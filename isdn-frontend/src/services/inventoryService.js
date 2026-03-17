import api from './api';

export const inventoryService = {
  /**
   * Fetch inventory stock for a specific RDC
   * @param {string} rdcId The Regional Distribution Center ID
   * @returns {Promise<Array>} List of inventory items
   */
  getRdcStock: async (rdcId) => {
    try {
      const response = await api.get(`/inventory/${rdcId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching RDC inventory:", error);
      throw error;
    }
  },

  /**
   * Request inter-RDC stock transfer
   * @param {Object} transferData { sourceRdcId, targetRdcId, productId, quantity }
   */
  requestTransfer: async (transferData) => {
    try {
      const response = await api.post('/transfers', transferData);
      return response.data;
    } catch (error) {
      console.error("Error requesting stock transfer:", error);
      throw error;
    }
  }
};
