'use client';

import { Search, Building, Verified, Clock, MapPin, Star, AlertCircle, UserPlus, Plus, Phone, Globe, Mail, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

interface Business {
  id: string;
  name: string;
  category: string;
  is_verified: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  address: string;
  city: string;
  our_rating: number;
  created_at: string;
  profile_url: string | null;
  phone?: string;
  email?: string;
  website?: string;
  country?: string;
}

interface BusinessFormData {
  name: string;
  category: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  description: string;
}

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showBusinessNotFoundModal, setShowBusinessNotFoundModal] = useState(false);
  const [showCreateBusinessModal, setShowCreateBusinessModal] = useState(false);
  const [createBusinessStep, setCreateBusinessStep] = useState(1);
  const [isCreatingBusiness, setIsCreatingBusiness] = useState(false);
  const [createBusinessError, setCreateBusinessError] = useState('');
  const [createBusinessSuccess, setCreateBusinessSuccess] = useState(false);
  const [createdBusinessId, setCreatedBusinessId] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  const [businessFormData, setBusinessFormData] = useState<BusinessFormData>({
    name: '',
    category: '',
    address: '',
    city: '',
    country: 'Pakistan',
    phone: '',
    email: '',
    website: '',
    description: ''
  });

  const searchRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { user, loading: authLoading } = useAuth();
  
  const greenColor = '#16a34a';
  const redColor = '#dc2626';
  const lightGreen = '#f0fdf4';
  const lightRed = '#fef2f2';

  // Fetch suggestions from Supabase
  const fetchSuggestions = useCallback(async (query: string) => {
    setLoading(true);
    try {
      let queryBuilder = supabase
        .from('businesses')
        .select('*');

      if (query.length >= 2) {
        queryBuilder = queryBuilder
          .or(`name.ilike.%${query}%,category.ilike.%${query}%,address.ilike.%${query}%`)
          .limit(10);
      } else {
        queryBuilder = queryBuilder
          .order('our_reviews_count', { ascending: false })
          .limit(5);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchSuggestions]);

  // Load initial businesses
  useEffect(() => {
    if (!searchQuery) {
      fetchSuggestions('');
    }
  }, [fetchSuggestions, searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      if (suggestions.length === 0 && searchQuery.length >= 2) {
        setShowBusinessNotFoundModal(true);
      }
    }
  };

  const handleSuggestionClick = (business: Business) => {
    setSearchQuery(business.name);
    setShowSuggestions(false);
    window.location.href = `/business/${business.id}`;
  };

  // Get first letter of name
  const getFirstLetter = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Function to get verification badge style
  const getVerificationBadge = (business: Business) => {
    const isVerified = business.is_verified && business.verification_status === 'verified';
    
    if (isVerified) {
      return {
        backgroundColor: '#dcfce7',
        color: '#166534',
        borderColor: '#86efac',
        text: 'Verified',
        icon: <Verified className="h-3 w-3" />,
        dotColor: 'bg-green-500'
      };
    } else {
      return {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        borderColor: '#fca5a5',
        text: 'Unverified',
        icon: <Clock className="h-3 w-3" />,
        dotColor: 'bg-red-500'
      };
    }
  };

  // Function to get business card background
  const getBusinessCardBackground = (business: Business) => {
    const isVerified = business.is_verified && business.verification_status === 'verified';
    
    if (isVerified) {
      return {
        backgroundColor: '#f0fdf4',
        hoverBackgroundColor: '#dcfce7',
        borderColor: '#bbf7d0'
      };
    } else {
      return {
        backgroundColor: '#fef2f2',
        hoverBackgroundColor: '#fee2e2',
        borderColor: '#fecaca'
      };
    }
  };

  // Function to render profile display
  const renderProfileDisplay = (business: Business) => {
    if (business.profile_url) {
      return (
        <img 
          src={business.profile_url} 
          alt={business.name}
          className="h-10 w-10 rounded-lg object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              const fallbackDiv = document.createElement('div');
              fallbackDiv.className = "h-10 w-10 rounded-lg flex items-center justify-center font-semibold";
              const badgeStyle = getVerificationBadge(business);
              fallbackDiv.style.backgroundColor = badgeStyle.backgroundColor;
              fallbackDiv.style.color = badgeStyle.color;
              fallbackDiv.textContent = getFirstLetter(business.name);
              parent.appendChild(fallbackDiv);
            }
          }}
        />
      );
    } else {
      const badgeStyle = getVerificationBadge(business);
      return (
        <div 
          className="h-10 w-10 rounded-lg flex items-center justify-center font-semibold"
          style={{
            backgroundColor: badgeStyle.backgroundColor,
            color: badgeStyle.color
          }}
        >
          {getFirstLetter(business.name)}
        </div>
      );
    }
  };

  // Handle business form input change
  const handleBusinessFormChange = (field: keyof BusinessFormData, value: string) => {
    setBusinessFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setCreateBusinessError('Logo file size should be less than 5MB');
        return;
      }

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setCreateBusinessError('Please upload a valid image (JPEG, PNG, or WebP)');
        return;
      }

      setCompanyLogo(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove logo
  const removeLogo = () => {
    setCompanyLogo(null);
    setLogoPreview(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  // Upload logo to Supabase Storage
  const uploadLogoToStorage = async (businessId: string): Promise<string | null> => {
    if (!companyLogo) return null;

    setIsUploadingLogo(true);
    try {
      const fileExt = companyLogo.name.split('.').pop();
      const fileName = `${businessId}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      console.log('Uploading logo to:', filePath);
      
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, companyLogo, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        
        if (uploadError.message.includes('bucket') || uploadError.message.includes('not found')) {
          setCreateBusinessError('Storage bucket not configured. Please create a "profile-pictures" bucket in Supabase Storage.');
          return null;
        }
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      console.log('Logo uploaded successfully:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      return null;
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Enhanced validation functions
  const validatePhoneNumber = (phone: string): { isValid: boolean; message?: string } => {
    const cleanedPhone = phone.replace(/\s/g, '');
    
    // Check if empty
    if (!cleanedPhone) {
      return { isValid: false, message: 'Phone number is required' };
    }
    
    // Pakistan phone number validation
    // Formats: +92XXXXXXXXXX, 92XXXXXXXXXX, 0XXXXXXXXXX
    const pakistanRegex = /^(\+92|92|0)[0-9]{10}$/;
    
    // International format (optional)
    const internationalRegex = /^\+[1-9]\d{0,3}[0-9]{9,15}$/;
    
    if (!pakistanRegex.test(cleanedPhone) && !internationalRegex.test(cleanedPhone)) {
      return { 
        isValid: false, 
        message: 'Please enter a valid phone number. Pakistani format: +92XXXXXXXXXX or 0XXXXXXXXXX' 
      };
    }
    
    return { isValid: true };
  };

  const validateEmail = (email: string): { isValid: boolean; message?: string } => {
    if (!email) {
      return { isValid: false, message: 'Email is required' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Please enter a valid email address' };
    }
    
    return { isValid: true };
  };

  const validateWebsite = (website: string): { isValid: boolean; message?: string } => {
    if (!website) return { isValid: true }; // Website is optional
    
    // Check if it starts with http:// or https://
    let url = website;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    try {
      new URL(url);
      return { isValid: true };
    } catch (error) {
      return { isValid: false, message: 'Please enter a valid website URL' };
    }
  };

  const validateBusinessForm = (step: number): boolean => {
    setCreateBusinessError('');

    if (step === 1) {
      if (!businessFormData.name.trim()) {
        setCreateBusinessError('Business name is required');
        return false;
      }
      if (businessFormData.name.trim().length < 2) {
        setCreateBusinessError('Business name must be at least 2 characters');
        return false;
      }
      if (!businessFormData.category.trim()) {
        setCreateBusinessError('Category is required');
        return false;
      }
      if (!businessFormData.address.trim()) {
        setCreateBusinessError('Address is required');
        return false;
      }
      if (!businessFormData.city.trim()) {
        setCreateBusinessError('City is required');
        return false;
      }
    }

    if (step === 2) {
      // Validate phone
      const phoneValidation = validatePhoneNumber(businessFormData.phone);
      if (!phoneValidation.isValid) {
        setCreateBusinessError(phoneValidation.message || 'Invalid phone number');
        return false;
      }

      // Validate email
      const emailValidation = validateEmail(businessFormData.email);
      if (!emailValidation.isValid) {
        setCreateBusinessError(emailValidation.message || 'Invalid email');
        return false;
      }

      // Validate website (optional)
      if (businessFormData.website.trim()) {
        const websiteValidation = validateWebsite(businessFormData.website);
        if (!websiteValidation.isValid) {
          setCreateBusinessError(websiteValidation.message || 'Invalid website URL');
          return false;
        }
      }
    }

    if (step === 3) {
      // Final validation
      const phoneValidation = validatePhoneNumber(businessFormData.phone);
      const emailValidation = validateEmail(businessFormData.email);
      
      if (!phoneValidation.isValid) {
        setCreateBusinessError(phoneValidation.message || 'Invalid phone number');
        return false;
      }
      
      if (!emailValidation.isValid) {
        setCreateBusinessError(emailValidation.message || 'Invalid email');
        return false;
      }
    }

    return true;
  };

  // Create business with authentication check
  const createBusiness = async () => {
    // Check if user is logged in
    if (!user) {
      setCreateBusinessError('You must be logged in to add a business');
      setShowLoginPrompt(true);
      return;
    }

    if (!validateBusinessForm(3)) return;

    setIsCreatingBusiness(true);
    setCreateBusinessError('');
    
    try {
      // Check if business already exists
      const { data: existingBusiness } = await supabase
        .from('businesses')
        .select('id')
        .or(`name.ilike.%${businessFormData.name}%,phone.ilike.%${businessFormData.phone}%`)
        .limit(1);

      if (existingBusiness && existingBusiness.length > 0) {
        setCreateBusinessError('A similar business already exists');
        return;
      }

      // Create business with user ID
      const businessData = {
        name: businessFormData.name,
        category: businessFormData.category,
        address: businessFormData.address,
        city: businessFormData.city,
        country: 'Pakistan',
        phone: businessFormData.phone,
        email: businessFormData.email,
        website: businessFormData.website || null,
        description: businessFormData.description,
        is_verified: false,
        verification_status: 'pending',
        our_rating: 0,
        our_reviews_count: 0,
        profile_url: null,
        created_by: user.id, // Add user ID who created the business
        updated_at: new Date().toISOString()
      };

      console.log('Creating business with data:', businessData);

      const { data, error } = await supabase
        .from('businesses')
        .insert([businessData])
        .select()
        .single();

      if (error) {
        console.error('Error creating business:', error);
        throw error;
      }

      console.log('Business created with ID:', data.id);

      // Upload logo if exists
      let logoUrl = null;
      if (companyLogo) {
        console.log('Uploading logo for business:', data.id);
        logoUrl = await uploadLogoToStorage(data.id);
        
        if (logoUrl) {
          console.log('Updating business with logo URL:', logoUrl);
          const { error: updateError } = await supabase
            .from('businesses')
            .update({ profile_url: logoUrl })
            .eq('id', data.id);

          if (updateError) {
            console.error('Error updating business with logo:', updateError);
          }
        }
      }

      // Success
      setCreatedBusinessId(data.id);
      setCreateBusinessSuccess(true);
      
      // Reset form after delay
      setTimeout(() => {
        setShowCreateBusinessModal(false);
        setCreateBusinessStep(1);
        setBusinessFormData({
          name: '',
          category: '',
          address: '',
          city: '',
          country: 'Pakistan',
          phone: '',
          email: '',
          website: '',
          description: ''
        });
        setCompanyLogo(null);
        setLogoPreview(null);
        setCreateBusinessSuccess(false);
        setCreatedBusinessId(null);
        
        window.location.href = `/business/${data.id}`;
      }, 3000);

    } catch (error: any) {
      console.error('Error creating business:', error);
      setCreateBusinessError(error.message || 'Failed to create business. Please try again.');
    } finally {
      setIsCreatingBusiness(false);
    }
  };

  // Start creating business with authentication check
  const startCreatingBusiness = () => {
    setShowBusinessNotFoundModal(false);
    
    // Check if user is logged in
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    
    setShowCreateBusinessModal(true);
    setBusinessFormData(prev => ({
      ...prev,
      name: searchQuery
    }));
  };

  // Close login prompt and redirect to login
  const handleLoginRedirect = () => {
    setShowLoginPrompt(false);
    window.location.href = '/login'; // Adjust this to your login page route
  };

  // Categories list
  const categories = [
    'Restaurant', 'Hospital', 'Bank', 'Hotel', 'School', 'Pharmacy',
    'Retail Store', 'Supermarket', 'Gym', 'Real Estate'
  ];

  // Cities in Pakistan
  const cities = [
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
    'Multan', 'Peshawar', 'Quetta', 'Hyderabad', 'Gujranwala',
    'Sialkot', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana',
    'Sheikhupura', 'Jhang', 'Rahim Yar Khan', 'Gujrat', 'Mardan'
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 }}
      className="container mx-auto px-4 -mt-8 relative z-20"
      ref={searchRef}
    >
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                    if (suggestions.length === 0 && searchQuery.length >= 2) {
                      setShowBusinessNotFoundModal(true);
                    }
                  }
                }}
                placeholder="Search for companies, restaurants, services..."
                className="w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                style={{ borderColor: greenColor }}
              />
              
              {loading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Search Button */}
            <button 
              onClick={handleSearch}
              className="text-white px-6 py-3 rounded-lg transition-colors duration-300 flex items-center justify-center space-x-2 font-medium hover:shadow-lg"
              style={{ backgroundColor: greenColor }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = greenColor}
            >
              <Search className="h-5 w-5" />
              <span>Search</span>
            </button>
          </div>

          {/* Search Suggestions */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
              >
                <div className="p-2 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">
                        {searchQuery ? `Search results for "${searchQuery}"` : 'Popular Businesses'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {suggestions.length} {searchQuery ? 'found' : 'showing'}
                      </span>
                    </div>
                  </div>

                  {suggestions.map((business) => {
                    const badgeStyle = getVerificationBadge(business);
                    const cardStyle = getBusinessCardBackground(business);
                    
                    return (
                      <motion.div
                        key={business.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ 
                          backgroundColor: cardStyle.hoverBackgroundColor,
                          borderLeftColor: badgeStyle.borderColor,
                          borderLeftWidth: '4px'
                        }}
                        className="p-4 border-b border-gray-100 last:border-b-0 cursor-pointer transition-all duration-150"
                        style={{
                          backgroundColor: cardStyle.backgroundColor,
                          borderLeft: '2px solid transparent'
                        }}
                        onClick={() => handleSuggestionClick(business)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 relative">
                            <div className="relative">
                              {renderProfileDisplay(business)}
                              <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border border-white ${badgeStyle.dotColor}`}></div>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {business.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span 
                                    className="text-xs text-gray-600 px-2 py-1 rounded-full"
                                    style={{ backgroundColor: badgeStyle.borderColor }}
                                  >
                                    {business.category}
                                  </span>
                                  <span 
                                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border"
                                    style={{
                                      backgroundColor: badgeStyle.backgroundColor,
                                      color: badgeStyle.color,
                                      borderColor: badgeStyle.borderColor
                                    }}
                                  >
                                    {badgeStyle.icon}
                                    {badgeStyle.text}
                                    {badgeStyle.text === 'Verified' ? ' ✅' : ' 🚫'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="font-semibold text-gray-900">
                                  {business.our_rating || 0}
                                </span>
                              </div>
                            </div>

                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">
                                {business.address || `${business.city}, Pakistan`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          <AnimatePresence>
            {showSuggestions && searchQuery.length >= 2 && suggestions.length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
              >
                <div className="p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <Building className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="font-semibold text-gray-700 text-lg mb-2">
                    No businesses found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    We couldn't find any businesses matching "<span className="font-semibold">{searchQuery}</span>"
                  </p>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Plus className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-green-800">Be the first to add this business!</h4>
                    </div>
                    <p className="text-sm text-green-700 mb-3">
                      Help others find this business by adding it to our directory.
                    </p>
                    <button
                      onClick={startCreatingBusiness}
                      className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="h-5 w-5" />
                      Add "{searchQuery}" to Directory
                    </button>
                  </div>

                  <button
                    onClick={() => setShowSuggestions(false)}
                    className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Close suggestions
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Popular Search Tags */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {['Restaurants', 'Hospitals', 'Banks', 'Hotels', 'Schools', 'Pharmacies'].map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setSearchQuery(tag);
                setShowSuggestions(true);
              }}
              className="px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: lightGreen,
                color: greenColor,
                border: `1px solid ${greenColor}40`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = greenColor;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = lightGreen;
                e.currentTarget.style.color = greenColor;
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Business Not Found Modal */}
      <AnimatePresence>
        {showBusinessNotFoundModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowBusinessNotFoundModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Business Not Found
                  </h3>
                  <p className="text-sm text-gray-600">
                    No results for "<span className="font-semibold">{searchQuery}</span>"
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  We couldn't find this business in our directory. Would you like to add it?
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Benefits of adding:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>✓ Help others discover this business</li>
                    <li>✓ Get reviews and ratings</li>
                    <li>✓ Free to list and manage</li>
                    <li>✓ Increase your online presence</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={startCreatingBusiness}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Yes, Add This Business
                </button>
                
                <button
                  onClick={() => setShowBusinessNotFoundModal(false)}
                  className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  No, try different search
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Prompt Modal */}
      <AnimatePresence>
        {showLoginPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowLoginPrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <UserPlus className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Login Required
                  </h3>
                  <p className="text-sm text-gray-600">
                    You need to be logged in to add a business
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  To ensure quality and prevent spam, we require users to be logged in before adding new businesses to our directory.
                </p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">Why login is required:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>✓ Prevent spam and fake listings</li>
                    <li>✓ Track business submissions</li>
                    <li>✓ Ensure accountability</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleLoginRedirect}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus className="h-5 w-5" />
                  Login to Continue
                </button>
                
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Business Modal */}
      <AnimatePresence>
        {showCreateBusinessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => !createBusinessSuccess && setShowCreateBusinessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {createBusinessSuccess ? (
                <div className="text-center py-8">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Verified className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Business Added Successfully!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    "{businessFormData.name}" has been added to our directory.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-green-700">
                      ✅ Business is now live on our platform
                      <br />
                      ✅ Customers can now find and review your business
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Redirecting to business page...
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Plus className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Add New Business
                      </h3>
                      <p className="text-sm text-gray-600">
                        Step {createBusinessStep} of 3
                      </p>
                    </div>
                  </div>

                  {/* User Info Display */}
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserPlus className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-700">
                          Adding as: <span className="font-semibold">{user?.email}</span>
                        </p>
                        <p className="text-xs text-blue-600">
                          Your user ID will be attached to this business submission
                        </p>
                      </div>
                    </div>
                  </div>

                  {createBusinessError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">{createBusinessError}</span>
                      </div>
                    </div>
                  )}

                  {/* Step 1: Basic Information */}
                  {createBusinessStep === 1 && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Basic Information</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company Logo (Optional)
                        </label>
                        <div className="flex items-center gap-4">
                          {logoPreview ? (
                            <div className="relative">
                              <img
                                src={logoPreview}
                                alt="Logo preview"
                                className="h-20 w-20 rounded-lg object-cover border border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={removeLogo}
                                className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <div 
                              className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50"
                              onClick={() => logoInputRef.current?.click()}
                            >
                              <Upload className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <input
                              type="file"
                              ref={logoInputRef}
                              onChange={handleLogoUpload}
                              accept="image/jpeg,image/jpg,image/png,image/webp"
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => logoInputRef.current?.click()}
                              className="text-sm text-green-600 hover:text-green-700 font-medium"
                            >
                              {logoPreview ? 'Change Logo' : 'Upload Logo'}
                            </button>
                            <p className="text-xs text-gray-500 mt-1">
                              Max 5MB. JPEG, PNG or WebP
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Business Name *
                        </label>
                        <input
                          type="text"
                          value={businessFormData.name}
                          onChange={(e) => handleBusinessFormChange('name', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Enter business name"
                          required
                          minLength={2}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category *
                        </label>
                        <div className="space-y-2">
                          <select
                            value={categories.includes(businessFormData.category) ? businessFormData.category : ''}
                            onChange={(e) => handleBusinessFormChange('category', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            required
                          >
                            <option value="">Select category</option>
                            {categories.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                          
                          {!categories.includes(businessFormData.category) && (
                            <div>
                              <input
                                type="text"
                                value={businessFormData.category}
                                onChange={(e) => handleBusinessFormChange('category', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Or enter custom category"
                                required
                                minLength={2}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Can't find your category? Type it above.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address *
                        </label>
                        <input
                          type="text"
                          value={businessFormData.address}
                          onChange={(e) => handleBusinessFormChange('address', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Full address"
                          required
                          minLength={5}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City *
                          </label>
                          <select
                            value={businessFormData.city}
                            onChange={(e) => handleBusinessFormChange('city', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            required
                          >
                            <option value="">Select city</option>
                            {cities.map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Country *
                          </label>
                          <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                            Pakistan
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Currently serving Pakistan only
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={businessFormData.description}
                          onChange={(e) => handleBusinessFormChange('description', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Brief description of your business"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 2: Contact Information */}
                  {createBusinessStep === 2 && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Contact Information</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number *
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="tel"
                            value={businessFormData.phone}
                            onChange={(e) => handleBusinessFormChange('phone', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="+92 300 1234567 or 0300 1234567"
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Pakistani format: +92XXXXXXXXXX or 0XXXXXXXXXX
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="email"
                            value={businessFormData.email}
                            onChange={(e) => handleBusinessFormChange('email', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="contact@business.com"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Website (Optional)
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="url"
                            value={businessFormData.website}
                            onChange={(e) => handleBusinessFormChange('website', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="https://www.example.com"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Include http:// or https://
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Review & Submit */}
                  {createBusinessStep === 3 && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Review & Submit</h4>
                      
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 mb-2">Business Summary</h5>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Business Name:</span>
                            <span className="font-medium">{businessFormData.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Category:</span>
                            <span className="font-medium">{businessFormData.category}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Location:</span>
                            <span className="font-medium">{businessFormData.city}, Pakistan</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Phone:</span>
                            <span className="font-medium">{businessFormData.phone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Email:</span>
                            <span className="font-medium">{businessFormData.email}</span>
                          </div>
                          {businessFormData.website && (
                            <div className="flex justify-between">
                              <span>Website:</span>
                              <span className="font-medium">{businessFormData.website}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-sm text-gray-500">
                        <p>By submitting, you confirm that:</p>
                        <ul className="mt-1 space-y-1">
                          <li>✓ You own or represent this business</li>
                          <li>✓ Information provided is accurate</li>
                          <li>✓ You agree to our terms and conditions</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-8">
                    {createBusinessStep > 1 ? (
                      <button
                        onClick={() => setCreateBusinessStep(prev => prev - 1)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                        disabled={isCreatingBusiness}
                      >
                        ← Back
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowCreateBusinessModal(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                        disabled={isCreatingBusiness}
                      >
                        Cancel
                      </button>
                    )}

                    {createBusinessStep < 3 ? (
                      <button
                        onClick={() => {
                          if (validateBusinessForm(createBusinessStep)) {
                            setCreateBusinessStep(prev => prev + 1);
                          }
                        }}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        Next Step →
                      </button>
                    ) : (
                      <button
                        onClick={createBusiness}
                        disabled={isCreatingBusiness || isUploadingLogo}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isCreatingBusiness ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Adding Business...
                          </>
                        ) : (
                          'Add Business to Directory'
                        )}
                      </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}