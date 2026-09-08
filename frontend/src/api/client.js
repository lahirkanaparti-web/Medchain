import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
});

/**
 * Creates a new pharmaceutical batch.
 * @param {FormData} formData - Contains drugName, batchNumber, mfgDate, expiryDate, and image file
 */
export const createBatch = async (formData) => {
  const response = await api.post('/batches', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Transfers batch custody on-chain.
 * @param {number} batchId 
 * @param {string} toAddress 
 * @param {number} newState 
 */
export const transferCustody = async (batchId, toAddress, newState) => {
  const response = await api.post(`/batches/${batchId}/transfer`, {
    toAddress,
    newState: Number(newState),
  });
  return response.data;
};

/**
 * Fetches batch details & complete custody history.
 * @param {number} batchId 
 */
export const getBatch = async (batchId) => {
  const response = await api.get(`/batches/${batchId}`);
  return response.data;
};

/**
 * Returns the direct URL for fetching the batch QR code PNG image.
 * @param {number} batchId 
 */
export const getBatchQRUrl = (batchId) => {
  return `${API_BASE_URL}/batches/${batchId}/qr`;
};

/**
 * Verifies live product photo against reference IPFS image using MobileNetV2 CNN endpoint.
 * @param {number} batchId 
 * @param {File} liveImageFile 
 */
export const verifyProduct = async (batchId, liveImageFile) => {
  const formData = new FormData();
  formData.append('image', liveImageFile);

  const response = await api.post(`/batches/${batchId}/verify`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export default api;
