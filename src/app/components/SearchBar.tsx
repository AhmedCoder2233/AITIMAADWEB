'use client';

import { Search, Building, Verified, Clock, MapPin, Star, AlertCircle, UserPlus } from 'lucide-react';
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
  profile_url: string | null; // Add profile_url to the interface
}

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showReviewLoginModal, setShowReviewLoginModal] = useState(false);
  const [selectedBusinessForReview, setSelectedBusinessForReview] = useState<Business | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
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
        // If search query exists, search by query
        queryBuilder = queryBuilder
          .or(`name.ilike.%${query}%,category.ilike.%${query}%,address.ilike.%${query}%`)
          .limit(10); // Show up to 10 results for search
      } else {
        // If no search query, show initial popular businesses
        queryBuilder = queryBuilder
          .order('google_reviews_count', { ascending: false })
          .limit(5); // Show only 5 initial businesses
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

  // Load initial businesses on component mount
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
      // Navigate to search results page
    }
  };

  const handleSuggestionClick = (business: Business) => {
    setSearchQuery(business.name);
    setShowSuggestions(false);
    // Navigate to business detail page - ALL USERS CAN ACCESS
    window.location.href = `/business/${business.id}`;
  };

  // Function to get first letter of name
  const getFirstLetter = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Function to display profile image or first letter
  const renderProfileDisplay = (business: Business) => {
    if (business.profile_url) {
      return (
        <img 
          src={business.profile_url} 
          alt={business.name}
          className="h-10 w-10 rounded-lg object-cover"
          onError={(e) => {
            // Fallback to first letter if image fails to load
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              const fallbackDiv = document.createElement('div');
              fallbackDiv.className = "h-10 w-10 rounded-lg flex items-center justify-center font-semibold";
              fallbackDiv.style.backgroundColor = getVerificationBadge(business).backgroundColor;
              fallbackDiv.style.color = getVerificationBadge(business).color;
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

  // Function to get verification badge style
  const getVerificationBadge = (business: Business) => {
    const isVerified = business.is_verified && business.verification_status === 'verified';
    
    if (isVerified) {
      return {
        backgroundColor: '#dcfce7', // Lighter green background
        color: '#166534', // Dark green text
        borderColor: '#86efac', // Green border
        text: 'Verified',
        icon: <Verified className="h-3 w-3" />,
        dotColor: 'bg-green-500'
      };
    } else {
      return {
        backgroundColor: '#fee2e2', // Red background
        color: '#991b1b', // Dark red text
        borderColor: '#fca5a5', // Red border
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
        backgroundColor: '#f0fdf4', // Very light green
        hoverBackgroundColor: '#dcfce7', // Light green on hover
        borderColor: '#bbf7d0' // Green border
      };
    } else {
      return {
        backgroundColor: '#fef2f2', // Very light red
        hoverBackgroundColor: '#fee2e2', // Light red on hover
        borderColor: '#fecaca' // Red border
      };
    }
  };


  // Function to render profile in modal
  const renderModalProfileDisplay = (business: Business) => {
    if (business.profile_url) {
      return (
        <img 
          src={business.profile_url} 
          alt={business.name}
          className="h-10 w-10 rounded-lg object-cover"
        />
      );
    } else {
      return (
        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center font-semibold text-gray-600">
          {getFirstLetter(business.name)}
        </div>
      );
    }
  };

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
                placeholder="Search for companies, restaurants, services..."
                className="w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                style={{ borderColor: greenColor }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              
              {/* Loading indicator */}
              {loading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Search Button */}
            <button 
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
                          {/* Profile Image or First Letter with verification status indicator */}
                          <div className="flex-shrink-0 relative">
                            <div className="relative">
                              {renderProfileDisplay(business)}
                              <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border border-white ${badgeStyle.dotColor}`}></div>
                            </div>
                          </div>

                          {/* Business Details */}
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

                              {/* Rating */}
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="font-semibold text-gray-900">
                                  {business.our_rating || 0}
                                </span>
                              </div>
                            </div>

                            {/* Address and Reviews */}
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">
                                  {business.address || `${business.city}, Pakistan`}
                                </span>
                              </div>
                              
                              
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
                className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-8 text-center z-50"
              >
                <div className="text-gray-400 mb-2">
                  <Building className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="font-semibold text-gray-700 mb-1">
                  No businesses found
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  We couldn't find any businesses matching "{searchQuery}"
                </p>
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Close suggestions
                </button>
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

      {/* Review Login Modal */}
      <AnimatePresence>
        {showReviewLoginModal && selectedBusinessForReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowReviewLoginModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Star className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Add Your Review
                  </h3>
                  <p className="text-sm text-gray-600">
                    Login to review {selectedBusinessForReview.name}
                  </p>
                </div>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {renderModalProfileDisplay(selectedBusinessForReview)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedBusinessForReview.name}</p>
                    <p className="text-sm text-gray-500">{selectedBusinessForReview.category}</p>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Share your experience and help others make better decisions. Your review matters!
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowReviewLoginModal(false);
                    window.location.href = '/login?type=customer';
                  }}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Login as Customer
                </button>
                
                <button
                  onClick={() => {
                    setShowReviewLoginModal(false);
                    window.location.href = '/signup?type=customer';
                  }}
                  className="w-full px-4 py-3 border-2 border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Sign up as Customer
                </button>
                
                <button
                  onClick={() => setShowReviewLoginModal(false)}
                  className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-500">
                  You can still{' '}
                  <button
                    onClick={() => {
                      setShowReviewLoginModal(false);
                      window.location.href = `/business/${selectedBusinessForReview.id}`;
                    }}
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    view business details
                  </button>{' '}
                  without logging in
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}