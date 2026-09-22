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
  /** GET /addresses/user — logged-in user's addresses (max 3) */
  getMyAddresses: async (
    token?: string | null
  ): Promise<BackendAddress[]> => {
    const res = await api.get<AddressResponse>("/addresses/user", {
      headers: authHeaders(token),
    });
    // NOTE: `api.get` already returns the JSON body, so use `res.data`
    return Array.isArray(res.data) ? res.data : [];
  },

  /** GET /addresses/:id */
  getAddressById: async (
    addressId: string,
    token?: string | null
  ): Promise<BackendAddress | null> => {
    const res = await api.get<AddressResponse>(`/addresses/${addressId}`, {
      headers: authHeaders(token),
    });
    return !Array.isArray(res.data) ? res.data ?? null : null;
  },

  /** POST /addresses */
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
    return !Array.isArray(res.data) ? res.data ?? null : null;
  },

  /** PUT /addresses/:id */
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
    return !Array.isArray(res.data) ? res.data ?? null : null;
  },

  /** DELETE /addresses/:id */
  deleteAddress: async (
    addressId: string,
    token?: string | null
  ): Promise<{ success: boolean; message?: string }> => {
    const res = await api.delete<AddressResponse>(`/addresses/${addressId}`, {
      headers: authHeaders(token),
    });
    return { success: res.success, message: res.message };
  },

  /** PATCH /addresses/:id/default */
  setDefaultAddress: async (
    addressId: string,
    token?: string | null
  ): Promise<BackendAddress | null> => {
    const res = await api.patch<AddressResponse>(
      `/addresses/${addressId}/default`,
      {},
      { headers: authHeaders(token) }
    );
    return !Array.isArray(res.data) ? res.data ?? null : null;
  },
};