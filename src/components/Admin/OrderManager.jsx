import React from 'react';
import { ChevronRight } from 'lucide-react';
import { formatEnPrice, statusLabels } from './AdminCommon';

export const OrderManager = ({ orders, onSelectOrder, language }) => {
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
            return (
              <tr key={order.id} onClick={() => onSelectOrder(order)}>
                <td>
                  <div className="order-cell">
                    <code className="order-id">#{order.id.slice(0, 8).toUpperCase()}</code>
                    <small className="order-time">{new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</small>
                  </div>
                </td>
                <td>
                  <div className="table-user">
                    <span className="user-name">{order.customer_name}</span>
                    <span className="user-phone">{order.customer_phone}</span>
                  </div>
                </td>
                <td><span className="price-main">{formatEnPrice(order.total_amount)}</span></td>
                <td>
                  <span className="profit-text positive">
                    +{formatEnPrice(profit)}
                  </span>
                </td>
                <td>
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
        .order-cell { display: flex; flex-direction: column; gap: 4px; min-width: 100px; }
        .order-time { color: #94a3b8; font-size: 0.75rem; }
        .price-main { font-weight: 800; color: #0f172a; font-size: 1rem; min-width: 90px; }
        .profit-text.positive { color: #10b981; font-weight: 700; font-size: 0.9rem; min-width: 90px; }
        .table-user { min-width: 140px; }
        
        .status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        
        @media (max-width: 640px) {
          .admin-table th, .admin-table td { padding: 12px 10px; }
          .order-id { font-size: 0.75rem; }
          .user-name { font-size: 0.85rem; }
          .price-main { font-size: 0.9rem; }
        }
      ` }} />
    </div>
  );
};
