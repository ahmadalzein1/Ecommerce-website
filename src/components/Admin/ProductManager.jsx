import React from 'react';
import { Edit3, Trash2, Image as ImageIcon, Search, Plus } from 'lucide-react';
import { formatEnPrice, en } from './AdminCommon';

export const ProductManager = ({ products, language, onEditProduct, onAddProduct }) => {
  return (
    <div className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>{language === 'ar' ? 'المنتج' : 'Product'}</th>
            <th>{language === 'ar' ? 'الفئة' : 'Category'}</th>
            <th>{language === 'ar' ? 'السعر' : 'Price'}</th>
            <th>{language === 'ar' ? 'المخزون' : 'Stock'}</th>
            <th style={{ width: '100px' }}></th>
          </tr>
        </thead>
        <tbody>
          {(products || []).map(product => {
            const baseVariant = product.product_variants?.[0];
            const totalStock = product.product_variants?.reduce((sum, v) => sum + v.stock_quantity, 0) || 0;
            return (
              <tr key={product.id}>
                <td>
                  <div className="product-media-cell">
                    <div className="product-img-wrapper">
                      {product.base_image_url ? (
                        <img src={product.base_image_url} alt="" />
                      ) : (
                        <div className="placeholder-icon"><ImageIcon size={18} /></div>
                      )}
                    </div>
                    <div className="product-info-stack">
                      <span className="product-name">
                        {language === 'ar' ? product.name_ar : product.name_en}
                      </span>
                      <small className="variant-tag">
                        {product.product_variants?.length || 0} {language === 'ar' ? 'موديلات' : 'variants'}
                      </small>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="category-pill">
                    {language === 'ar' ? (product.categories?.name_ar || '-') : (product.categories?.name_en || '-')}
                  </span>
                </td>
                <td><span className="price-main">{formatEnPrice(baseVariant?.base_price || 0)}</span></td>
                <td>
                  <div className={`stock-indicator ${totalStock > 0 ? 'active' : 'empty'}`}>
                    <span className="indicator-bar" style={{ width: totalStock > 0 ? '100%' : '0%' }}></span>
                    <span className="indicator-label">
                      {totalStock > 0 ? `${en(totalStock)} ${language === 'ar' ? 'متوفر' : 'in stock'}` : (language === 'ar' ? 'نفذ' : 'Out')}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="product-actions">
                    <button className="action-icn-btn" onClick={() => onEditProduct(product)}><Edit3 size={16} /></button>
                    <button className="action-icn-btn danger"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <style dangerouslySetInnerHTML={{ __html: `
        .product-media-cell { display: flex; align-items: center; gap: 16px; }
        .product-img-wrapper { 
          width: 52px; height: 52px; border-radius: 12px; overflow: hidden; 
          background: #f1f5f9; border: 1px solid #e2e8f0; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .product-img-wrapper img { width: 100%; height: 100%; object-fit: cover; }
        .product-info-stack { display: flex; flex-direction: column; gap: 4px; }
        .product-name { font-weight: 700; color: #0f172a; font-size: 0.95rem; line-height: 1.2; }
        .variant-tag { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }

        .category-pill { 
          background: #f1f5f9; padding: 4px 10px; border-radius: 8px; 
          font-size: 0.8rem; font-weight: 600; color: #475569;
        }

        .stock-indicator { display: flex; flex-direction: column; gap: 6px; width: 100%; max-width: 120px; }
        .indicator-bar { height: 4px; border-radius: 2px; background: #e2e8f0; overflow: hidden; position: relative; }
        .indicator-bar::after { 
          content: ''; position: absolute; top: 0; left: 0; height: 100%; width: 100%; 
          background: currentColor; opacity: 0.3;
        }
        .stock-indicator.active { color: #10b981; }
        .stock-indicator.empty { color: #ef4444; }
        .indicator-bar { background: currentColor; opacity: 0.2; }
        .indicator-label { font-size: 0.75rem; font-weight: 700; }

        .product-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .action-icn-btn { 
          padding: 8px; border-radius: 8px; border: 1px solid #f1f5f9; background: white;
          color: #94a3b8; cursor: pointer; transition: all 0.2s;
        }
        .action-icn-btn:hover { color: #3b82f6; border-color: #3b82f6; background: rgba(59, 130, 246, 0.05); }
        .action-icn-btn.danger:hover { color: #ef4444; border-color: #ef4444; background: rgba(239, 68, 68, 0.05); }
      ` }} />
    </div>
  );
};
