import React, { useState, useEffect } from 'react';
import { PayPalButtons } from "@paypal/react-paypal-js";
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { billingService } from '../../services/billingService';

export const Billing = () => {
  const { currentUser } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentPane, setShowPaymentPane] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const data = await billingService.getInvoices(currentUser.role, currentUser.uid);
        const invoiceList = Array.isArray(data) ? data : (data?.data || []);

        const mappedInvoices = invoiceList.map(inv => ({
          ...inv,
          id: inv.id || inv._id || inv.invoiceNumber || inv.invoiceId,
          customer: inv.customerName || (inv.customer ? inv.customer.name : 'Valued Retailer'),
          date: inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : 'N/A',
          dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A',
          status: inv.invoiceStatus || inv.status || 'UNPAID',
          amount: parseFloat(inv.totalAmount || inv.amount || 0)
        }));

        setInvoices(mappedInvoices);
      } catch (err) {
        console.error("Failed to fetch invoices:", err);
        setError("Could not load billing information from the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [currentUser]);

  const totalOutstanding = invoices.filter(i => i.status !== 'PAID').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === 'OVERDUE').reduce((acc, curr) => acc + curr.amount, 0);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PAID': return { bg: 'var(--accent-success)20', color: 'var(--accent-success)' };
      case 'UNPAID': return { bg: 'var(--accent-warning)20', color: 'var(--accent-warning)' };
      case 'OVERDUE': return { bg: 'var(--accent-danger)20', color: 'var(--accent-danger)' };
      default: return { bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)' };
    }
  };

  const handleInvoiceSelect = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentSuccess(false);
    setShowPaymentPane(true);
  };

  const onPaymentApprove = async (data, actions) => {
    const details = await actions.order.capture();
    try {
      await billingService.processPayment(selectedInvoice.id, {
        paymentMethod: 'PAYPAL',
        gatewayRef: details.id,
        amount: selectedInvoice.amount
      });

      setInvoices(prev => prev.map(inv =>
        inv.id === selectedInvoice.id ? { ...inv, status: 'PAID' } : inv
      ));
      setPaymentSuccess(true);
    } catch (err) {
      console.error("Payment sync failed:", err);
      alert("Payment was successful but we couldn't sync with the server. Please contact support.");
    }
  };

  if (loading) {
    return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Loading billing data...</div>;
  }

  if (error) {
    return <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--accent-danger)' }}>{error}</div>;
  }

  return (
    <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* 1. Page Title */}
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 'var(--space-1)' }}>Billing & Payment</h1>
        <p style={{ color: 'var(--text-secondary)' }}>View your invoices and pay securely via PayPal.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showPaymentPane ? '1fr 400px' : '1fr', gap: 'var(--space-6)', transition: 'all 0.3s ease' }}>
        {/* Invoice List View */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <Card style={{ padding: 'var(--space-4)', flex: 1, minWidth: '200px', borderLeft: '4px solid var(--accent-warning)' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Total Outstanding</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>LKR {totalOutstanding.toLocaleString()}</div>
            </Card>
            <Card style={{ padding: 'var(--space-4)', flex: 1, minWidth: '200px', borderLeft: '4px solid var(--accent-danger)' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Overdue Balance</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: totalOverdue > 0 ? 'var(--accent-danger)' : 'inherit' }}>
                LKR {totalOverdue.toLocaleString()}
              </div>
            </Card>
          </div>

          <Card style={{ padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <tr>
                    <th style={{ padding: 'var(--space-4)' }}>Invoice #</th>
                    <th style={{ padding: 'var(--space-4)' }}>Issue Date</th>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-tertiary)' }}>No invoices found.</td></tr>
                  ) : (
                    invoices.map((inv, idx) => {
                      const style = getStatusStyle(inv.status);
                      return (
                        <tr key={inv.id} style={{ borderBottom: idx === invoices.length - 1 ? 'none' : '1px solid var(--border-light)', cursor: 'pointer' }} onClick={() => handleInvoiceSelect(inv)}>
                          <td style={{ padding: 'var(--space-4)', fontWeight: 600 }}>{inv.id.substring(0, 12)}</td>
                          <td style={{ padding: 'var(--space-4)', color: 'var(--text-secondary)' }}>{inv.date}</td>
                          <td style={{ padding: 'var(--space-4)', textAlign: 'right', fontWeight: 700 }}>LKR {inv.amount.toLocaleString()}</td>
                          <td style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                            <span style={{ backgroundColor: style.bg, color: style.color, padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                              {inv.status}
                            </span>
                          </td>
                          <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                            {inv.status !== 'PAID' && <Button size="sm">Pay Now</Button>}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* 2. & 3. Summary & PayPal Section */}
        {showPaymentPane && selectedInvoice && (
          <div style={{ position: 'sticky', top: 'var(--space-4)', height: 'fit-content' }}>
            <Card style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', boxShadow: 'var(--shadow-lg)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Payment Summary</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowPaymentPane(false)}>✕</Button>
              </div>

              {paymentSuccess ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-10) 0', animation: 'scaleUp 0.3s ease-out' }}>
                  <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🎉</div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>Payment Complete!</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                    Your payment for invoice {selectedInvoice.id.substring(0, 8)} was successful.
                  </p>
                  <Button className="w-full" onClick={() => setShowPaymentPane(false)}>Done</Button>
                </div>
              ) : (
                <>
                  <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Invoice Number</span>
                      <span style={{ fontWeight: 600 }}>#{selectedInvoice.id.substring(0, 12)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Due Date</span>
                      <span>{selectedInvoice.dueDate}</span>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: 'var(--space-4) 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>Total Amount</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                        LKR {selectedInvoice.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)', textAlign: 'center' }}>
                      🔒 Secure payment handled by PayPal. Your data is encrypted.
                    </p>
                    <PayPalButtons
                      style={{ layout: "vertical", shape: "rect", height: 45 }}
                      createOrder={(data, actions) => {
                        return actions.order.create({
                          purchase_units: [{
                            amount: {
                              value: (selectedInvoice.amount / 300).toFixed(2), // Mock conversion to USD for test
                              currency_code: "USD"
                            },
                            description: `Payment for Invoice #${selectedInvoice.id}`
                          }]
                        });
                      }}
                      onApprove={onPaymentApprove}
                      onError={(err) => {
                        console.error("PayPal Error:", err);
                        alert("PayPal Checkout failed to initialize. Please try again.");
                      }}
                    />
                  </div>
                </>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

