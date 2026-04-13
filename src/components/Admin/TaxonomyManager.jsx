import React from 'react';
import { Plus, Edit3, Trash2, Palette, Layers, Hash } from 'lucide-react';

export const CategoryManager = ({ categories, language, onAdd, onEdit, onDelete }) => (
  <div className="admin-section">
    <div className="admin-table-container">
        {(categories || []).length === 0 ? (
          <div className="empty-state-modern">
            <div className="empty-icon-wrapper">
              <Layers size={40} />
            </div>
            <h3>{language === 'ar' ? 'لا توجد فئات' : 'No categories yet'}</h3>
            <p>{language === 'ar' ? 'ابدأ بتنظيم منتجاتك بإضافة فئات جديدة' : 'Start organizing your products by adding categories.'}</p>
            <button className="add-btn sm" onClick={onAdd} style={{ marginTop: '24px' }}>
              <Plus size={16} /> {language === 'ar' ? 'إضافة فئة' : 'Add First Category'}
            </button>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{language === 'ar' ? 'الاسم (AR)' : 'Name (AR)'}</th>
                <th>{language === 'ar' ? 'الاسم (EN)' : 'Name (EN)'}</th>
                <th>{language === 'ar' ? 'الفئة الأب' : 'Parent'}</th>
                <th style={{ width: '100px' }}></th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td data-label={language === 'ar' ? 'الاسم (AR)' : 'Name (AR)'}><span className="user-name">{cat.name_ar}</span></td>
                  <td data-label={language === 'ar' ? 'الاسم (EN)' : 'Name (EN)'}><span className="user-name">{cat.name_en}</span></td>
                  <td data-label={language === 'ar' ? 'الفئة الأب' : 'Parent'}>
                    <span className="category-pill parent">
                      <Layers size={14} />
                      {categories.find(c => c.id === cat.parent_id)?.name_en || (language === 'ar' ? 'أساسي' : 'Root')}
                    </span>
                  </td>
                  <td>
                    <div className="product-actions">
                      <button className="action-icn-btn" onClick={() => onEdit(cat)}><Edit3 size={16} /></button>
                      <button className="action-icn-btn danger" onClick={() => onDelete(cat.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </div>
    <style dangerouslySetInnerHTML={{ __html: `
      .category-pill.parent { background: rgba(59, 130, 246, 0.05); color: #3b82f6; display: inline-flex; align-items: center; gap: 8px; }
    ` }} />
  </div>
);

export const ColorManager = ({ colors, language, onAdd, onEdit, onDelete }) => (
  <div className="admin-section">
    <div className="admin-table-container">
        {(colors || []).length === 0 ? (
          <div className="empty-state-modern">
            <div className="empty-icon-wrapper">
              <Palette size={40} />
            </div>
            <h3>{language === 'ar' ? 'لا توجد ألوان' : 'No colors yet'}</h3>
            <p>{language === 'ar' ? 'أضف الألوان التي تتوفر بها منتجاتك' : 'Add the colors available for your products.'}</p>
            <button className="add-btn sm" onClick={onAdd} style={{ marginTop: '24px' }}>
              <Plus size={16} /> {language === 'ar' ? 'إضافة لون' : 'Add First Color'}
            </button>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{language === 'ar' ? 'اللون' : 'Color'}</th>
                <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
                <th>{language === 'ar' ? 'HEX' : 'HEX Code'}</th>
                <th style={{ width: '100px' }}></th>
              </tr>
            </thead>
            <tbody>
              {colors.map(color => (
                <tr key={color.id}>
                  <td data-label={language === 'ar' ? 'اللون' : 'Color'}>
                    <div className="color-preview-container">
                      <div className="color-swatch" style={{ background: color.hex_code }} />
                      <div className="color-swatch-glow" style={{ background: color.hex_code }} />
                    </div>
                  </td>
                  <td data-label={language === 'ar' ? 'الاسم' : 'Name'}>
                    <div className="table-user">
                      <span className="user-name">{language === 'ar' ? color.name_ar : color.name_en}</span>
                    </div>
                  </td>
                  <td data-label={language === 'ar' ? 'HEX' : 'HEX Code'}><code className="hex-stamp">{color.hex_code.toUpperCase()}</code></td>
                  <td>
                    <div className="product-actions">
                      <button className="action-icn-btn" onClick={() => onEdit(color)}><Edit3 size={16} /></button>
                      <button className="action-icn-btn danger" onClick={() => onDelete(color.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </div>
    <style dangerouslySetInnerHTML={{ __html: `
      .color-preview-container { position: relative; width: 32px; height: 32px; }
      .color-swatch { 
        width: 100%; height: 100%; border-radius: 10px; border: 2px solid white; 
        box-shadow: 0 0 0 1px #e2e8f0; position: relative; z-index: 2;
      }
      .color-swatch-glow {
        position: absolute; inset: 2px; border-radius: 10px; filter: blur(8px); opacity: 0.3; z-index: 1;
      }
      .hex-stamp { 
        font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; background: #f1f5f9; 
        color: #475569; padding: 4px 8px; border-radius: 6px; font-weight: 700;
      }

      .empty-state-modern { padding: 100px 40px; text-align: center; display: flex; flex-direction: column; align-items: center; }
      .empty-icon-wrapper { 
        width: 100px; height: 100px; background: #f8fafc; border-radius: 30px; 
        display: flex; align-items: center; justify-content: center; margin-bottom: 24px;
        color: #cbd5e1; border: 1px dashed #e2e8f0;
      }
      .empty-state-modern h3 { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
      .empty-state-modern p { color: #64748b; font-size: 0.95rem; }
    ` }} />
  </div>
);
