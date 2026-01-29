'use client';

import { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';
import { User, Building, Camera, Save, Phone, MapPin, Mail, Briefcase, Link as LinkIcon, Globe, Edit, Trash2, CheckCircle, X, ChevronRight, Menu, Settings as SettingsIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Business {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  is_verified: boolean;
  verification_status: string;
  our_rating: number | null;
  our_reviews_count: number | null;
  created_at: string;
  updated_at: string;
  profile_url: string | null;
  user_id: string;
  created_by: string;
}

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  profile_url: string | null;
  user_type: 'business' | 'customer' | null;
  is_verified: boolean;
  
  // Business specific fields
  business_name: string | null;
  business_description: string | null;
  business_category: string | null;
  business_address: string | null;
  business_city: string | null;
  business_country: string | null;
  business_phone_number: string | null;
  business_email: string | null;
  business_website: string | null;
  business_logo_url: string | null;
  
  // Customer specific fields
  phone_number: string | null;
}

type TabType = 'personal' | 'business-profile' | 'my-businesses';

export default function SettingsPage() {
  const { user, profile, updateProfile, uploadProfilePicture } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Refs for scrolling
  const editBusinessRef = useRef<HTMLDivElement>(null);
  const personalFormRef = useRef<HTMLDivElement>(null);
  const businessProfileRef = useRef<HTMLDivElement>(null);
  const myBusinessesRef = useRef<HTMLDivElement>(null);
  
  // Personal Profile State
  const [personalForm, setPersonalForm] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    profile_url: ''
  });
  
  // Business Profile State (for business users)
  const [businessForm, setBusinessForm] = useState({
    business_name: '',
    business_description: '',
    business_category: '',
    business_address: '',
    business_city: '',
    business_country: '',
    business_phone_number: '',
    business_email: '',
    business_website: '',
  });
  
  // User's Businesses State
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  
  // Business edit form state
  const [businessEditForm, setBusinessEditForm] = useState({
    name: '',
    description: '',
    category: '',
    customCategory: '', // New field for custom category input
    address: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    profile_url: ''
  });

  // Categories for dropdown
  const categories = [
    'Restaurant',
    'Retail',
    'Healthcare',
    'Education',
    'Technology',
    'Finance',
    'Real Estate',
    'Hospitality',
    'Automotive',
    'Manufacturing',
    'Consulting',
    'Other'
  ];

  // Load initial data
  useEffect(() => {
    if (profile) {
      // Load personal info
      setPersonalForm({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
        email: profile.email || '',
        profile_url: profile.profile_url || ''
      });
      
      // Load business info for business users
      if (profile.user_type === 'business') {
        setBusinessForm({
          business_name: profile.business_name || '',
          business_description: profile.business_description || '',
          business_category: profile.business_category || '',
          business_address: profile.business_address || '',
          business_city: profile.business_city || '',
          business_country: profile.business_country || '',
          business_phone_number: profile.business_phone_number || '',
          business_email: profile.business_email || '',
          business_website: profile.business_website || '',
        });
        
        // Load user's businesses
        loadUserBusinesses();
      }
    }
  }, [profile]);

  // Load user's businesses from database
  const loadUserBusinesses = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setBusinesses(data || []);
    } catch (error) {
      console.error('Error loading businesses:', error);
      setErrorMessage('Failed to load businesses');
    }
  };

  // Handle personal profile update
  const handlePersonalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      const updates: Partial<Profile> = {
        full_name: personalForm.full_name,
        phone_number: personalForm.phone_number,
      };
      
      await updateProfile(updates);
      setSuccessMessage('Personal information updated successfully!');
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setErrorMessage(error.message || 'Failed to update personal information');
    } finally {
      setLoading(false);
    }
  };

  // Handle business profile update (for business user type)
  const handleBusinessProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      // Determine category value
      let categoryValue = businessForm.business_category;
      
      const updates: Partial<Profile> = {
        business_name: businessForm.business_name,
        business_description: businessForm.business_description,
        business_category: categoryValue,
        business_address: businessForm.business_address,
        business_city: businessForm.business_city,
        business_country: businessForm.business_country,
        business_phone_number: businessForm.business_phone_number,
        business_email: businessForm.business_email,
        business_website: businessForm.business_website,
      };
      
      await updateProfile(updates);
      setSuccessMessage('Business profile updated successfully!');
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error('Error updating business profile:', error);
      setErrorMessage(error.message || 'Failed to update business profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload for personal profile
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !profile) return;
    
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Image size should be less than 2MB');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload an image file');
      return;
    }
    
    setLoading(true);
    
    try {
      // Use the uploadProfilePicture function from AuthContext
      const profileUrl = await uploadProfilePicture(file, user.id);
      
      const updates: Partial<Profile> = { 
        profile_url: profileUrl,
      };
      
      await updateProfile(updates);
      setPersonalForm(prev => ({ ...prev, profile_url: profileUrl }));
      setSuccessMessage('Profile picture updated successfully!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setErrorMessage(error.message || 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  // Handle business image upload
  const handleBusinessImageUpload = async (e: ChangeEvent<HTMLInputElement>, businessId: string) => {
    const file = e.target.files?.[0];
    if (!file || !businessId || !user) return;
    
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Image size should be less than 2MB');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload an image file');
      return;
    }
    
    setLoading(true);
    
    try {
      // Upload using same function
      const profileUrl = await uploadProfilePicture(file, user.id);
      
      const { error: updateError } = await supabase
        .from('businesses')
        .update({ 
          profile_url: profileUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', businessId);
      
      if (updateError) throw updateError;
      
      await loadUserBusinesses();
      setSuccessMessage('Business picture updated successfully!');
    } catch (error: any) {
      console.error('Error uploading business image:', error);
      setErrorMessage(error.message || 'Failed to upload business image');
    } finally {
      setLoading(false);
    }
  };

  // Start editing a business
  const startEditBusiness = (business: Business) => {
    setSelectedBusiness(business);
    setIsEditingBusiness(true);
    // Check if category is in predefined list or custom
    const isCustomCategory = business.category && !categories.includes(business.category);
    
    setBusinessEditForm({
      name: business.name || '',
      description: business.description || '',
      category: isCustomCategory ? 'Other' : business.category || '',
      customCategory: isCustomCategory ? business.category || '' : '',
      address: business.address || '',
      city: business.city || '',
      country: business.country || '',
      phone: business.phone || '',
      email: business.email || '',
      website: business.website || '',
      profile_url: business.profile_url || ''
    });
    
    // Auto scroll to edit form on mobile
    setTimeout(() => {
      editBusinessRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  // Cancel editing
  const cancelEditBusiness = () => {
    setSelectedBusiness(null);
    setIsEditingBusiness(false);
    setBusinessEditForm({
      name: '',
      description: '',
      category: '',
      customCategory: '',
      address: '',
      city: '',
      country: '',
      phone: '',
      email: '',
      website: '',
      profile_url: ''
    });
  };

  // Update business details
  const handleUpdateBusiness = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness) return;
    
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      // Determine category value - if "Other" is selected, use customCategory
      let categoryValue = businessEditForm.category;
      if (businessEditForm.category === 'Other' && businessEditForm.customCategory.trim()) {
        categoryValue = businessEditForm.customCategory.trim();
      }
      
      const { error } = await supabase
        .from('businesses')
        .update({
          name: businessEditForm.name,
          description: businessEditForm.description,
          category: categoryValue,
          address: businessEditForm.address,
          city: businessEditForm.city,
          country: businessEditForm.country,
          phone: businessEditForm.phone,
          email: businessEditForm.email,
          website: businessEditForm.website,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedBusiness.id);
      
      if (error) throw error;
      
      await loadUserBusinesses();
      setSuccessMessage('Business updated successfully!');
      cancelEditBusiness();
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error('Error updating business:', error);
      setErrorMessage(error.message || 'Failed to update business');
    } finally {
      setLoading(false);
    }
  };

  // Delete business
  const handleDeleteBusiness = async (businessId: string) => {
    if (!confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId);
      
      if (error) throw error;
      
      await loadUserBusinesses();
      if (selectedBusiness?.id === businessId) {
        cancelEditBusiness();
      }
      setSuccessMessage('Business deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting business:', error);
      setErrorMessage(error.message || 'Failed to delete business');
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handlePersonalChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalForm(prev => ({ ...prev, [name]: value }));
  };

  const handleBusinessFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBusinessForm(prev => ({ ...prev, [name]: value }));
  };

  const handleBusinessEditFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBusinessEditForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle tab change with auto-scroll on mobile
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    
    // Scroll to content area on mobile
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        switch(tab) {
          case 'personal':
            personalFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            break;
          case 'business-profile':
            businessProfileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            break;
          case 'my-businesses':
            myBusinessesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            break;
        }
      }, 100);
    }
  };

  // Get the actual category value to display
  const getDisplayCategory = (category: string | null) => {
    if (!category) return 'Uncategorized';
    return category.length > 20 ? category.substring(0, 20) + '...' : category;
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
              <p className="text-xs text-gray-500">Manage your account</p>
            </div>
          </div>
          <SettingsIcon className="h-5 w-5 text-green-600" />
        </div>
        
        {/* Mobile Tab Navigation */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg"
          >
            <nav className="py-2">
              <button
                onClick={() => handleTabChange('personal')}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium ${
                  activeTab === 'personal'
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4" />
                  Personal Information
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>
              
              {profile?.user_type === 'business' && (
                <>
                  <button
                    onClick={() => handleTabChange('business-profile')}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium ${
                      activeTab === 'business-profile'
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4" />
                      Business Profile
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => {
                      handleTabChange('my-businesses');
                      cancelEditBusiness();
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium ${
                      activeTab === 'my-businesses'
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4 w-4" />
                      My Businesses
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Success/Error Messages */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 lg:mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <p className="text-green-700 text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {successMessage}
            </p>
          </motion.div>
        )}
        
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 lg:mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-red-700 text-sm font-medium">{errorMessage}</p>
          </motion.div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation - Desktop */}
          <div className="hidden lg:block lg:w-1/4">
            <div className="sticky top-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex flex-col items-center text-center mb-6 p-2">
                  {profile?.profile_url ? (
                    <div className="relative h-20 w-20 mb-3">
                      <img
                        src={profile.profile_url}
                        alt="Profile"
                        className="h-full w-full rounded-full object-cover ring-2 ring-green-100"
                      />
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center ring-2 ring-green-100 mb-3">
                      {profile?.user_type === 'business' ? (
                        <Building className="h-10 w-10 text-white" />
                      ) : (
                        <User className="h-10 w-10 text-white" />
                      )}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{profile?.full_name || 'User'}</h3>
                    <p className="text-sm text-gray-500 capitalize">{profile?.user_type || 'User'}</p>
                  </div>
                </div>
                
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab('personal')}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'personal'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <User className="h-4 w-4" />
                    Personal Information
                  </button>
                  
                  {profile?.user_type === 'business' && (
                    <>
                      <button
                        onClick={() => setActiveTab('business-profile')}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === 'business-profile'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <Building className="h-4 w-4" />
                        Business Profile
                      </button>
                      
                      <button
                        onClick={() => {
                          setActiveTab('my-businesses');
                          cancelEditBusiness();
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === 'my-businesses'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <Briefcase className="h-4 w-4" />
                        My Businesses
                      </button>
                    </>
                  )}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Desktop Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden lg:block mb-6"
            >
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">
                Manage your account settings and preferences
              </p>
            </motion.div>

            {/* Personal Information Tab */}
            {activeTab === 'personal' && (
              <motion.div
                ref={personalFormRef}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Personal Information</h2>
                  <div className="lg:hidden">
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Personal</span>
                  </div>
                </div>
                
                <div className="mb-6 sm:mb-8">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                    <div className="relative">
                      {personalForm.profile_url ? (
                        <div className="relative h-24 w-24 sm:h-32 sm:w-32">
                          <img
                            src={personalForm.profile_url}
                            alt="Profile"
                            className="h-full w-full rounded-full object-cover ring-4 ring-green-50"
                          />
                        </div>
                      ) : (
                        <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center ring-4 ring-green-50">
                          <User className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                        </div>
                      )}
                      <label className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors active:scale-95">
                        <Camera className="h-4 w-4 text-gray-600" />
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={loading}
                        />
                      </label>
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="font-medium text-gray-900">Profile Picture</h3>
                      <p className="text-sm text-gray-500 mt-1 max-w-md">
                        Upload a clear photo of yourself. Max size 2MB.
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        JPG, PNG, GIF supported
                      </p>
                    </div>
                  </div>
                </div>
                
                <form onSubmit={handlePersonalSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        value={personalForm.full_name}
                        onChange={handlePersonalChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50">
                        <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <input
                          type="email"
                          value={personalForm.email}
                          className="flex-1 bg-transparent outline-none text-gray-600"
                          disabled
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500">
                        <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <input
                          type="tel"
                          name="phone_number"
                          value={personalForm.phone_number}
                          onChange={handlePersonalChange}
                          className="flex-1 outline-none min-w-0"
                          placeholder="+92 300 1234567"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      <Save className="h-4 w-4" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Business Profile Tab (for business users) */}
            {activeTab === 'business-profile' && profile?.user_type === 'business' && (
              <motion.div
                ref={businessProfileRef}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Business Profile</h2>
                  <div className="lg:hidden">
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Business</span>
                  </div>
                </div>
                
                <form onSubmit={handleBusinessProfileSubmit}>
                  <div className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Name
                        </label>
                        <input
                          type="text"
                          name="business_name"
                          value={businessForm.business_name}
                          onChange={handleBusinessFormChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                          placeholder="Enter business name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Category
                        </label>
                        <select
                          name="business_category"
                          value={businessForm.business_category}
                          onChange={handleBusinessFormChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        >
                          <option value="">Select category</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Description
                      </label>
                      <textarea
                        name="business_description"
                        value={businessForm.business_description}
                        onChange={handleBusinessFormChange}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                        placeholder="Describe your business..."
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Email
                        </label>
                        <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg">
                          <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <input
                            type="email"
                            name="business_email"
                            value={businessForm.business_email}
                            onChange={handleBusinessFormChange}
                            className="flex-1 outline-none min-w-0"
                            placeholder="business@example.com"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Phone
                        </label>
                        <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg">
                          <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <input
                            type="tel"
                            name="business_phone_number"
                            value={businessForm.business_phone_number}
                            onChange={handleBusinessFormChange}
                            className="flex-1 outline-none min-w-0"
                            placeholder="+92 300 1234567"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Address
                      </label>
                      <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg">
                        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <input
                          type="text"
                          name="business_address"
                          value={businessForm.business_address}
                          onChange={handleBusinessFormChange}
                          className="flex-1 outline-none min-w-0"
                          placeholder="Street address"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          name="business_city"
                          value={businessForm.business_city}
                          onChange={handleBusinessFormChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                          placeholder="City"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          name="business_country"
                          value={businessForm.business_country}
                          onChange={handleBusinessFormChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                          placeholder="Country"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Website
                        </label>
                        <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg">
                          <LinkIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <input
                            type="url"
                            name="business_website"
                            value={businessForm.business_website}
                            onChange={handleBusinessFormChange}
                            className="flex-1 outline-none min-w-0"
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      <Save className="h-4 w-4" />
                      {loading ? 'Saving...' : 'Update Business Profile'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* My Businesses Tab (for business users) */}
            {activeTab === 'my-businesses' && profile?.user_type === 'business' && (
              <div ref={myBusinessesRef} className="space-y-6">
                {/* Business List */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">My Businesses</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Manage all your registered businesses
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                        {businesses.length} business{businesses.length !== 1 ? 'es' : ''}
                      </div>
                      <div className="lg:hidden">
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Businesses</span>
                      </div>
                    </div>
                  </div>
                  
                  {businesses.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-4">
                        <Building className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No businesses found</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Your businesses will appear here once you create them through the platform
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {businesses.map((business) => (
                        <div
                          key={business.id}
                          className={`p-3 sm:p-4 border rounded-lg transition-all hover:shadow-sm ${
                            selectedBusiness?.id === business.id
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-200 bg-white hover:border-green-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                            {/* Business Image */}
                            <div className="flex items-center gap-3">
                              <div className="relative flex-shrink-0">
                                {business.profile_url ? (
                                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg overflow-hidden">
                                    <img
                                      src={business.profile_url}
                                      alt={business.name}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                                    <Building className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                                  </div>
                                )}
                                <label className="absolute -bottom-1 -right-1 bg-white p-1 sm:p-1.5 rounded-full shadow cursor-pointer hover:bg-gray-50 active:scale-95">
                                  <Camera className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-600" />
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleBusinessImageUpload(e, business.id)}
                                    disabled={loading}
                                  />
                                </label>
                              </div>
                              
                              {/* Mobile Actions */}
                              <div className="sm:hidden flex items-center gap-2">
                                <button
                                  onClick={() => startEditBusiness(business)}
                                  className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteBusiness(business.id)}
                                  className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Business Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-2">
                                    <h3 className="font-semibold text-gray-900 truncate">{business.name}</h3>
                                   <span
  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
    business.verification_status === 'verified'
      ? 'bg-green-100 text-green-700'
      : business.verification_status === 'pending'
      ? 'bg-orange-100 text-orange-700'
      : 'bg-red-100 text-red-700'
  }`}
>
  <CheckCircle className="h-3 w-3" />
  <span className="hidden sm:inline">
    {business.verification_status === 'verified'
      ? 'Verified'
      : business.verification_status === 'pending'
      ? 'Pending'
      : 'Rejected'}
  </span>
</span>

                                  </div>
                                  <p className="text-sm text-gray-500 line-clamp-1 sm:line-clamp-2 mt-1">
                                    {business.description || 'No description'}
                                  </p>
                                </div>
                                
                                {/* Desktop Actions */}
                                <div className="hidden sm:flex items-center gap-2">
                                  <button
                                    onClick={() => startEditBusiness(business)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors active:scale-[0.98]"
                                  >
                                    <Edit className="h-3 w-3" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBusiness(business.id)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors active:scale-[0.98]"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Delete
                                  </button>
                                </div>
                              </div>
                              
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                                <div className="flex items-center gap-1 text-gray-600">
                                  <Briefcase className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                  <span className="truncate">{getDisplayCategory(business.category)}</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-600">
                                  <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                  <span className="truncate">{business.city || 'No city'}</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-600">
                                  <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                  <span className="truncate">{business.phone || 'No phone'}</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-600">
                                  <Globe className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                  <span className="truncate">{business.website || 'No website'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Edit Business Form */}
                {isEditingBusiness && selectedBusiness && (
                  <motion.div
                    ref={editBusinessRef}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                          Edit Business
                        </h2>
                        <p className="text-sm text-gray-500 mt-1 truncate">
                          {selectedBusiness.name}
                        </p>
                      </div>
                      <button
                        onClick={cancelEditBusiness}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 active:scale-95"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <form onSubmit={handleUpdateBusiness}>
                      <div className="space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Business Name *
                            </label>
                            <input
                              type="text"
                              name="name"
                              value={businessEditForm.name}
                              onChange={handleBusinessEditFormChange}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                              placeholder="Enter business name"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Category *
                            </label>
                            <select
                              name="category"
                              value={businessEditForm.category}
                              onChange={handleBusinessEditFormChange}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                              required
                            >
                              <option value="">Select category</option>
                              {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            
                            {/* Custom Category Input - Show only when "Other" is selected */}
                            {businessEditForm.category === 'Other' && (
                              <div className="mt-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Custom Category *
                                </label>
                                <input
                                  type="text"
                                  name="customCategory"
                                  value={businessEditForm.customCategory}
                                  onChange={handleBusinessEditFormChange}
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                  placeholder="Enter your custom category"
                                  required
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <textarea
                            name="description"
                            value={businessEditForm.description}
                            onChange={handleBusinessEditFormChange}
                            rows={3}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                            placeholder="Describe your business..."
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email Address
                            </label>
                            <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg">
                              <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <input
                                type="email"
                                name="email"
                                value={businessEditForm.email}
                                onChange={handleBusinessEditFormChange}
                                className="flex-1 outline-none min-w-0"
                                placeholder="business@example.com"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone Number
                            </label>
                            <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg">
                              <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <input
                                type="tel"
                                name="phone"
                                value={businessEditForm.phone}
                                onChange={handleBusinessEditFormChange}
                                className="flex-1 outline-none min-w-0"
                                placeholder="+92 300 1234567"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address
                          </label>
                          <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg">
                            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <input
                              type="text"
                              name="address"
                              value={businessEditForm.address}
                              onChange={handleBusinessEditFormChange}
                              className="flex-1 outline-none min-w-0"
                              placeholder="Street address"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              City
                            </label>
                            <input
                              type="text"
                              name="city"
                              value={businessEditForm.city}
                              onChange={handleBusinessEditFormChange}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                              placeholder="City"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Country
                            </label>
                            <input
                              type="text"
                              name="country"
                              value={businessEditForm.country}
                              onChange={handleBusinessEditFormChange}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                              placeholder="Country"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Website
                            </label>
                            <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg">
                              <LinkIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <input
                                type="url"
                                name="website"
                                value={businessEditForm.website}
                                onChange={handleBusinessEditFormChange}
                                className="flex-1 outline-none min-w-0"
                                placeholder="https://example.com"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                          <Save className="h-4 w-4" />
                          {loading ? 'Updating...' : 'Update Business'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditBusiness}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors active:scale-[0.98]"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}