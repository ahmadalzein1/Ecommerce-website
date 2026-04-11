import { useState } from 'react';
import { X, ShoppingBag, Trash2, Tag, ArrowRight, Minus, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import useCartStore from '../../stores/cartStore';
import useLanguageStore from '../../stores/languageStore';
import { formatPrice } from '../../lib/constants';
import { FlagLB, FlagTR } from './FlagIcons';

export default function CartDrawer() {
  const {
    items, isCartOpen, closeCart,
    removeItem, updateQuantity,
    discount, discountLoading, discountError,
    applyDiscount, removeDiscount,
    getSubtotal, getDiscountAmount, getTotal, getItemCount
  } = useCartStore();
  const { t, isRTL, getLocalizedField } = useLanguageStore();

  const [discountCode, setDiscountCode] = useState('');

  if (!isCartOpen) return null;

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    await applyDiscount(discountCode);
  };

  const subtotal = getSubtotal();
  const discountAmt = getDiscountAmount();
  const total = getTotal();
  const count = getItemCount();

  return (
    <>
      <div className="cart-overlay" onClick={closeCart} />
      <div className="cart-drawer">
        <div className="cart-header">
          <h2>{t('cart.title')} ({count})</h2>
          <button className="cart-close-btn" onClick={closeCart}>
            <X size={20} />
          </button>
        </div>

        <div className="cart-items">
          {items.length === 0 ? (
            <div className="cart-empty">
              <ShoppingBag size={64} />
              <p>{t('cart.empty')}</p>
              <Link to="/shop" className="btn btn-outline" onClick={closeCart}>
                {t('cart.continueShopping')}
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div className="cart-item" key={item.variantId}>
                <div className="cart-item-image">
                  {item.image ? (
                    <img src={item.image} alt={item.productName} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>💎</div>
                  )}
                </div>
                <div className="cart-item-details">
                  <div className="cart-item-name">{getLocalizedField(item, 'productName')}</div>
                  <div className="cart-item-variant">
                    {getLocalizedField(item, 'color') && (isRTL() ? `اللون: ${getLocalizedField(item, 'color')}` : `Color: ${getLocalizedField(item, 'color')}`)}
                    {getLocalizedField(item, 'color') && item.size && ' · '}
                    {item.size && (isRTL() ? `المقاس: ${item.size}` : `Size: ${item.size}`)}
                  </div>
                  <div className="cart-item-price">{formatPrice(item.price * item.quantity)}</div>
                  <div className="cart-item-controls">
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="cart-item-qty">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      disabled={item.maxStock && item.quantity >= item.maxStock}
                    >
                      <Plus size={14} />
                    </button>
                    <button className="cart-item-remove" onClick={() => removeItem(item.variantId)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            {/* Discount Code */}
            {!discount ? (
              <>
                <div className="cart-discount">
                  <input
                    className="input-field"
                    placeholder={t('checkout.discountCode')}
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyDiscount()}
                  />
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={handleApplyDiscount}
                    disabled={discountLoading}
                  >
                    {discountLoading ? '...' : t('checkout.apply')}
                  </button>
                </div>
                {discountError && <div className="cart-discount-error">{discountError}</div>}
              </>
            ) : (
              <div className="cart-discount-success">
                <span><Tag size={14} /> {discount.code} (-{discount.value}%)</span>
                <button onClick={removeDiscount} style={{ color: 'var(--color-text-muted)' }}>
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Summary */}
            <div className="cart-summary">
              <div className="cart-summary-row">
                <span>{t('cart.subtotal')}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount && (
                <div className="cart-summary-row discount">
                  <span>{isRTL() ? `الخصم (${discount.value}%)` : `Discount (${discount.value}%)`}</span>
                  <span>-{formatPrice(discountAmt)}</span>
                </div>
              )}
              <div className="cart-summary-row total">
                <span>{t('cart.total')}</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="cart-summary-row total-lbp">
                <span></span>
                <span>{formatPrice(total, 'LBP')}</span>
              </div>
            </div>

            <div className="checkout-delivery-note" style={{
              padding: '10px',
              backgroundColor: 'rgba(0,0,0,0.03)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '12px',
              fontSize: '0.8rem',
              textAlign: 'center',
              color: 'var(--color-text-muted)'
            }}>
              {isRTL() ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '4px' }}>
                  شحن ممتاز: يستغرق توصيل الطلبات من 10 إلى 12 يوماً (من تركيا <FlagTR size={14} /> إلى لبنان <FlagLB size={14} />).
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '4px' }}>
                  Premium Shipping: Orders take 10-12 days to arrive (Turkey <FlagTR size={14} /> to Lebanon <FlagLB size={14} />).
                </span>
              )}
            </div>

            <Link
              to="/checkout"
              className="btn btn-accent btn-full btn-lg"
              onClick={closeCart}
            >
              {t('cart.checkout')} <ArrowRight size={18} style={{ transform: isRTL() ? 'rotate(180deg)' : 'none' }} />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
