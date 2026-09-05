// hooks/useProducts.js
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { api, imageService } from '../config/apiQuery';
// Search product 

// Get products with infinite scroll
export function useProducts(filters) {
  return useInfiniteQuery({
    queryKey: ['products',  filters],
    queryFn: async () => {
      const res = await api.get(`/products`,{params:filters});

      // Server response: { success: true, data: products[], pagination: { page, pages, total } }
      const products = res.data ?? [];
      const pagination = res.pagination ?? {};
      const currentPage = pagination.page ?? pageParam;
      const totalPages = pagination.pages ?? 1;

      // Prefetch images for this page
      const imageUrls = products
        .filter(p => p.images?.[0])
        .map(p => p.images[0])
        .slice(0, 5); // Prefetch first 5 images

      // Don't await - let it run in background
      // imageService.prefetch(imageUrls);
     
      return {
        products,
        nextPage: currentPage < totalPages ? currentPage + 1 : undefined,
        totalPages,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 1 * 60 * 1000, // 1 minute for product list
    keepPreviousData: true, // Keep old data while fetching new
  });
}

// Get single product with prefetching
export function useProduct(productId) {
  const queryClient = useQueryClient();

  const prefetchProduct = async (id) => {
    await queryClient.prefetchQuery({
      queryKey: ['product', id],
      queryFn: () => api.get(`/products/${id}`),
      staleTime: 5 * 60 * 1000,
    });
  };

  const query = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const res = await api.get(`/products/${productId}`);

      // Server response: { success: true, data: product }
      const product = res.data ?? res;

      // Prefetch main image
      const mainImage = product.images?.[0];
      if (mainImage) {
        await imageService.prefetch([mainImage]);
      }

      // Prefetch gallery images (skip first since it's already the main one)
      const galleryImages = (product.images ?? []).slice(1, 3);
      if (galleryImages.length) {
        await imageService.prefetch(galleryImages);
      }

      return product;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });

  return { ...query, prefetchProduct };
}
