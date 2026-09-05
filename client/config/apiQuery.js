
// api/client.ts
import axios, { AxiosRequestConfig } from 'axios';

const API_BASE = "https://lira-lilac.vercel.app/api/v1";

// Create an axios instance with default configuration
const axiosClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'max-age=300',
  },
});

export const api = {
  get: async (endpoint: string, options?: { signal?: AbortSignal; params?: Record<string, any> }) => {
    const config: AxiosRequestConfig = {
      params: options?.params, // axios automatically builds query string
      signal: options?.signal,  // supports AbortController cancellation
    };

    console.log('🔗 Fetching URL:', `${API_BASE}${endpoint}`);

    try {
      const response = await axiosClient.get(endpoint, config);

      console.log('📡 Status:', response.status);
      console.log('📦 Raw response body:', response.data);
      console.log('✅ Parsed data:', response.data);

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Axios error with response
        const status = error.response?.status || 'unknown';
        const data = error.response?.data || error.message;
        console.error('❌ API Error:', status, data);
        throw new Error(`API Error ${status}: ${JSON.stringify(data)}`);
      }
      // Re-throw other errors
      throw error;
    }
  },
};
// // api/client.ts
// const API_BASE = "https://lira-lilac.vercel.app/api/v1";

// // Helper to build query string from object
// const buildQuery = (params?: Record<string, any>): string => {
//   if (!params) return '';
//   const searchParams = new URLSearchParams();
//   Object.entries(params).forEach(([key, value]) => {
//     if (value !== undefined && value !== null && value !== '') {
//       searchParams.append(key, String(value));
//     }
//   });
//   const qs = searchParams.toString();
//   return qs ? `?${qs}` : '';
// };

// export const api = {
//   get: async (endpoint: string, options?: { signal?: AbortSignal; params?: Record<string, any> }) => {
//     const url = `${API_BASE}${endpoint}${buildQuery(options?.params)}`;
//     console.log('🔗 Fetching URL:', url);

//     const response = await fetch(url, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         'Cache-Control': 'max-age=300',
//       },
//       signal: options?.signal,
//     });

//     // Log status for debugging
//     console.log('📡 Status:', response.status);

//     // Read response as text (so we can log it, and also parse)
//     const rawText = await response.text();
//     console.log('📦 Raw response body:', rawText);

//     if (!response.ok) {
//       throw new Error(`API Error ${response.status}: ${rawText}`);
//     }

//     try {
//       const data = JSON.parse(rawText);
//       console.log('✅ Parsed data:', data);
//       return data;
//     } catch (parseError) {
//       console.error('❌ Failed to parse JSON:', parseError);
//       throw new Error('Invalid JSON response from server');
//     }
//   },
// };