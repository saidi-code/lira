// api/products.ts
import { api } from './api';
import type { IProduct } from '../constants/types';

// Shape returned by GET /api/v1/products/search
interface SearchResponseBody {
  success?: boolean;
  data?: IProduct[];
  pagination?: {
    total: number;
    page: number;
    limit?: number;
    totalPages?: number;
  };
}

export const searchProducts = async ({
  query,
  signal,
  category,
  minPrice,
  maxPrice,
}: {
  query: string;
  signal?: AbortSignal;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}) => {
  const params = new URLSearchParams({
    q: query,
    page: '1',
    limit: '10',
    ...(category && { category }),
    ...(minPrice && { minPrice: String(minPrice) }),
    ...(maxPrice && { maxPrice: String(maxPrice) }),
  });

  const body = await api.get<SearchResponseBody>(`/products/search?${params}`, {
    signal, // 👈 passes AbortSignal to axios
  });

  // The API responds with { success, data, pagination } — expose it as
  // { products, pagination } which useDebouncedSearch expects.
  return { products: body.data ?? [], pagination: body.pagination };
};