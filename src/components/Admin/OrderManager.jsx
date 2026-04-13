import React from 'react';
import { ChevronRight } from 'lucide-react';
import { formatEnPrice, statusLabels } from './AdminCommon';

export const OrderManager = ({ orders, onSelectOrder, language }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>{language === 'ar' ? 'الطلب' : 'Order'}</th>
            <th>{language === 'ar' ? 'العميل' : 'Customer'}</th>
            <th>{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
            <th>{language === 'ar' ? 'الربح' : 'Profit'}</th>
            <th>{language === 'ar' ? 'الحالة' : 'Status'}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(orders || []).map(order => {
            const profit = order.order_items?.reduce((acc, item) => 
              acc + ((item.price_at_purchase - (item.cost_price_at_purchase || 0)) * item.quantity), 0) || 0;
            const itemsCount = order.order_items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
            
            return (
              <tr key={order.id} onClick={() => onSelectOrder(order)}>
                <td data-label={language === 'ar' ? 'الطلب' : 'Order'}>
                  <div className="order-cell">
                    <div className="order-id-group">
                      <code className="order-id">#{order.id.slice(0, 8).toUpperCase()}</code>
                      <span className="items-badge">{itemsCount} {language === 'ar' ? 'قطع' : 'pcs'}</span>
                    </div>
                    <small className="order-time">{formatDate(order.created_at)}</small>
                  </div>
                </td>
                <td data-label={language === 'ar' ? 'العميل' : 'Customer'}>
                  <div className="table-user">
                    <span className="user-name">{order.customer_name}</span>
                    <span className="user-phone">{order.customer_phone}</span>
                  </div>
                </td>
                <td data-label={language === 'ar' ? 'الإجمالي' : 'Total'}><span className="price-main">{formatEnPrice(order.total_amount)}</span></td>
                <td data-label={language === 'ar' ? 'الربح' : 'Profit'}>
                  <span className="profit-text positive">
                    +{formatEnPrice(profit)}
                  </span>
                </td>
                <td data-label={language === 'ar' ? 'الحالة' : 'Status'}>
                  <span className={`status-badge ${order.status}`}>
                    <span className="status-dot"></span>
                    {language === 'ar' ? statusLabels[order.status] : order.status}
                  </span>
                </td>
                <td><div className="table-action"><ChevronRight size={18} /></div></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .order-cell { display: flex; flex-direction: column; gap: 4px; min-width: 150px; }
        .order-id-group { display: flex; align-items: center; gap: 8px; }
        .items-badge { 
          font-size: 0.65rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; 
          color: #64748b; font-weight: 700;
        }
        .order-time { color: #94a3b8; font-size: 0.72rem; white-space: nowrap; font-weight: 500; }
        .price-main { font-weight: 800; color: #0f172a; font-size: 1rem; min-width: 90px; }
        .profit-text.positive { color: #10b981; font-weight: 700; font-size: 0.9rem; min-width: 90px; }
        .table-user { min-width: 160px; word-break: break-all; }
        .user-name { display: block; font-weight: 700; color: #0f172a; }
        .user-phone { display: block; color: #64748b; font-size: 0.8rem; }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        
        @media (max-width: 768px) {
          .items-badge { margin-inline-start: auto; }
          .order-cell { width: 100%; min-width: 0; }
          .order-time { color: #64748b; margin-top: 4px; }
          .price-main, .profit-text.positive { font-weight: 900; }
        }
      ` }} />
    </div>
  );
};
