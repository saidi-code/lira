// api/client.ts
const API_BASE = "https://lira-lilac.vercel.app/api/v1";

// Helper to build query string from object
const buildQuery = (params?: Record<string, any>): string => {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
};

export const api = {
  get: async (endpoint: string, options?: { signal?: AbortSignal; params?: Record<string, any> }) => {
    const url = `${API_BASE}${endpoint}${buildQuery(options?.params)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=300',
      },
      signal: options?.signal, // 👈 pass AbortSignal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'API Error');
    }
    return response.json();
  },

  // Optional: post, put, delete can be added similarly
};