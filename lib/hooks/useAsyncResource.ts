'use client';

import { useCallback, useEffect, useState, type DependencyList } from 'react';

export interface AsyncResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

/**
 * Hook tải dữ liệu bất đồng bộ chuẩn hóa 3 trạng thái (loading, error, data) và hàm retry().
 */
export function useAsyncResource<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList = []
): AsyncResourceState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState<number>(0);

  const retry = useCallback(() => {
    setReloadTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcher()
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err?.message || 'Không thể tải dữ liệu. Vui lòng thử lại.');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadTick, ...deps]);

  return { data, loading, error, retry, setData };
}
