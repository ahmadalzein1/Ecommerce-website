import { TrendingUp, Package, DollarSign, ShoppingBag, BarChart2 } from 'lucide-react';
import { formatEnPrice, en, StatCard } from './AdminCommon';

export const AnalyticsManager = ({ products, orders, language }) => {
  const isAR = language === 'ar';

  // 1. Process orders to get product-wise stats
  const productStats = {};

  orders.forEach(order => {
    // Only count 'delivering' or 'received_paid' orders for revenue/profit
    const isValidForAnalytics = ['delivering', 'received_paid'].includes(order.status);
    if (!isValidForAnalytics) return;

    order.order_items?.forEach(item => {
      const variantId = item.product_variant_id;
      
      // Find which product this variant belongs to
      const product = products.find(p => 
        p.product_variants?.some(v => v.id === variantId)
      );

      if (!product) return;

      const productId = product.id;
      if (!productStats[productId]) {
        productStats[productId] = {
          name: isAR ? product.name_ar : product.name_en,
          unitsSold: 0,
          revenue: 0,
          profit: 0,
          image: product.base_image_url
        };
      }

      const itemRevenue = (item.unit_price || item.price_at_purchase || 0) * item.quantity;
      const itemCost = (item.cost_price_at_purchase || 0) * item.quantity;
      const itemProfit = itemRevenue - itemCost;

      productStats[productId].unitsSold += item.quantity;
      productStats[productId].revenue += itemRevenue;
      productStats[productId].profit += itemProfit;
    });
  });

  // Convert to array and sort by units sold
  const statsArray = Object.values(productStats).sort((a, b) => b.unitsSold - a.unitsSold);

  // Global totals
  const totals = statsArray.reduce((acc, curr) => ({
    unitsSold: acc.unitsSold + curr.unitsSold,
    revenue: acc.revenue + curr.revenue,
    profit: acc.profit + curr.profit
  }), { unitsSold: 0, revenue: 0, profit: 0 });

  return (
    <div className="analytics-container">
      {/* Summary StatCards */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <StatCard 
          label={isAR ? 'إجمالي الإيرادات' : 'Total Revenue'} 
          value={formatEnPrice(totals.revenue)} 
          icon={DollarSign} 
          colorClass="gold" 
        />
        <StatCard 
          label={isAR ? 'إجمالي الأرباح' : 'Net Profit'} 
          value={formatEnPrice(totals.profit)} 
          icon={TrendingUp} 
          colorClass="green" 
        />
      </div>

      <div className="section-header" style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart2 size={20} className="text-primary" />
          {isAR ? 'أداء المنتجات' : 'Product Performance'}
        </h2>
      </div>

      {/* Products Performance Table */}
      <div className="pro-content-card">
        <div className="pro-table-wrapper">
          <table className="pro-table analytics-table-fixed">
            <thead>
              <tr>
                <th className="col-product">{isAR ? 'المنتج' : 'Product'}</th>
                <th className="col-metric">{isAR ? 'المبيعات' : 'Sold'}</th>
                <th className="col-metric">{isAR ? 'الإجمالي' : 'Total'}</th>
                <th className="col-metric">{isAR ? 'الأرباح' : 'Profit'}</th>
              </tr>
            </thead>
            <tbody>
              {statsArray.length > 0 ? (
                statsArray.map((stat, idx) => (
                  <tr key={idx} style={{ animationDelay: `${idx * 0.05}s` }} className="animate-slide-up">
                    <td data-label={isAR ? 'المنتج' : 'Product'}>
                      <div className="analytics-product-cell">
                        <div className="analytics-img-wrap">
                          {stat.image ? <img src={stat.image} alt="" /> : <div className="p-placeholder">📦</div>}
                        </div>
                        <span className="analytics-p-name">{stat.name}</span>
                      </div>
                    </td>
                    <td data-label={isAR ? 'المبيعات' : 'Sold'} className="col-metric"><span className="analytics-badge blue">{en(stat.unitsSold)}</span></td>
                    <td data-label={isAR ? 'الإجمالي' : 'Total'} className="col-metric"><span className="analytics-price">{formatEnPrice(stat.revenue)}</span></td>
                    <td data-label={isAR ? 'الأرباح' : 'Profit'} className="col-metric">
                      <span className={`analytics-profit ${stat.profit >= 0 ? 'pos' : 'neg'}`}>
                        {stat.profit >= 0 ? '+' : ''}{formatEnPrice(stat.profit)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="empty-analytics-cell">
                    {isAR ? 'لا توجد بيانات متاحة حالياً' : 'No analytics data available yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .analytics-container { animation: fadeIn 0.4s ease; padding-bottom: 40px; }
        
        /* Desktop Table Styling */
        .analytics-table-fixed { width: 100%; border-collapse: separate; border-spacing: 0; }
        .col-product { width: 40%; text-align: ${isAR ? 'right' : 'left'}; padding: 16px; }
        .col-metric { width: 20%; text-align: center; padding: 16px; }

        .analytics-product-cell { display: flex; align-items: center; gap: 14px; }
        .analytics-img-wrap { 
          width: 52px; height: 52px; border-radius: 12px; overflow: hidden; 
          background: #f1f5f9; border: 1px solid #e2e8f0; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .analytics-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
        .analytics-p-name { font-weight: 700; color: #0f172a; font-size: 0.95rem; line-height: 1.3; }
        
        .analytics-badge {
          background: #eff6ff; color: #3b82f6; padding: 6px 12px; border-radius: 10px;
          font-weight: 800; font-size: 0.85rem; display: inline-block;
        }
        .analytics-price { font-weight: 700; color: #1e293b; font-size: 1rem; }
        .analytics-profit { font-weight: 800; font-size: 1rem; }
        .analytics-profit.pos { color: #10b981; }
        .analytics-profit.neg { color: #ef4444; }

        .empty-analytics-cell { text-align: center; padding: 60px !important; color: #94a3b8; font-weight: 600; }

        /* Animations */
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.4s ease forwards; }

        /* MOBILE OVERHAUL (THE FIX) */
        @media (max-width: 768px) {
          .analytics-table-fixed { display: block; border: none; }
          .analytics-table-fixed thead { display: none; } /* Hide headers on mobile */
          .analytics-table-fixed tbody { display: block; width: 100%; }
          .analytics-table-fixed tr { 
            display: block; background: #fff; border: 1px solid #f1f5f9; 
            border-radius: 20px; margin-bottom: 20px; padding: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          }
          .analytics-table-fixed td { 
            display: flex; align-items: center; justify-content: space-between;
            padding: 12px 0 !important; width: 100% !important; height: auto !important;
            border: none !important;
          }
          
          /* The First Cell (Product Name/Image) */
          .analytics-table-fixed td[data-label="${isAR ? 'المنتج' : 'Product'}"] {
            border-bottom: 1.5px solid #f8fafc !important; 
            padding-bottom: 16px !important; margin-bottom: 8px !important;
            justify-content: flex-start; gap: 16px;
          }
          .analytics-table-fixed td[data-label="${isAR ? 'المنتج' : 'Product'}"]::before { display: none; }
          
          /* Metric Cells Styling */
          .analytics-table-fixed td:not([data-label="${isAR ? 'المنتج' : 'Product'}"])::before {
            content: attr(data-label); font-weight: 700; color: #94a3b8; font-size: 0.75rem;
            text-transform: uppercase; letter-spacing: 0.5px;
          }
          
          .analytics-img-wrap { width: 60px; height: 60px; border-radius: 14px; }
          .analytics-p-name { font-size: 1.1rem; flex: 1; }
          .col-metric { text-align: right !important; }
        }
      `}</style>
    </div>
  );
};
