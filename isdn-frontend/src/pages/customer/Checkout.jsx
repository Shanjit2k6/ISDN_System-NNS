import React, { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { orderService } from '../../services/orderService'; // NEW API SERVICE

export const Checkout = () => {
  const { cart, cartTotal, removeFromCart, updateQuantity, clearCart } = useCart();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    // Simulate credit limit validation
    if (currentUser?.creditLimit > 0 && cartTotal > currentUser.creditLimit) {
      setError(`Credit limit exceeded. Your available limit is LKR ${currentUser.creditLimit}`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const orderData = {
        retailOutletId: currentUser.retailOutletId || currentUser.uid,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price
        })),
        rdcId: currentUser.rdcId || 'DEFAULT-RDC'
      };

      await orderService.createOrder(orderData);
      
      setSuccess('Order placed successfully!');
      clearCart();
    } catch (err) {
      console.error(err);
      setError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>✅</div>
        <h2>{success}</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
          Your order has been sent to the Regional Distribution Centre for processing.
        </p>
        <Button onClick={() => window.location.href='/dashboard'}>Return to Dashboard</Button>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ marginBottom: 'var(--space-2)' }}>Checkout</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Review your items and confirm your order.</p>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--accent-danger)', color: 'white', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Cart Items List */}
        <Card style={{ gap: 0, padding: 0, overflow: 'hidden' }}>
          {cart.length === 0 ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Your cart is empty.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {cart.map((item, index) => (
                <div key={item.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: 'var(--space-4)',
                  borderBottom: index < cart.length - 1 ? '1px solid var(--border-light)' : 'none'
                }}>
                  <div style={{ fontSize: '2rem', marginRight: 'var(--space-4)' }}>{item.image}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.sku}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginRight: 'var(--space-6)' }}>
                    <button style={{ padding: 4, borderRadius: 4, border: '1px solid var(--border-medium)', cursor: 'pointer' }} onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                    <span style={{ width: 24, textAlign: 'center' }}>{item.quantity}</span>
                    <button style={{ padding: 4, borderRadius: 4, border: '1px solid var(--border-medium)', cursor: 'pointer' }} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <div style={{ width: '100px', textAlign: 'right', fontWeight: 600 }}>
                    LKR {(item.price * item.quantity).toLocaleString()}
                  </div>
                  <button style={{ marginLeft: 'var(--space-4)', color: 'var(--accent-danger)', cursor: 'pointer', background: 'none', border: 'none' }} onClick={() => removeFromCart(item.id)}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Order Summary */}
        <Card style={{ position: 'sticky', top: 'var(--space-6)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Order Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Items ({cart.reduce((a,b)=>a+b.quantity,0)})</span>
            <span>LKR {cartTotal.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Delivery Fee</span>
            <span>Free</span>
          </div>
          <div style={{ borderTop: '1px solid var(--border-light)', margin: 'var(--space-4) 0' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-6)', fontSize: '1.25rem', fontWeight: 700 }}>
            <span>Total</span>
            <span>LKR {cartTotal.toLocaleString()}</span>
          </div>

          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleCheckout} 
            disabled={cart.length === 0 || loading}
          >
            {loading ? 'Processing...' : 'Confirm Order'}
          </Button>

          {currentUser?.creditLimit > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: 'var(--space-4)' }}>
              Available Credit: LKR {currentUser.creditLimit.toLocaleString()}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
