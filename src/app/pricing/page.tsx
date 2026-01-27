'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Building, CheckCircle2, AlertCircle, Send, Shield, Clock, XCircle, Mail, Phone, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PricingPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const [formData, setFormData] = useState({
    preferred_contact: '',
    best_time_to_call: '',
    additional_info: ''
  });

  const greenColor = '#16a34a';

  // Check for existing verification request
  useEffect(() => {
    const checkRequestStatus = async () => {
      if (!user) return;
      
      setCheckingStatus(true);
      try {
        const { data, error } = await supabase
          .from('verification_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          setExistingRequest(data);
        }
      } catch (err) {
        console.error('Error checking request:', err);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkRequestStatus();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.preferred_contact) {
      setError('Please select your preferred contact method');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user?.id,
          business_name: profile?.business_name || profile?.full_name,
          business_email: profile?.business_email || profile?.email,
          business_phone: profile?.business_phone_number || profile?.phone_number,
          business_category: profile?.business_category,
          business_address: profile?.business_address,
          business_city: profile?.business_city,
          business_description: profile?.business_description,
          business_website: profile?.business_website,
          preferred_contact: formData.preferred_contact,
          best_time_to_call: formData.best_time_to_call,
          additional_info: formData.additional_info,
          status: 'pending',
          submitted_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 4000);

    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

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

  // Redirect if not business user
  if (profile && profile.user_type !== 'business') {
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
              This page is only accessible to business accounts.
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

  // Already Verified
  if (existingRequest?.status === 'verified' || profile?.is_verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 text-center border border-green-100"
          >
            <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12" style={{ color: greenColor }} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Already Verified!</h2>
            <p className="text-gray-600 mb-6">
              Your business is already verified on AITIMAAD.PK. You can now receive and manage customer reviews!
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

  // Pending Request
  if (existingRequest?.status === 'pending' || existingRequest?.status === 'contacted') {
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
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              {existingRequest.status === 'contacted' ? 'Under Review' : 'Request Pending'}
            </h2>
            <p className="text-gray-600 mb-6">
              Your verification request is currently being reviewed. Our team will contact you within <strong>24-48 working hours</strong>.
            </p>
            <div className="bg-amber-50 rounded-2xl p-5 mb-6 border border-amber-200">
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-amber-700 font-medium">Business Name</p>
                    <p className="text-sm text-amber-900 font-semibold">{existingRequest.business_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-amber-700 font-medium">Contact Method</p>
                    <p className="text-sm text-amber-900 font-semibold capitalize">{existingRequest.preferred_contact}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-amber-700 font-medium">Submitted</p>
                    <p className="text-sm text-amber-900 font-semibold">
                      {new Date(existingRequest.submitted_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
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

  // Rejected Request
  if (existingRequest?.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 text-center border border-red-100"
          >
            <div className="bg-red-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Request Rejected</h2>
            <p className="text-gray-600 mb-4">
              Unfortunately, your verification request was not approved.
            </p>
            {existingRequest.admin_notes && (
              <div className="bg-red-50 rounded-2xl p-4 mb-6 border border-red-200">
                <p className="text-xs text-red-700 font-medium mb-1">Reason</p>
                <p className="text-sm text-red-900">{existingRequest.admin_notes}</p>
              </div>
            )}
            <p className="text-sm text-gray-600 mb-6">
              Please contact our support team for more information or to reapply.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push('/')}
                className="flex-1 px-6 py-3 rounded-lg font-medium border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300"
              >
                Go to Home
              </button>
              <button
                className="flex-1 px-6 py-3 rounded-lg font-medium text-white transition-all duration-300 shadow-md hover:shadow-lg"
                style={{ backgroundColor: greenColor }}
              >
                <a href="mailto:admin@bigbulldigital.com">Contact Support</a>
              </button>
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
              <CheckCircle2 className="h-12 w-12" style={{ color: greenColor }} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Request Submitted!</h2>
            <p className="text-gray-600 mb-4">
              Thank you for your verification request! Our team will review your business details and contact you shortly.
            </p>
            <div className="bg-green-50 rounded-2xl p-5 mb-6 border border-green-200">
              <p className="text-sm text-green-800">
                <strong>What's next?</strong><br />
                We'll reach out to you via <strong className="capitalize">{formData.preferred_contact}</strong> within <strong>24-48 working hours</strong> to complete your business verification.
              </p>
            </div>
            <p className="text-sm text-gray-500 animate-pulse">Redirecting to home page...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-8 md:py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header Section */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 md:px-10 py-10 md:py-12 text-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Shield className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Business Verification</h1>
            <p className="text-green-50 text-sm md:text-base max-w-2xl mx-auto">
              Get your business verified on AITIMAAD.PK and start receiving trusted customer reviews
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6">
            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={profile?.business_name || profile?.full_name || ''}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 cursor-not-allowed"
              />
            </div>

            {/* Business Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={profile?.business_category || 'Not provided'}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 capitalize cursor-not-allowed"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={profile?.business_email || profile?.email || ''}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 cursor-not-allowed"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={profile?.business_phone_number || profile?.phone_number || 'Not provided'}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 cursor-not-allowed"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* Preferred Contact Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Contact Method <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.preferred_contact}
                onChange={(e) => setFormData(prev => ({ ...prev, preferred_contact: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-500 focus:outline-none transition-colors text-gray-900"
              >
                <option value="">Select contact method</option>
                <option value="email">Email</option>
                <option value="phone">Phone Call</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="any">Any Method</option>
              </select>
            </div>

            {/* Best Time to Call */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Best Time to Contact (Optional)
              </label>
              <select
                value={formData.best_time_to_call}
                onChange={(e) => setFormData(prev => ({ ...prev, best_time_to_call: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-500 focus:outline-none transition-colors text-gray-900"
              >
                <option value="">Select time slot</option>
                <option value="morning">Morning (9 AM - 12 PM)</option>
                <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                <option value="evening">Evening (4 PM - 8 PM)</option>
                <option value="anytime">Anytime</option>
              </select>
            </div>

            {/* Additional Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Information (Optional)
              </label>
              <textarea
                value={formData.additional_info}
                onChange={(e) => setFormData(prev => ({ ...prev, additional_info: e.target.value }))}
                rows={4}
                placeholder="Any additional details you'd like to share..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-500 focus:outline-none transition-colors resize-none text-sm"
              />
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
              className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
              style={{ backgroundColor: greenColor }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting Request...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Submit Verification Request
                </>
              )}
            </button>

            {/* Info Box */}
            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-2">Verification Process</p>
                  <ul className="space-y-1 text-blue-800">
                    <li>• Our team reviews your business information</li>
                    <li>• We contact you within 24-48 working hours</li>
                    <li>• Complete verification over call/email</li>
                    <li>• Get verified badge and start receiving reviews!</li>
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