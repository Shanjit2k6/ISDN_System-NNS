import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventoryService';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

export const Inventory = () => {
  const { currentUser } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (!currentUser?.rdcId) {
      setLoading(false);
      return;
    }
    
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const data = await inventoryService.getRdcStock(currentUser.rdcId);
        const invArray = Array.isArray(data) ? data : (data?.data || []);
        setInventory(invArray);
      } catch (err) {
        console.error("Failed to load inventory:", err);
        setError("Could not retrieve stock levels.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchInventory();
  }, [currentUser]);

  const filteredInventory = inventory.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = inventory.filter(i => i.quantity <= (i.lowStockThreshold || 0)).length;

  const handleRequestTransfer = async (e) => {
    e.preventDefault();
    try {
      const quantity = e.target.elements[1].value; // Requested Quantity input
      await inventoryService.requestTransfer({
        sourceRdcId: 'HQ',
        targetRdcId: currentUser?.rdcId,
        productId: selectedItem?.id || selectedItem?.productId,
        quantity: parseInt(quantity, 10)
      });
      alert(`Transfer request sent successfully for ${selectedItem?.name}`);
    } catch (err) {
      alert("Failed to send transfer request. " + err.message);
    } finally {
      setIsTransferModalOpen(false);
      setSelectedItem(null);
    }
  };

  const openTransferModal = (item) => {
    setSelectedItem(item);
    setIsTransferModalOpen(true);
  };

  if (!currentUser?.rdcId && !loading) {
    return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Please configure your RDC ID to view inventory.</div>;
  }

  if (loading) {
    return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Loading inventory from server...</div>;
  }

  if (error) {
    return <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--accent-danger)' }}>{error}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header and KPIs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ marginBottom: 'var(--space-2)' }}>Inventory Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            RDC: {currentUser?.rdcId || 'Central Warehouse'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <Card style={{ padding: 'var(--space-3) var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ backgroundColor: 'var(--accent-primary)20', color: 'var(--accent-primary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-full)' }}>
              📦
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total SKU Types</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{inventory.length}</div>
            </div>
          </Card>
          
          <Card style={{ padding: 'var(--space-3) var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', borderColor: lowStockCount > 0 ? 'var(--accent-danger)' : 'var(--border-light)' }}>
            <div style={{ backgroundColor: lowStockCount > 0 ? 'var(--accent-danger)20' : 'var(--accent-success)20', color: lowStockCount > 0 ? 'var(--accent-danger)' : 'var(--accent-success)', padding: 'var(--space-3)', borderRadius: 'var(--radius-full)' }}>
              ⚠️
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Low Stock Alerts</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: lowStockCount > 0 ? 'var(--accent-danger)' : 'inherit' }}>
                {lowStockCount}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Table Area */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Input 
            placeholder="Search SKU or Product Name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
          <Button variant="secondary">Export Report</Button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <tr>
                <th style={{ padding: 'var(--space-4)' }}>SKU</th>
                <th style={{ padding: 'var(--space-4)' }}>Product Name</th>
                <th style={{ padding: 'var(--space-4)' }}>Quantity On Hand</th>
                <th style={{ padding: 'var(--space-4)' }}>Status</th>
                <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item, index) => {
                const isLowStock = item.quantity <= item.lowStockThreshold;
                return (
                  <tr key={item.id} style={{ borderBottom: index === filteredInventory.length - 1 ? 'none' : '1px solid var(--border-light)' }}>
                    <td style={{ padding: 'var(--space-4)', fontWeight: 500 }}>{item.sku}</td>
                    <td style={{ padding: 'var(--space-4)' }}>{item.name}</td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      <span style={{ fontSize: '1.125rem', fontWeight: 600, color: isLowStock ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                        {item.quantity}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      {isLowStock ? (
                        <span style={{ backgroundColor: 'var(--accent-danger)20', color: 'var(--accent-danger)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                          Low Stock
                        </span>
                      ) : (
                        <span style={{ backgroundColor: 'var(--accent-success)20', color: 'var(--accent-success)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                          Healthy
                        </span>
                      )}
                    </td>
                    <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                      <Button variant="ghost" size="sm" onClick={() => openTransferModal(item)}>
                        Request Stock
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Transfer Request Modal */}
      <Modal 
        isOpen={isTransferModalOpen} 
        onClose={() => setIsTransferModalOpen(false)}
        title="Inter-RDC Stock Transfer Request"
      >
        <form onSubmit={handleRequestTransfer} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Requesting Product</div>
            <div style={{ fontWeight: 600 }}>{selectedItem?.name} ({selectedItem?.sku})</div>
          </div>
          
          <Input label="Source RDC" type="select" defaultValue="HQ">
            {/* Note: In real app this would be a proper select element */}
            <option>Head Office (HQ)</option>
            <option>Central RDC</option>
            <option>Northern RDC</option>
          </Input>

          <Input label="Requested Quantity" type="number" min="1" required defaultValue="50" />
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <Button type="button" variant="ghost" onClick={() => setIsTransferModalOpen(false)}>Cancel</Button>
            <Button type="submit">Submit Request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
