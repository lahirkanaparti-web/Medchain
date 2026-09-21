import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
});

/**
 * Creates a new pharmaceutical batch accepting 1-3 reference images.
 * @param {FormData} formData - Contains drugName, batchNumber, mfgDate, expiryDate, and 'images' files
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
 * Transfers batch custody on-chain with optional geolocation coordinates.
 * @param {number} batchId 
 * @param {string} toAddress 
 * @param {number} newState 
 * @param {string} latitude 
 * @param {string} longitude 
 */
export const transferCustody = async (batchId, toAddress, newState, latitude = "", longitude = "") => {
  const response = await api.post(`/batches/${batchId}/transfer`, {
    toAddress,
    newState: Number(newState),
    latitude,
    longitude
  });
  return response.data;
};

/**
 * Recalls a batch on-chain (REGULATOR_ROLE).
 * @param {number} batchId 
 * @param {string} reason 
 */
export const recallBatch = async (batchId, reason) => {
  const response = await api.post(`/batches/${batchId}/recall`, { reason });
  return response.data;
};

/**
 * Downloads batch export file (CSV or PDF).
 * @param {number} batchId 
 * @param {'csv'|'pdf'} format 
 */
export const exportBatch = async (batchId, format = 'csv') => {
  const response = await api.get(`/batches/${batchId}/export`, {
    params: { format },
    responseType: 'blob'
  });
  
  const blob = new Blob([response.data], {
    type: format === 'pdf' ? 'application/pdf' : 'text/csv'
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `medchain_batch_${batchId}_export.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
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
 * Verifies live product photo against reference IPFS images using Siamese embedding model.
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

/**
 * Agent A3: Manufacturer Vision OCR Autofill from label photograph.
 * @param {File} imageFile 
 */
export const extractBatchInfo = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await api.post('/extract-batch-info', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Agent A4: Regulator Multi-Step Investigation Agent.
 * @param {number} batchId 
 */
export const investigateBatch = async (batchId) => {
  const response = await api.post(`/batches/${batchId}/investigate`);
  return response.data;
};

/**
 * Agent A5: Physical Defect Inspection Agent.
 * @param {number} batchId 
 * @param {File} imageFile 
 */
export const inspectDefects = async (batchId, imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await api.post(`/batches/${batchId}/inspect-defects`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Fetches autonomous regulator audit trail history with optional filters.
 * @param {Object} params - { risk_level, action_taken, batch_id }
 */
export const getRegulatorAuditLog = async (params = {}) => {
  const response = await api.get('/regulator/audit-log', { params });
  return response.data;
};

export default api;



