import axios from 'axios';
import toast from 'react-hot-toast';

const baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL,
});

/**
 * Helper to build auth headers
 */
export const getAuthHeaders = (token, isFormData = false) => {
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (isFormData) {
    headers['Content-Type'] = 'multipart/form-data';
  }
  return headers;
};

/**
 * Universal API request wrapper with standardized error handling
 */
export const apiRequest = async ({ method = 'get', url, data = null, token = null, isFormData = false }) => {
  try {
    const config = {
      method,
      url,
      headers: getAuthHeaders(token, isFormData),
    };

    if (data) {
      config.data = data;
    }

    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
    toast.error(errorMessage);
    return { success: false, message: errorMessage };
  }
};

export default apiClient;
