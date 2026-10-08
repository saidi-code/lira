import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../config/api";
import { IProduct } from "../constants/types";

export interface ProductFilters {
  category?: string;
  brand?: string;
  color?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  limit?: number;
  page?: number;
  [key: string]: any;
}

export interface ProductsPageResponse {
  products: IProduct[];
  nextPage?: number;
  totalPages: number;
  total: number;
}

export function useProducts(filters: ProductFilters = {}) {
  return useInfiniteQuery<ProductsPageResponse, Error>({
    queryKey: ["products", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const isSearch = Boolean(
        filters.q || filters.brand || filters.color || filters.size || filters.minPrice || filters.maxPrice
      );
      const endpoint = isSearch ? "/products/search" : "/products";

      const cleanParams: Record<string, any> = {
        ...filters,
        page: pageParam,
        limit: filters.limit || 10,
      };

      if (cleanParams.category === "الكل") {
        delete cleanParams.category;
      }

      Object.keys(cleanParams).forEach((key) => {
        if (cleanParams[key] === undefined || cleanParams[key] === null || cleanParams[key] === "") {
          delete cleanParams[key];
        }
      });

      const res = await api.get(endpoint, { params: cleanParams });

      const products: IProduct[] = res.data ?? [];
      const pagination = res.pagination ?? {};
      const currentPage = Number(pagination.page) || pageParam;
      const totalPages = Number(pagination.totalPages || pagination.pages) || 1;
      const total = Number(pagination.total) || products.length;

      return {
        products,
        nextPage: currentPage < totalPages ? currentPage + 1 : undefined,
        totalPages,
        total,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 2 * 60 * 1000,
    keepPreviousData: true,
  });
}

export function useProduct(productId?: string) {
  const queryClient = useQueryClient();

  const prefetchProduct = async (id: string) => {
    if (!id) return;
    await queryClient.prefetchQuery({
      queryKey: ["product", id],
      queryFn: async () => {
        const res = await api.get(`/products/${id}`);
        return res.data ?? res;
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  const query = useQuery<IProduct, Error>({
    queryKey: ["product", productId],
    queryFn: async () => {
      if (!productId) throw new Error("Product ID is required");
      const res = await api.get(`/products/${productId}`);
      return res.data ?? res;
    },
    enabled: Boolean(productId),
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });

  return { ...query, prefetchProduct };
}
