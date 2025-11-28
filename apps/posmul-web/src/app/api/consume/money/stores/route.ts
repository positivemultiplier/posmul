/**
 * MoneyConsume Local Stores API Route
 * 지역 매장 목록 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    let query = supabase
      .schema('consume')
      .from('local_stores')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category.toUpperCase());
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,address.ilike.%${search}%`);
    }

    const { data: stores, error } = await query;

    if (error) {
      // eslint-disable-next-line no-console
      console.error('매장 조회 오류:', error);
      return NextResponse.json(
        { error: '매장 목록을 불러오는 데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: (stores ?? []).map(formatStore),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('매장 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

interface StoreRow {
  id: string;
  name: string;
  description: string | null;
  category: string;
  address: string;
  phone: string | null;
  image_url: string | null;
  pmc_rate: number;
  business_hours: Record<string, unknown> | null;
  location_lat: number | null;
  location_lng: number | null;
  total_sales: number;
  total_pmc_issued: number;
}

function formatStore(row: StoreRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    address: row.address,
    phone: row.phone,
    imageUrl: row.image_url,
    pmcRate: Number(row.pmc_rate),
    pmcRatePercent: `${(Number(row.pmc_rate) * 100).toFixed(1)}%`,
    businessHours: row.business_hours,
    location: row.location_lat && row.location_lng 
      ? { lat: Number(row.location_lat), lng: Number(row.location_lng) }
      : null,
    totalSales: Number(row.total_sales),
    totalPmcIssued: Number(row.total_pmc_issued),
  };
}
