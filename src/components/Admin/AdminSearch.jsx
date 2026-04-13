import React from 'react';
import { Search, X } from 'lucide-react';

export default function AdminSearch({ value, onChange, placeholder, language }) {
  return (
    <div className="admin-search-wrapper">
      <div className="admin-search-bar">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || (language === 'ar' ? 'بحث...' : 'Search...')}
        />
        {value && (
          <button className="search-clear" onClick={() => onChange('')}>
            <X size={16} />
          </button>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-search-wrapper {
          flex: 1;
          max-width: 400px;
          margin-bottom: 0;
        }
        .admin-search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          padding: 10px 18px;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .admin-search-bar:focus-within {
          border-color: var(--admin-primary);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
          transform: translateY(-1px);
        }
        .search-icon {
          color: #94a3b8;
          min-width: 20px;
        }
        .admin-search-bar input {
          background: none;
          border: none;
          flex: 1;
          outline: none;
          font-size: 0.95rem;
          color: #0f172a;
          width: 100%;
          font-family: inherit;
        }
        .admin-search-bar input::placeholder {
          color: #94a3b8;
        }
        .search-clear {
          background: #f1f5f9;
          border: none;
          color: #64748b;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .search-clear:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        @media (max-width: 640px) {
          .admin-search-wrapper {
            max-width: 100%;
            margin-bottom: 8px;
          }
        }
      ` }} />
    </div>
  );
}
