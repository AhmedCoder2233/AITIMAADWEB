'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Building, CheckCircle2, AlertCircle, Send, Shield, Clock, XCircle, Mail, Phone, MessageSquare, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [existingRequests, setExistingRequests] = useState<any[]>([]);
  const [userBusinesses, setUserBusinesses] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [formData, setFormData] = useState({
    preferred_contact: '',
    best_time_to_call: '',
    additional_info: ''
  });

  const greenColor = '#16a34a';

  // Helper function to get verification status for a specific business
  const getVerificationStatusForBusiness = (business: any) => {
    if (!business) return null;
    
    // Check if the business is verified in businesses table
    if (business.is_verified || business.verification_status === 'verified') {
      return 'verified';
    }
    
    // Check for verification requests for this specific business
    const businessRequests = existingRequests.filter(request => 
      (request.business_id && request.business_id === business.id) || 
      (request.business_name && request.business_name === business.name)
    );
    
    if (businessRequests.length > 0) {
      // Return the status of the most recent request
      const mostRecentRequest = businessRequests.sort((a, b) => 
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      )[0];
      return mostRecentRequest.status;
    }
    
    return null;
  };

  // Check for existing verification requests and fetch user's businesses
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setCheckingStatus(true);
      setLoadingBusinesses(true);
      
      try {
        // Fetch ALL existing verification requests for this user
        const { data: requestData, error: requestError } = await supabase
          .from('verification_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false });

        if (requestData) {
          setExistingRequests(requestData);
        }

        // Fetch user's businesses from businesses table
        const { data: businessesData, error: businessesError } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (businessesError) {
          console.error('Error fetching businesses:', businessesError);
        } else if (businessesData && businessesData.length > 0) {
          // Process businesses and add verification status
          const businessesWithStatus = businessesData.map(business => {
            const status = getVerificationStatusForBusiness(business);
            return {
              ...business,
              verificationStatus: status
            };
          });
          
          setUserBusinesses(businessesWithStatus);
          
          // Select first business by default that is not verified and has no pending requests
          const availableBusiness = businessesWithStatus.find(b => 
            !b.is_verified && 
            b.verification_status !== 'verified' && 
            !['pending', 'contacted', 'rejected'].includes(getVerificationStatusForBusiness(b))
          ) || businessesWithStatus[0];
          
          setSelectedBusiness(availableBusiness);
        } else {
          // If no businesses found, create a default business from profile
          const defaultBusiness = {
            id: 'profile',
            name: profile?.business_name || profile?.full_name,
            description: profile?.business_description,
            category: profile?.business_category,
            address: profile?.business_address,
            city: profile?.business_city,
            country: profile?.business_country,
            phone: profile?.business_phone_number || profile?.phone_number,
            email: profile?.business_email || profile?.email,
            website: profile?.business_website,
            is_verified: profile?.is_verified,
            verification_status: profile?.is_verified,
            user_id: user.id,
            created_at: new Date().toISOString(),
            verificationStatus: getVerificationStatusForBusiness({
              id: 'profile',
              name: profile?.business_name || profile?.full_name,
            })
          };
          setUserBusinesses([defaultBusiness]);
          setSelectedBusiness(defaultBusiness);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setCheckingStatus(false);
        setLoadingBusinesses(false);
      }
    };

    fetchData();
  }, [user, profile]);

  // Update businesses when existingRequests changes
  useEffect(() => {
    if (userBusinesses.length > 0) {
      const updatedBusinesses = userBusinesses.map(business => ({
        ...business,
        verificationStatus: getVerificationStatusForBusiness(business)
      }));
      setUserBusinesses(updatedBusinesses);
      
      // Update selected business status
      if (selectedBusiness) {
        const currentBusiness = updatedBusinesses.find(b => 
          b.id === selectedBusiness.id
        );
        if (currentBusiness) {
          setSelectedBusiness(currentBusiness);
        }
      }
    }
  }, [existingRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.preferred_contact) {
      setError('Please select your preferred contact method');
      return;
    }

    if (!selectedBusiness) {
      setError('Please select a business to verify');
      return;
    }

    // Check if business already has pending request
    const existingStatus = getVerificationStatusForBusiness(selectedBusiness);
    if (existingStatus === 'verified' || existingStatus === 'pending' || existingStatus === 'contacted') {
      setError('This business already has a verification request in process');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user?.id,
          business_id: selectedBusiness.id !== 'profile' ? selectedBusiness.id : null,
          business_name: selectedBusiness.name,
          business_email: selectedBusiness.email,
          business_phone: selectedBusiness.phone,
          business_category: selectedBusiness.category,
          business_address: selectedBusiness.address,
          business_city: selectedBusiness.city,
          business_description: selectedBusiness.description,
          business_website: selectedBusiness.website,
          preferred_contact: formData.preferred_contact,
          best_time_to_call: formData.best_time_to_call,
          additional_info: formData.additional_info,
          status: 'pending',
          submitted_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // Refresh the existing requests
      const { data: requestData } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false });

      if (requestData) {
        setExistingRequests(requestData);
      }

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
  if (checkingStatus || loadingBusinesses) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification details...</p>
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

  // Get current status for selected business
  const businessStatus = getVerificationStatusForBusiness(selectedBusiness);

  // Success state - show this before other status checks
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
              Verification request for <strong>{selectedBusiness?.name}</strong> has been submitted!
            </p>
            <div className="bg-green-50 rounded-2xl p-5 mb-6 border border-green-200">
              <p className="text-sm text-green-800">
                <strong>What's next?</strong><br />
                We'll reach out to you via <strong className="capitalize">{formData.preferred_contact}</strong> within <strong>24-48 working hours</strong> to complete your business verification.
              </p>
            </div>
            
            <BusinessSwitcher 
              userBusinesses={userBusinesses}
              selectedBusiness={selectedBusiness}
              onBusinessSelect={(business:any) => {
                setSelectedBusiness(business);
                setFormData({
                  preferred_contact: '',
                  best_time_to_call: '',
                  additional_info: ''
                });
                setSuccess(false);
                setError('');
              }}
            />
            
            <p className="text-sm text-gray-500 animate-pulse mt-6">Redirecting to home page...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Check business status and render appropriate UI
  if (businessStatus === 'verified') {
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
            <p className="text-gray-600 mb-4">
              <strong>{selectedBusiness?.name}</strong> is already verified on AITIMAAD.PK.
            </p>
            <div className="bg-green-50 rounded-2xl p-4 mb-6 border border-green-200">
              <p className="text-sm text-green-800">
                You can now receive and manage customer reviews for this business!
              </p>
            </div>
            
            <BusinessSwitcher 
              userBusinesses={userBusinesses}
              selectedBusiness={selectedBusiness}
              onBusinessSelect={(business:any) => {
                setSelectedBusiness(business);
                setFormData({
                  preferred_contact: '',
                  best_time_to_call: '',
                  additional_info: ''
                });
                setSuccess(false);
                setError('');
              }}
            />
            
            <button
              onClick={() => router.push('/')}
              className="w-full mt-6 px-6 py-3 rounded-lg font-medium text-white transition-all duration-300 shadow-md hover:shadow-lg"
              style={{ backgroundColor: greenColor }}
            >
              Go to Home
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (businessStatus === 'pending' || businessStatus === 'contacted') {
    const businessRequests = existingRequests.filter(request => 
      (request.business_id && request.business_id === selectedBusiness?.id) || 
      (request.business_name && request.business_name === selectedBusiness?.name)
    );
    const currentRequest = businessRequests[0];
    
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
              {businessStatus === 'contacted' ? 'Under Review' : 'Request Pending'}
            </h2>
            <p className="text-gray-600 mb-4">
              Verification request for <strong>{selectedBusiness?.name}</strong> is being reviewed.
            </p>
            <div className="bg-amber-50 rounded-2xl p-5 mb-6 border border-amber-200">
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-amber-700 font-medium">Business Name</p>
                    <p className="text-sm text-amber-900 font-semibold">{currentRequest?.business_name || selectedBusiness?.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-amber-700 font-medium">Contact Method</p>
                    <p className="text-sm text-amber-900 font-semibold capitalize">{currentRequest?.preferred_contact || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-amber-700 font-medium">Submitted</p>
                    <p className="text-sm text-amber-900 font-semibold">
                      {currentRequest?.submitted_at ? new Date(currentRequest.submitted_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Our team will contact you within <strong>24-48 working hours</strong>.
            </p>
            
            <BusinessSwitcher 
              userBusinesses={userBusinesses}
              selectedBusiness={selectedBusiness}
              onBusinessSelect={(business:any) => {
                setSelectedBusiness(business);
                setFormData({
                  preferred_contact: '',
                  best_time_to_call: '',
                  additional_info: ''
                });
                setSuccess(false);
                setError('');
              }}
            />
            
            <button
              onClick={() => router.push('/')}
              className="w-full mt-6 px-6 py-3 rounded-lg font-medium text-white transition-all duration-300 shadow-md hover:shadow-lg"
              style={{ backgroundColor: greenColor }}
            >
              Go to Home
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (businessStatus === 'rejected') {
    const rejectedRequests = existingRequests.filter(request => 
      (request.business_id && request.business_id === selectedBusiness?.id) || 
      (request.business_name && request.business_name === selectedBusiness?.name)
    );
    const rejectedRequest = rejectedRequests[0];
    
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
              Verification request for <strong>{selectedBusiness?.name}</strong> was not approved.
            </p>
            {rejectedRequest?.admin_notes && (
              <div className="bg-red-50 rounded-2xl p-4 mb-6 border border-red-200">
                <p className="text-xs text-red-700 font-medium mb-1">Reason</p>
                <p className="text-sm text-red-900">{rejectedRequest.admin_notes}</p>
              </div>
            )}
            
            <BusinessSwitcher 
              userBusinesses={userBusinesses}
              selectedBusiness={selectedBusiness}
              onBusinessSelect={(business:any) => {
                setSelectedBusiness(business);
                setFormData({
                  preferred_contact: '',
                  best_time_to_call: '',
                  additional_info: ''
                });
                setSuccess(false);
                setError('');
              }}
            />
            
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
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

  // Show form for businesses with no status (not verified, no pending requests)
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
              Note: 49$ per month will be charged for verification process.
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6">
            {/* Business Selection Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Business to Verify <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedBusiness?.id || ''}
                  onChange={(e) => {
                    const business = userBusinesses.find(biz => biz.id === e.target.value);
                    if (business) {
                      setSelectedBusiness(business);
                      // Reset form data when switching business
                      setFormData({
                        preferred_contact: '',
                        best_time_to_call: '',
                        additional_info: ''
                      });
                      setError('');
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-500 focus:outline-none transition-colors text-gray-900 appearance-none"
                >
                  <option value="">Select a business</option>
                  {userBusinesses
                    .filter(business => {
                      const status = getVerificationStatusForBusiness(business);
                      return !status || status === 'rejected'; // Show only businesses that can be verified
                    })
                    .map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.name} 
                        {business.verificationStatus ? ` (${business.verificationStatus})` : ''}
                      </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                  <ChevronDown className="h-5 w-5" />
                </div>
              </div>
              
              {/* Show businesses that are already in process */}
              {userBusinesses.some(biz => {
                const status = getVerificationStatusForBusiness(biz);
                return status === 'verified' || status === 'pending' || status === 'contacted';
              }) && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">Businesses already in process:</p>
                  <div className="space-y-1">
                    {userBusinesses
                      .filter(biz => {
                        const status = getVerificationStatusForBusiness(biz);
                        return status === 'verified' || status === 'pending' || status === 'contacted';
                      })
                      .map(business => {
                        const status = getVerificationStatusForBusiness(business);
                        return (
                          <div key={business.id} className="text-xs text-gray-500 flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              status === 'verified' ? 'bg-green-500' :
                              status === 'pending' || status === 'contacted' ? 'bg-amber-500' :
                              'bg-gray-400'
                            }`}></div>
                            {business.name} ({status})
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {selectedBusiness && (
              <>
                {/* Business Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={selectedBusiness?.name || ''}
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
                    value={selectedBusiness?.category || 'Not provided'}
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
                    value={selectedBusiness?.email || ''}
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
                    value={selectedBusiness?.phone || 'Not provided'}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 cursor-not-allowed"
                  />
                </div>

                {/* Business Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Address
                  </label>
                  <input
                    type="text"
                    value={selectedBusiness?.address || 'Not provided'}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 cursor-not-allowed"
                  />
                </div>

                {/* Business City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={selectedBusiness?.city || 'Not provided'}
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
                    required
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
              </>
            )}

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
              disabled={loading || !selectedBusiness}
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

// Business Switcher Component
function BusinessSwitcher({ userBusinesses, selectedBusiness, onBusinessSelect }: any) {
  if (userBusinesses.length <= 1) return null;

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <p className="text-sm text-gray-600 mb-3">Switch Business:</p>
      <div className="space-y-2">
        {userBusinesses
          .filter((business:any) => business.id !== selectedBusiness.id)
          .map((business:any) => (
            <button
              key={business.id}
              onClick={() => onBusinessSelect(business)}
              className="w-full px-4 py-3 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors flex items-center justify-between"
            >
              <span>{business.name}</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                business.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
                business.verificationStatus === 'pending' || business.verificationStatus === 'contacted' ? 'bg-amber-100 text-amber-800' :
                business.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {business.verificationStatus || 'Not Submitted'}
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}