import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, ChevronRight, Check, Minus, Plus, ArrowLeft, AlertCircle, MessageCircle } from 'lucide-react';
import { useProductDetail, useRelatedProducts } from '../hooks/useProductDetail';
import useCartStore from '../stores/cartStore';
import useLanguageStore from '../stores/languageStore';
import ProductCard from '../components/UI/ProductCard';
import { formatPrice, WHATSAPP_NUMBER, sortSizes } from '../lib/constants';
import useScrollReveal from '../hooks/useScrollReveal';

export default function ProductPage() {
  const { id } = useParams();
  const { product, loading, error } = useProductDetail(id);
  const { items, addItem, openCart } = useCartStore();
  const { t, isRTL, getLocalizedField } = useLanguageStore();

  const [selectedColorId, setSelectedColorId] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [mainImage, setMainImage] = useState(null);

  const { products: relatedProducts } = useRelatedProducts(
    product?.category_id,
    product?.id
  );

  useScrollReveal([product, relatedProducts, loading]);

  // Derive selectable data
  const colors = product?.product_colors || [];
  const variants = product?.product_variants || [];

  // Get available sizes for selected color
  const availableSizes = useMemo(() => {
    let rawSizes = [];
    if (!selectedColorId) {
      rawSizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];
    } else {
      const colorVariants = variants.filter((v) => v.product_color_id === selectedColorId);
      rawSizes = [...new Set(colorVariants.map((v) => v.size).filter(Boolean))];
    }
    return sortSizes(rawSizes);
  }, [selectedColorId, variants]);

  // Get selected variant
  const selectedVariant = useMemo(() => {
    if (!selectedSize && !selectedColorId) return variants[0] || null;
    return variants.find((v) => {
      const colorMatch = !selectedColorId || v.product_color_id === selectedColorId;
      const sizeMatch = !selectedSize || v.size === selectedSize;
      return colorMatch && sizeMatch;
    }) || null;
  }, [selectedColorId, selectedSize, variants]);

  // Get colors that have at least one variant in stock
  const colorsInStockIds = useMemo(() => {
    return colors
      .filter(pc => variants.some(v => v.product_color_id === pc.id && v.stock_quantity > 0))
      .map(pc => pc.id);
  }, [colors, variants]);

  const hasOtherColorsInStock = useMemo(() => {
    return colorsInStockIds.some(id => id !== selectedColorId);
  }, [colorsInStockIds, selectedColorId]);

  const price = selectedVariant ? Number(selectedVariant.base_price) : 0;
  const stock = selectedVariant ? selectedVariant.stock_quantity : 0;

  // Check if current variant is in cart
  const cartItem = useMemo(() => {
    return items.find(i => i.variantId === selectedVariant?.id);
  }, [items, selectedVariant]);

  const isInCart = !!cartItem;

  // Set initial selections
  useEffect(() => {
    if (product && colors.length > 0 && !selectedColorId) {
      // Prioritize the first color that has at least one size in stock
      const firstInStockId = colorsInStockIds[0];
      const initialColor = colors.find(c => c.id === (firstInStockId || colors[0].id));

      if (initialColor) {
        setSelectedColorId(initialColor.id);
        setMainImage(initialColor.image_url || product.base_image_url);
      }
    } else if (product && !selectedColorId) {
      setMainImage(product.base_image_url);
    }
  }, [product, colorsInStockIds]);

  // Handle color selection
  const handleColorSelect = (pc) => {
    setSelectedColorId(pc.id);
    setSelectedSize(null);
    setQuantity(1);
    setMainImage(pc.image_url || product.base_image_url);
  };

  // Get all images for gallery
  const allImages = useMemo(() => {
    if (!product) return [];
    const imgs = [];
    if (product.base_image_url) imgs.push({ url: product.base_image_url, label: 'Main' });
    colors.forEach((pc) => {
      if (pc.image_url && !imgs.find((i) => i.url === pc.image_url)) {
        imgs.push({ url: pc.image_url, label: getLocalizedField(pc.colors, 'name') || 'Variant' });
      }
    });
    return imgs;
  }, [product, colors]);

  const getStockForSize = (size) => {
    const v = variants.find((v) => {
      const colorMatch = !selectedColorId || v.product_color_id === selectedColorId;
      return colorMatch && v.size === size;
    });
    return v ? v.stock_quantity : 0;
  };

  useEffect(() => {
    if (availableSizes.length > 0 && !selectedSize) {
      const firstAvailable = availableSizes.find((size) => getStockForSize(size) > 0);
      setSelectedSize(firstAvailable || availableSizes[0]);
    }
  }, [availableSizes, selectedSize, selectedColorId]);

  // Sync quantity with cart if already present
  useEffect(() => {
    if (cartItem) {
      setQuantity(cartItem.quantity);
    } else {
      setQuantity(1);
    }
  }, [cartItem]);

  const handleAddToCart = () => {
    if (!selectedVariant || stock === 0) return;

    const colorInfo = colors.find((c) => c.id === selectedColorId);

    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      productName_en: product.name_en || product.name,
      productName_ar: product.name_ar || product.name,
      price: Number(selectedVariant.base_price),
      costPrice: Number(selectedVariant.cost_price),
      color: colorInfo?.colors?.name || null,
      color_en: colorInfo?.colors?.name_en || colorInfo?.colors?.name || null,
      color_ar: colorInfo?.colors?.name_ar || colorInfo?.colors?.name || null,
      size: selectedVariant.size || null,
      image: colorInfo?.image_url || product.base_image_url || null,
      quantity,
      maxStock: stock,
    }, true); // Always replace when adding/updating from product page

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="product-detail">
        <div className="container">
          <div className="page-loader">
            <div className="spinner" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail">
        <div className="container">
          <div className="empty-state">
            <AlertCircle size={64} />
            <h3>{t('common.error')}</h3>
            <p>{isRTL() ? 'المنتج غير موجود' : 'Product not found'}</p>
            <Link to="/shop" className="btn btn-outline" style={{ marginTop: '16px' }}>
              <ArrowLeft size={16} /> {t('common.back')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail">
      <div className="container">
        {/* Breadcrumb */}
        <div className="product-breadcrumb">
          <Link to="/">{t('nav.home')}</Link>
          <ChevronRight size={14} />
          <Link to="/shop">{t('nav.shop')}</Link>
          {product.categories && (
            <>
              <ChevronRight size={14} />
              <Link to={`/shop?category=${product.categories.id}`}>{getLocalizedField(product.categories, 'name')}</Link>
            </>
          )}
          <ChevronRight size={14} />
          <span style={{ color: 'var(--color-text)' }}>{getLocalizedField(product, 'name')}</span>
        </div>

        <div className="product-detail-grid">
          {/* Gallery */}
          <div className="product-gallery">
            <div className="product-gallery-main">
              {mainImage ? (
                <img src={mainImage} alt={getLocalizedField(product, 'name')} />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--color-surface)', fontSize: '5rem'
                }}>
                  💎
                </div>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="product-gallery-thumbs">
                {allImages.map((img, i) => (
                  <div
                    key={i}
                    className={`product-gallery-thumb ${mainImage === img.url ? 'active' : ''}`}
                  >
                    <img src={img.url} alt={img.label} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-info">
            {product.categories && (
              <span className="badge badge-gold" style={{ marginBottom: 'var(--space-md)', display: 'inline-block' }}>
                {getLocalizedField(product.categories, 'name')}
              </span>
            )}

            <h1 className="product-title">{getLocalizedField(product, 'name')}</h1>

            <div className="product-price-section">
              <span className="product-price-main">{formatPrice(price)}</span>
              <span className="product-price-lbp">{formatPrice(price, 'LBP')}</span>
            </div>

            {getLocalizedField(product, 'description') && (
              <p className="product-description">{getLocalizedField(product, 'description')}</p>
            )}

            {/* Color Selection */}
            {colors.length > 0 && (
              <div>
                <div className="product-option-label">
                  {t('product.selectColor')}
                  {selectedColorId && (
                    <span>
                      — {colors.find((c) => c.id === selectedColorId)?.colors?.name}
                    </span>
                  )}
                </div>
                <div className="product-colors-select">
                  {colors.map((pc) => {
                    const isInStock = colorsInStockIds.includes(pc.id);
                    return (
                      <div
                        key={pc.id}
                        className={`color-swatch color-swatch-lg ${selectedColorId === pc.id ? 'active' : ''} ${!isInStock ? 'out-of-stock' : ''}`}
                        style={{ backgroundColor: pc.colors?.hex_code || '#ccc' }}
                        title={`${getLocalizedField(pc.colors, 'name')}${!isInStock ? ` (${t('product.outOfStock')})` : ''}`}
                        onClick={() => handleColorSelect(pc)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {availableSizes.length > 0 && (
              <div>
                <div className="product-option-label">
                  {t('product.selectSize')}
                  {selectedSize && <span>— {selectedSize}</span>}
                </div>
                <div className="product-size-select">
                  {availableSizes.map((size) => {
                    const sizeStock = getStockForSize(size);
                    return (
                      <button
                        key={size}
                        className={`size-option ${selectedSize === size ? 'active' : ''} ${sizeStock === 0 ? 'out-of-stock' : ''}`}
                        onClick={() => {
                          if (sizeStock > 0) {
                            setSelectedSize(size);
                            setQuantity(1);
                          }
                        }}
                      >
                        {size}
                      </button>
                    );
                  })}
                  {availableSizes.length > 0 && !isNaN(availableSizes[0]) && (
                    <span className="years-label">
                      {isRTL() ? 'سنوات' : 'Years'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Stock Status */}
            {selectedVariant && (
              <div className={`product-stock ${stock === 0 ? 'out-of-stock' : stock <= 3 ? 'low-stock' : 'in-stock'}`}>
                {stock === 0 ? (
                  <>
                    <AlertCircle size={16} />
                    {t('product.outOfStock')}
                    {hasOtherColorsInStock && (
                      <span
                        onClick={() => {
                          const firstAvailableId = colorsInStockIds.find(id => id !== selectedColorId);
                          const pc = colors.find(c => c.id === firstAvailableId);
                          if (pc) handleColorSelect(pc);
                        }}
                        style={{
                          marginLeft: isRTL() ? 0 : '10px',
                          marginRight: isRTL() ? '10px' : 0,
                          cursor: 'pointer',
                          fontSize: '0.9em',
                          fontWeight: 600,
                          color: '#15803d',
                          background: 'rgba(34, 197, 94, 0.15)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid rgba(34, 197, 94, 0.2)',
                          transition: 'all 0.2s ease',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.25)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.15)'}
                      >
                        {t('product.otherColorsAvailable')}
                      </span>
                    )}
                  </>
                ) : stock <= 3 ? (
                  <><AlertCircle size={16} /> {isRTL() ? `تبقى ${stock} فقط!` : `Only ${stock} left!`}</>
                ) : (
                  <><Check size={16} /> {isRTL() ? 'متوفر' : 'In Stock'}</>
                )}
              </div>
            )}

            {/* Quantity */}
            {stock > 0 && (
              <div className="product-quantity">
                <span className="product-option-label" style={{ marginBottom: 0 }}>{isRTL() ? 'الكمية' : 'Quantity'}</span>
                <button
                  className="qty-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus size={18} />
                </button>
                <span className="qty-display">{quantity}</span>
                <button
                  className="qty-btn"
                  onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                  disabled={quantity >= stock}
                >
                  <Plus size={18} />
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="product-actions">
              <button
                className={`btn ${added ? 'btn-gold' : 'btn-accent'} btn-lg`}
                onClick={handleAddToCart}
                disabled={!selectedVariant || stock === 0}
              >
                {added ? (
                  <><Check size={18} /> {isRTL() ? 'تم تحديث السلة!' : 'Cart Updated!'}</>
                ) : (
                  <><ShoppingBag size={18} /> {isInCart ? (isRTL() ? 'تعديل السلة' : 'Update Cart') : t('product.addToCart')}</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section style={{ marginTop: 'var(--space-4xl)' }}>
            <h2 className="section-title reveal reveal-fade-up">{t('product.similarProducts')}</h2>
            <div className="product-grid">
              {relatedProducts.map((p, i) => (
                <div key={p.id} className={`reveal reveal-fade-up stagger-${(i % 4) + 1}`} style={{ width: '100%' }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
