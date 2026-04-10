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
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
};

export const generateOrderMessage = (items, customerName, customerPhone, total, discount = null) => {
  // Using fromCodePoint to be 100% safe across all OS and build systems
  const emoji = {
    shop: String.fromCodePoint(0x1F6CD, 0xFE0F),      // 🛍️
    user: String.fromCodePoint(0x1F464),              // 👤
    phone: String.fromCodePoint(0x1F4DE),             // 📞
    box: String.fromCodePoint(0x1F4E6),               // 📦
    tag: String.fromCodePoint(0x1F3F7, 0xFE0F),      // 🏷️
    money: String.fromCodePoint(0x1F4B0),             // 💰
    pin: String.fromCodePoint(0x1F4CC),               // 📍
    warning: String.fromCodePoint(0x26A0, 0xFE0F),    // ⚠️
    lebanon: String.fromCodePoint(0x1F1F1, 0x1F1E7),  // 🇱🇧
    turkey: String.fromCodePoint(0x1F1F9, 0x1F1F7),   // 🇹🇷
    diamond: String.fromCodePoint(0x1F48E)            // 💎
  };

  let msg = `${emoji.shop} *طلب جديد — Zein Shop*\n\n`;
  msg += `${emoji.user} *الاسم:* ${customerName}\n`;
  msg += `${emoji.phone} *رقم الهاتف:* ${customerPhone}\n\n`;
  msg += `${emoji.box} *المنتجات المطلوبة:*\n`;
  msg += `─────────────────\n`;

  items.forEach((item, i) => {
    msg += `${i + 1}. *${item.productName}*\n`;
    if (item.color) msg += `   اللون: ${item.color}\n`;
    if (item.size) msg += `   المقاس: ${item.size}\n`;
    msg += `   الكمية: ${item.quantity} × ${formatPrice(item.price)}\n`;
    msg += `   المجموع: ${formatPrice(item.quantity * item.price)}\n\n`;
  });

  msg += `─────────────────\n`;
  if (discount) {
    msg += `${emoji.tag} *الخصم:* ${discount.code} (-${discount.value}%)\n`;
  }
  msg += `${emoji.money} *الإجمالي الكلي: ${formatPrice(total)}*\n`;
  msg += `${emoji.money} *الإجمالي (بالليرة): ${formatPrice(total, 'LBP')}*\n\n`;
  msg += `${emoji.pin} *الدفع:* الدفع عند الاستلام\n`;
  msg += `${emoji.warning} *أقر بموافقتي على أن الطلب يستغرق 10-12 يوماً للتوصيل (شحن ممتاز ${emoji.lebanon} 👈 ${emoji.turkey}).*\n`;
  msg += `\nشكراً لتسوقكم من Zein Shop! ${emoji.diamond}`;

  return msg;
};
