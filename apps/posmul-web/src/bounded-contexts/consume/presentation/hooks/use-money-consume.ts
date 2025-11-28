'use client';

/**
 * MoneyConsume Custom Hooks
 * 지역 소비 PMC 획득 관련 React hooks
 */

import { useState, useCallback, useEffect } from 'react';

export interface LocalStore {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string | null;
  description: string | null;
  imageUrl: string | null;
  pmcRate: number;
  isVerified: boolean;
  totalSales: number;
  totalPmcIssued: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  storeId: string;
  paymentAmount: number;
  pmcEarned: number;
  paymentMethod: string;
  status: string;
  receiptNumber: string | null;
  createdAt: string;
  store?: {
    name: string;
    category: string;
  };
}

export interface PaymentResult {
  paymentId: string;
  storeId: string;
  storeName: string;
  paymentAmount: number;
  pmcEarned: number;
  paymentMethod: string;
  receiptNumber: string;
  updatedBalance: {
    pmcAvailable: number;
  };
  message: string;
}

export interface StoreFilters {
  category?: string;
  search?: string;
  verified?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * 매장 목록 조회 hook
 */
export function useLocalStores(initialFilters?: StoreFilters) {
  const [stores, setStores] = useState<LocalStore[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StoreFilters>(initialFilters ?? {});

  const fetchStores = useCallback(async (newFilters?: StoreFilters) => {
    setLoading(true);
    setError(null);
    
    const currentFilters = newFilters ?? filters;
    
    try {
      const params = new URLSearchParams();
      if (currentFilters.category) params.append('category', currentFilters.category);
      if (currentFilters.search) params.append('search', currentFilters.search);
      if (currentFilters.verified !== undefined) params.append('verified', String(currentFilters.verified));
      if (currentFilters.limit) params.append('limit', String(currentFilters.limit));
      if (currentFilters.offset) params.append('offset', String(currentFilters.offset));

      const url = `/api/consume/money/stores${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? '매장 목록을 불러오는 데 실패했습니다.');
      }

      setStores(result.data.stores);
      setCategories(result.data.categories);
      setTotal(result.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const updateFilters = useCallback((newFilters: Partial<StoreFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    fetchStores(updated);
  }, [filters, fetchStores]);

  const searchStores = useCallback((search: string) => {
    updateFilters({ search, offset: 0 });
  }, [updateFilters]);

  const filterByCategory = useCallback((category: string | undefined) => {
    updateFilters({ category, offset: 0 });
  }, [updateFilters]);

  return {
    stores,
    categories,
    total,
    loading,
    error,
    filters,
    refetch: fetchStores,
    updateFilters,
    searchStores,
    filterByCategory,
  };
}

/**
 * 결제 내역 조회 hook
 */
export function usePaymentHistory(options?: { limit?: number; offset?: number }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPmcEarned, setTotalPmcEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', String(options.limit));
      if (options?.offset) params.append('offset', String(options.offset));

      const url = `/api/consume/money/payment${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? '결제 내역을 불러오는 데 실패했습니다.');
      }

      setPayments(result.data.payments);
      setTotal(result.data.total);
      setTotalPmcEarned(result.data.totalPmcEarned);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [options?.limit, options?.offset]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return { payments, total, totalPmcEarned, loading, error, refetch: fetchPayments };
}

/**
 * 결제 처리 hook
 */
export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentResult | null>(null);

  const processPayment = useCallback(async (
    storeId: string,
    paymentAmount: number,
    paymentMethod: string = 'CARD',
    receiptNumber?: string
  ): Promise<PaymentResult> => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/consume/money/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          paymentAmount,
          paymentMethod,
          receiptNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? '결제 처리에 실패했습니다.');
      }

      setResult(data.data);
      return data.data as PaymentResult;
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
    processPayment,
    reset,
  };
}

/**
 * 특정 매장 상세 조회 hook
 */
export function useStoreDetail(storeId: string | null) {
  const [store, setStore] = useState<LocalStore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStore = useCallback(async () => {
    if (!storeId) {
      setStore(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/consume/money/stores?search=${storeId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? '매장 정보를 불러오는 데 실패했습니다.');
      }

      const foundStore = result.data.stores.find((s: LocalStore) => s.id === storeId);
      setStore(foundStore ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchStore();
  }, [fetchStore]);

  return { store, loading, error, refetch: fetchStore };
}
