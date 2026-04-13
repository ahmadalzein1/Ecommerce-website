import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, ChevronRight, ChevronLeft, Image as ImageIcon, CheckCircle2, Plus } from 'lucide-react';
import { adminService } from '../../lib/adminService';
import { errorService } from '../../lib/errorService';

export const ProductWizard = ({ isOpen, onClose, product, categories, colors, onSaved, language }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // State
  const [baseInfo, setBaseInfo] = useState({
    name_ar: '', name_en: '', description_ar: '', description_en: '', category_id: '', base_image_url: ''
  });
  const [colorImages, setColorImages] = useState([]); // [{ color_id, image_url, image_file }]
  const [variants, setVariants] = useState([]); // [{ color_id, size, stock_quantity, base_price, cost_price }]

  useEffect(() => {
    if (product) {
      setBaseInfo({
        name_ar: product.name_ar,
        name_en: product.name_en,
        description_ar: product.description_ar,
        description_en: product.description_en,
        category_id: product.category_id,
        base_image_url: product.base_image_url
      });
    }
  }, [product]);

  if (!isOpen) return null;

  const handleBaseImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const url = await adminService.uploadImage(file);
      setBaseInfo({ ...baseInfo, base_image_url: url });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addColorMapping = (colorId) => {
    if (colorImages.find(c => c.color_id === colorId)) return;
    setColorImages([...colorImages, { color_id: colorId, image_url: '', image_file: null }]);
  };

  const handleColorImageUpload = async (index, file) => {
    setLoading(true);
    try {
      const url = await adminService.uploadImage(file);
      const newMappings = [...colorImages];
      newMappings[index].image_url = url;
      setColorImages(newMappings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateVariants = () => {
    const newVariants = [];
    colorImages.forEach(cm => {
      ['S', 'M', 'L', 'XL'].forEach(size => {
        newVariants.push({
          color_id: cm.color_id,
          size,
          stock_quantity: '',
          base_price: '',
          cost_price: ''
        });
      });
    });
    setVariants(newVariants);
    setStep(3);
  };

  const handleSave = async () => {
    if (!errorService.isOnline()) {
      alert(language === 'ar' ? 'لا يوجد اتصال بالإنترنت' : 'No internet connection');
      return;
    }

    setLoading(true);
    try {
      const saveLogic = async () => {
        const formattedVariants = variants.map(v => ({
          ...v,
          stock_quantity: Number(v.stock_quantity) || 0,
          base_price: Number(v.base_price) || 0,
          cost_price: Number(v.cost_price) || 0
        }));
        await adminService.createFullProduct(baseInfo, formattedVariants, colorImages);
      };

      await errorService.withTimeout(saveLogic(), 25000); // Product creation is heavy, 25s
      onSaved();
      onClose();
    } catch (err) {
      alert(errorService.translate(err, language));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-card wizard" style={{
        maxWidth: '900px', height: 'auto', maxHeight: '95vh'
      }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-area">
            <div className="modal-icon-bg">
              <ImageIcon size={24} />
            </div>
            <div>
              <h3>{product ? (language === 'ar' ? 'تعديل المنتج' : 'Edit Product') : (language === 'ar' ? 'إنشاء منتج جديد' : 'Create New Product')}</h3>
              <div className="steps-indicator-bar">
                {[1, 2, 3].map(s => (
                  <div key={s} className={`step-dot ${s <= step ? 'active' : ''}`} />
                ))}
              </div>
            </div>
          </div>
          <button className="close-modal-btn" onClick={onClose} disabled={loading}><X size={24} /></button>
        </div>

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
          
          {step === 1 && (
            <div className="step-content animate-in">
              <div className="section-title">{language === 'ar' ? 'تفاصيل المنتج الأساسية' : 'Base Product Details'}</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>{language === 'ar' ? 'الاسم بالعربي' : 'Name (Arabic)'}</label>
                  <input type="text" disabled={loading} value={baseInfo.name_ar} onChange={e => setBaseInfo({...baseInfo, name_ar: e.target.value})} placeholder="قميص رجالي" />
                </div>
                <div className="form-group">
                  <label>{language === 'ar' ? 'الاسم بالإنجليزي' : 'Name (English)'}</label>
                  <input type="text" disabled={loading} value={baseInfo.name_en} onChange={e => setBaseInfo({...baseInfo, name_en: e.target.value})} placeholder="Men's Shirt" />
                </div>
                <div className="form-group full">
                  <label>{language === 'ar' ? 'الفئة' : 'Category'}</label>
                  <select disabled={loading} value={baseInfo.category_id} onChange={e => setBaseInfo({...baseInfo, category_id: e.target.value})}>
                    <option value="">{language === 'ar' ? 'اختر الفئة' : 'Select Category'}</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{language === 'ar' ? c.name_ar : c.name_en}</option>)}
                  </select>
                </div>
                <div className="form-group full">
                  <label>{language === 'ar' ? 'صورة العرض الرئيسية' : 'Main Showcase Image'}</label>
                  <div className="pro-upload-box">
                    {baseInfo.base_image_url ? (
                      <div className="uploaded-preview">
                        <img src={baseInfo.base_image_url} alt="" />
                        <div className="preview-overlay" onClick={() => setBaseInfo({...baseInfo, base_image_url: ''})}>
                          <Trash2 size={24} color="white" />
                        </div>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <div className={`upload-icon-circle ${loading ? 'animate-pulse' : ''}`}>
                          <Upload size={32} />
                        </div>
                        <p>{language === 'ar' ? 'انقر لرفع الصورة الرئيسية' : 'Click to upload main image'}</p>
                        <input type="file" disabled={loading} onChange={handleBaseImageUpload} className="hidden-file-input" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-content animate-in">
              <div className="section-title">{language === 'ar' ? 'تخطيط الألوان والوسائط' : 'Color & Media Mapping'}</div>
              <div className="color-selector-grid">
                {colors.map(c => (
                  <button key={c.id} disabled={loading} onClick={() => addColorMapping(c.id)} className="color-option-pill">
                    <div className="swatch" style={{ background: c.hex_code }} />
                    <span>{language === 'ar' ? c.name_ar : c.name_en}</span>
                    <Plus size={14} />
                  </button>
                ))}
              </div>

              <div className="mapping-cards-grid">
                {colorImages.map((cm, idx) => {
                  const colorDetails = colors.find(c => c.id === cm.color_id);
                  return (
                    <div key={idx} className="mapping-card-item">
                      <div className="card-top">
                        <div className="color-info">
                          <div className="dot" style={{ background: colorDetails?.hex_code }} />
                          <strong>{language === 'ar' ? colorDetails?.name_ar : colorDetails?.name_en}</strong>
                        </div>
                        <button disabled={loading} onClick={() => setColorImages(colorImages.filter((_, i) => i !== idx))} className="remove-card">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="card-upload-area">
                        {cm.image_url ? <img src={cm.image_url} alt="" /> : <ImageIcon size={24} color="#94a3b8" />}
                        <input type="file" disabled={loading} onChange={e => handleColorImageUpload(idx, e.target.files[0])} className="hidden-file-input" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-content animate-in">
              <div className="section-title">{language === 'ar' ? 'مصفوفة المخزون والتسعير' : 'Inventory & Pricing Matrix'}</div>
              <div className="matrix-scroll-wrapper">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th>{language === 'ar' ? 'اللون' : 'Color'}</th>
                      <th>{language === 'ar' ? 'المقاس' : 'Size'}</th>
                      <th>{language === 'ar' ? 'المخزون' : 'Stock'}</th>
                      <th>{language === 'ar' ? 'السعر ($)' : 'Price ($)'}</th>
                      <th>{language === 'ar' ? 'التكلفة ($)' : 'Cost ($)'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, idx) => {
                      const colorDetails = colors.find(c => c.id === v.color_id);
                      return (
                        <tr key={idx}>
                          <td>
                            <div className="matrix-color">
                              <div className="dot" style={{ background: colorDetails?.hex_code }} />
                              {language === 'ar' ? colorDetails?.name_ar : colorDetails?.name_en}
                            </div>
                          </td>
                          <td><input type="text" disabled={loading} value={v.size} onChange={e => {
                            const n = [...variants]; n[idx].size = e.target.value; setVariants(n);
                          }} className="sm-matrix-input" /></td>
                          <td><input type="number" disabled={loading} value={v.stock_quantity} onChange={e => {
                            const n = [...variants]; n[idx].stock_quantity = parseInt(e.target.value); setVariants(n);
                          }} className="sm-matrix-input" /></td>
                          <td><input type="number" disabled={loading} value={v.base_price} onChange={e => {
                            const n = [...variants]; n[idx].base_price = e.target.value; setVariants(n);
                          }} className="sm-matrix-input" /></td>
                          <td><input type="number" disabled={loading} value={v.cost_price} onChange={e => {
                            const n = [...variants]; n[idx].cost_price = e.target.value; setVariants(n);
                          }} className="sm-matrix-input" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        <div className="modal-actions" style={{ padding: '24px 32px' }}>
          <button 
            disabled={step === 1 || loading}
            onClick={() => setStep(step - 1)}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ChevronLeft size={18} /> {language === 'ar' ? 'رجوع' : 'Back'}
          </button>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            {step < 3 ? (
              <button 
                disabled={loading}
                onClick={() => step === 2 ? generateVariants() : setStep(step + 1)}
                className="btn-primary"
                style={{ background: '#0f172a' }}
              >
                {language === 'ar' ? 'الخطوة التالية' : 'Next Step'} <ChevronRight size={18} />
              </button>
            ) : (
              <button 
                disabled={loading}
                onClick={handleSave}
                className="btn-primary"
                style={{ background: '#fbbf24', color: '#0f172a' }}
              >
                 {loading ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'إنهاء وإطلاق' : 'Finish & Launch')} <CheckCircle2 size={18} />
              </button>
            )}
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          .steps-indicator-bar { display: flex; gap: 8px; margin-top: 8px; }
          .step-dot { width: 32px; height: 4px; border-radius: 2px; background: #f1f5f9; transition: all 0.3s; }
          .step-dot.active { background: #fbbf24; width: 48px; }

          .section-title { font-size: 1.1rem; font-weight: 800; margin-bottom: 24px; color: #0f172a; }

          .pro-upload-box { 
            border: 2px dashed #e2e8f0; border-radius: 24px; height: 240px; 
            display: flex; align-items: center; justify-content: center; 
            position: relative; overflow: hidden; background: #f8fafc; transition: all 0.2s;
          }
          .pro-upload-box:hover { border-color: #3b82f6; background: #f1f7ff; }
          
          .upload-placeholder { cursor: pointer; text-align: center; }
          .upload-icon-circle { width: 64px; height: 64px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: #94a3b8; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .hidden-file-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }

          .uploaded-preview { width: 100%; height: 100%; position: relative; }
          .uploaded-preview img { width: 100%; height: 100%; object-fit: contain; }
          .preview-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; cursor: pointer; }
          .uploaded-preview:hover .preview-overlay { opacity: 1; }

          .color-selector-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 32px; }
          .color-option-pill { 
            padding: 8px 14px; border-radius: 12px; border: 1px solid #e2e8f0; background: white;
            display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 700; font-size: 0.85rem;
            transition: all 0.2s;
          }
          .color-option-pill:hover { border-color: #3b82f6; background: #f8fafc; }
          .color-option-pill .swatch { width: 14px; height: 14px; border-radius: 50%; }

          .mapping-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
          .mapping-card-item { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 20px; padding: 16px; transition: all 0.2s; }
          .mapping-card-item:hover { border-color: #e2e8f0; transform: translateY(-2px); }
          .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
          .color-info { display: flex; align-items: center; gap: 8px; }
          .color-info .dot { width: 10px; height: 10px; border-radius: 50%; }
          .remove-card { background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px; }
          
          .card-upload-area { height: 120px; background: white; border-radius: 12px; border: 2px dashed #e2e8f0; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
          .card-upload-area img { width: 100%; height: 100%; object-fit: cover; }

          .matrix-scroll-wrapper { width: 100%; overflow-x: auto; background: white; border: 1px solid #f1f5f9; border-radius: 20px; }
          .matrix-table { width: 100%; border-collapse: collapse; min-width: 600px; }
          .matrix-table th { background: #f8fafc; padding: 14px; font-size: 0.75rem; text-transform: uppercase; color: #64748b; text-align: start; }
          .matrix-table td { padding: 12px 14px; border-bottom: 1px solid #f8fafc; }
          .matrix-color { display: flex; align-items: center; gap: 8px; font-weight: 700; color: #0f172a; }
          .matrix-color .dot { width: 8px; height: 8px; border-radius: 50%; }
          .sm-matrix-input { width: 100%; padding: 8px 12px !important; font-size: 0.85rem !important; }

          @media (max-width: 640px) {
            .form-grid { grid-template-columns: 1fr; gap: 16px; }
            .mapping-cards-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
            .mapping-card-item { padding: 10px; border-radius: 16px; }
            .card-upload-area { height: 100px; }
            .section-title { font-size: 1rem; }
            .modal-actions { padding: 16px 20px !important; }
            .btn-primary, .btn-secondary { padding: 10px 16px !important; font-size: 0.85rem !important; }
          }
           @media (max-width: 480px) {
            .mapping-cards-grid { grid-template-columns: 1fr; }
           }
        ` }} />
      </div>
    </div>
  );
};
