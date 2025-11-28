/**
 * CloudConsume Funding Projects API Route
 * 펀딩 프로젝트 목록 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    let query = supabase
      .schema('consume')
      .from('funding_projects')
      .select('*')
      .in('status', ['ACTIVE', 'FUNDED', 'COMPLETED'])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category.toUpperCase());
    }

    if (status) {
      query = query.eq('status', status.toUpperCase());
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error('프로젝트 조회 오류:', error);
      return NextResponse.json(
        { error: '프로젝트 목록을 불러오는 데 실패했습니다.' },
        { status: 500 }
      );
    }

    // 카테고리 목록 추출
    const allProjects = projects ?? [];
    const categories = [...new Set(allProjects.map(p => p.category))].filter(Boolean);

    return NextResponse.json({
      success: true,
      data: {
        projects: allProjects.map(formatProject),
        categories,
        total: allProjects.length,
      },
    });
  } catch (error) {
    console.error('펀딩 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

interface ProjectRow {
  id: string;
  title: string;
  description: string;
  category: string;
  target_amount: number;
  current_amount: number;
  min_contribution: number;
  max_contribution: number | null;
  pmc_rate: number;
  image_url: string | null;
  video_url: string | null;
  start_date: string;
  end_date: string;
  status: string;
  backer_count: number;
  rewards: unknown | null;
  created_at: string;
}

function formatProject(row: ProjectRow) {
  const progress = Math.round((Number(row.current_amount) / Number(row.target_amount)) * 100);
  const daysLeft = Math.max(0, Math.ceil((new Date(row.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount),
    pmcRewardRate: Number(row.pmc_rate),
    minContribution: Number(row.min_contribution),
    maxContribution: Number(row.max_contribution ?? 10000000),
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    contributorCount: row.backer_count,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    progress: Math.min(progress, 100),
    daysLeft,
  };
}
