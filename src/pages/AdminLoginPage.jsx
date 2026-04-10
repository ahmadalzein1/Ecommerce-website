import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import useAuthStore from '../stores/authStore';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'فشل تسجيل الدخول. يرجى التأكد من البيانات.');
    }
  };

  return (
    <div className="admin-login-page">
      <div className="login-container">
        <div className="login-card animate-fade-in">
          <div className="login-header">
            <div className="lock-icon">
              <Lock size={24} />
            </div>
            <h1>لوحة التحكم</h1>
            <p>سجل الدخول لإدارة متجر Zein Shop</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label>البريد الإلكتروني</label>
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
              <label>كلمة المرور</label>
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
                  جاري التحميل...
                </>
              ) : (
                'تسجيل الدخول'
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
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .lock-icon {
          width: 56px;
          height: 56px;
          background: var(--color-gold);
          color: white;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .login-header h1 {
          font-size: 24px;
          color: white;
          margin-bottom: 8px;
        }
        .login-header p {
          color: #94a3b8;
          font-size: 14px;
        }
        .login-form .input-group {
          margin-bottom: 20px;
        }
        .login-form label {
          display: block;
          color: #e2e8f0;
          font-size: 14px;
          margin-bottom: 8px;
        }
        .input-wrapper {
          position: relative;
        }
        .input-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
        }
        .input-wrapper input {
          width: 100%;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 12px 40px 12px 12px;
          color: white;
          font-size: 15px;
          transition: all 0.2s;
        }
        .input-wrapper input:focus {
          border-color: var(--color-gold);
          outline: none;
          box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.1);
        }
        .password-toggle {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          background: none;
          border: none;
          cursor: pointer;
        }
        .login-error {
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.2);
          color: #f87171;
          padding: 12px;
          border-radius: 12px;
          font-size: 13px;
          margin-bottom: 20px;
          text-align: center;
        }
        .login-footer {
          margin-top: 32px;
          text-align: center;
          color: #64748b;
          font-size: 12px;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      ` }} />
    </div>
  );
}
