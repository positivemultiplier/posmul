'use client';

/**
 * CloudConsume Custom Hooks
 * 클라우드 펀딩 PMC 획득 관련 React hooks
 */

import { useState, useCallback, useEffect } from 'react';

export interface FundingProject {
  id: string;
  title: string;
  description: string | null;
  category: string;
  creatorId: string;
  targetAmount: number;
  currentAmount: number;
  pmcRewardRate: number;
  minContribution: number;
  maxContribution: number;
  startDate: string;
  endDate: string;
  status: string;
  contributorCount: number;
  imageUrl: string | null;
  createdAt: string;
  progress: number;
  daysLeft: number;
}

export interface Contribution {
  id: string;
  userId: string;
  projectId: string;
  amount: number;
  pmcEarned: number;
  status: string;
  createdAt: string;
  project?: {
    title: string;
    category: string;
  };
}

export interface ContributionResult {
  contributionId: string;
  projectId: string;
  projectTitle: string;
  amount: number;
  pmcEarned: number;
  updatedBalance: {
    pmcAvailable: number;
  };
  projectProgress: {
    currentAmount: number;
    targetAmount: number;
    progress: number;
    contributorCount: number;
  };
  message: string;
}

export interface ProjectFilters {
  category?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * 펀딩 프로젝트 목록 조회 hook
 */
export function useFundingProjects(initialFilters?: ProjectFilters) {
  const [projects, setProjects] = useState<FundingProject[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProjectFilters>(initialFilters ?? {});

  const fetchProjects = useCallback(async (newFilters?: ProjectFilters) => {
    setLoading(true);
    setError(null);
    
    const currentFilters = newFilters ?? filters;
    
    try {
      const params = new URLSearchParams();
      if (currentFilters.category) params.append('category', currentFilters.category);
      if (currentFilters.status) params.append('status', currentFilters.status);
      if (currentFilters.search) params.append('search', currentFilters.search);
      if (currentFilters.limit) params.append('limit', String(currentFilters.limit));
      if (currentFilters.offset) params.append('offset', String(currentFilters.offset));

      const url = `/api/consume/cloud/projects${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? '프로젝트 목록을 불러오는 데 실패했습니다.');
      }

      setProjects(result.data.projects);
      setCategories(result.data.categories);
      setTotal(result.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const updateFilters = useCallback((newFilters: Partial<ProjectFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    fetchProjects(updated);
  }, [filters, fetchProjects]);

  const filterByCategory = useCallback((category: string | undefined) => {
    updateFilters({ category, offset: 0 });
  }, [updateFilters]);

  const filterByStatus = useCallback((status: string | undefined) => {
    updateFilters({ status, offset: 0 });
  }, [updateFilters]);

  return {
    projects,
    categories,
    total,
    loading,
    error,
    filters,
    refetch: fetchProjects,
    updateFilters,
    filterByCategory,
    filterByStatus,
  };
}

/**
 * 참여 내역 조회 hook
 */
export function useContributionHistory(options?: { limit?: number; offset?: number }) {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPmcEarned, setTotalPmcEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContributions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', String(options.limit));
      if (options?.offset) params.append('offset', String(options.offset));

      const url = `/api/consume/cloud/contribute${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? '참여 내역을 불러오는 데 실패했습니다.');
      }

      setContributions(result.data.contributions);
      setTotal(result.data.total);
      setTotalPmcEarned(result.data.totalPmcEarned);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [options?.limit, options?.offset]);

  useEffect(() => {
    fetchContributions();
  }, [fetchContributions]);

  return { contributions, total, totalPmcEarned, loading, error, refetch: fetchContributions };
}

/**
 * 펀딩 참여 hook
 */
export function useContribute() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ContributionResult | null>(null);

  const contribute = useCallback(async (
    projectId: string,
    amount: number
  ): Promise<ContributionResult> => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/consume/cloud/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? '펀딩 참여에 실패했습니다.');
      }

      setResult(data.data);
      return data.data as ContributionResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : '오류가 발생했습니다.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    result,
    loading,
    error,
    contribute,
    reset,
  };
}

/**
 * 특정 프로젝트 상세 조회 hook
 */
export function useProjectDetail(projectId: string | null) {
  const [project, setProject] = useState<FundingProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!projectId) {
      setProject(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/consume/cloud/projects?search=${projectId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? '프로젝트 정보를 불러오는 데 실패했습니다.');
      }

      const foundProject = result.data.projects.find((p: FundingProject) => p.id === projectId);
      setProject(foundProject ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return { project, loading, error, refetch: fetchProject };
}
