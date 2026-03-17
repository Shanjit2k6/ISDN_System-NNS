import React, { useEffect, useState } from 'react';
import { orderService } from '../../services/orderService';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';

export const Orders = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        let data;
        
        // Depending on role, fetch different orders
        if (currentUser.role === 'customer') {
          // Send retailOutletId or fallback to uid
          data = await orderService.getCustomerOrders(currentUser.retailOutletId || currentUser.uid);
        } else {
          // For RDC staff / Admin: all orders
          data = await orderService.getAllOrders();
        }

        // Map data if wrapped in data.data or return directly
        const ordersList = Array.isArray(data) ? data : (data?.data || []);
        
        // Ensure dates are parsed
        const mappedOrders = ordersList.map(order => ({
          ...order,
          id: order.id || order._id || order.orderId,
          createdAt: new Date(order.createdAt || order.orderDate || Date.now())
        }));

        setOrders(mappedOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Could not load orders. Ensure backend is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentUser]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'var(--accent-warning)';
      case 'PROCESSING': return 'var(--accent-primary)';
      case 'DISPATCHED': return 'var(--accent-purple)';
      case 'DELIVERED': return 'var(--accent-success)';
      case 'CANCELLED': return 'var(--accent-danger)';
      default: return 'var(--text-secondary)';
    }
  };

  if (loading) {
    return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Loading orders from server...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--accent-danger)' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: 'var(--space-2)' }}>Orders Tracking</h1>
          <p style={{ color: 'var(--text-secondary)' }}>View and track the status of your orders.</p>
        </div>
        {currentUser?.role === 'customer' && (
          <Link to="/catalogue">
            <Button>+ New Order</Button>
          </Link>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--text-tertiary)' }}>
            You haven't placed any orders yet. 
            <Link to="/catalogue" style={{ display: 'block', marginTop: 'var(--space-2)', color: 'var(--accent-primary)' }}>Start Shopping</Link>
          </div>
        ) : (
          orders.map(order => (
            <Card key={order.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {order.createdAt.toLocaleDateString()} at {order.createdAt.toLocaleTimeString()}
                  </div>
                </div>
                <div style={{ 
                  padding: 'var(--space-1) var(--space-3)', 
                  borderRadius: 'var(--radius-full)', 
                  backgroundColor: `${getStatusColor(order.status)}20`, /* 20% opacity */
                  color: getStatusColor(order.status),
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}>
                  {order.status}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 'var(--space-4)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)', fontSize: '0.875rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>Customer</div>
                    <div style={{ fontWeight: 500 }}>{order.customerName}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>Total Items</div>
                    <div style={{ fontWeight: 500 }}>{order.items?.length || 0} items</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>Total Value</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      LKR {(order.totalValue || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <Button variant="secondary" size="sm">View Invoice</Button>
                {/* Driver specific action */}
                {currentUser?.role === 'logistics' && order.status === 'PROCESSING' && (
                  <Button size="sm">Assign to Route</Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
