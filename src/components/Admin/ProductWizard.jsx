import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2, Save, ChevronRight, ChevronLeft, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { adminService } from '../../lib/adminService';
import { formatEnPrice } from './AdminCommon';

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
      // In a real app we'd load mappings and variants here for edit mode
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
          stock_quantity: 10,
          base_price: 0,
          cost_price: 0
        });
      });
    });
    setVariants(newVariants);
    setStep(3);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await adminService.createFullProduct(baseInfo, variants, colorImages);
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error saving product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      <div className="modal-content wizard" style={{
        background: 'white', width: '100%', maxWidth: '900px', borderRadius: '32px', maxHeight: '95vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Header */}
        <div className="wizard-header" style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>{product ? 'Edit Product' : 'Create New Product'}</h2>
            <div className="steps-indicator" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              {[1, 2, 3].map(s => (
                <div key={s} style={{ width: '40px', height: '4px', borderRadius: '2px', background: s <= step ? '#fbbf24' : '#f1f5f9' }} />
              ))}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="wizard-body scrollable" style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
          
          {step === 1 && (
            <div className="step-1 animate-in">
              <h3 style={{ marginBottom: '24px' }}>Base Product Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="input-group">
                  <label>Name (Arabic)</label>
                  <input type="text" value={baseInfo.name_ar} onChange={e => setBaseInfo({...baseInfo, name_ar: e.target.value})} placeholder="قميص رجالي" />
                </div>
                <div className="input-group">
                  <label>Name (English)</label>
                  <input type="text" value={baseInfo.name_en} onChange={e => setBaseInfo({...baseInfo, name_en: e.target.value})} placeholder="Men's Shirt" />
                </div>
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label>Category</label>
                  <select value={baseInfo.category_id} onChange={e => setBaseInfo({...baseInfo, category_id: e.target.value})}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{language === 'ar' ? c.name_ar : c.name_en}</option>)}
                  </select>
                </div>
                <div className="image-upload-section" style={{ gridColumn: 'span 2' }}>
                  <label>Main Showcase Image</label>
                  <div className="upload-box" style={{ 
                    border: '2px dashed #e2e8f0', borderRadius: '16px', height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden'
                  }}>
                    {baseInfo.base_image_url ? (
                      <img src={baseInfo.base_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <>
                        <Upload size={32} color="#94a3b8" />
                        <span style={{ marginTop: '12px', color: '#64748b' }}>Click to upload main image</span>
                      </>
                    )}
                    <input type="file" onChange={handleBaseImageUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-2 animate-in">
              <h3 style={{ marginBottom: '24px' }}>Color & Media Mapping</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
                {colors.map(c => (
                  <button key={c.id} onClick={() => addColorMapping(c.id)} className="color-btn" style={{ 
                    padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                  }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: c.hex_code }} />
                    {language === 'ar' ? c.name_ar : c.name_en}
                  </button>
                ))}
              </div>

              <div className="mappings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {colorImages.map((cm, idx) => {
                  const colorDetails = colors.find(c => c.id === cm.color_id);
                  return (
                    <div key={idx} className="mapping-card" style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontWeight: '700' }}>{language === 'ar' ? colorDetails?.name_ar : colorDetails?.name_en}</span>
                        <button onClick={() => setColorImages(colorImages.filter((_, i) => i !== idx))} style={{ color: '#ef4444', background: 'none', border: 'none' }}><Trash2 size={16} /></button>
                      </div>
                      <div className="mini-upload" style={{ height: '120px', background: 'white', borderRadius: '8px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        {cm.image_url ? <img src={cm.image_url} alt="" style={{ height: '100%' }} /> : <ImageIcon size={20} color="#cbd5e1" />}
                        <input type="file" onChange={e => handleColorImageUpload(idx, e.target.files[0])} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-3 animate-in">
              <h3 style={{ marginBottom: '24px' }}>Inventory & Pricing Matrix</h3>
              <table className="variant-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px' }}>Color</th>
                    <th>Size</th>
                    <th>Stock</th>
                    <th>Price ($)</th>
                    <th>Cost ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, idx) => {
                    const colorDetails = colors.find(c => c.id === v.color_id);
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: colorDetails?.hex_code }} />
                            {colorDetails?.name_en}
                          </div>
                        </td>
                        <td><input type="text" value={v.size} onChange={e => {
                          const n = [...variants]; n[idx].size = e.target.value; setVariants(n);
                        }} style={{ width: '50px', padding: '4px' }} /></td>
                        <td><input type="number" value={v.stock_quantity} onChange={e => {
                          const n = [...variants]; n[idx].stock_quantity = parseInt(e.target.value); setVariants(n);
                        }} style={{ width: '60px', padding: '4px' }} /></td>
                        <td><input type="number" value={v.base_price} onChange={e => {
                          const n = [...variants]; n[idx].base_price = parseFloat(e.target.value); setVariants(n);
                        }} style={{ width: '80px', padding: '4px' }} /></td>
                        <td><input type="number" value={v.cost_price} onChange={e => {
                          const n = [...variants]; n[idx].cost_price = parseFloat(e.target.value); setVariants(n);
                        }} style={{ width: '80px', padding: '4px' }} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="wizard-footer" style={{ padding: '24px 32px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', background: '#fcfcfc' }}>
          <button 
            disabled={step === 1 || loading}
            onClick={() => setStep(step - 1)}
            style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <ChevronLeft size={18} /> Back
          </button>
          
          {step < 3 ? (
            <button 
              disabled={loading}
              onClick={() => step === 2 ? generateVariants() : setStep(step + 1)}
              style={{ padding: '12px 24px', borderRadius: '12px', background: '#0f172a', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              Next Step <ChevronRight size={18} />
            </button>
          ) : (
            <button 
              disabled={loading}
              onClick={handleSave}
              style={{ padding: '12px 24px', borderRadius: '12px', background: '#fbbf24', color: '#0f172a', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '800' }}
            >
               {loading ? 'Saving...' : 'Finish & Launch'} <CheckCircle2 size={18} />
            </button>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .wizard-body input, .wizard-body select, .wizard-body textarea {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 2px solid #f1f5f9;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        .wizard-body input:focus { outline: none; border-color: #fbbf24; }
        .wizard-body label { display: block; font-size: 13px; font-weight: 700; color: #64748b; margin-bottom: 8px; }
        .animate-in { animation: slideUp 0.3s ease-out; }
        @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}} />
    </div>
  );
};
