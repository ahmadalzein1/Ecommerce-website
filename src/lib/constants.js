export const STORE_NAME = 'Zein Shop';
export const STORE_TAGLINE = 'أزياء راقية وعصرية';
export const WHATSAPP_NUMBER = '96176420540';
export const INSTAGRAM_URL = 'https://www.instagram.com/zeiin_shop';
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'zeinahmad763@gmail.com';
export const DELIVERY_INFO = 'توصيل لجميع أنحاء لبنان';

// Currency
export const PRIMARY_CURRENCY = 'USD';
export const SECONDARY_CURRENCY = 'LBP';
export let LBP_RATE = 89500; // approximate fallback rate

export const initializeExchangeRate = async () => {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await response.json();
    if (data?.rates?.LBP) {
      // Ensure the API isn't returning an outdated 15,000 official rate
      const liveRate = data.rates.LBP;
      LBP_RATE = liveRate < 20000 ? 89500 : liveRate;
      console.log('Live LBP Rate Enabled:', LBP_RATE);
    }
  } catch (error) {
    console.error('Using localized LBP Rate:', error);
  }
};

export const formatPrice = (amount, currency = 'USD') => {
  if (currency === 'LBP') {
    const lbp = Math.round(amount * LBP_RATE);
    return `${lbp.toLocaleString()} ل.ل`;
  }
  return `$${Number(amount).toFixed(2)}`;
};

export const generateWhatsAppUrl = (message) => {
  const encoded = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encoded}`;
};

export const generateOrderMessage = (items, customerName, customerPhone, total, discount = null, lang = 'ar') => {
  const isRTL = lang === 'ar';
  let msg = `*${isRTL ? 'طلب جديد' : 'New Order'} — Zein Shop*\n\n`;
  msg += `*${isRTL ? 'الاسم' : 'Name'}:* ${customerName}\n`;
  msg += `*${isRTL ? 'رقم الهاتف' : 'Phone'}:* ${customerPhone}\n\n`;
  msg += `*${isRTL ? 'المنتجات المطلوبة' : 'Requested Products'}:*\n`;
  msg += `─────────────────\n`;

  items.forEach((item, i) => {
    const itemName = lang === 'ar' ? (item.productName_ar || item.productName) : (item.productName_en || item.productName);
    const itemColor = lang === 'ar' ? (item.color_ar || item.color) : (item.color_en || item.color);
    
    msg += `${i + 1}. *${itemName}*\n`;
    if (itemColor) msg += `   ${isRTL ? 'اللون' : 'Color'}: ${itemColor}\n`;
    if (item.size) msg += `   ${isRTL ? 'المقاس' : 'Size'}: ${item.size}\n`;
    msg += `   ${isRTL ? 'الكمية' : 'Qty'}: ${item.quantity} × ${formatPrice(item.price)}\n`;
    msg += `   ${isRTL ? 'المجموع' : 'Total'}: ${formatPrice(item.quantity * item.price)}\n\n`;
  });

  msg += `─────────────────\n`;
  if (discount) {
    msg += `*${isRTL ? 'الخصم' : 'Discount'}:* ${discount.code} (-${discount.value}%)\n`;
  }
  msg += `*${isRTL ? 'الإجمالي الكلي' : 'Grand Total'}: ${formatPrice(total)}*\n`;
  msg += `*${isRTL ? 'الإجمالي (بالليرة)' : 'Total (LBP)'}: ${formatPrice(total, 'LBP')}*\n\n`;
  msg += `*${isRTL ? 'الدفع' : 'Payment'}:* ${isRTL ? 'الدفع عند الاستلام' : 'Cash on Delivery'}\n`;
  msg += `*${isRTL ? 'أقر بموافقتي على أن الطلب يستغرق 10-12 يوماً للتوصيل (شحن ممتاز).' : 'I acknowledge and agree that the order takes 10-12 days to deliver (Premium Shipping).'}\n`;
  msg += `\n${isRTL ? 'شكراً لتسوقكم من Zein Shop!' : 'Thank you for shopping at Zein Shop!'}`;

  return msg;
};
