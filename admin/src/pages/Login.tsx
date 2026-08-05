import React, { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import logo from '../assets/logo.png';

interface AdminUser {
  id: number;
  firebase_uid?: string;
  email: string;
  full_name?: string;
  profile_image?: string;
  role: string;
  status: string;
  is_profile_completed: boolean;
}

interface LoginProps {
  onLoginSuccess: (token: string, user: AdminUser) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!email || !password) {
      setError('Please fill in all fields.');
      setIsLoading(false);
      return;
    }

    try {
      const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      // Call our credentials login endpoint
      const response = await axios.post(`${apiURL}/admin/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data;

      // Save credentials and trigger success callback
      localStorage.setItem('admin_jwt', token);
      localStorage.setItem('admin_user', JSON.stringify(user));
      onLoginSuccess(token, user);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Email authentication failure:', err);
      const errMsg = err.response?.data?.message || err.message || 'Invalid email or password';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111B30] flex flex-col items-center justify-center px-4 font-sans antialiased text-white selection:bg-[#C41230]/30 selection:text-white relative overflow-hidden">
      {/* Decorative background glow elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#C41230]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[350px] h-[350px] bg-[#243260]/30 rounded-full blur-[100px] pointer-events-none" />

      {/* Main glass card */}
      <div className="bg-[#1A2744] border border-[#243260] rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 flex flex-col items-center">
        {/* Established Tag */}
        <div className="inline-flex items-center space-x-2 bg-[#111B30] border border-[#243260] px-4 py-1.5 rounded-full mb-6">
          <span className="w-2 h-2 rounded-full bg-[#C41230] animate-pulse" />
          <span className="text-[10px] font-extrabold text-slate-300 tracking-wider">ESTD. 1994</span>
        </div>

        {/* Circular Logo Frame */}
        <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center p-2 mb-6 border-4 border-[#243260] shadow-xl overflow-hidden group transition-all duration-300 hover:border-[#C41230] hover:scale-105">
          <img 
            src={logo} 
            alt="SEC Logo" 
            className="w-20 h-20 object-contain transition-transform duration-500 group-hover:rotate-6"
          />
        </div>

        {/* Header Text */}
        <div className="text-center space-y-1.5 mb-8">
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">SEC Cricket Club</h2>
          <p className="text-xs font-bold text-[#F9D0D7] tracking-widest uppercase">Admin Portal</p>
          <div className="w-12 h-0.5 bg-[#C41230] mx-auto mt-3" />
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {/* Email input field */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-4 text-slate-400" size={18} />
              <input
                type="email"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className="w-full py-3.5 pl-12 pr-4 bg-[#111B30] border border-[#243260] text-white rounded-xl placeholder-slate-400 focus:outline-none focus:border-[#C41230] focus:ring-2 focus:ring-[#C41230]/20 transition-all duration-200 text-sm"
              />
            </div>
          </div>

          {/* Password input field */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 text-slate-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                className="w-full py-3.5 pl-12 pr-12 bg-[#111B30] border border-[#243260] text-white rounded-xl placeholder-slate-400 focus:outline-none focus:border-[#C41230] focus:ring-2 focus:ring-[#C41230]/20 transition-all duration-200 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-4 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 flex items-center justify-center space-x-2 px-6 py-3.5 bg-[#C41230] hover:bg-[#9E0E27] text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-[#C41230]/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Error Feedback Display */}
        {error && (
          <div className="w-full mt-6 bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold px-4 py-3 rounded-xl text-center leading-relaxed animate-shake">
            {error}
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="mt-8 text-center text-xs text-slate-400 font-bold uppercase tracking-widest relative z-10">
        Prestige • Community • Legacy
      </div>
    </div>
  );
};

export default Login;
