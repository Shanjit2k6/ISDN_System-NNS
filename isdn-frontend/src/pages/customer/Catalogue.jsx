import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCart } from '../../contexts/CartContext';
import { productService } from '../../services/productService';
import { useAuth } from '../../contexts/AuthContext';

export const Catalogue = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const { currentUser } = useAuth(); // Needed for token fetching implicitly handled by API service

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productService.getAllProducts();
        
        // Ensure data is an array before setting
        if (Array.isArray(data)) {
           // Map the backend structure to the frontend structure temporarily
           const mappedData = data.map(p => ({
             id: p.id || p._id,
             name: p.productName || p.name,
             category: p.category || 'General',
             price: p.baseUnitPrice || p.price,
             sku: p.sku,
             stock: p.stockOnHand || 100, // mock stock if not given
             image: '📦' // placeholder image
           }));
           setProducts(mappedData);
        } else if (data && Array.isArray(data.data)) {
           // If backend returns { data: [] }
           const mappedData = data.data.map(p => ({
             id: p.id || p._id,
             name: p.productName || p.name,
             category: p.category || 'General',
             price: p.baseUnitPrice || p.price,
             sku: p.sku,
             stock: p.stockOnHand || 100, // mock stock if not given
             image: '📦' // placeholder image
           }));
           setProducts(mappedData);
        } else {
           setProducts([]);
        }
      } catch (err) {
        console.error("Failed to load products:", err);
        setError("Could not load catalogue. Ensure backend is running.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
        Loading products from server...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ marginBottom: 'var(--space-2)' }}>Product Catalogue</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Browse and order products for your store.</p>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <Input 
            placeholder="Search products or SKU..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ minWidth: '250px' }}
          />
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)'
            }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--accent-danger)20', color: 'var(--accent-danger)', borderRadius: 'var(--radius-md)' }}>
          {error}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
          {filteredProducts.map(product => (
          <Card key={product.id} style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ height: '140px', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
              {product.image}
            </div>
            <div style={{ padding: 'var(--space-4)', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>
                {product.category} • {product.sku}
              </div>
              <h3 style={{ fontSize: '1.125rem', marginBottom: 'var(--space-2)', flex: 1 }}>{product.name}</h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'var(--space-4)' }}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(product.price)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: product.stock < 50 ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
                    {product.stock} in stock
                  </div>
                </div>
                <Button size="sm" onClick={() => addToCart(product)}>
                  Add
                </Button>
              </div>
            </div>
          </Card>
          ))}
          {filteredProducts.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No products found matching your criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
