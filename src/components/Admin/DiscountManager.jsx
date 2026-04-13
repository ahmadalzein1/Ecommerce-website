import React from 'react';
import { Plus, Edit3, Trash2, CreditCard, Tag, Calendar, BarChart3 } from 'lucide-react';
import { en, formatEnPrice } from './AdminCommon';

export const DiscountManager = ({ discounts, language, onAdd, onEdit, onDelete }) => {
  return (
    <div className="admin-section">
      <div className="admin-table-container">
        {!discounts || discounts.length === 0 ? (
          <div className="empty-state-modern">
            <div className="empty-icon-wrapper">
              <CreditCard size={40} />
            </div>
            <h3>{language === 'ar' ? 'لا توجد خصومات نشطة' : 'No active campaigns'}</h3>
            <p>{language === 'ar' ? 'ابدأ بإنشاء أول كود خصم لعملائك' : 'Create your first discount code to boost sales.'}</p>
            <button className="add-btn sm" onClick={onAdd} style={{ marginTop: '24px' }}>
              <Plus size={16} /> {language === 'ar' ? 'إنشاء كود' : 'Create First Code'}
            </button>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{language === 'ar' ? 'الكود' : 'Coupon Code'}</th>
                <th>{language === 'ar' ? 'القيمة' : 'Discount'}</th>
                <th>{language === 'ar' ? 'الحالة' : 'Status'}</th>
                <th>{language === 'ar' ? 'الاستخدام' : 'Usage'}</th>
                <th style={{ width: '100px' }}></th>
              </tr>
            </thead>
            <tbody>
              {discounts.map(code => (
                <tr key={code.id}>
                  <td>
                    <div className="coupon-cell">
                      <Tag size={16} className="coupon-icon" />
                      <code className="coupon-code">{code.code}</code>
                    </div>
                  </td>
                  <td>
                    <span className="price-main">{en(code.discount_value)}%</span>
                  </td>
                  <td>
                    <span className={`status-badge ${code.is_active ? 'active' : 'inactive'}`}>
                      {code.is_active 
                        ? (language === 'ar' ? 'نشط' : 'Active') 
                        : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                    </span>
                  </td>
                  <td>
                    <div className="usage-stats">
                      <BarChart3 size={14} />
                      <span>{en(code.usage_count || 0)} times</span>
                    </div>
                  </td>
                  <td>
                    <div className="product-actions">
                      <button className="action-icn-btn" onClick={() => onEdit(code)}>
                        <Edit3 size={16} />
                      </button>
                      <button className="action-icn-btn danger" onClick={() => onDelete(code.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .empty-state-modern { padding: 100px 40px; text-align: center; display: flex; flex-direction: column; align-items: center; }
        .empty-icon-wrapper { 
          width: 100px; height: 100px; background: #f8fafc; border-radius: 30px; 
          display: flex; align-items: center; justify-content: center; margin-bottom: 24px;
          color: #cbd5e1; border: 1px dashed #e2e8f0;
        }
        .empty-state-modern h3 { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
        .empty-state-modern p { color: #64748b; font-size: 0.95rem; }

        .coupon-cell { display: flex; align-items: center; gap: 10px; }
        .coupon-icon { color: #f59e0b; }
        .coupon-code { font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #0f172a; font-size: 1rem; }

        .status-badge {
          padding: 6px 12px; border-radius: 10px; font-size: 0.75rem; font-weight: 800; display: inline-flex; align-items: center;
        }
        .status-badge.active { background: rgba(34, 197, 94, 0.1); color: #16a34a; }
        .status-badge.inactive { background: rgba(148, 163, 184, 0.1); color: #64748b; }

        .usage-stats { display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 0.85rem; font-weight: 600; }
      ` }} />
    </div>
  );
};
