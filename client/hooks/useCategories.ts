import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../config/apiQuery';

export const useCategories = (filters: any = {}) => {
  return useQuery({
    queryKey: ['categories', filters],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (filters?.page) query.append('page', String(filters.page));    
    if (filters?.limit) query.append('limit', String(filters.limit));
        const res = await api.get(`/categories?${query.toString()}`);
      
        return res.data;
    },
  });
}