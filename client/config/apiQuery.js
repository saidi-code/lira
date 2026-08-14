import { Image } from 'expo-image';
const API_BASE ="https://lira-lilac.vercel.app/api/v1";

  // Fetch with caching headers
export const api = {
  get: async (endpoint) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        // Add cache control
        'Cache-Control': 'max-age=300',
      },
    });
    
    if (!response.ok) throw new Error('API Error');
    return response.json();
  },
};
// Image service with local caching
export const imageService = {
  prefetch: async (urls) => {
    // expo-image prefetch returns a promise
    const promises = urls.map(url => Image.prefetch(url).catch(() => null));
    return Promise.all(promises);
  },
  // No need for AsyncStorage caching – expo-image handles it internally
};