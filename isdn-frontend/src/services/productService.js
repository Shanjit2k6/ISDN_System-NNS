import api from './api';

export const productService = {
  /**
   * Fetch all products from the Node.js backend
   * @returns {Promise<Array>} List of products
   */
  getAllProducts: async () => {
    try {
      const response = await api.get('/products');
      return response.data;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },

  /**
   * Fetch active promotions
   */
  getPromotions: async () => {
    try {
      const response = await api.get('/products/promotions');
      return response.data;
    } catch (error) {
      console.error("Error fetching promotions:", error);
      throw error;
    }
  }
};
