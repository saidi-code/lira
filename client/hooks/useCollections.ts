import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collectionApi } from '../config/collectionApi';
import {api} from "../config/apiQuery"
// import { Collection, CreateCollectionInput, UpdateCollectionInput } from '../types/collection';

// Keys for caching
export const collectionKeys = {
  all: ['collections'] as const,
  lists: () => [...collectionKeys.all, 'list'] as const,
  list: (filters: any) => [...collectionKeys.lists(), filters] as const,
  details: () => [...collectionKeys.all, 'detail'] as const,
  detail: (id: string) => [...collectionKeys.details(), id] as const,
};

// ------------------- Queries -------------------
export const useCollections = (filters={}) => {
  return useQuery({
    queryKey: ['collections', filters],
    // queryFn: () => collectionApi.getAll(params),
    queryFn: async ({filters}) =>{
       const query = new URLSearchParams();
      if (filters?.page) query.append('page', String(filters.page));
    if (filters?.limit) query.append('limit', String(filters.limit));
    if (filters?.isActive !== undefined) query.append('isActive', String(filters.isActive));
    if (filters?.isFeatured !== undefined) query.append('isFeatured', String(filters.isFeatured));
      const res = await api.get(`/collections?${query.toString()}`);
     
      return res.data;
    }
  });
};

export const useCollection = (id: string) => {
  return useQuery({
    queryKey: collectionKeys.detail(id),
    queryFn: () => collectionApi.getById(id),
    enabled: !!id, // only run if id exists
  });
};

// ------------------- Mutations -------------------
export const useCreateCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => collectionApi.create(data),
    onSuccess: () => {
      // Invalidate the list of collections to refetch
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
    },
  });
};

export const useUpdateCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => collectionApi.update(data),
    onSuccess: (updated, variables) => {
      // Update the individual cache entry
      queryClient.setQueryData(collectionKeys.detail(variables._id), updated);
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
    },
  });
};

export const useDeleteCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => collectionApi.delete(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: collectionKeys.detail(id) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
    },
  });
};