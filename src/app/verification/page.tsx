'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Upload, CheckCircle, AlertCircle, FileText, CreditCard, Car, Clock, XCircle, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function VerificationPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [documentType, setDocumentType] = useState('');
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState('');
  const [backPreview, setBackPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [existingVerification, setExistingVerification] = useState<any>(null);

  const greenColor = '#16a34a';

  const documentTypes = [
    { value: 'nic', label: 'National Identity Card', icon: CreditCard },
    { value: 'passport', label: 'Passport', icon: FileText },
    { value: 'driving_license', label: 'Driving License', icon: Car }
  ];

  // Check if user already has a pending or approved verification
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!user) return;
      
      setCheckingStatus(true);
      try {
        const { data, error } = await supabase
          .from('verifications')
          .select('*')
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          setExistingVerification(data);
        }
      } catch (err) {
        console.error('Error checking verification:', err);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkVerificationStatus();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (side === 'front') {
          setFrontImage(file);
          setFrontPreview(reader.result as string);
        } else {
          setBackImage(file);
          setBackPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const uploadImage = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('verification-documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('verification-documents')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!documentType) {
      setError('Please select a document type');
      return;
    }

    if (!frontImage || !backImage) {
      setError('Please upload both front and back images');
      return;
    }

    if (!user) {
      setError('Please login to submit verification');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Upload images
      const frontUrl = await uploadImage(frontImage, `${user.id}/front`);
      const backUrl = await uploadImage(backImage, `${user.id}/back`);

      // Insert verification request
      const { error: insertError } = await supabase
        .from('verifications')
        .insert({
          user_id: user.id,
          document_type: documentType,
          front_image_url: frontUrl,
          back_image_url: backUrl,
          status: 'pending',
          submitted_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to submit verification request');
    } finally {
      setLoading(false);
    }
  };

// Redirect if not business user
  if (profile && profile.user_type !== 'customer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-red-100"
          >
            <div className="bg-red-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              This page is only accessible to normal customer accounts.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-300 shadow-md hover:shadow-lg"
              style={{ backgroundColor: greenColor }}
            >
              Go to Home
            </button>
          </motion.div>
        </div>
      </div>
    );
  }


  // Loading state
  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking verification status...</p>
        </div>
      </div>
    );
  }

  // Already verified
  if (profile?.is_verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 text-center border border-green-100"
          >
            <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="h-12 w-12" style={{ color: greenColor }} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Already Verified!</h2>
            <p className="text-gray-600 mb-6">
              Your account is verified and you have full access to all features.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-300 shadow-md hover:shadow-lg"
              style={{ backgroundColor: greenColor }}
            >
              Go to Home
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Pending verification
  if (existingVerification?.status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 text-center border border-amber-100"
          >
            <div className="bg-amber-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Clock className="h-12 w-12 text-amber-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Verification Pending</h2>
            <p className="text-gray-600 mb-6">
              Your verification request is currently under review. Our team will process it within <strong>24-48 hours</strong>.
            </p>
            <div className="bg-amber-50 rounded-xl p-4 mb-6 border border-amber-200">
              <div className="flex items-start gap-3 text-left">
                <Shield className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-900 mb-1">Submitted Details</p>
                  <p className="text-xs text-amber-700">
                    Document: <span className="font-semibold capitalize">{existingVerification.document_type.replace('_', ' ')}</span>
                  </p>
                  <p className="text-xs text-amber-700">
                    Submitted: <span className="font-semibold">{new Date(existingVerification.submitted_at).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 rounded-lg font-medium text-white transition-all duration-300 shadow-md hover:shadow-lg"
              style={{ backgroundColor: greenColor }}
            >
              Go to Home
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Rejected verification - allow resubmission
  if (existingVerification?.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl p-8 md:p-10"
          >
            <div className="text-center mb-8">
              <div className="bg-red-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Previous Verification Rejected</h2>
              <p className="text-gray-600 mb-4">
                Your previous verification was not approved. Please submit again with valid documents.
              </p>
              {existingVerification.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 inline-block">
                  <p className="text-sm text-red-800">
                    <strong>Reason:</strong> {existingVerification.rejection_reason}
                  </p>
                </div>
              )}
            </div>
            <div className="border-t pt-8">
              <p className="text-center text-gray-700 font-medium mb-6">Submit New Verification Request</p>
              {/* Show form here - you can reuse the form component */}
               {/* Form Section */}
          <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-8">
            {/* Document Type Selection */}
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-4">
                Select Document Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {documentTypes.map((doc) => {
                  const Icon = doc.icon;
                  return (
                    <button
                      key={doc.value}
                      type="button"
                      onClick={() => setDocumentType(doc.value)}
                      className={`group p-5 rounded-2xl border-2 transition-all duration-300 ${
                        documentType === doc.value
                          ? 'border-green-500 bg-green-50 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-green-300 hover:shadow-md'
                      }`}
                    >
                      <Icon
                        className="h-10 w-10 mx-auto mb-3 transition-transform group-hover:scale-110"
                        style={{ color: documentType === doc.value ? greenColor : '#9ca3af' }}
                      />
                      <p className={`text-sm font-semibold text-center ${
                        documentType === doc.value ? 'text-green-700' : 'text-gray-700'
                      }`}>
                        {doc.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Image Uploads Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Front Image Upload */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-4">
                  Front Side <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'front')}
                    className="hidden"
                    id="front-upload"
                  />
                  <label
                    htmlFor="front-upload"
                    className="group flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:bg-gray-50 hover:border-green-400 transition-all duration-300"
                  >
                    {frontPreview ? (
                      <div className="relative w-full h-full">
                        <img src={frontPreview} alt="Front" className="h-full w-full object-contain rounded-2xl p-2" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                          <p className="text-white font-medium">Click to change</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-14 w-14 text-gray-400 mb-3 group-hover:text-green-500 transition-colors" />
                        <p className="text-sm font-medium text-gray-600 group-hover:text-green-600">Click to upload front side</p>
                        <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 5MB</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Back Image Upload */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-4">
                  Back Side <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'back')}
                    className="hidden"
                    id="back-upload"
                  />
                  <label
                    htmlFor="back-upload"
                    className="group flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:bg-gray-50 hover:border-green-400 transition-all duration-300"
                  >
                    {backPreview ? (
                      <div className="relative w-full h-full">
                        <img src={backPreview} alt="Back" className="h-full w-full object-contain rounded-2xl p-2" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                          <p className="text-white font-medium">Click to change</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-14 w-14 text-gray-400 mb-3 group-hover:text-green-500 transition-colors" />
                        <p className="text-sm font-medium text-gray-600 group-hover:text-green-600">Click to upload back side</p>
                        <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 5MB</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg"
              >
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
              style={{ backgroundColor: greenColor }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  Submit Verification Request
                </>
              )}
            </button>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-2">Important Information</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Review time: 24-48 hours</li>
                    <li>• Ensure all information is clearly visible</li>
                    <li>• Images should not be blurry or cropped</li>
                    <li>• You'll receive email notification once processed</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 text-center border border-green-100"
          >
            <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="h-12 w-12" style={{ color: greenColor }} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Verification Submitted!</h2>
            <p className="text-gray-600 mb-4">
              Your verification request has been submitted successfully. We'll review it within <strong>24-48 hours</strong>.
            </p>
            <div className="bg-green-50 rounded-xl p-4 mb-6 border border-green-200">
              <p className="text-sm text-green-800">
                You'll be notified via email once your verification is processed.
              </p>
            </div>
            <p className="text-sm text-gray-500 animate-pulse">Redirecting to home page...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Main verification form
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-8 md:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header Section */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 md:px-10 py-8 md:py-12 text-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Shield className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Account Verification</h1>
            <p className="text-green-50 text-sm md:text-base max-w-2xl mx-auto">
              Verify your identity to unlock all features and build trust with businesses
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-8">
            {/* Document Type Selection */}
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-4">
                Select Document Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {documentTypes.map((doc) => {
                  const Icon = doc.icon;
                  return (
                    <button
                      key={doc.value}
                      type="button"
                      onClick={() => setDocumentType(doc.value)}
                      className={`group p-5 rounded-2xl border-2 transition-all duration-300 ${
                        documentType === doc.value
                          ? 'border-green-500 bg-green-50 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-green-300 hover:shadow-md'
                      }`}
                    >
                      <Icon
                        className="h-10 w-10 mx-auto mb-3 transition-transform group-hover:scale-110"
                        style={{ color: documentType === doc.value ? greenColor : '#9ca3af' }}
                      />
                      <p className={`text-sm font-semibold text-center ${
                        documentType === doc.value ? 'text-green-700' : 'text-gray-700'
                      }`}>
                        {doc.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Image Uploads Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Front Image Upload */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-4">
                  Front Side <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'front')}
                    className="hidden"
                    id="front-upload"
                  />
                  <label
                    htmlFor="front-upload"
                    className="group flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:bg-gray-50 hover:border-green-400 transition-all duration-300"
                  >
                    {frontPreview ? (
                      <div className="relative w-full h-full">
                        <img src={frontPreview} alt="Front" className="h-full w-full object-contain rounded-2xl p-2" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                          <p className="text-white font-medium">Click to change</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-14 w-14 text-gray-400 mb-3 group-hover:text-green-500 transition-colors" />
                        <p className="text-sm font-medium text-gray-600 group-hover:text-green-600">Click to upload front side</p>
                        <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 5MB</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Back Image Upload */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-4">
                  Back Side <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'back')}
                    className="hidden"
                    id="back-upload"
                  />
                  <label
                    htmlFor="back-upload"
                    className="group flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:bg-gray-50 hover:border-green-400 transition-all duration-300"
                  >
                    {backPreview ? (
                      <div className="relative w-full h-full">
                        <img src={backPreview} alt="Back" className="h-full w-full object-contain rounded-2xl p-2" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                          <p className="text-white font-medium">Click to change</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-14 w-14 text-gray-400 mb-3 group-hover:text-green-500 transition-colors" />
                        <p className="text-sm font-medium text-gray-600 group-hover:text-green-600">Click to upload back side</p>
                        <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 5MB</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg"
              >
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
              style={{ backgroundColor: greenColor }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  Submit Verification Request
                </>
              )}
            </button>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-2">Important Information</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Review time: 24-48 hours</li>
                    <li>• Ensure all information is clearly visible</li>
                    <li>• Images should not be blurry or cropped</li>
                    <li>• You'll receive email notification once processed</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}