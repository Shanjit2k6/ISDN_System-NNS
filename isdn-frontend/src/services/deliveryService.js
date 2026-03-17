import api from './api';

export const deliveryService = {
  /**
   * Fetch all deliveries for the current driver
   * @returns {Promise<Array>} List of deliveries
   */
  getMyDeliveries: async () => {
    try {
      const response = await api.get('/deliveries/my');
      return response.data;
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      throw error;
    }
  },

  /**
   * Update delivery status (e.g., DELIVERED)
   * @param {string} deliveryId 
   * @param {Object} data { status, proofOfDeliveryUrl, signature }
   */
  updateDeliveryStatus: async (deliveryId, data) => {
    try {
      const response = await api.patch(`/deliveries/${deliveryId}/status`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating delivery status:", error);
      throw error;
    }
  },

  /**
   * Fetch a specific delivery by ID
   */
  getDeliveryById: async (deliveryId) => {
    try {
      const response = await api.get(`/deliveries/${deliveryId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching delivery details:", error);
      throw error;
    }
  }
};
