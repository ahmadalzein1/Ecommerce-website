export default function SkeletonLoader({ count = 4 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="product-card" style={{ pointerEvents: 'none' }}>
          <div className="product-card-image">
            <div className="skeleton-image" />
          </div>
          <div className="product-card-info">
            <div className="skeleton skeleton-text" style={{ width: '40%' }} />
            <div className="skeleton skeleton-text" style={{ width: '80%' }} />
            <div className="skeleton skeleton-text-sm" style={{ width: '50%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
