import React from 'react';
import { X, Users, Mail, ShoppingBag, DollarSign, BarChart2, Package } from 'lucide-react';
import { formatEnPrice, statusLabels } from './AdminCommon';

export const OrderIntelligenceModal = ({ order, isOpen, onClose, onUpdateStatus, updatingId, language }) => {
  if (!isOpen || !order) return null;

  const totalNetProfit = (order.order_items || []).reduce((acc, item) => 
    acc + ((item.price_at_purchase - (item.cost_price_at_purchase || 0)) * item.quantity), 0);

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      <div className="modal-content large" onClick={e => e.stopPropagation()} style={{
        background: 'white', width: '100%', maxWidth: '800px', borderRadius: '28px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.3)'
      }}>
        <div className="modal-header" style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="header-title-group">
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{language === 'ar' ? 'تفاصيل الطلب' : 'Order Intelligence'}</h2>
            <code className="order-id" style={{ fontSize: '12px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', color: '#64748b' }}>#{order.id.toUpperCase()}</code>
          </div>
          <button className="close-btn" onClick={onClose} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '10px', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        
        <div className="modal-body scrollable" style={{ padding: '32px', overflowY: 'auto' }}>
          <div className="order-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            
            <div className="order-info-card">
              <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '20px' }}>{language === 'ar' ? 'معلومات العميل' : 'Customer Info'}</h3>
              <div className="info-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', color: '#1e293b', fontWeight: '500' }}>
                <Users size={16} /> <span>{order.customer_name}</span>
              </div>
              <div className="info-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: '#1e293b', fontWeight: '500' }}>
                <Mail size={16} /> <span style={{ fontFamily: 'JetBrains Mono' }}>{order.customer_phone}</span>
              </div>
              <div className="status-selector" style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>{language === 'ar' ? 'حالة الطلب الحالي' : 'Live Status'}</label>
                <select 
                  value={order.status}
                  disabled={updatingId === order.id}
                  onChange={(e) => onUpdateStatus(order, e.target.value)}
                  className={`status-select ${order.status}`}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', fontWeight: '700', border: '2px solid transparent' }}
                >
                  {Object.keys(statusLabels).map(s => (
                    <option key={s} value={s}>{language === 'ar' ? statusLabels[s] : (s.charAt(0).toUpperCase() + s.slice(1))}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="order-items-card">
              <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '20px' }}>{language === 'ar' ? 'المنتجات والتكاليف' : 'Items & Economics'}</h3>
              <div className="items-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {order.order_items?.map((item, idx) => {
                  const profit = (item.price_at_purchase - (item.cost_price_at_purchase || 0)) * item.quantity;
                  return (
                    <div key={idx} className="order-item-detail" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #f8fafc' }}>
                      <div className="item-main" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="item-qty" style={{ background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>{item.quantity}x</span>
                        <div className="item-names">
                          <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a' }}>{item.product_name || (language === 'ar' ? 'منتج' : 'Product')}</strong>
                          <small style={{ color: '#64748b' }}>{item.variant_label || '-'}</small>
                        </div>
                      </div>
                      <div className="item-money" style={{ textAlign: 'right' }}>
                        <div className="item-total" style={{ fontWeight: '700', color: '#0f172a' }}>{formatEnPrice(item.price_at_purchase * item.quantity)}</div>
                        <div className="item-profit" style={{ fontSize: '11px', color: '#10b981', fontWeight: '600' }}>+{formatEnPrice(profit)} <small style={{ color: '#94a3b8' }}>Net</small></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="order-financial-summary" style={{ padding: '20px', background: '#0f172a', borderRadius: '20px', color: 'white' }}>
                <div className="summary-line" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#94a3b8' }}>{language === 'ar' ? 'الإجمالي' : 'Gross Revenue'}</span>
                  <span style={{ fontWeight: '700' }}>{formatEnPrice(order.total_amount)}</span>
                </div>
                <div className="summary-line profit" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '800' }}>
                  <span>{language === 'ar' ? 'صافي الربح' : 'Total Net Profit'}</span>
                  <span style={{ color: '#fbbf24' }}>{formatEnPrice(totalNetProfit)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
