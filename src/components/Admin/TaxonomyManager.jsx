import React from 'react';
import { Plus, Edit3, Trash2, Palette, Layers, Hash } from 'lucide-react';

export const CategoryManager = ({ categories, language, onAdd, onEdit, onDelete }) => (
  <div className="admin-section">
    <div className="section-header">
      <h2>{language === 'ar' ? 'إدارة الفئات' : 'Category Management'}</h2>
      <button className="add-btn" onClick={onAdd}>
        <Plus size={18} /> {language === 'ar' ? 'فئة جديدة' : 'Add Category'}
      </button>
    </div>
    <div className="admin-table-container">
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
          {(categories || []).map(cat => (
            <tr key={cat.id}>
              <td><span className="user-name">{cat.name_ar}</span></td>
              <td><span className="user-name">{cat.name_en}</span></td>
              <td>
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
    </div>
    <style dangerouslySetInnerHTML={{ __html: `
      .category-pill.parent { background: rgba(59, 130, 246, 0.05); color: #3b82f6; display: inline-flex; align-items: center; gap: 8px; }
    ` }} />
  </div>
);

export const ColorManager = ({ colors, language, onAdd, onDelete }) => (
  <div className="admin-section">
    <div className="section-header">
      <h2>{language === 'ar' ? 'باليت الألوان' : 'Color Palette'}</h2>
      <button className="add-btn" onClick={onAdd}>
        <Plus size={18} /> {language === 'ar' ? 'لون جديد' : 'Add Color'}
      </button>
    </div>
    <div className="admin-table-container">
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
          {(colors || []).map(color => (
            <tr key={color.id}>
              <td>
                <div className="color-preview-container">
                  <div className="color-swatch" style={{ background: color.hex_code }} />
                  <div className="color-swatch-glow" style={{ background: color.hex_code }} />
                </div>
              </td>
              <td>
                <div className="table-user">
                  <span className="user-name">{language === 'ar' ? color.name_ar : color.name_en}</span>
                </div>
              </td>
              <td><code className="hex-stamp">{color.hex_code.toUpperCase()}</code></td>
              <td>
                <div className="product-actions">
                  <button className="action-icn-btn danger" onClick={() => onDelete(color.id)}><Trash2 size={16} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
    ` }} />
  </div>
);
