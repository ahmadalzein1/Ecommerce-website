import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import useCartStore from '../../stores/cartStore';
import { formatPrice } from '../../lib/constants';
import useLanguageStore from '../../stores/languageStore';

export default function ProductCard({ product }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);
  const imgRef = useRef();
  const addItem = useCartStore((s) => s.addItem);
  const { t, isRTL } = useLanguageStore();

  const variants = product.product_variants || [];
  const colors = product.product_colors || [];
  const category = product.categories;

  // Get min price from variants
  const prices = variants.map((v) => Number(v.base_price)).filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

  // Get primary image
  const primaryImage = product.base_image_url || colors[0]?.image_url || null;

  // Lazy load image with IntersectionObserver
  useEffect(() => {
    if (!primaryImage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImgSrc(primaryImage);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [primaryImage]);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (variants.length === 0) return;

    const variant = variants.find((v) => v.stock_quantity > 0) || variants[0];
    const color = colors.find((c) => c.id === variant.product_color_id);

    addItem({
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      price: Number(variant.base_price),
      costPrice: Number(variant.cost_price),
      color: color?.colors?.name || null,
      size: variant.size || null,
      image: color?.image_url || product.base_image_url || null,
      quantity: 1,
      maxStock: variant.stock_quantity,
    });
  };

  const totalStock = variants.reduce((sum, v) => sum + v.stock_quantity, 0);
  const isNew = new Date(product.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return (
    <Link to={`/product/${product.id}`} className="product-card" id={`product-${product.id}`}>
      <div className="product-card-image" ref={imgRef}>
        {!imageLoaded && <div className="skeleton-image" />}
        {imgSrc && (
          <img
            src={imgSrc}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
          />
        )}
        {!primaryImage && !imgSrc && (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--color-surface)',
            color: 'var(--color-text-muted)', fontSize: '3rem'
          }}>
            💎
          </div>
        )}

        {isNew && <span className="product-card-badge badge badge-gold">{isRTL() ? 'جديد' : 'New'}</span>}
        {totalStock === 0 && <span className="product-card-badge badge badge-accent">{t('product.outOfStock')}</span>}

        {totalStock > 0 && (
          <div className="product-card-quick-add">
            <button className="btn btn-primary btn-full btn-sm" onClick={handleQuickAdd}>
              <ShoppingBag size={14} />
              {isRTL() ? 'إضافة سريعة' : 'Quick Add'}
            </button>
          </div>
        )}
      </div>

      <div className="product-card-info">
        {category && <div className="product-card-category">{category.name}</div>}
        <div className="product-card-name">{product.name}</div>
        <div className="product-card-price">
          <span className="price-main">{formatPrice(minPrice)}</span>
          <span className="price-secondary">{formatPrice(minPrice, 'LBP')}</span>
        </div>
        {colors.length > 0 && (
          <div className="product-card-colors">
            {colors.slice(0, 5).map((pc) => (
              <div
                key={pc.id}
                className="color-swatch"
                style={{ backgroundColor: pc.colors?.hex_code || '#ccc' }}
                title={pc.colors?.name}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (pc.image_url) {
                    setImgSrc(pc.image_url);
                    setImageLoaded(false);
                  }
                }}
              />
            ))}
            {colors.length > 5 && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', alignSelf: 'center' }}>
                +{colors.length - 5}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
