import React, { useState } from 'react';
import { ShoppingBag, Lock, User, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { storage } from '../services/storage';
import { UserEntity } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: UserEntity) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const user = storage.getUserByUsername(username);
      if (user && user.passwordHash === password) {
        storage.setCurrentUser(user);
        onLoginSuccess(user);
      } else {
        setError('بيانات الدخول غير صحيحة! يرجى التحقق من اسم المستخدم وكلمة المرور.');
      }
      setIsLoading(false);
    }, 250);
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    const user = storage.getUserByUsername(u);
    if (user && user.passwordHash === p) {
      storage.setCurrentUser(user);
      onLoginSuccess(user);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFDF9] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#dce5df] shadow-lg p-8 sm:p-10 relative overflow-hidden">
        {/* Top Decorative accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#006C50] via-[#008f6b] to-[#4C6358]" />

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-emerald-50 text-[#006C50] flex items-center justify-center mb-4 shadow-inner ring-8 ring-emerald-50/50">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">نظام إدارة المبيعات والمخازن</h2>
          <p className="text-sm text-gray-500 mt-1">تسجيل الدخول للنظام الموحد (POS & Inventory Engine)</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 text-sm animate-shake">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 text-right">اسم المستخدم</label>
            <div className="relative">
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-3 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006C50] focus:border-transparent transition-all"
                placeholder="أدخل اسم المستخدم"
              />
              <User className="w-5 h-5 text-gray-400 absolute right-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 text-right">كلمة المرور</label>
            <div className="relative">
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-3 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006C50] focus:border-transparent transition-all"
                placeholder="أدخل كلمة المرور"
              />
              <Lock className="w-5 h-5 text-gray-400 absolute right-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            disabled={isLoading}
            className="w-full mt-6 py-3.5 px-4 bg-[#006C50] hover:bg-[#00543e] text-white font-bold text-base rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <span>دخول إلى نقطة البيع</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Testing Options */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 mb-3">
            <ShieldCheck className="w-4 h-4 text-[#006C50]" />
            <span>بيانات الدخول الافتراضية للنظام:</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'admin123')}
              className="py-2 px-3 text-xs font-semibold bg-emerald-50 text-[#006C50] hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors text-center"
            >
              admin / admin123 (المدير)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('cashier1', '123456')}
              className="py-2 px-3 text-xs font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors text-center"
            >
              cashier1 / 123456 (كاشير)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
