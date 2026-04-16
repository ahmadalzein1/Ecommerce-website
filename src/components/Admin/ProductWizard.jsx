import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, ChevronRight, ChevronLeft, Image as ImageIcon, CheckCircle2, Plus } from 'lucide-react';
import { adminService } from '../../lib/adminService';
import { errorService } from '../../lib/errorService';
import { sortSizes } from '../../lib/constants';


export const ProductWizard = ({ isOpen, onClose, product, categories, colors, onSaved, language }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // State
  const [baseInfo, setBaseInfo] = useState({
    name_ar: '', name_en: '', description_ar: '', description_en: '', category_id: '',
    base_price: '', cost_price: ''
  });
  const [colorImages, setColorImages] = useState([]); // [{ color_id, image_url, image_file }]
  const [variants, setVariants] = useState([]); // [{ color_id, size, stock_quantity, base_price, cost_price }]
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null); // { message, type }

  useEffect(() => {
    // Cleanup Effect for Blob URLs
    return () => {
      colorImages.forEach(cm => {
        if (cm.image_url?.startsWith('blob:')) {
          URL.revokeObjectURL(cm.image_url);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (product) {
      // 1. Set Base Info
      setBaseInfo({
        name_ar: product.name_ar,
        name_en: product.name_en,
        description_ar: product.description_ar,
        description_en: product.description_en,
        category_id: product.category_id,
        base_price: product.product_variants?.[0]?.base_price || '',
        cost_price: product.product_variants?.[0]?.cost_price || ''
      });

      // 2. Set Color Images
      if (product.product_colors) {
        setColorImages(product.product_colors.map(pc => ({
          color_id: pc.color_id,
          image_url: pc.image_url
        })));
      }

      // 3. Set Variants
      if (product.product_variants) {
        setVariants(product.product_variants.map(v => ({
          color_id: v.product_color_id ? product.product_colors?.find(pc => pc.id === v.product_color_id)?.color_id : null,
          size: v.size,
          stock_quantity: v.stock_quantity,
          base_price: v.base_price,
          cost_price: v.cost_price
        })));
      }
    } else {
      // Reset if no product (new product mode)
      setBaseInfo({
        name_ar: '', name_en: '', description_ar: '', description_en: '', category_id: '',
        base_price: '', cost_price: ''
      });
      setColorImages([]);
      setVariants([]);
      setStep(1);
    }
  }, [product, colors]);

  if (!isOpen) return null;


  const addColorMapping = (colorId) => {
    if (colorImages.find(c => c.color_id === colorId)) return;
    setColorImages([...colorImages, { color_id: colorId, image_url: '', image_file: null }]);
  };

  const removeColorMapping = (index) => {
    const item = colorImages[index];
    if (item.image_url?.startsWith('blob:')) {
      URL.revokeObjectURL(item.image_url);
    }
    setColorImages(colorImages.filter((_, i) => i !== index));
  };

  const handleColorImageUpload = (index, file) => {
    if (!file) return;
    
    // Create local preview URL
    const previewUrl = URL.createObjectURL(file);
    
    const newMappings = [...colorImages];
    // Cleanup previous blob if exists
    if (newMappings[index].image_url?.startsWith('blob:')) {
      URL.revokeObjectURL(newMappings[index].image_url);
    }
    
    newMappings[index].image_url = previewUrl;
    newMappings[index].image_file = file;
    setColorImages(newMappings);
  };

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const validateStep1 = () => {
    const required = ['name_ar', 'name_en', 'category_id', 'base_price', 'cost_price', 'description_ar', 'description_en'];
    const newErrors = {};
    required.forEach(key => {
      if (!baseInfo[key]) newErrors[key] = true;
    });
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      showToast(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (colorImages.length === 0) {
      showToast(language === 'ar' ? 'يرجى إضافة لون واحد على الأقل' : 'Please add at least one color');
      return false;
    }
    const missingImages = colorImages.some(c => !c.image_url);
    if (missingImages) {
      showToast(language === 'ar' ? 'يرجى رفع صور لكل الألوان المختارة' : 'Please upload images for all selected colors');
      return false;
    }
    return true;
  };

  const generateVariants = () => {
    if (!validateStep2()) return;

    // Determine sizes based on parent category
    const selectedCategory = categories.find(c => String(c.id) === String(baseInfo.category_id));
    const parentCategory = selectedCategory ? categories.find(p => p.id === selectedCategory.parent_id) : null;
    const parentNameEn = parentCategory?.name_en?.toLowerCase() || '';

    const sizes = parentNameEn.includes('girl')
      ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14']
      : ['S', 'M', 'L', 'XL', 'XXL'];

    const newVariants = [];
    colorImages.forEach(cm => {
      sizes.forEach(size => {
        const existing = variants.find(v => v.color_id === cm.color_id && v.size === size);
        newVariants.push({
          color_id: cm.color_id,
          size,
          stock_quantity: existing ? existing.stock_quantity : 0,
          base_price: baseInfo.base_price,
          cost_price: baseInfo.cost_price
        });
      });
    });
    // Sort variants to ensure they appear in the correct order in the matrix
    const sortedVariants = [...newVariants].sort((a, b) => {
      const aIndex = sizes.indexOf(a.size);
      const bIndex = sizes.indexOf(b.size);
      return aIndex - bIndex;
    });

    setVariants(sortedVariants);
    setStep(3);
  };

  const handleSave = async () => {
    if (!errorService.isOnline()) {
      showToast(language === 'ar' ? 'لا يوجد اتصال بالإنترنت' : 'No internet connection');
      return;
    }

    if (!validateStep1() || !validateStep2()) return;

    setLoading(true);
    try {
      const saveLogic = async () => {
        // 1. Upload any new images first
        const finalizedColorImages = await Promise.all(colorImages.map(async (cm) => {
          if (cm.image_file) {
            const remoteUrl = await adminService.uploadImage(cm.image_file);
            // Cleanup blob
            if (cm.image_url?.startsWith('blob:')) URL.revokeObjectURL(cm.image_url);
            return { ...cm, image_url: remoteUrl, image_file: null };
          }
          return cm; // Already a remote URL (editing mode)
        }));

        const formattedVariants = variants.map(v => ({
          ...v,
          stock_quantity: Number(v.stock_quantity) || 0,
          base_price: Number(baseInfo.base_price) || 0,
          cost_price: Number(baseInfo.cost_price) || 0
        }));

        if (product) {
          await adminService.updateFullProduct(product.id, baseInfo, formattedVariants, finalizedColorImages);
        } else {
          await adminService.createFullProduct(baseInfo, formattedVariants, finalizedColorImages);
        }
      };

      await errorService.withTimeout(saveLogic(), 60000); // 60s as we upload multiple images
      onSaved();
      onClose();
    } catch (err) {
      showToast(errorService.translate(err, language));
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

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          
          {toast && (
            <div className={`wizard-toast ${toast.type}`}>
               <div className="toast-icon">!</div>
               <span>{toast.message}</span>
            </div>
          )}
          {step === 1 && (
            <div className="step-content animate-in">
              <div className="section-title">{language === 'ar' ? 'تفاصيل المنتج الأساسية' : 'Base Product Details'}</div>
              <div className="form-grid">
                <div className={`form-group ${errors.name_ar ? 'error' : ''}`}>
                  <label>{language === 'ar' ? 'الاسم بالعربي' : 'Name (Arabic)'}</label>
                  <input type="text" disabled={loading} required value={baseInfo.name_ar} onChange={e => { setBaseInfo({...baseInfo, name_ar: e.target.value}); setErrors({...errors, name_ar: false}); }} placeholder="قميص رجالي" />
                </div>
                <div className={`form-group ${errors.name_en ? 'error' : ''}`}>
                  <label>{language === 'ar' ? 'الاسم بالإنجليزي' : 'Name (English)'}</label>
                  <input type="text" disabled={loading} required value={baseInfo.name_en} onChange={e => { setBaseInfo({...baseInfo, name_en: e.target.value}); setErrors({...errors, name_en: false}); }} placeholder="Men's Shirt" />
                </div>
                <div className={`form-group full ${errors.category_id ? 'error' : ''}`}>
                  <label>{language === 'ar' ? 'الفئة' : 'Category'}</label>
                  <select disabled={loading} required value={baseInfo.category_id} onChange={e => { setBaseInfo({...baseInfo, category_id: e.target.value}); setErrors({...errors, category_id: false}); }}>
                    <option value="">{language === 'ar' ? 'اختر الفئة' : 'Select Category'}</option>
                    {categories.filter(c => {
                      if (!c.parent_id) return false;
                      if (product) {
                        const currentCategory = categories.find(cat => cat.id === product.category_id);
                        return c.parent_id === currentCategory?.parent_id;
                      }
                      return true;
                    }).map(c => {
                      const parent = categories.find(p => p.id === c.parent_id);
                      const parentName = parent ? (language === 'ar' ? parent.name_ar : parent.name_en) : '';
                      return (
                        <option key={c.id} value={c.id}>
                          {language === 'ar' ? c.name_ar : c.name_en} {parentName ? `(${parentName})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className={`form-group ${errors.base_price ? 'error' : ''}`}>
                  <label>{language === 'ar' ? 'السعر ($)' : 'Price ($)'}</label>
                  <input type="number" disabled={loading} required value={baseInfo.base_price} onChange={e => { setBaseInfo({...baseInfo, base_price: e.target.value}); setErrors({...errors, base_price: false}); }} placeholder="100.00" />
                </div>
                <div className={`form-group ${errors.cost_price ? 'error' : ''}`}>
                  <label>{language === 'ar' ? 'التكلفة ($)' : 'Cost ($)'}</label>
                  <input type="number" disabled={loading} required value={baseInfo.cost_price} onChange={e => { setBaseInfo({...baseInfo, cost_price: e.target.value}); setErrors({...errors, cost_price: false}); }} placeholder="50.00" />
                </div>
                <div className={`form-group full ${errors.description_ar ? 'error' : ''}`}>
                  <label>{language === 'ar' ? 'الوصف بالعربي' : 'Description (Arabic)'}</label>
                  <textarea disabled={loading} value={baseInfo.description_ar} onChange={e => { setBaseInfo({...baseInfo, description_ar: e.target.value}); setErrors({...errors, description_ar: false}); }} placeholder="..." rows={3} />
                </div>
                <div className={`form-group full ${errors.description_en ? 'error' : ''}`}>
                  <label>{language === 'ar' ? 'الوصف بالإنجليزي' : 'Description (English)'}</label>
                  <textarea disabled={loading} value={baseInfo.description_en} onChange={e => { setBaseInfo({...baseInfo, description_en: e.target.value}); setErrors({...errors, description_en: false}); }} placeholder="..." rows={3} />
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
                        <button disabled={loading} onClick={() => removeColorMapping(idx)} className="remove-card">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className={`card-upload-area ${!cm.image_url && errors.step2 ? 'error-pulse' : ''}`}>
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
              <div className="section-title">{language === 'ar' ? 'مصفوفة المخزون' : 'Inventory Matrix'}</div>
              <div className="matrix-scroll-wrapper">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th>{language === 'ar' ? 'اللون' : 'Color'}</th>
                      <th>{language === 'ar' ? 'المقاس' : 'Size'}</th>
                      <th style={{ width: '150px' }}>{language === 'ar' ? 'المخزون' : 'Stock'}</th>
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
                          <td>
                            <span className="matrix-size-label">{v.size}</span>
                          </td>
                          <td>
                            <div className="stock-input-group">
                              <input type="number" disabled={loading} value={v.stock_quantity} onChange={e => {
                                const n = [...variants]; n[idx].stock_quantity = parseInt(e.target.value) || 0; setVariants(n);
                              }} className="sm-matrix-input" placeholder="0" />
                              <span className="unit">{language === 'ar' ? 'قطعة' : 'pcs'}</span>
                            </div>
                          </td>
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
                onClick={() => {
                  if (step === 1) {
                    if (validateStep1()) setStep(2);
                  } else if (step === 2) {
                    generateVariants();
                  }
                }}
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
          .wizard-toast { 
            position: absolute; top: 20px; left: 50%; transform: translateX(-50%); 
            z-index: 100; background: #0f172a; color: white; padding: 12px 24px; 
            border-radius: 12px; display: flex; align-items: center; gap: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2); animation: toastIn 0.3s ease-out;
            font-weight: 600; font-size: 0.9rem; border: 1px solid rgba(255,255,255,0.1);
          }
          .wizard-toast.error { background: #ef4444; }
          .toast-icon { width: 20px; height: 20px; background: white; color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; }
          
          @keyframes toastIn { from { top: -20px; opacity: 0; } to { top: 20px; opacity: 1; } }

          .form-group.error input, .form-group.error select, .form-group.error textarea { border-color: #ef4444 !important; background: #fff1f2 !important; }
          .form-group.error label { color: #ef4444 !important; }
          
          .card-upload-area.error-pulse { border-color: #ef4444 !important; animation: borderPulse 1.5s infinite; }
          @keyframes borderPulse { 0% { border-color: #ef4444; } 50% { border-color: #fee2e2; } 100% { border-color: #ef4444; } }

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

          .matrix-scroll-wrapper { width: 100%; overflow-x: auto; background: white; border: 1px solid #f1f5f9; border-radius: 20px; -webkit-overflow-scrolling: touch; }
          .matrix-table { width: 100%; border-collapse: collapse; min-width: 500px; table-layout: fixed; }
          .matrix-table th { background: #f8fafc; padding: 12px 8px; font-size: 0.7rem; text-transform: uppercase; color: #64748b; text-align: start; }
          .matrix-table td { padding: 12px 14px; border-bottom: 1px solid #f8fafc; }
          .matrix-color { display: flex; align-items: center; gap: 8px; font-weight: 700; color: #0f172a; }
          .matrix-color .dot { width: 8px; height: 8px; border-radius: 50%; }
          .stock-input-group { display: flex; align-items: center; gap: 8px; }
          .stock-input-group .unit { font-size: 0.75rem; color: #94a3b8; font-weight: 500; min-width: 30px; }
          .sm-matrix-input { width: 100%; padding: 10px 12px !important; font-size: 1rem !important; border-radius: 12px !important; border: 1.5px solid #e2e8f0 !important; background: white !important; transition: all 0.2s; }
          .sm-matrix-input:focus { border-color: #3b82f6 !important; outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
          .matrix-size-label { font-weight: 700; color: #64748b; font-size: 0.9rem; }

          @media (max-width: 640px) {
            .matrix-table { min-width: 100%; }
            .matrix-table th, .matrix-table td { padding: 8px 4px; }
            .matrix-table th:nth-child(1), .matrix-table td:nth-child(1) { width: 40%; }
            .matrix-table th:nth-child(2), .matrix-table td:nth-child(2) { width: 25%; }
            .matrix-table th:nth-child(3), .matrix-table td:nth-child(3) { width: 35%; }
            
            .stock-input-group { gap: 4px; }
            .stock-input-group .unit { display: none; }
            .sm-matrix-input { padding: 8px !important; text-align: center; }

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
