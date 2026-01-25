'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { User, Building, Mail, Lock, Eye, EyeOff, UserPlus, AlertCircle, Upload, X, Camera, Edit } from 'lucide-react';
import Link from 'next/link';
import Header from '../components/Header';
import { motion } from 'framer-motion';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signUp, loading: authLoading } = useAuth();
  
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState<'customer' | 'business'>('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Profile picture for both customer and business
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>('');
  
  // Business specific fields
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessCity, setBusinessCity] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [businessWebsite, setBusinessWebsite] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  const greenColor = '#16a34a';
  const categories = [
    'Restaurant', 'Hospital', 'Bank', 'Hotel', 'School', 
    'Pharmacy', 'Shop', 'Clinic', 'Salon', 'Gym', 'Other'
  ];

  // Get user type from URL query parameter
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'business' || type === 'customer') {
      setUserType(type);
    }
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Show custom category input when "Other" is selected
  useEffect(() => {
    if (businessCategory === 'Other') {
      setShowCustomCategory(true);
    } else {
      setShowCustomCategory(false);
      setCustomCategory('');
    }
  }, [businessCategory]);

  const validateStep1 = () => {
    if (!fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (userType === 'business') {
      if (!businessName.trim()) {
        setError('Business name is required');
        return false;
      }
      if (!businessCategory) {
        setError('Please select a business category');
        return false;
      }
      if (businessCategory === 'Other' && !customCategory.trim()) {
        setError('Please specify your business category');
        return false;
      }
      if (!businessAddress.trim()) {
        setError('Business address is required');
        return false;
      }
      if (!businessCity.trim()) {
        setError('Business city is required');
        return false;
      }
      // Phone number validation for business only
      if (!businessPhone.trim()) {
        setError('Business phone number is required');
        return false;
      }
      if (!/^03\d{9}$/.test(businessPhone)) {
        setError('Please enter a valid Pakistani phone number (03XXXXXXXXX)');
        return false;
      }
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setProfilePicture(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeProfilePicture = () => {
    setProfilePicture(null);
    setProfilePreview('');
    if (profileFileInputRef.current) {
      profileFileInputRef.current.value = '';
    }
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(1);
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  if (!validateStep2()) {
    return;
  }

  setIsLoading(true);

  try {
    const finalCategory = businessCategory === 'Other' ? customCategory : businessCategory;

    const businessDetails = userType === 'business' ? {
      business_name: businessName,
      business_category: finalCategory,
      business_address: businessAddress,
      business_city: businessCity,
      business_country: 'Pakistan',
      business_description: businessDescription,
      business_website: businessWebsite,
      business_email: email,
      business_phone_number: businessPhone,
    } : undefined;

    // ✅ Pass profile picture
    const result = await signUp(
      email,
      password,
      fullName,
      userType,
      userType === 'business' ? businessPhone : undefined,
      businessDetails,
      profilePicture || undefined // ✅ Pass profile picture
    );
    
    if (result.success) {
      setError('');
      alert(result.message);
      // Redirect to login page (NOT home) - user needs to verify email
      router.push(`/login?type=${userType}&registered=true`);
    } else {
      setError(result.message);
    }
    
  } catch (err: any) {
    setError(err.message || 'Signup failed. Please try again.');
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
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <UserPlus className="h-8 w-8" style={{ color: greenColor }} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Create Your Account
              </h1>
              <p className="text-gray-600">
                Join AITIMAAD.PK to {userType === 'business' ? 'list your business' : 'explore and review businesses'}
              </p>
            </div>

            {/* User Type Selection */}
            <div className="mb-8">
              <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setUserType('customer');
                    setStep(1);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all duration-300 ${userType === 'customer' ? 'shadow-lg transform -translate-y-0.5' : ''}`}
                  style={{
                    backgroundColor: userType === 'customer' ? '#f0fdf4' : 'transparent',
                    color: userType === 'customer' ? greenColor : '#6b7280',
                  }}
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">Sign up as Customer</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setUserType('business');
                    setStep(1);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all duration-300 ${userType === 'business' ? 'shadow-lg transform -translate-y-0.5' : ''}`}
                  style={{
                    backgroundColor: userType === 'business' ? '#f0fdf4' : 'transparent',
                    color: userType === 'business' ? greenColor : '#6b7280',
                  }}
                >
                  <Building className="h-5 w-5" />
                  <span className="font-medium">Sign up as Business</span>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Step {step} of 2
                </span>
                <span className="text-sm text-gray-500">
                  {step === 1 ? 'Account Details' : `${userType === 'business' ? 'Business' : 'Profile'} Information`}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: step === 1 ? '50%' : '100%',
                    backgroundColor: greenColor 
                  }}
                ></div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {step === 1 ? (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      Account Information
                    </h2>

                    {/* Profile Picture (for both customer and business) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {userType === 'business' ? 'Business Logo/Profile Picture (Optional)' : 'Profile Picture (Optional)'}
                      </label>
                      <div className="flex items-center gap-4">
                        {profilePreview ? (
                          <div className="relative">
                            <img
                              src={profilePreview}
                              alt="Profile preview"
                              className={`${userType === 'business' ? 'h-24 w-24 rounded-lg' : 'h-24 w-24 rounded-full'} object-cover border-2 border-green-500`}
                            />
                            <button
                              type="button"
                              onClick={removeProfilePicture}
                              className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            className={`${userType === 'business' ? 'h-24 w-24 rounded-lg' : 'h-24 w-24 rounded-full'} border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50`}
                            onClick={() => profileFileInputRef.current?.click()}
                          >
                            {userType === 'business' ? (
                              <Building className="h-8 w-8 text-gray-400 mb-1" />
                            ) : (
                              <Camera className="h-8 w-8 text-gray-400 mb-1" />
                            )}
                            <span className="text-xs text-gray-500">
                              {userType === 'business' ? 'Add Logo' : 'Add Photo'}
                            </span>
                          </div>
                        )}
                        
                        <div>
                          <input
                            ref={profileFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <p className="text-sm text-gray-600 mb-1">Recommended: 400x400px</p>
                          <p className="text-xs text-gray-500">JPG, PNG, GIF, WebP (Max 5MB)</p>
                          {!profilePreview && (
                            <button
                              type="button"
                              onClick={() => profileFileInputRef.current?.click()}
                              className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium"
                            >
                              Choose file
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {userType === 'business' ? 'Owner Full Name *' : 'Full Name *'}
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          placeholder={userType === 'business' ? "Enter owner's full name" : "Enter your full name"}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                          style={{ borderColor: fullName ? greenColor : '' }}
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
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
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          placeholder="At least 6 characters"
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
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          placeholder="Confirm your password"
                          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                          style={{ borderColor: confirmPassword ? greenColor : '' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Next Button */}
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg"
                      style={{ backgroundColor: greenColor }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = greenColor}
                    >
                      Continue to {userType === 'business' ? 'Business Details' : 'Profile'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {userType === 'business' ? 'Business Information' : 'Profile Details'}
                    </h2>

                    {userType === 'business' ? (
                      <>
                        {/* Business Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Name *
                          </label>
                          <input
                            type="text"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            required
                            placeholder="Enter your business name"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                            style={{ borderColor: businessName ? greenColor : '' }}
                          />
                        </div>

                        {/* Business Category */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Category *
                          </label>
                          <select
                            value={businessCategory}
                            onChange={(e) => setBusinessCategory(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all appearance-none"
                            style={{ borderColor: businessCategory ? greenColor : '' }}
                          >
                            <option value="">Select a category</option>
                            {categories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>

                          {/* Custom Category Input (shown when "Other" is selected) */}
                          {showCustomCategory && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center gap-2 mb-3">
                                <Edit className="h-4 w-4 text-gray-600" />
                                <label className="block text-sm font-medium text-gray-700">
                                  Specify Your Business Category
                                </label>
                              </div>
                              <input
                                type="text"
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                required={businessCategory === 'Other'}
                                placeholder="e.g., Software Company, Construction, Consulting, etc."
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                style={{ borderColor: customCategory ? greenColor : '' }}
                              />
                              <p className="text-xs text-gray-500 mt-2">
                                Please enter the specific category for your business
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Business Phone Number */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Phone Number *
                          </label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                              <span className="text-gray-500">+92</span>
                              <div className="h-4 w-px bg-gray-300"></div>
                            </div>
                            <input
                              type="tel"
                              value={businessPhone}
                              onChange={(e) => setBusinessPhone(e.target.value)}
                              required
                              placeholder="3XX XXXXXXX"
                              className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                              style={{ borderColor: businessPhone ? greenColor : '' }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Format: 03XXXXXXXXX</p>
                        </div>

                        {/* Business Address */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Address *
                          </label>
                          <input
                            type="text"
                            value={businessAddress}
                            onChange={(e) => setBusinessAddress(e.target.value)}
                            required
                            placeholder="Full street address"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                            style={{ borderColor: businessAddress ? greenColor : '' }}
                          />
                        </div>

                        {/* Business City */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City *
                          </label>
                          <input
                            type="text"
                            value={businessCity}
                            onChange={(e) => setBusinessCity(e.target.value)}
                            required
                            placeholder="City"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                            style={{ borderColor: businessCity ? greenColor : '' }}
                          />
                        </div>

                        {/* Business Website */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Website (Optional)
                          </label>
                          <input
                            type="url"
                            value={businessWebsite}
                            onChange={(e) => setBusinessWebsite(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                            style={{ borderColor: businessWebsite ? greenColor : '' }}
                          />
                        </div>

                        {/* Business Description */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Description *
                          </label>
                          <textarea
                            value={businessDescription}
                            onChange={(e) => setBusinessDescription(e.target.value)}
                            placeholder="Briefly describe your business"
                            rows={4}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                            style={{ borderColor: businessDescription ? greenColor : '' }}
                          />
                        </div>
                      </>
                    ) : (
                      /* Customer Profile Fields */
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-4">
                          <User className="h-10 w-10" style={{ color: greenColor }} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Customer Profile
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Your customer profile is ready!
                        </p>
                      </div>
                    )}

                    {/* Form Actions */}
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="flex-1 py-3 px-4 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading || authLoading}
                        className="flex-1 py-3 px-4 rounded-lg font-medium text-white transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        style={{ backgroundColor: greenColor }}
                        onMouseEnter={(e) => !isLoading && !authLoading && (e.currentTarget.style.backgroundColor = '#15803d')}
                        onMouseLeave={(e) => !isLoading && !authLoading && (e.currentTarget.style.backgroundColor = greenColor)}
                      >
                        {isLoading || authLoading ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>
                              Creating Account...
                            </span>
                          </div>
                        ) : (
                          `Complete ${userType === 'business' ? 'Business' : 'Customer'} Signup`
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>

              {/* Login Link */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <Link
                    href={`/login?type=${userType}`}
                    className="font-medium text-green-600 hover:text-green-700"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
