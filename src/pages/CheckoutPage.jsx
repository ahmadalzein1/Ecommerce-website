import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowLeft, ShoppingBag, Tag, X, User, Phone, Minus, Plus, Trash2, Building2 } from 'lucide-react';
import useCartStore from '../stores/cartStore';
import { supabase } from '../lib/supabase';
import { errorService } from '../lib/errorService';
import { formatPrice, generateOrderMessage, generateWhatsAppUrl } from '../lib/constants';
import useLanguageStore from '../stores/languageStore';
import { FlagLB, FlagTR } from '../components/UI/FlagIcons';
import useScrollReveal from '../hooks/useScrollReveal';

export default function CheckoutPage() {
  const {
    items, removeItem, updateQuantity,
    getSubtotal, getTotal, clearCart
  } = useCartStore();
  const { t, isRTL, getLocalizedField, language } = useLanguageStore();

  useScrollReveal([items]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const subtotal = getSubtotal();
  const total = getTotal();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة.' : 'Please fill in all required fields.');
      return;
    }
    if (items.length === 0) {
      setError(language === 'ar' ? 'سلة التسوق فارغة.' : 'Your cart is empty.');
      return;
    }

    if (!errorService.isOnline()) {
      setError(language === 'ar' ? 'فشل الاتصال: لا يوجد إنترنت' : 'Connection failed: No internet');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const createOrderLogic = async () => {
        let order;
        try {
          const { data, error: orderError } = await supabase
            .from('orders')
            .insert({
              customer_name: name.trim(),
              customer_phone: phone.trim(),
              address: address.trim(),
              status: 'pending',
              total_amount: total,
            })
            .select()
            .single();

          if (orderError) throw orderError;
          order = data;
        } catch (err) {
          // Fallback: If 'address' column is missing, save it in the name field
          if (err.message?.includes('address') || err.code === '42703') {
            console.log('Address column missing, using fallback...');
            const { data: fallbackOrder, error: fallbackError } = await supabase
              .from('orders')
              .insert({
                customer_name: `${name.trim()} (${address.trim()})`,
                customer_phone: phone.trim(),
                status: 'pending',
                total_amount: total,
              })
              .select()
              .single();

            if (fallbackError) throw fallbackError;
            order = fallbackOrder;
          } else {
            throw err;
          }
        }

        // Create order items
        const orderItems = items.map((item) => ({
          order_id: order.id,
          product_variant_id: item.variantId,
          quantity: item.quantity,
          unit_price: item.price,
          price_at_purchase: item.price,
          cost_price_at_purchase: item.costPrice || 0,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      };

      // Wrap whole order logic in 15s timeout
      await errorService.withTimeout(createOrderLogic(), 15000);

      // Generate WhatsApp message
      const message = generateOrderMessage(items, name, phone, address, total, language);
      const whatsappUrl = generateWhatsAppUrl(message);

      // Clear cart and navigate
      clearCart();

      // Open WhatsApp and redirect
      window.location.href = whatsappUrl;
    } catch (err) {
      setError(errorService.translate(err, language));
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="checkout-page">
      <div className="container">
        <div className="empty-state">
          <ShoppingBag size={64} />
          <h3>{t('checkout.emptyCart')}</h3>
          <Link to="/shop" className="btn btn-outline btn-lg" style={{ marginTop: '16px' }}>
            <ArrowLeft size={16} /> {isRTL() ? 'متابعة التسوق' : 'Continue Shopping'}
          </Link>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="section-title reveal reveal-fade-up">{t('checkout.title')}</h1>

        <div className="checkout-grid">
          {/* Form */}
          <div className="reveal reveal-fade-up" style={{ '--delay': '0.1s' }}>
            <div className="checkout-section">
              <h2>{t('checkout.yourInfo')}</h2>
              <form className="checkout-form" onSubmit={handleSubmit}>
                <div className="input-group">
                  <label className="input-label">
                    <User size={14} style={{ display: 'inline', [isRTL() ? 'marginLeft' : 'marginRight']: '6px' }} />
                    {t('checkout.fullName')}
                  </label>
                  <input
                    className="input-field"
                    placeholder={t('checkout.namePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">
                    <Phone size={14} style={{ display: 'inline', [isRTL() ? 'marginLeft' : 'marginRight']: '6px' }} />
                    {t('checkout.phone')}
                  </label>
                  <input
                    className="input-field"
                    placeholder={t('checkout.phonePlaceholder')}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    type="tel"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">
                    <Building2 size={14} style={{ display: 'inline', [isRTL() ? 'marginLeft' : 'marginRight']: '6px' }} />
                    {t('checkout.address')}
                  </label>
                  <textarea
                    className="input-field"
                    placeholder={t('checkout.addressPlaceholder')}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    rows={3}
                    style={{ resize: 'none' }}
                  />
                </div>



                {error && (
                  <div style={{
                    padding: '12px 16px', background: 'rgba(220,53,69,0.08)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--color-error)',
                    fontSize: 'var(--text-sm)'
                  }}>
                    {error}
                  </div>
                )}

                <label className="checkout-delivery-note" style={{
                  padding: '12px',
                  backgroundColor: 'rgba(0,0,0,0.03)',
                  border: '1px dashed var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}>
                  <input type="checkbox" required style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }} />
                  <span>
                    {isRTL() ? (
                      <>أقر وأوافق على أن الطلب يستغرق من 10 إلى 12 يوماً للتوصيل (شحن ممتاز من <FlagTR size={16} /> إلى <FlagLB size={16} />).</>
                    ) : (
                      <>I acknowledge and agree that the order takes 10 to 12 days to deliver (Premium Shipping from <FlagTR size={16} /> to <FlagLB size={16} />).</>
                    )}
                  </span>
                </label>

                <button
                  type="submit"
                  className="btn btn-whatsapp btn-full btn-lg"
                  disabled={submitting}
                >
                  <MessageCircle size={20} />
                  {submitting ? t('common.loading') : t('checkout.confirmButton')}
                </button>

                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                  {t('checkout.whatsappNotice')}
                </p>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="checkout-section checkout-order-summary reveal reveal-fade-up" style={{ '--delay': '0.2s' }}>
            <h2>{t('checkout.orderSummary')}</h2>

            {items.map((item) => (
              <div className="checkout-item" key={item.variantId}>
                <div className="checkout-item-image">
                  {item.image ? (
                    <img src={item.image} alt={item.productName} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💎</div>
                  )}
                </div>
                <div className="checkout-item-details">
                  <div className="checkout-item-name">{getLocalizedField(item, 'productName')}</div>
                  <div className="checkout-item-variant">
                    {getLocalizedField(item, 'color') && `${getLocalizedField(item, 'color')}`}
                    {getLocalizedField(item, 'color') && item.size && ' · '}
                    {item.size && `${item.size}`}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <button className="qty-btn" onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>
                      <Minus size={12} />
                    </button>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{item.quantity}</span>
                    <button 
                      className="qty-btn" 
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      disabled={item.maxStock && item.quantity >= item.maxStock}
                    >
                      <Plus size={12} />
                    </button>
                    <button onClick={() => removeItem(item.variantId)} style={{ marginLeft: 'auto', color: 'var(--color-text-muted)', padding: '4px' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="checkout-item-price">{formatPrice(item.price * item.quantity)}</div>
              </div>
            ))}

            <div className="cart-summary" style={{ marginTop: 'var(--space-lg)' }}>
              <div className="cart-summary-row">
                <span>{t('cart.subtotal')}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <div className="cart-summary-row total">
                <span>{t('cart.total')}</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="cart-summary-row total-lbp">
                <span></span>
                <span>{formatPrice(total, 'LBP')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
