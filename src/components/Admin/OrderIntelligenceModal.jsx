import React from 'react';
import { X, Users, Mail, ShoppingBag, DollarSign, BarChart2, Package } from 'lucide-react';
import { formatEnPrice, statusLabels } from './AdminCommon';

export const OrderIntelligenceModal = ({ order, isOpen, onClose, onUpdateStatus, updatingId, language, onNotify }) => {
  if (!isOpen || !order) return null;

  const copyIdToClipboard = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(order.id);
    onNotify?.(language === 'ar' ? 'تم نسخ المعرف!' : 'ID Copied!', 'success');
  };

  const totalNetProfit = (order.order_items || []).reduce((acc, item) => 
    acc + ((item.price_at_purchase - (item.cost_price_at_purchase || 0)) * item.quantity), 0);

  const formatDate = (dateStr) => {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-card large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-area">
            <div className="modal-icon-bg">
              <Package size={24} />
            </div>
            <div>
              <h3>{language === 'ar' ? 'تفاصيل الطلب' : 'Order Intelligence'}</h3>
              <code 
                className="order-id-badge clickable" 
                title={language === 'ar' ? 'انقر للنسخ' : 'Click to copy'} 
                onClick={copyIdToClipboard}
              >
                {order.id.slice(0, 8)}
              </code>
            </div>
          </div>
          <button className="close-modal-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="modal-body">
          <div className="timestamp-section">
            <BarChart2 size={16} />
            <span>{language === 'ar' ? 'تم إنشاء الطلب في:' : 'Created on:'} <strong>{formatDate(order.created_at)}</strong></span>
          </div>

          <div className="intelligence-grid">
            <div className="intel-column">
              <div className="section-head">
                <Users size={16} />
                <span>{language === 'ar' ? 'معلومات العميل' : 'Customer Profile'}</span>
              </div>
              <div className="customer-card">
                <div className="cust-row">
                  <span className="cust-label">{language === 'ar' ? 'الاسم' : 'Name'}</span>
                  <span className="cust-value">{order.customer_name}</span>
                </div>
                <div className="cust-row">
                  <span className="cust-label">{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</span>
                  <span className="cust-value mono">{order.customer_phone}</span>
                </div>
                
                <div className="status-update-box">
                  <label>{language === 'ar' ? 'تحديث الحالة' : 'Status Control'}</label>
                  <select 
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(e) => onUpdateStatus(order, e.target.value)}
                    className={`status-select ${order.status}`}
                  >
                    {Object.keys(statusLabels).map(s => (
                      <option key={s} value={s}>{language === 'ar' ? statusLabels[s] : (s.charAt(0).toUpperCase() + s.slice(1))}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="intel-column">
              <div className="section-head">
                <ShoppingBag size={16} />
                <span>{language === 'ar' ? 'المنتجات والنتائج المالية' : 'Items & Economics'}</span>
              </div>
              <div className="items-mini-list">
                {order.order_items?.map((item, idx) => {
                  const profit = (item.price_at_purchase - (item.cost_price_at_purchase || 0)) * item.quantity;
                  return (
                    <div key={idx} className="mini-item-row">
                      <div className="item-main-info">
                        <span className="qty-tag">{item.quantity}x</span>
                        <div className="item-text">
                          <div className="item-name">{item.product_name || (language === 'ar' ? 'منتج' : 'Product')}</div>
                          <div className="item-var">{item.variant_label || '-'}</div>
                        </div>
                      </div>
                      <div className="item-finance">
                        <div className="item-gross">{formatEnPrice(item.price_at_purchase * item.quantity)}</div>
                        <div className="item-net">+{formatEnPrice(profit)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="financial-summary-card">
                <div className="sum-line">
                  <span>{language === 'ar' ? 'الإجمالي العام' : 'Gross Revenue'}</span>
                  <span>{formatEnPrice(order.total_amount)}</span>
                </div>
                <div className="sum-line total">
                  <span>{language === 'ar' ? 'صافي الربح' : 'Total Net Profit'}</span>
                  <span className="profit-value">{formatEnPrice(totalNetProfit)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .order-id-badge { font-size: 11px; background: #eff6ff; padding: 4px 8px; border-radius: 6px; color: #3b82f6; font-family: 'JetBrains Mono', monospace; font-weight: 700; border: 1px solid rgba(59, 130, 246, 0.1); margin-top: 4px; display: inline-block; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.05); transition: all 0.2s; }
        .order-id-badge.clickable { cursor: copy; }
        .order-id-badge.clickable:hover { background: #dbeafe; transform: translateY(-1px); }
        .order-id-badge.clickable:active { transform: translateY(0); }
        .timestamp-section { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: rgba(59, 130, 246, 0.05); border-radius: 12px; margin-bottom: 24px; font-size: 0.85rem; color: #3b82f6; }
        .timestamp-section strong { color: #1e3a8a; }

        .intelligence-grid { display: grid; grid-template-columns: 1.2fr 1.8fr; gap: 32px; }
        @media (max-width: 768px) { .intelligence-grid { grid-template-columns: 1fr; gap: 24px; } }

        .section-head { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; color: #64748b; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .customer-card { background: #f8fafc; border-radius: 20px; padding: 20px; }
        .cust-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
        .cust-label { color: #94a3b8; font-size: 0.85rem; }
        .cust-value { color: #0f172a; font-weight: 700; }
        .cust-value.mono { font-family: 'JetBrains Mono'; }

        .status-update-box { margin-top: 24px; padding-top: 20px; border-top: 2px dashed #e2e8f0; }
        .status-update-box label { display: block; font-size: 0.75rem; font-weight: 800; color: #64748b; margin-bottom: 12px; }

        .items-mini-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
        .mini-item-row { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; border: 1px solid #f1f5f9; border-radius: 14px; }
        .item-main-info { display: flex; align-items: center; gap: 12px; }
        .qty-tag { width: 32px; height: 32px; background: #f1f5f9; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem; color: #0f172a; }
        .item-name { font-size: 0.9rem; font-weight: 700; color: #0f172a; }
        .item-var { font-size: 0.75rem; color: #94a3b8; }
        .item-finance { text-align: right; }
        .item-gross { font-weight: 800; font-size: 0.9rem; color: #0f172a; }
        .item-net { font-size: 0.75rem; color: #10b981; font-weight: 700; }

        .financial-summary-card { padding: 20px; background: #0f172a; border-radius: 20px; color: white; }
        .sum-line { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.85rem; color: #94a3b8; }
        .sum-line.total { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 1.1rem; font-weight: 800; color: #fff; }
        .profit-value { color: #fbbf24; }

        @media (max-width: 640px) {
          .admin-modal-card.large { max-width: none; }
          .modal-body { padding: 20px; }
          .intelligence-grid { gap: 40px; }
          .mini-item-row { gap: 8px; }
          .item-name { font-size: 0.85rem; }
        }
      ` }} />
    </div>
  );
};
