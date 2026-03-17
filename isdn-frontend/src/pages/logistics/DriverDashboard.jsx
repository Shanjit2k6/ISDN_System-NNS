import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { deliveryService } from '../../services/deliveryService';

export const DriverDashboard = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [view, setView] = useState('list'); // 'list', 'details', 'pod'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        setLoading(true);
        const data = await deliveryService.getMyDeliveries();
        setDeliveries(Array.isArray(data) ? data : (data?.data || []));
      } catch (err) {
        console.error("Failed to fetch deliveries:", err);
        setError("Could not load delivery route. Ensure you are assigned to a route.");
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveries();
  }, []);

  const handleDeliveryComplete = async () => {
    try {
      setLoading(true);
      // In real app, first upload POD to firebase storage
      const mockPodUrl = "https://firebasestorage.googleapis.com/...";
      
      await deliveryService.updateDeliveryStatus(selectedDelivery.id || selectedDelivery.deliveryId, {
        status: 'DELIVERED',
        proofOfDeliveryUrl: mockPodUrl
      });

      setDeliveries(prev => prev.map(d => 
        (d.id === selectedDelivery.id || d.deliveryId === selectedDelivery.deliveryId) 
          ? { ...d, status: 'DELIVERED' } : d
      ));
      setView('list');
      setSelectedDelivery(null);
    } catch (err) {
      console.error("Failed to complete delivery:", err);
      alert("Error saving delivery status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (view === 'pod' && selectedDelivery) {
    return (
      <div style={{ padding: 'var(--space-2)' }}>
        <div style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Button variant="ghost" onClick={() => setView('details')}>← Back</Button>
          <h2 style={{ fontSize: '1.25rem' }}>Proof of Delivery</h2>
        </div>
        
        <Card>
          <p style={{ marginBottom: 'var(--space-4)', fontWeight: 500 }}>
            Upload signature or photo for {selectedDelivery.customerName}
          </p>
          
          <div style={{ 
            border: '2px dashed var(--border-medium)', 
            borderRadius: 'var(--radius-md)', 
            height: '250px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-6)',
            cursor: 'pointer'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>📷</div>
            <div>Tap to Open Camera</div>
          </div>
          
          <Button className="w-full" size="lg" onClick={handleDeliveryComplete}>
            Confirm Delivery
          </Button>
        </Card>
      </div>
    );
  }

  if (view === 'details' && selectedDelivery) {
    return (
      <div style={{ padding: 'var(--space-2)' }}>
        <div style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Button variant="ghost" onClick={() => { setView('list'); setSelectedDelivery(null); }}>← Back</Button>
          <h2 style={{ fontSize: '1.25rem' }}>Stop #{selectedDelivery.seq}</h2>
        </div>

        <Card style={{ marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>{selectedDelivery.customerName}</h3>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>
            <span>📍</span>
            <span>{selectedDelivery.address}</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>
            <span>📞</span>
            <a href={`tel:${selectedDelivery.phone}`} style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{selectedDelivery.phone}</a>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3)', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Order Value</div>
              <div style={{ fontWeight: 600 }}>LKR {selectedDelivery.amount.toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Items</div>
              <div style={{ fontWeight: 600 }}>{selectedDelivery.items} Boxes</div>
            </div>
          </div>
        </Card>

        {selectedDelivery.status === 'PENDING' && (
          <Button 
            className="w-full" 
            size="lg" 
            style={{ backgroundColor: 'var(--accent-success)' }}
            onClick={() => setView('pod')}
          >
            Mark as Delivered
          </Button>
        )}
      </div>
    );
  }

  if (loading && view === 'list') {
    return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Loading your route...</div>;
  }

  return (
    <div style={{ padding: 'var(--space-2)', maxWidth: '100%', overflowX: 'hidden' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-1)' }}>Today's Route</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {deliveries.filter(d => d.status === 'DELIVERED').length} of {deliveries.length} completed
        </p>
        {error && <p style={{ color: 'var(--accent-danger)', fontSize: '0.875rem', marginTop: 'var(--space-2)' }}>{error}</p>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {deliveries.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--text-tertiary)' }}>
            No deliveries assigned to you today.
          </div>
        )}
        {deliveries.sort((a,b) => (a.seq || 0) - (b.seq || 0)).map(delivery => (
          <Card 
            key={delivery.id || delivery.deliveryId} 
            style={{ 
              padding: 'var(--space-4)', 
              cursor: 'pointer',
              opacity: delivery.status === 'DELIVERED' ? 0.6 : 1,
              borderLeft: `4px solid ${delivery.status === 'DELIVERED' ? 'var(--accent-success)' : 'var(--accent-primary)'}`
            }}
            onClick={() => {
              setSelectedDelivery(delivery);
              setView('details');
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{(delivery.seq || '•')} {delivery.customerName || 'Customer'}</div>
              {delivery.status === 'DELIVERED' && <span title="Delivered">✅</span>}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {delivery.address || 'Address not provided'}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
