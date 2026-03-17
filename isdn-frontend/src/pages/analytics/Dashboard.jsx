import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsService } from '../../services/analyticsService';

// Standard fallback dashboard layout containing KPIs
export const Dashboard = () => {
  const { currentUser } = useAuth();
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await analyticsService.getDashboardSummary(currentUser?.rdcId);
        
        // Map the backend KPI structure to our dashboard items
        // Note: The structure depends on what the Node backend returns. 
        // We'll map standard operational metrics.
        const summary = Array.isArray(data) ? data : (data?.data || data);
        
        const mappedKpis = [
          { 
            label: 'Total Sales Today', 
            value: `LKR ${(summary.todaySales || 0).toLocaleString()}`, 
            trend: summary.salesTrend || '0%', 
            color: 'var(--accent-success)' 
          },
          { 
            label: 'Active RDCs', 
            value: summary.activeRdcs || '5', 
            trend: 'Online', 
            color: 'var(--accent-primary)' 
          },
          { 
            label: 'Deliveries In Progress', 
            value: summary.pendingDeliveries || '0', 
            trend: 'On Schedule', 
            color: 'var(--accent-purple)' 
          },
          { 
            label: 'Low Stock Items', 
            value: summary.lowStockCount || '0', 
            trend: 'Needs Action', 
            color: 'var(--accent-danger)' 
          }
        ];
        
        setKpis(mappedKpis);
      } catch (err) {
        console.error("Failed to fetch dashboard KPIs:", err);
        setError("Could not load real-time metrics.");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);

  if (loading) {
    return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Loading dashboard metrics...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ marginBottom: 'var(--space-2)' }}>Overview</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {currentUser?.name || 'User'}. Here is what's happening today.</p>
        {error && <p style={{ color: 'var(--accent-danger)', fontSize: '0.875rem', marginTop: 'var(--space-2)' }}>{error}</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        {kpis.map((kpi, index) => (
          <Card key={index} style={{ padding: 'var(--space-5)' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
              {kpi.label}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: '0.75rem', color: kpi.color, fontWeight: 500 }}>
              {kpi.trend}
            </div>
          </Card>
        ))}
      </div>

      {(currentUser?.role === 'admin' || currentUser?.role === 'ho_manager') && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
          <Card style={{ minHeight: '300px' }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Sales Trends (Current Week)</h3>
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', border: '1px dashed var(--border-medium)', borderRadius: 'var(--radius-md)' }}>
              [Chart Visualization Placeholder: Recharts]
            </div>
          </Card>
          
          <Card>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Delivery Performance</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 'var(--space-1)' }}>
                  <span>On Time</span>
                  <span style={{ fontWeight: 600 }}>92%</span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '92%', backgroundColor: 'var(--accent-success)' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 'var(--space-1)' }}>
                  <span>Delayed</span>
                  <span style={{ fontWeight: 600 }}>6%</span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '6%', backgroundColor: 'var(--accent-warning)' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 'var(--space-1)' }}>
                  <span>Failed</span>
                  <span style={{ fontWeight: 600 }}>2%</span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '2%', backgroundColor: 'var(--accent-danger)' }}></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
