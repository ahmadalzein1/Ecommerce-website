import React, { useState, useEffect } from 'react';
import { X, Save, Layers, Palette, Hash } from 'lucide-react';
import { errorService } from '../../lib/errorService';

export function CategoryModal({ category, categories, onClose, onSave, language }) {
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    parent_id: null
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name_ar: category.name_ar || '',
        name_en: category.name_en || '',
        parent_id: category.parent_id || null
      });
    }
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!errorService.isOnline()) {
      alert(language === 'ar' ? 'فشل الاتصال: لا يوجد إنترنت' : 'Connection failed: No internet');
      return;
    }
    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-card animate-slide-up">
        <div className="modal-header">
          <div className="modal-title-area">
            <div className="modal-icon-bg"><Layers size={20} /></div>
            <div>
              <h3>{category ? (language === 'ar' ? 'تعديل الفئة' : 'Edit Category') : (language === 'ar' ? 'فئة جديدة' : 'New Category')}</h3>
              <p>{language === 'ar' ? 'أضف أو عدل فئات المنتجات في متجرك' : 'Manage your store product categories'}</p>
            </div>
          </div>
          <button className="close-modal-btn" onClick={onClose} disabled={isSaving}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label>{language === 'ar' ? 'الاسم بالعربي' : 'Name (Arabic)'}</label>
              <input 
                type="text" 
                required 
                disabled={isSaving}
                value={formData.name_ar}
                onChange={e => setFormData({...formData, name_ar: e.target.value})}
                placeholder="أحذية، ملابس، إلخ..."
              />
            </div>
            <div className="form-group">
              <label>{language === 'ar' ? 'الاسم بالإنجليزي' : 'Name (English)'}</label>
              <input 
                type="text" 
                required 
                disabled={isSaving}
                value={formData.name_en}
                onChange={e => setFormData({...formData, name_en: e.target.value})}
                placeholder="Shoes, Clothing, etc..."
              />
            </div>
            <div className="form-group full">
              <label>{language === 'ar' ? 'الفئة الأم (اختياري)' : 'Parent Category (Optional)'}</label>
              <select 
                value={formData.parent_id || ''} 
                disabled={isSaving}
                onChange={e => setFormData({...formData, parent_id: e.target.value || null})}
              >
                <option value="">{language === 'ar' ? 'بدون (فئة أساسية)' : 'None (Root Category)'}</option>
                {categories.filter(c => c.id !== category?.id).map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {language === 'ar' ? cat.name_ar : cat.name_en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSaving}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? (
                <div className="btn-spinner-group">
                  <div className="btn-spinner" />
                  <span>{language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</span>
                </div>
              ) : (
                <>
                  <Save size={18} /> 
                  <span>{language === 'ar' ? 'حفظ' : 'Save Category'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ColorModal({ color, onClose, onSave, language }) {
  const PRESET_COLORS = [
    // Monotone
    '#000000', '#1F2937', '#4B5563', '#9CA3AF', '#E5E7EB', '#FFFFFF',
    // Reds/Pinks
    '#EF4444', '#DC2626', '#B91C1C', '#F87171', '#FB7185', '#EC4899',
    // Oranges/Yellows
    '#F97316', '#EA580C', '#FB923C', '#F59E0B', '#FBBF24', '#FCD34D',
    // Greens
    '#10B981', '#059669', '#34D399', '#22C55E', '#16A34A', '#86EFAC',
    // Blues
    '#3B82F6', '#2563EB', '#1D4ED8', '#60A5FA', '#06B6D4', '#0891B2',
    // Indigos/Purples
    '#6366F1', '#4F46E5', '#3730A3', '#8B5CF6', '#7C3AED', '#A78BFA'
  ];

  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    hex_code: '#000000'
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (color) {
      setFormData({
        name_ar: color.name_ar || '',
        name_en: color.name_en || '',
        hex_code: color.hex_code || '#000000'
      });
    }
  }, [color]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!errorService.isOnline()) {
      alert(language === 'ar' ? 'فشل الاتصال: لا يوجد إنترنت' : 'Connection failed: No internet');
      return;
    }
    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-card animate-slide-up color-modal-card">
        <div className="modal-header">
          <div className="modal-title-area">
            <div className="modal-icon-bg"><Palette size={20} /></div>
            <div>
              <h3>{color ? (language === 'ar' ? 'تعديل اللون' : 'Edit Color') : (language === 'ar' ? 'لون جديد' : 'New Color')}</h3>
              <p>{language === 'ar' ? 'اختر اللون واسم التصنيف' : 'Choose color and category name'}</p>
            </div>
          </div>
          <button className="close-modal-btn" onClick={onClose} disabled={isSaving}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label>{language === 'ar' ? 'الاسم بالعربي' : 'Name (Arabic)'}</label>
              <input 
                type="text" 
                required 
                disabled={isSaving}
                value={formData.name_ar}
                onChange={e => setFormData({...formData, name_ar: e.target.value})}
                placeholder="أحمر، أسود..."
              />
            </div>
            <div className="form-group">
              <label>{language === 'ar' ? 'الاسم بالإنجليزي' : 'Name (English)'}</label>
              <input 
                type="text" 
                required 
                disabled={isSaving}
                value={formData.name_en}
                onChange={e => setFormData({...formData, name_en: e.target.value})}
                placeholder="Red, Black..."
              />
            </div>
          </div>

          <div className="color-ux-section">
            <label className="section-label">{language === 'ar' ? 'اختيار اللون' : 'Choose Color'}</label>
            
            <div className="presets-row">
              {PRESET_COLORS.map(c => (
                <button 
                  key={c}
                  type="button"
                  disabled={isSaving}
                  className={`preset-circle ${formData.hex_code === c ? 'active' : ''} ${isSaving ? 'disabled' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setFormData({...formData, hex_code: c})}
                  title={c}
                />
              ))}
            </div>

            <div className="color-main-area">
              <div className="color-preview-block" style={{ backgroundColor: formData.hex_code }}>
                <span className="preview-label" style={{ color: ['#FFFFFF', '#F5F5F5'].includes(formData.hex_code.toUpperCase()) ? '#000' : '#FFF' }}>
                  Preview
                </span>
              </div>
              
              <div className="color-controls-stack">
                <div className="picker-wrapper">
                  <input 
                    type="color" 
                    disabled={isSaving}
                    value={formData.hex_code}
                    onChange={e => setFormData({...formData, hex_code: e.target.value.toUpperCase()})}
                    className="pro-color-picker"
                  />
                  <span>{language === 'ar' ? 'منتقي الألوان' : 'Color Picker'}</span>
                  <span className="picker-hint">{language === 'ar' ? '(انقر للتحكم)' : '(Click to pick)'}</span>
                </div>

                <div className="hex-input-group">
                  <span className="hex-prefix">#</span>
                  <input 
                    type="text" 
                    disabled={isSaving}
                    value={formData.hex_code.replace('#', '')}
                    onChange={e => setFormData({...formData, hex_code: `#${e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6)}`.toUpperCase()})}
                    maxLength={6}
                    placeholder="FFFFFF"
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? (
                <div className="btn-spinner-group">
                  <div className="btn-spinner" />
                  <span>{language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</span>
                </div>
              ) : (
                <>
                  <Save size={18} />
                  <span>{language === 'ar' ? 'حفظ اللون' : 'Save Color'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .color-modal-card { max-width: 480px !important; }
        
        .color-ux-section { margin-top: 24px; }
        .section-label { display: block; font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 12px; }
        
        .presets-row { 
          display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;
          padding: 12px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;
        }
        .preset-circle { 
          width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;
        }
        .preset-circle:hover { transform: scale(1.15); }
        .preset-circle.active { transform: scale(1.15); border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); }

        .color-main-area { display: flex; gap: 20px; align-items: stretch; }
        
        .color-preview-block { 
          flex: 0 0 120px; height: 120px; border-radius: 20px; 
          display: flex; align-items: center; justify-content: center;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05); border: 4px solid white;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1); transition: background-color 0.3s ease;
        }
        .preview-label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; }

        .color-controls-stack { flex: 1; display: flex; flex-direction: column; gap: 16px; justify-content: center; }
        
        .picker-wrapper { 
          display: flex; align-items: center; gap: 12px; color: #64748b; font-size: 0.9rem; font-weight: 600;
        }
        .picker-hint { font-size: 0.7rem; color: #94a3b8; font-weight: 400; margin-left: -4px; }
        .pro-color-picker { 
          width: 44px; height: 44px; border: none; background: none; padding: 0; cursor: pointer;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); transition: all 0.2s;
        }
        .pro-color-picker:hover { transform: scale(1.1); filter: drop-shadow(0 6px 12px rgba(0,0,0,0.15)); }
        .pro-color-picker::-webkit-color-swatch-wrapper { padding: 0; }
        .pro-color-picker::-webkit-color-swatch { border: 2px solid white; border-radius: 12px; box-shadow: 0 0 0 1px #e2e8f0; }

        .hex-input-group { 
          display: flex; align-items: center; background: #f1f5f9; padding: 12px 16px; border-radius: 14px;
          border: 1.5px solid transparent; transition: all 0.2s;
        }
        .hex-input-group:focus-within { border-color: #3b82f6; background: white; box-shadow: 0 4px 12px rgba(59,130,246,0.05); }
        .hex-prefix { font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #94a3b8; margin-right: 8px; }
        .hex-input-group input { 
          background: none; border: none; outline: none; font-family: 'JetBrains Mono', monospace;
          font-weight: 700; color: #0f172a; text-transform: uppercase; width: 100%;
        }

        @media (max-width: 480px) {
          .color-main-area { flex-direction: column; }
          .color-preview-block { width: 100%; height: 80px; }
        }

        }
      ` }} />
    </div>
  );
}
