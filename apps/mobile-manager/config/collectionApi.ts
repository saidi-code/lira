// ---------------------- Types ----------------------
export interface Product {
  _id: string;
  name: string;
  price: number;
  // ... other fields as needed
}

export interface Collection {
  _id: string;
  title: string;
  subtitle: string;
  products: Product[] | string[]; // populated or just IDs
  isActive: boolean;
  isFeatured: boolean;
  cta: string;
  banner: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateCollectionInput = Omit<Collection, '_id' | 'createdAt' | 'updatedAt'>;
export type UpdateCollectionInput = Partial<CreateCollectionInput> & { _id: string };

// Paginated response (matches your backend)
export interface PaginatedCollections {
  data: Collection[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ---------------------- API Service ----------------------
const BASE_URL = "https://lira-lilac.vercel.app/api/v1";
const COLLECTIONS_URL = `${BASE_URL}/collections`;

// Helper to handle fetch errors
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Try to get error message from response body
    let errorMessage = `HTTP error ${response.status}`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error || errorBody.message || errorMessage;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(errorMessage);
  }
  // For DELETE (204 No Content)
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export const collectionApi = {
  /**
   * Get all collections with pagination and optional filters.
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    isFeatured?: boolean;
  }): Promise<PaginatedCollections> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.isActive !== undefined) query.append('isActive', String(params.isActive));
    if (params?.isFeatured !== undefined) query.append('isFeatured', String(params.isFeatured));

    const url = query.toString() ? `${COLLECTIONS_URL}?${query}` : COLLECTIONS_URL;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // if you use cookies/sessions
    });
    return handleResponse<PaginatedCollections>(response);
  },

  /**
   * Get a single collection by ID (populates products).
   */
  getById: async (id: string): Promise<Collection> => {
    const response = await fetch(`${COLLECTIONS_URL}/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleResponse<Collection>(response);
  },

  /**
   * Create a new collection.
   */
  create: async (data: CreateCollectionInput): Promise<Collection> => {
    const response = await fetch(COLLECTIONS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<Collection>(response);
  },

  /**
   * Update an existing collection.
   */
  update: async (data: UpdateCollectionInput): Promise<Collection> => {
    const { _id, ...payload } = data;
    const response = await fetch(`${COLLECTIONS_URL}/${_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleResponse<Collection>(response);
  },

  /**
   * Delete a collection by ID.
   */
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${COLLECTIONS_URL}/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    await handleResponse<void>(response);
  },
};