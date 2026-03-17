import api from './api';

export const billingService = {
  /**
   * Fetch invoices
   * @param {string} role 'customer' | 'finance' | 'admin'
   * @param {string} [userId] Optional customer/user ID
   */
  getInvoices: async (role, userId) => {
    try {
      let endpoint = '/billing/invoices';
      if (role === 'customer' && userId) {
        endpoint = `/billing/invoices/customer/${userId}`;
      }
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error("Error fetching invoices:", error);
      throw error;
    }
  },

  /**
   * Mock a payment processor transaction for an invoice
   * @param {string} invoiceId 
   * @param {Object} paymentPayload Tokenized card details
   */
  processPayment: async (invoiceId, paymentPayload) => {
    try {
      // Typically, card details wouldn't hit this API raw, but a token would.
      const response = await api.post(`/billing/invoices/${invoiceId}/pay`, paymentPayload);
      return response.data;
    } catch (error) {
      console.error("Error processing payment:", error);
      throw error;
    }
  }
};
