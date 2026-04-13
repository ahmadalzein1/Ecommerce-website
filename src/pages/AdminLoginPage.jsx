import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useLanguageStore from '../stores/languageStore';
import { errorService } from '../lib/errorService';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const { login, loading, isAdmin, isInitialized } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isInitialized && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, isInitialized, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!errorService.isOnline()) {
      setError(language === 'ar' ? 'فشل الاتصال: لا يوجد إنترنت' : 'Connection failed: No internet');
      return;
    }

    try {
      await errorService.withTimeout(login(email, password), 15000);
      navigate('/admin');
    } catch (err) {
      setError(errorService.translate(err, language));
    }
  };

  const isAR = language === 'ar';

  return (
    <div className="admin-login-page" dir={isAR ? 'rtl' : 'ltr'}>
      <div className="login-container">
        <div className="login-card animate-fade-in">
          <div className="login-lang-switch">
             <button 
               className={!isAR ? 'active' : ''} 
               onClick={() => setLanguage('en')}
             >
               EN
             </button>
             <button 
               className={isAR ? 'active' : ''} 
               onClick={() => setLanguage('ar')}
             >
               عربي
             </button>
          </div>

          <div className="login-header">
            <div className="lock-icon">
              <Lock size={24} />
            </div>
            <h1>{isAR ? 'لوحة التحكم' : 'Admin Panel'}</h1>
            <p>{isAR ? 'سجل الدخول لإدارة متجر Zein Shop' : 'Sign in to manage Zein Shop'}</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label>{isAR ? 'البريد الإلكتروني' : 'Email Address'}</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>{isAR ? 'كلمة المرور' : 'Password'}</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <div className="login-error animate-shake">{error}</div>}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  {isAR ? 'جاري التحميل...' : 'Loading...'}
                </>
              ) : (
                isAR ? 'تسجيل الدخول' : 'Sign In'
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>© {new Date().getFullYear()} Zein Shop Admin</p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          padding: 20px;
          font-family: 'Tajawal', 'Inter', sans-serif;
        }
        .login-card {
          width: 100%;
          max-width: 420px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          padding: 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          position: relative;
        }
        .login-lang-switch {
          position: absolute;
          top: 24px;
          right: ${isAR ? 'auto' : '24px'};
          left: ${isAR ? '24px' : 'auto'};
          display: flex;
          background: rgba(255,255,255,0.05);
          padding: 4px;
          border-radius: 100px;
          gap: 2px;
        }
        .login-lang-switch button {
          padding: 4px 10px;
          border-radius: 100px;
          border: none;
          background: transparent;
          color: #94a3b8;
          font-size: 0.7rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
        }
        .login-lang-switch button.active {
          background: white;
          color: #0f172a;
        }
        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .lock-icon {
          width: 64px;
          height: 64px;
          background: #fbbf24;
          color: #0f172a;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          box-shadow: 0 10px 20px rgba(251, 191, 36, 0.3);
        }
        .login-header h1 {
          font-size: 1.75rem;
          font-weight: 900;
          color: white;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        .login-header p {
          color: #94a3b8;
          font-size: 0.95rem;
        }
        .login-form .input-group {
          margin-bottom: 24px;
        }
        .login-form label {
          display: block;
          color: #cbd5e1;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 10px;
        }
        .input-wrapper {
          position: relative;
        }
        .input-icon {
          position: absolute;
          ${isAR ? 'right' : 'left'}: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
        }
        .input-wrapper input {
          width: 100%;
          background: rgba(15, 23, 42, 0.4);
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 14px;
          padding-${isAR ? 'right' : 'left'}: 48px;
          color: white;
          font-size: 1rem;
          transition: all 0.2s;
        }
        .input-wrapper input:focus {
          border-color: #fbbf24;
          background: rgba(15, 23, 42, 0.6);
          outline: none;
          box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.1);
        }
        .password-toggle {
          position: absolute;
          ${isAR ? 'left' : 'right'}: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .login-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          padding: 14px;
          border-radius: 16px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 24px;
          text-align: center;
        }
        .btn-primary {
          width: 100%;
          background: #fbbf24;
          color: #0f172a;
          border: none;
          padding: 14px;
          border-radius: 16px;
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 10px 25px rgba(251, 191, 36, 0.2);
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(251, 191, 36, 0.3);
          background: #f59e0b;
        }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .login-footer {
          margin-top: 32px;
          text-align: center;
          color: #475569;
          font-size: 0.8rem;
          font-weight: 600;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
        .animate-fade-in { animation: fadeIn 0.6s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      ` }} />
    </div>
  );
}
