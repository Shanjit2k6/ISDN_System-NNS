import api from './api';

export const orderService = {
  /**
   * Create a new order
   * @param {Object} orderData The order payload
   * @returns {Promise<Object>} Created order data
   */
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  /**
   * Fetch orders for the current customer
   * @param {string} customerId The customer's retailOutletId
   * @returns {Promise<Array>} List of orders
   */
  getCustomerOrders: async (customerId) => {
    try {
      const response = await api.get(`/orders/customer/${customerId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      throw error;
    }
  },

  /**
   * Fetch all orders (for Admin/RDC)
   * @returns {Promise<Array>} List of orders
   */
  getAllOrders: async () => {
    try {
      const response = await api.get('/orders');
      return response.data;
    } catch (error) {
      console.error("Error fetching all orders:", error);
      throw error;
    }
  }
};
