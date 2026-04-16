/**
 * Error Service - Centralized High-Fidelity Error & Network Resilience
 * Supports AR/EN translations for Supabase and Network errors.
 */

export const errorService = {
  /**
   * Wraps a promise with a timeout
   */
  withTimeout(promise, ms = 15000) {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), ms)
    );
    return Promise.race([promise, timeout]);
  },

  /**
   * Checks if the device is currently online
   */
  isOnline() {
    return window.navigator.onLine;
  },

  /**
   * Translates errors into human-readable strings based on language
   */
  translate(error, language = 'en') {
    console.error('Core Error Log:', error);

    const isAR = language === 'ar';

    // 1. Connectivity Checks
    if (!this.isOnline()) {
      return isAR ? 'فشل الاتصال: لا يوجد إنترنت' : 'Connection failed: No internet';
    }

    // 2. Specific Error Identifiers
    const msg = error.message || '';
    const code = error.code || '';

    if (msg === 'TIMEOUT') {
      return isAR ? 'الاتصال بطيء جداً، يرجى المحاولة مرة أخرى' : 'Connection too slow, please try again';
    }

    // 3. Supabase / Postgres Error Codes
    if (code === '23505') {
       return isAR ? 'هذا الاسم أو الكود موجود بالفعل!' : 'This name or code already exists!';
    }
    
    if (code === '23503') {
      return isAR 
        ? 'لا يمكن حذف هذا العنصر لأنه مرتبط بمنتجات أو بيانات أخرى. يرجى حذف الارتباطات أولاً.' 
        : 'Cannot delete this item as it is linked to other products or data. Please remove links first.';
    }

    if (code === '23502') {
      return isAR ? 'بعض البيانات المطلوبة مفقودة. يرجى المحاولة مرة أخرى' : 'Required data is missing. Please check and try again';
    }
    
    if (code === '42501') {
      return isAR ? 'ليس لديك صلاحيات كافية للقيام بهذا الإجراء' : 'You do not have sufficient permissions for this action';
    }

    if (msg.toLowerCase().includes('storage') || msg.toLowerCase().includes('bucket')) {
      return isAR ? 'فشل في الوصول إلى التخزين. تأكد من وجود الـ Bucket وحاول مجدداً' : 'Storage access failed. Please ensure the bucket exists and try again';
    }

    if (msg.toLowerCase().includes('fetch')) {
      return isAR ? 'حدث خطأ في جلب البيانات. قد يكون السيرفر مشغولاً' : 'Failed to fetch data. The server might be busy';
    }

    if (msg.toLowerCase().includes('policy') || code === '42501') {
      return isAR ? 'ليس لديك صلاحيات كافية للقيام بهذا الإجراء (RLS)' : 'Insufficient permissions (RLS policy). Please check database rules';
    }

    // 4. Custom Logic Errors (e.g. from cartStore or Auth)
    if (msg.includes('Invalid login credentials')) {
      return isAR ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password';
    }
    
    if (msg.toLowerCase().includes('insufficient stock')) {
      return isAR ? 'عذراً، الكمية المتوفرة في المخزون غير كافية' : 'Sorry, there is not enough stock available';
    }
    
    // 5. Fallback with more detail if possible
    const fallbackMsg = isAR 
      ? 'حدث خطأ غير متوقع. يرجى المحاولة لاحقاً' 
      : 'An unexpected error occurred. Please try again later';
    
    return msg ? `${fallbackMsg} (${msg})` : fallbackMsg;
  }
};
