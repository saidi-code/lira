// hooks/useDebouncedSearch.ts
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchProducts } from '../config/productApi';

export const useDebouncedSearch = (
  initialQuery: string = '',
  options: {
    delay?: number;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    enabled?: boolean;
    q?: string;
  } = {}
) => {
  const { delay = 400, category, minPrice, maxPrice, enabled = true } = options;

  const [inputValue, setInputValue] = useState(initialQuery);
  const [debouncedTerm, setDebouncedTerm] = useState(initialQuery);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce logic
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (!inputValue.trim()) {
      setDebouncedTerm('');
      return;
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedTerm(inputValue.trim());
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [inputValue, delay]);

  const query = useQuery({
    queryKey: ['products', 'search', debouncedTerm, category, minPrice, maxPrice],
    queryFn: ({ signal }) =>
      searchProducts({
        query: debouncedTerm,
        signal,
        category,
        minPrice,
        maxPrice,
      }),
    enabled: enabled && debouncedTerm.length > 0,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  return {
    inputValue,
    setInputValue,
    debouncedTerm,
    // Spread query results (rename data to products for clarity)
    products: query.data?.products || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetching: query.isFetching,
    refetch: query.refetch,
    clear: () => {
      setInputValue('');
      setDebouncedTerm('');
      query.remove();
    },
  };
};