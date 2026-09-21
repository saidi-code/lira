// services/addressApi.ts
import { api } from "./api";

// ==================== Types ====================

export interface BackendAddress {
  _id: string;
  user?: string;
  type: "Home" | "Work" | "Other";
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  isDefault: boolean;
  createdAt?: string;
}

export interface AddressResponse {
  success: boolean;
  message?: string;
  count?: number;
  data?: BackendAddress | BackendAddress[];
}

export interface AddAddressInput {
  type: "Home" | "Work" | "Other";
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  isDefault?: boolean;
}

export interface UpdateAddressInput {
  type?: "Home" | "Work" | "Other";
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber?: string;
  isDefault?: boolean;
}

export interface DeleteAddressInput {
  addressId: string;
}

// ==================== Helpers ====================

const authHeaders = (token?: string | null) =>
  token ? { Authorization: `Bearer ${token}` } : undefined;

// ==================== API ====================

export const addressApi = {
  /**
   * GET /api/addresses/user
   * Get all addresses of the logged-in user (max 3)
   */
  getMyAddresses: async (
    token?: string | null
  ): Promise<BackendAddress[]> => {
    const res = await api.get<AddressResponse>("/addresses/user", {
      headers: authHeaders(token),
    });
    // data can be an array for this endpoint
    return Array.isArray(res.data.data) ? res.data.data : [];
  },

  /**
   * GET /api/addresses/:id
   * Get a single address by id
   */
  getAddressById: async (
    addressId: string,
    token?: string | null
  ): Promise<BackendAddress | null> => {
    const res = await api.get<AddressResponse>(`/addresses/${addressId}`, {
      headers: authHeaders(token),
    });
    return !Array.isArray(res.data.data) ? res.data.data ?? null : null;
  },

  /**
   * POST /api/addresses
   * Create a new address (max 3 per user)
   */
  addAddress: async (
    payload: AddAddressInput,
    token?: string | null
  ): Promise<BackendAddress | null> => {
    const res = await api.post<AddressResponse>(
      "/addresses",
      {
        type: payload.type,
        street: payload.street,
        city: payload.city,
        state: payload.state,
        zipCode: payload.zipCode,
        phoneNumber: payload.phoneNumber,
        isDefault: payload.isDefault ?? false,
      },
      { headers: authHeaders(token) }
    );
    return !Array.isArray(res.data.data) ? res.data.data ?? null : null;
  },

  /**
   * PUT /api/addresses/:id
   * Update an existing address
   */
  updateAddress: async (
    addressId: string,
    payload: UpdateAddressInput,
    token?: string | null
  ): Promise<BackendAddress | null> => {
    const res = await api.put<AddressResponse>(
      `/addresses/${addressId}`,
      {
        type: payload.type,
        street: payload.street,
        city: payload.city,
        state: payload.state,
        zipCode: payload.zipCode,
        phoneNumber: payload.phoneNumber,
        isDefault: payload.isDefault,
      },
      { headers: authHeaders(token) }
    );
    return !Array.isArray(res.data.data) ? res.data.data ?? null : null;
  },

  /**
   * DELETE /api/addresses/:id
   * Delete an address
   */
  deleteAddress: async (
    addressId: string,
    token?: string | null
  ): Promise<{ success: boolean; message?: string }> => {
    const res = await api.delete<AddressResponse>(`/addresses/${addressId}`, {
      headers: authHeaders(token),
    });
    return { success: res.data.success, message: res.data.message };
  },

  /**
   * PATCH /api/addresses/:id/default
   * Set an address as the default one
   */
  setDefaultAddress: async (
    addressId: string,
    token?: string | null
  ): Promise<BackendAddress | null> => {
    const res = await api.patch<AddressResponse>(
      `/addresses/${addressId}/default`,
      {},
      { headers: authHeaders(token) }
    );
    return !Array.isArray(res.data.data) ? res.data.data ?? null : null;
  },
};