import React, { useState, useEffect } from 'react';
import { X, Save, Tag, Percent, DollarSign, Activity } from 'lucide-react';
import { errorService } from '../../lib/errorService';

export default function DiscountModal({ discount, onClose, onSave, language }) {
  const [formData, setFormData] = useState({
    code: '',
    value: '',
    is_active: true
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (discount) {
      setFormData({
        code: discount.code || '',
        value: discount.discount_value !== undefined ? discount.discount_value : '',
        is_active: discount.is_active !== undefined ? discount.is_active : true
      });
    }
  }, [discount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!errorService.isOnline()) {
       alert(language === 'ar' ? 'فشل الاتصال: لا يوجد إنترنت' : 'Connection failed: No internet');
       return;
    }

    setIsSaving(true);
    try {
      await onSave({
        code: formData.code,
        discount_type: 'percentage',
        discount_value: Number(formData.value) || 0,
        is_active: formData.is_active
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-card animate-slide-up small">
        <div className="modal-header">
          <div className="modal-title-area">
            <div className="modal-icon-bg"><Tag size={20} /></div>
            <div>
              <h3>{discount ? (language === 'ar' ? 'تعديل الكود' : 'Edit Discount') : (language === 'ar' ? 'كود جديد' : 'New Discount')}</h3>
              <p>{language === 'ar' ? 'أنشئ حملات ترويجية لزيادة مبيعاتك' : 'Create promotion campaigns to boost sales'}</p>
            </div>
          </div>
          <button className="close-modal-btn" onClick={onClose} disabled={isSaving}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-grid">
            <div className="form-group full">
              <label>{language === 'ar' ? 'كود الخصم' : 'Discount Code'}</label>
              <div className="code-input-wrapper">
                <input 
                  type="text" 
                  required 
                  disabled={isSaving}
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  placeholder="SALE20, WELCOME10..."
                  className="code-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>{language === 'ar' ? 'نسبة الخصم (%)' : 'Discount Percentage (%)'}</label>
              <div className="value-input-wrapper">
                <input 
                  type="number" 
                  required 
                  disabled={isSaving}
                  min="1"
                  max="100"
                  value={formData.value}
                  onChange={e => setFormData({...formData, value: e.target.value})}
                  placeholder="20"
                />
                <span className="input-suffix">%</span>
              </div>
            </div>

            <div className="form-group">
              <label>{language === 'ar' ? 'الحالة' : 'Status'}</label>
              <div className="status-toggle-container">
                <label className="switch">
                  <input 
                    type="checkbox" 
                    disabled={isSaving}
                    checked={formData.is_active}
                    onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  />
                  <span className="slider round"></span>
                </label>
                <span className="status-label">
                  {formData.is_active 
                    ? (language === 'ar' ? 'نشط' : 'Active') 
                    : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                </span>
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
                  <span>{language === 'ar' ? 'حفظ الكود' : 'Save Discount'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .code-input-wrapper { position: relative; }
        .code-input { 
          font-family: 'JetBrains Mono', monospace !important; 
          font-weight: 800; 
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        
        .radio-tabs {
          display: flex; gap: 8px; background: #f1f5f9; padding: 4px; border-radius: 12px;
        }
        .radio-tabs button {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 10px; border: none; background: transparent; border-radius: 8px;
          font-size: 0.85rem; font-weight: 700; color: #64748b; cursor: pointer; transition: all 0.2s;
        }
        .radio-tabs button.active { background: white; color: var(--admin-primary); box-shadow: 0 2px 6px rgba(0,0,0,0.06); }

        .value-input-wrapper { position: relative; display: flex; align-items: center; }
        .value-input-wrapper input { padding-inline-end: 60px; }
        .input-suffix {
          position: absolute; right: 16px; font-weight: 800; color: #94a3b8; font-size: 0.9rem;
        }
        [dir="rtl"] .input-suffix { right: auto; left: 16px; }

        .status-toggle-container {
          display: flex; align-items: center; gap: 12px; margin-top: 8px;
        }
        .status-label { font-size: 0.85rem; font-weight: 700; color: #475569; }

        /* Switch UI */
        .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider {
          position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
          background-color: #e2e8f0; transition: .3s;
        }
        .slider:before {
          position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px;
          background-color: white; transition: .3s;
        }
        input:checked + .slider { background-color: var(--admin-primary); }
        input:checked + .slider:before { transform: translateX(20px); }
        .slider.round { border-radius: 24px; }
        .slider.round:before { border-radius: 50%; }
      ` }} />
    </div>
  );
}
