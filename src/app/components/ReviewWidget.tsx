'use client';

import React, { useState, useEffect } from 'react';
import { Star, User, CheckCircle, Calendar, Building, Globe, Phone, Mail } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  description?: string;
  category?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  is_verified: boolean;
  profile_url?: string;
  our_rating?: number;
  our_reviews_count?: number;
}

interface Review {
  id: string;
  business_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at?: string;
  profiles: {
    full_name: string;
    profile_url: string | null;
    is_verified: boolean;
    user_type?: string;
  };
}

interface ReviewsWidgetProps {
  theme?: 'light' | 'dark';
  showVerifiedOnly?: boolean;
  apiBaseUrl?: string;
  businessId?: string; // Optional: If you want to show specific business
}

const BusinessReviewsWidget: React.FC<ReviewsWidgetProps> = ({
  theme = 'light',
  showVerifiedOnly = true,
  apiBaseUrl = 'http://localhost:8000',
  businessId // Optional parameter
}) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    average: 0
  });

  // Fetch all businesses on component mount
  useEffect(() => {
    fetchBusinesses();
  }, []);

  // Fetch reviews when business is selected
  useEffect(() => {
    if (selectedBusiness || businessId) {
      fetchReviews(selectedBusiness?.id || businessId!);
    }
  }, [selectedBusiness, businessId]);

  const fetchBusinesses = async () => {
    try {
      setLoadingBusinesses(true);
      const response = await fetch(`${apiBaseUrl}/api/businesses`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch businesses: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBusinesses(data.businesses || []);
        
        // If businessId is provided, select that business
        if (businessId) {
          const business = data.businesses.find((b: Business) => b.id === businessId);
          if (business) {
            setSelectedBusiness(business);
          }
        } else if (data.businesses.length > 0) {
          // Select first business by default
          setSelectedBusiness(data.businesses[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching businesses:', err);
      setError('Failed to load businesses');
    } finally {
      setLoadingBusinesses(false);
    }
  };

  const fetchReviews = async (bizId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${apiBaseUrl}/api/business/${bizId}/reviews`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Business not found');
        } else {
          throw new Error(`Failed to fetch reviews: ${response.statusText}`);
        }
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.reviews || []);
        setStats({
          total: data.total_reviews || 0,
          average: data.average_rating || 0
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    }[size];

    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Business selector component
  const BusinessSelector = () => (
    <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Select Business</h3>
        <span className="text-sm opacity-75">{businesses.length} businesses</span>
      </div>
      
      <select
        value={selectedBusiness?.id || ''}
        onChange={(e) => {
          const business = businesses.find(b => b.id === e.target.value);
          if (business) {
            setSelectedBusiness(business);
          }
        }}
        className={`w-full p-2 rounded border ${
          theme === 'dark' 
            ? 'bg-gray-700 border-gray-600 text-white' 
            : 'bg-white border-gray-300 text-gray-800'
        }`}
      >
        <option value="">Choose a business...</option>
        {businesses.map((business) => (
          <option key={business.id} value={business.id}>
            {business.name} {business.is_verified && '✓'}
          </option>
        ))}
      </select>
    </div>
  );

  // Business info component
  const BusinessInfo = () => {
    if (!selectedBusiness) return null;
    
    return (
      <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex items-start space-x-4">
          {selectedBusiness.profile_url ? (
            <img
              src={selectedBusiness.profile_url}
              alt={selectedBusiness.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-blue-500 flex items-center justify-center">
              <Building className="w-8 h-8 text-white" />
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold">{selectedBusiness.name}</h2>
                  {selectedBusiness.is_verified && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                      Verified
                    </span>
                  )}
                </div>
                
                {selectedBusiness.category && (
                  <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedBusiness.category}
                  </p>
                )}
                
                {selectedBusiness.description && (
                  <p className="mt-2 text-sm">{selectedBusiness.description}</p>
                )}
              </div>
              
              {selectedBusiness.our_rating && (
                <div className="text-right">
                  <div className="flex items-center justify-end">
                    {renderStars(selectedBusiness.our_rating, 'lg')}
                    <span className="ml-2 text-2xl font-bold">
                      {selectedBusiness.our_rating.toFixed(1)}
                    </span>
                  </div>
                  {selectedBusiness.our_reviews_count && (
                    <p className="text-sm opacity-75">
                      {selectedBusiness.our_reviews_count} reviews
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {/* Business contact info */}
            {(selectedBusiness.address || selectedBusiness.phone || selectedBusiness.email || selectedBusiness.website) && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedBusiness.address && (
                  <div className="flex items-center text-sm">
                    <Building className="w-4 h-4 mr-2 opacity-60" />
                    <span>{selectedBusiness.address}</span>
                  </div>
                )}
                
                {selectedBusiness.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="w-4 h-4 mr-2 opacity-60" />
                    <span>{selectedBusiness.phone}</span>
                  </div>
                )}
                
                {selectedBusiness.email && (
                  <div className="flex items-center text-sm">
                    <Mail className="w-4 h-4 mr-2 opacity-60" />
                    <span>{selectedBusiness.email}</span>
                  </div>
                )}
                
                {selectedBusiness.website && (
                  <div className="flex items-center text-sm">
                    <Globe className="w-4 h-4 mr-2 opacity-60" />
                    <a 
                      href={selectedBusiness.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loadingBusinesses && !selectedBusiness) {
    return (
      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-300 rounded w-1/2"></div>
          <div className="h-10 bg-gray-300 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!selectedBusiness && businesses.length === 0) {
    return (
      <div className={`p-6 rounded-lg text-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <Building className="w-12 h-12 mx-auto text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold">No Businesses Found</h3>
        <p className="mt-2 text-sm">No businesses available to show reviews.</p>
      </div>
    );
  }

  if (!selectedBusiness) {
    return (
      <div className={`rounded-lg shadow ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
        <BusinessSelector />
        <div className="p-8 text-center">
          <Building className="w-12 h-12 mx-auto text-gray-400" />
          <p className="mt-3">Please select a business to view reviews</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`rounded-lg shadow ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <BusinessSelector />
        <BusinessInfo />
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-300 rounded w-1/3"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3 p-4 border rounded">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-24"></div>
                    <div className="h-3 bg-gray-300 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-300 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-lg shadow ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <BusinessSelector />
        <BusinessInfo />
        <div className="p-6 text-center">
          <p className="font-medium text-red-500">Error loading reviews</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => fetchReviews(selectedBusiness.id)}
            className="mt-3 px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const displayReviews = showVerifiedOnly 
    ? reviews.filter(review => review.profiles?.is_verified)
    : reviews;

  return (
    <div className={`rounded-lg shadow ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      <BusinessSelector />
      <BusinessInfo />
      
      {/* Header with stats */}
      <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Customer Reviews</h2>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Reviews from verified customers
            </p>
          </div>
          
          {stats.total > 0 && (
            <div className="text-right">
              <div className="flex items-center justify-end">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500 mr-1" />
                <span className="text-2xl font-bold">{stats.average.toFixed(1)}</span>
              </div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {stats.total} {stats.total === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div className="p-6 max-h-[500px] overflow-y-auto">
        {displayReviews.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-12 h-12 mx-auto text-gray-400" />
            <p className="mt-3 font-medium">No reviews yet</p>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Be the first to review {selectedBusiness.name}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayReviews.map((review) => (
              <div 
                key={review.id}
                className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {review.profiles?.profile_url ? (
                      <img
                        src={review.profiles.profile_url}
                        alt={review.profiles.full_name || 'User'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {(review.profiles?.full_name || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {review.profiles?.full_name || 'Anonymous'}
                        </span>
                        {review.profiles?.is_verified && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        {renderStars(review.rating)}
                        <span className="text-xs opacity-75">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="mt-4 leading-relaxed">
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={() => fetchReviews(selectedBusiness.id)}
          className={`w-full py-2 rounded font-medium ${
            theme === 'dark'
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Refresh Reviews
        </button>
      </div>
    </div>
  );
};

export default BusinessReviewsWidget;