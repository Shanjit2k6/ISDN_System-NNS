import api from './api';

export const analyticsService = {
  /**
   * Fetch dashboard KPI summary data
   * @param {string} [rdcId] Optional RDC filtered view
   * @returns {Promise<Object>} KPI metrics
   */
  getDashboardSummary: async (rdcId) => {
    try {
      const response = await api.get('/kpi/dashboard', { params: { rdcId } });
      return response.data;
    } catch (error) {
      console.error("Error fetching dashboard summary:", error);
      throw error;
    }
  },

  /**
   * Fetch historical snapshots for charts
   */
  getSnapshots: async (rdcId) => {
    try {
      const response = await api.get('/kpi/snapshots', { params: { rdcId } });
      return response.data;
    } catch (error) {
      console.error("Error fetching snapshots:", error);
      throw error;
    }
  }
};
