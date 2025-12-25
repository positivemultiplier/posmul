/**
 * MoneyConsume Payment API Route
 * 결제 처리 및 PMC 지급
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST - 결제 생성 (QR 결제 시뮬레이션)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { storeId, amount, paymentMethod = 'QR' } = body;

    if (!storeId || !amount) {
      return NextResponse.json(
        { error: '매장 ID와 결제 금액이 필요합니다.' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: '결제 금액은 0보다 커야 합니다.' },
        { status: 400 }
      );
    }

    // 매장 조회
    const { data: store, error: storeError } = await supabase
      .schema('consume')
      .from('local_stores')
      .select('*')
      .eq('id', storeId)
      .eq('is_active', true)
      .single();

    if (storeError || !store) {
      return NextResponse.json(
        { error: '매장을 찾을 수 없거나 비활성 상태입니다.' },
        { status: 404 }
      );
    }

    // PMC 계산 (결제액 * PMC 비율)
    const pmcEarned = Math.floor(amount * store.pmc_rate * 100) / 100;

    // 결제 기록 생성
    const receiptNumber = `PMT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const { data: payment, error: insertError } = await supabase
      .schema('consume')
      .from('payments')
      .insert({
        user_id: user.id,
        store_id: storeId,
        payment_amount: amount,
        pmc_earned: pmcEarned,
        payment_method: paymentMethod,
        status: 'COMPLETED',
        receipt_number: receiptNumber,
        metadata: {
          store_name: store.name,
          pmc_rate: store.pmc_rate,
        },
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: '결제 처리에 실패했습니다.' },
        { status: 500 }
      );
    }

    // PMC 지급
    if (pmcEarned > 0) {
      // 경제 계정에 PMC 추가
      const { error: accountError } = await supabase
        .schema('economy')
        .from('pmp_pmc_accounts')
        .upsert({
          user_id: user.id,
          pmc_balance: pmcEarned,
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (accountError) {
        // upsert 실패 시 update 시도
        await supabase
          .schema('economy')
          .from('pmp_pmc_accounts')
          .update({
            pmc_balance: supabase.rpc('increment_pmc', { amount: pmcEarned }),
            last_updated: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      }

      // 거래 기록 생성
      await supabase
        .schema('economy')
        .from('pmp_pmc_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'PMC_EARN',
          pmc_amount: pmcEarned,
          description: `MoneyConsume: ${store.name}에서 ${amount.toLocaleString()}원 결제`,
          metadata: {
            source: 'MONEY_CONSUME',
            store_id: storeId,
            store_name: store.name,
            payment_id: payment.id,
            payment_amount: amount,
          },
        });

      // 매장 통계 업데이트
      await supabase
        .schema('consume')
        .from('local_stores')
        .update({
          total_sales: store.total_sales + amount,
          total_pmc_issued: store.total_pmc_issued + pmcEarned,
          updated_at: new Date().toISOString(),
        })
        .eq('id', storeId);
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        receiptNumber,
        storeName: store.name,
        paymentAmount: amount,
        pmcEarned,
        pmcRate: `${(store.pmc_rate * 100).toFixed(1)}%`,
        status: 'COMPLETED',
        message: `결제 완료! ${pmcEarned.toFixed(2)} PMC를 획득했습니다.`,
      },
    });
  } catch (error) {
    void error;
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * GET - 결제 내역 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const { data: payments, error } = await supabase
      .schema('consume')
      .from('payments')
      .select(`
        *,
        store:local_stores(name, category, address)
      `)
      .eq('user_id', user.id)
      .order('payment_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: '결제 내역을 불러오는 데 실패했습니다.' },
        { status: 500 }
      );
    }

    // 총계 계산
    const { data: totals } = await supabase
      .schema('consume')
      .from('payments')
      .select('payment_amount, pmc_earned')
      .eq('user_id', user.id)
      .eq('status', 'COMPLETED');

    const totalAmount = totals?.reduce((sum, p) => sum + Number(p.payment_amount), 0) ?? 0;
    const totalPmc = totals?.reduce((sum, p) => sum + Number(p.pmc_earned), 0) ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        payments: (payments ?? []).map(formatPayment),
        summary: {
          totalPayments: totals?.length ?? 0,
          totalAmount,
          totalPmcEarned: totalPmc,
        },
      },
    });
  } catch (error) {
    void error;
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

interface PaymentRow {
  id: string;
  payment_amount: number;
  pmc_earned: number;
  payment_method: string;
  status: string;
  receipt_number: string;
  payment_date: string;
  store: {
    name: string;
    category: string;
    address: string;
  } | null;
}

function formatPayment(row: PaymentRow) {
  return {
    id: row.id,
    paymentAmount: Number(row.payment_amount),
    pmcEarned: Number(row.pmc_earned),
    paymentMethod: row.payment_method,
    status: row.status,
    receiptNumber: row.receipt_number,
    paymentDate: row.payment_date,
    store: row.store ? {
      name: row.store.name,
      category: row.store.category,
      address: row.store.address,
    } : null,
  };
}
