'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { User, Building, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import HCaptcha from '@hcaptcha/react-hcaptcha';

export default function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, signIn, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'customer' | 'business'>('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // ✅ ADDED: Captcha state for login
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);

  const greenColor = '#16a34a';

  // Get user type from URL query parameter
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'business' || type === 'customer') {
      setUserType(type);
    }
    
    // Check for registration success message
    const registered = searchParams.get('registered');
    if (registered === 'true') {
      setSuccessMessage('Registration successful! Please check your email to verify your account before logging in.');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    }
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    // ✅ ADDED: Check captcha for login
    if (!captchaToken) {
      setError('Please complete the security verification');
      return;
    }
    
    setIsLoading(true);

    try {
      // Call signIn function with captcha token
      await signIn(email, password, userType, captchaToken);
      
      // If signIn doesn't throw an error, login was successful
      setSuccessMessage('Login successful! Redirecting...');
      
      // Auto-redirect after 1.5 seconds
      setTimeout(() => {
        router.push('/');
      }, 1500);
      
    } catch (err: any) {
      // Handle different types of error messages
      const errorMessage = err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      
      // Reset captcha on error
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
      }
      setCaptchaToken(null);
      
      // Auto-switch user type based on error message
      if (errorMessage.includes('registered as a Business account')) {
        setUserType('business');
      } else if (errorMessage.includes('registered as a Customer account')) {
        setUserType('customer');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // If already logged in, show redirecting message
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to homepage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Success Message Modal */}
            {successMessage && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-auto"
                >
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
                      <CheckCircle className="h-10 w-10" style={{ color: greenColor }} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {successMessage.includes('Registration') ? 'Registration Successful!' : 'Login Successful!'}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {successMessage}
                    </p>
                    {successMessage.includes('Redirecting') && (
                      <p className="text-sm text-gray-500 mb-6">
                        Redirecting in a moment...
                      </p>
                    )}
                    <button
                      onClick={() => {
                        setSuccessMessage('');
                        if (successMessage.includes('Registration')) {
                          // For registration success, stay on page
                        } else {
                          // For login success, redirect to home
                          router.push('/');
                        }
                      }}
                      className="w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-300"
                      style={{ backgroundColor: greenColor }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = greenColor}
                    >
                      {successMessage.includes('Registration') ? 'Continue to Login' : 'Go to Homepage'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600">
                Sign in to access your account
              </p>
            </div>

            {/* User Type Selection */}
            <div className="mb-8">
              <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setUserType('customer')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all duration-300 ${userType === 'customer' ? 'shadow-lg transform -translate-y-0.5' : ''}`}
                  style={{
                    backgroundColor: userType === 'customer' ? '#f0fdf4' : 'transparent',
                    color: userType === 'customer' ? greenColor : '#6b7280',
                  }}
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">Customer Login</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setUserType('business')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all duration-300 ${userType === 'business' ? 'shadow-lg transform -translate-y-0.5' : ''}`}
                  style={{
                    backgroundColor: userType === 'business' ? '#f0fdf4' : 'transparent',
                    color: userType === 'business' ? greenColor : '#6b7280',
                  }}
                >
                  <Building className="h-5 w-5" />
                  <span className="font-medium">Business Login</span>
                </button>
              </div>
              
              <p className="text-sm text-gray-500 mt-3 text-center">
                {userType === 'business' 
                  ? 'Login to manage your business profile and reviews'
                  : 'Login to explore businesses and submit reviews'}
              </p>
            </div>

            {/* Login Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-red-700 text-sm font-medium mb-1">Login Failed</p>
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Registration Success Message (inline) */}
              {successMessage.includes('Registration') && !successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-green-700 text-sm font-medium mb-1">Registration Successful</p>
                      <p className="text-green-600 text-sm">Please check your email to verify your account before logging in.</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      style={{ borderColor: email ? greenColor : '' }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      style={{ borderColor: password ? greenColor : '' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <div className="flex justify-end mt-2">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                {/* ✅ ADDED: Captcha for Login */}
                <div className="pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Security Verification *
                  </label>
                  <div className="flex justify-center">
                    <HCaptcha
                      ref={captchaRef}
                      sitekey="fe8c16d4-b1e0-4a7e-ac5a-1b6280c4a39e" 
                      onVerify={(token) => {
                        setCaptchaToken(token);
                        setError(''); // Clear any previous errors
                      }}
                      onExpire={() => {
                        setCaptchaToken(null);
                        setError('Captcha verification expired. Please verify again.');
                      }}
                      onError={() => {
                        setCaptchaToken(null);
                        setError('Captcha verification failed. Please try again.');
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Please verify that you're not a robot to continue
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || authLoading || !captchaToken}
                  className="w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{ backgroundColor: greenColor }}
                  onMouseEnter={(e) => !isLoading && !authLoading && captchaToken && (e.currentTarget.style.backgroundColor = '#15803d')}
                  onMouseLeave={(e) => !isLoading && !authLoading && captchaToken && (e.currentTarget.style.backgroundColor = greenColor)}
                >
                  {isLoading || authLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    `Sign in as ${userType === 'business' ? 'Business' : 'Customer'}`
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Sign up Link */}
              <div className="text-center">
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    href={`/signup?type=${userType}`}
                    className="font-medium text-green-600 hover:text-green-700"
                  >
                    Sign up as {userType === 'business' ? 'Business' : 'Customer'}
                  </Link>
                </p>
              </div>

              {/* Info Box */}
              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Building className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800 mb-1">
                      Business Owners
                    </p>
                    <p className="text-xs text-blue-600">
                      Login to manage your business profile, respond to reviews, and access analytics.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}