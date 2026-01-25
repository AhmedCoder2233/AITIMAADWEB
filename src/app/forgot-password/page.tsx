'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const authListenerActive = useRef(true);

  /* =========================
     DETECT PASSWORD RECOVERY
  ========================= */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsResettingPassword(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!authListenerActive.current) return;

      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /* =========================
     SEND RESET EMAIL
  ========================= */
  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/forgot-password`,
      });

      if (error) throw error;

      setMessage('✅ Password reset link sent. Please check your email.');
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     RESET PASSWORD (FIXED SECTION)
  ========================= */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    setTimeout(() => {
            router.push("/")
    }, 2000);

    try {
      authListenerActive.current = false;

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // ✅ SUCCESS - Message show karein
      setMessage('✅ Password updated successfully! Redirecting to Home...');
      setLoading(false); 
      
      // ✅ 1.5 seconds ka delay taake user message padh sake, phir Home ('/') par redirect
      setTimeout(() => {
        router.replace('/'); // Login ki jagah '/' (Home) kar diya
        router.refresh();
      }, 1500);

    } catch (err: any) {
      authListenerActive.current = true;
      setError(err.message || 'Failed to update password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          {isResettingPassword ? 'Set New Password' : 'Forgot Password'}
        </h1>

        <p className="text-center text-gray-500 mb-6">
          {isResettingPassword
            ? 'Create a new secure password'
            : 'Enter your registered email'}
        </p>

        {/* ✅ SUCCESS MESSAGE */}
        {message && (
          <div className={`mb-4 p-3 rounded text-sm ${
            message.includes('✅') 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-blue-50 border border-blue-200 text-blue-700'
          }`}>
            {message}
          </div>
        )}

        {/* ❌ ERROR MESSAGE */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {!isResettingPassword && (
          <form onSubmit={handleSendResetEmail} className="space-y-4">
            <input
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />

            <button
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 hover:bg-green-700 transition"
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {isResettingPassword && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />

            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 hover:bg-green-700 transition"
            >
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link 
            href="/login" 
            className="text-green-600 hover:underline font-medium"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}