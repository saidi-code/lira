import { useQuery, UseQueryResult  } from '@tanstack/react-query';
import { api } from '../config/apiQuery';
interface ICategory {
  _id: string;
  title: string;
  icon: string;
}
export const useCategories = (filters): UseQueryResult<ICategory[], Error> => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories',{params:{...filters},});
      return res.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000,
    retry: 2,
  });
};