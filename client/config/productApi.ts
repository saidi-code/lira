// api/products.ts
import { api } from './apiQuery';

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

  const response = await  api.get(`/products/search?${params}`, {
    signal, // 👈 passes AbortSignal to axios
  });

  // Adjust to your API response shape
  return response.data; // { products: [...], pagination: {...} }
};