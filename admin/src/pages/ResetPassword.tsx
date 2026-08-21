import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import logo from '../assets/logo.png';
import { getApiUrl } from '../lib/api';

export const ResetPassword: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = queryParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError('Password reset link is missing or invalid. Please request a new link.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Invalid or missing password reset token.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please check and try again.');
      return;
    }

    setIsLoading(true);

    try {
      const apiURL = getApiUrl();
      await axios.post(
        `${apiURL}/admin/auth/reset-password`,
        { token, newPassword },
        { timeout: 20000 }
      );

      setIsSuccess(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to reset password. The link may have expired.';
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
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center p-2 mb-6 border-4 border-[#243260] shadow-xl overflow-hidden">
          <img src={logo} alt="SEC Logo" className="w-16 h-16 object-contain" />
        </div>

        {/* Header Text */}
        <div className="text-center space-y-1.5 mb-8">
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Set New Password</h2>
          <p className="text-xs font-bold text-[#F9D0D7] tracking-widest uppercase">SEC Admin Portal</p>
          <div className="w-12 h-0.5 bg-[#C41230] mx-auto mt-3" />
        </div>

        {isSuccess ? (
          <div className="w-full text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 size={36} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Password Reset Successful!</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your administrator password has been updated in the database. You can now log in using your new credentials.
              </p>
            </div>
            <a
              href="/login"
              className="inline-flex items-center justify-center space-x-2 w-full py-3.5 bg-[#C41230] hover:bg-[#9E0E27] text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-[#C41230]/30"
            >
              <span>Return to Sign In</span>
              <ArrowRight size={16} />
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-5">
            {/* New Password input field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                New Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading || !token}
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

            {/* Confirm Password input field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Confirm New Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading || !token}
                  required
                  className="w-full py-3.5 pl-12 pr-12 bg-[#111B30] border border-[#243260] text-white rounded-xl placeholder-slate-400 focus:outline-none focus:border-[#C41230] focus:ring-2 focus:ring-[#C41230]/20 transition-all duration-200 text-sm"
                />
              </div>
            </div>

            {/* Error Feedback Display */}
            {error && (
              <div className="w-full bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold px-4 py-3 rounded-xl flex items-start space-x-2 leading-relaxed">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !token}
              className="w-full mt-4 flex items-center justify-center space-x-2 px-6 py-3.5 bg-[#C41230] hover:bg-[#9E0E27] text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-[#C41230]/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Footer Branding */}
      <div className="mt-8 text-center text-xs text-slate-400 font-bold uppercase tracking-widest relative z-10">
        Prestige • Community • Legacy
      </div>
    </div>
  );
};

export default ResetPassword;
