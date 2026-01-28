'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../app/contexts/AuthContext';
import { 
  Star, 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  MessageSquare,
  Calendar,
  Copy,
  CheckCircle,
  ChevronDown,
  Building,
  Globe,
  Mail,
  Phone,
  BarChart3,
  Users,
  TrendingUp,
  Shield,
  ChevronRight,
  Filter,
  Search,
  Download,
  MoreVertical,
  Home,
  Briefcase,
  Menu,
  X
} from 'lucide-react';

interface Review {
  id: string;
  business_id: string;
  rating: number;
  comment: string;
  experience_date?: string;
  proof_url?: string;
  proof_type?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  customer_name?: string;
  customer_email?: string;
  reply?: string;
  reply_date?: string;
}

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
  is_verified?: boolean;
  verification_status?: string;
  rating?: number;
  reviews_count?: number;
  profile_url?: string;
  created_at: string;
  updated_at: string;
}

interface ReviewsWidgetProps {
  apiUrl?: string;
}

export default function ReviewsWidget({ 
  apiUrl = process.env.AITIMAAD_REViEW_API_ENDPOINT,
}: ReviewsWidgetProps) {
  const { profile, user, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalRating, setTotalRating] = useState(0);
  const [ratingBreakdown, setRatingBreakdown] = useState<Record<number, number>>({});
  const [copied, setCopied] = useState(false);
  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'reviews' | 'stats' | 'info'>('reviews');

  // Filter reviews based on search query
  const filteredReviews = reviews.filter(review =>
    review.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.rating.toString().includes(searchQuery)
  );

  // Fetch user's businesses from your businesses table
  const fetchUserBusinesses = async () => {
    if (profile?.user_type === 'business' && user?.id) {
      try {
        setBusinessLoading(true);
        
        const response = await fetch(`${apiUrl}/api/businesses?user_id=${user.id}`);
        
        if (!response.ok) {
          console.warn('Businesses endpoint not found, using fallback');
          
          const dummyBusiness: Business = {
            id: user.id,
            name: profile.business_name || user.email?.split('@')[0] || 'My Business',
            email: user.email || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          setBusinesses([dummyBusiness]);
          setSelectedBusiness(dummyBusiness);
          return;
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setBusinesses(data);
          if (data.length > 0) {
            setSelectedBusiness(data[0]);
          }
        } else if (data.businesses) {
          setBusinesses(data.businesses);
          if (data.businesses.length > 0) {
            setSelectedBusiness(data.businesses[0]);
          }
        } else {
          const fallbackBusiness: Business = {
            id: user.id,
            name: profile.business_name || 'My Business',
            email: user.email || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setBusinesses([fallbackBusiness]);
          setSelectedBusiness(fallbackBusiness);
        }
      } catch (err) {
        console.error('Error fetching businesses:', err);
        if (user?.id) {
          const fallbackBusiness: Business = {
            id: user.id,
            name: profile?.business_name || user.email?.split('@')[0] || 'My Business',
            email: user.email || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setBusinesses([fallbackBusiness]);
          setSelectedBusiness(fallbackBusiness);
        }
      } finally {
        setBusinessLoading(false);
      }
    }
  };

  // Fetch reviews for selected business
  const fetchReviews = useCallback(async (businessId: string) => {
    if (!businessId) {
      setError('No business selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${apiUrl}/api/business/${businessId}/reviews`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.reviews || []);
      } else {
        throw new Error(data.detail || 'Failed to fetch reviews');
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // Calculate statistics from reviews
  useEffect(() => {
    if (reviews.length > 0) {
      const avg = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      setTotalRating(parseFloat(avg.toFixed(1)));

      const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviews.forEach(review => {
        const rating = Math.round(review.rating);
        if (rating >= 1 && rating <= 5) {
          breakdown[rating]++;
        }
      });
      setRatingBreakdown(breakdown);
    } else {
      setTotalRating(0);
      setRatingBreakdown({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
    }
  }, [reviews]);

  // Fetch user businesses on mount
  useEffect(() => {
    if (user && profile?.user_type === 'business') {
      fetchUserBusinesses();
    }
  }, [user, profile]);

  // Fetch reviews when business changes
  useEffect(() => {
    if (selectedBusiness?.id) {
      fetchReviews(selectedBusiness.id);
    }
  }, [selectedBusiness, fetchReviews]);

  // Render stars
  const renderStars = (rating: number, size: 'xs' | 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      xs: 'h-2.5 w-2.5',
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5'
    };
    
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'fill-emerald-500 text-emerald-500' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Get rating percentage
  const getRatingPercentage = (rating: number) => {
    const count = ratingBreakdown[rating] || 0;
    return reviews.length > 0 ? (count / reviews.length) * 100 : 0;
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle business selection
  const handleBusinessSelect = (business: Business) => {
    setSelectedBusiness(business);
    setShowBusinessDropdown(false);
  };

  // Non-business user UI
  if (!authLoading && (!user || profile?.user_type !== 'business')) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
              <Briefcase className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Business Account Required
          </h3>
          <p className="text-gray-600 mb-6 text-sm">
            Access your customer reviews dashboard by logging in with a business account.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/login?type=business"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
            >
              <Briefcase className="h-4 w-4" />
              Business Login
            </a>
            <a
              href="/signup?type=business"
              className="inline-flex items-center justify-center px-6 py-2.5 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors font-medium text-sm"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] gap-3 p-4">
        <div className="relative">
          <div className="w-12 h-12 border-3 border-emerald-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-12 h-12 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-600 text-sm">Loading dashboard...</p>
      </div>
    );
  }

  // Mobile navigation tabs
  const MobileTabs = () => (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 mb-4 -mx-4 px-4">
      <div className="flex">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'reviews'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>Reviews</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'stats'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <BarChart3 className="h-4 w-4" />
            <span>Stats</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'info'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <Building className="h-4 w-4" />
            <span>Business</span>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">AITIMAAD</h1>
            <p className="text-xs text-gray-600 mt-0.5">Reviews Dashboard</p>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5 text-gray-600" />
            ) : (
              <Menu className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Stats Bar */}
        <div className="flex items-center border-t border-gray-100">
          <div className="flex-1 flex items-center justify-center gap-2 px-3 py-3 border-r border-gray-100">
            <Star className="h-4 w-4 text-emerald-600" />
            <div>
              <div className="font-semibold text-gray-900">{totalRating.toFixed(1)}</div>
              <div className="text-xs text-gray-500">Rating</div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 px-3 py-3">
            <Users className="h-4 w-4 text-emerald-600" />
            <div>
              <div className="font-semibold text-gray-900">{reviews.length}</div>
              <div className="text-xs text-gray-500">Reviews</div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Reviews Dashboard</h1>
              <p className="text-gray-600 mt-1">Monitor and manage customer feedback</p>
            </div>
            <button
              onClick={() => selectedBusiness && fetchReviews(selectedBusiness.id)}
              disabled={loading || !selectedBusiness}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Business Selector and Search - Mobile */}
        <div className="lg:hidden space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Business
            </label>
            <div className="relative">
              <button
                onClick={() => setShowBusinessDropdown(!showBusinessDropdown)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:border-emerald-500 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Building className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {selectedBusiness?.name || 'Select Business'}
                    </div>
                    {selectedBusiness?.email && (
                      <div className="text-sm text-gray-500 truncate">
                        {selectedBusiness.email}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${showBusinessDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Business Dropdown */}
              {showBusinessDropdown && businesses.length > 0 && (
                <>
                  <div 
                    className="fixed inset-0 z-30 bg-black/20" 
                    onClick={() => setShowBusinessDropdown(false)}
                  />
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto">
                    {businesses.map((business) => (
                      <button
                        key={business.id}
                        onClick={() => handleBusinessSelect(business)}
                        className={`w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                          selectedBusiness?.id === business.id ? 'bg-emerald-50' : ''
                        }`}
                      >
                        <div className="font-medium text-gray-900 truncate">{business.name}</div>
                        <div className="text-sm text-gray-500 truncate">
                          ID: {business.id.substring(0, 8)}...
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Reviews
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Error Display - Mobile */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-800">Error Loading Reviews</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Business Selector and Search - Desktop */}
        <div className="hidden lg:flex gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Business
            </label>
            <div className="relative">
              <button
                onClick={() => setShowBusinessDropdown(!showBusinessDropdown)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:border-emerald-500 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{selectedBusiness?.name || 'Select Business'}</div>
                    {selectedBusiness?.email && (
                      <div className="text-sm text-gray-500">{selectedBusiness.email}</div>
                    )}
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${showBusinessDropdown ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
          <div className="w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Reviews
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Error Display - Desktop */}
        {error && (
          <div className="hidden lg:block mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800">Error Loading Reviews</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Content */}
        <div className="lg:hidden">
          <MobileTabs />
          
          {activeTab === 'reviews' && (
            <div className="pb-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Customer Reviews</h2>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Filter className="h-4 w-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Download className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col justify-center items-center py-12 gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-3 border-emerald-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-12 h-12 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-gray-600">Loading reviews...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
                    <MessageSquare className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Reviews Yet</h3>
                  <p className="text-gray-600 mb-6">
                    Start collecting customer feedback by sharing your business profile.
                  </p>
                  {selectedBusiness && (
                    <button
                      onClick={() => fetchReviews(selectedBusiness.id)}
                      className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                    >
                      Check for New Reviews
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review, index) => (
                    <div 
                      key={review.id}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50">
                            <Users className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {review.customer_name || 'Anonymous Customer'}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              {renderStars(review.rating, 'sm')}
                              <span>{review.rating}.0</span>
                              <span>•</span>
                              <span>{formatDate(review.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-3 leading-relaxed">{review.comment}</p>
                      
                      <div className="flex items-center gap-2 text-sm">
                        {review.experience_date && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded">
                            <Calendar className="h-3 w-3" />
                            Visited {formatDate(review.experience_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6 pb-20">
              {/* Rating Breakdown */}
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
                <div className="space-y-4">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const percentage = getRatingPercentage(rating);
                    const count = ratingBreakdown[rating] || 0;
                    return (
                      <div key={rating} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{rating} stars</span>
                            {renderStars(rating, 'sm')}
                          </div>
                          <div className="text-sm text-gray-600">
                            {count} ({percentage.toFixed(0)}%)
                          </div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${percentage}%` }}
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* API Integration */}
              <div className="bg-emerald-900 text-white rounded-lg p-5">
                <h3 className="text-lg font-semibold mb-4">API Integration</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-emerald-200 mb-2">API Endpoint</div>
                    <div className="bg-emerald-800 p-3 rounded">
                      <code className="text-sm text-emerald-300 break-all">
                        GET {apiUrl}/api/business/{'{business_id}'}/reviews
                      </code>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-emerald-200 mb-2">Example Usage</div>
                    <div className="bg-emerald-800 p-3 rounded">
                      <pre className="text-sm text-emerald-300 overflow-x-auto">
{`fetch('${apiUrl}/api/business/${selectedBusiness?.id}/reviews')
  .then(res => res.json())
  .then(data => console.log(data.reviews));`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'info' && selectedBusiness && (
            <div className="space-y-6 pb-20">
              {/* Business Info */}
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business ID
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-gray-50 text-sm font-mono border border-gray-300 rounded truncate">
                        {selectedBusiness.id}
                      </code>
                      <button
                        onClick={() => copyToClipboard(selectedBusiness.id)}
                        className="p-2 hover:bg-gray-100 rounded"
                        title="Copy Business ID"
                      >
                        {copied ? (
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <Copy className="h-5 w-5 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {selectedBusiness.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-emerald-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-700">Email</div>
                          <div className="text-gray-900">{selectedBusiness.email}</div>
                        </div>
                      </div>
                    )}
                    
                    {selectedBusiness.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-emerald-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-700">Phone</div>
                          <div className="text-gray-900">{selectedBusiness.phone}</div>
                        </div>
                      </div>
                    )}
                    
                    {selectedBusiness.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-emerald-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-700">Website</div>
                          <a 
                            href={selectedBusiness.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-800"
                          >
                            {selectedBusiness.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Content */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6">
          {/* Left Column - Reviews List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-600" />
                Customer Reviews
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({filteredReviews.length} {filteredReviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </h2>
            </div>

            {loading ? (
              <div className="flex flex-col justify-center items-center py-12 gap-4">
                <div className="relative">
                  <div className="w-12 h-12 border-3 border-emerald-200 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-12 h-12 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-600">Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
                  <MessageSquare className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Reviews Yet</h3>
                <p className="text-gray-600 mb-6">
                  Start collecting customer feedback by sharing your business profile.
                </p>
                {selectedBusiness && (
                  <button
                    onClick={() => fetchReviews(selectedBusiness.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Check for New Reviews
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReviews.map((review, index) => (
                  <div 
                    key={review.id}
                    className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50">
                          <Users className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {review.customer_name || 'Anonymous Customer'}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {renderStars(review.rating, 'sm')}
                            <span>{review.rating}.0</span>
                            <span>•</span>
                            <span>{formatDate(review.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical className="h-5 w-5 text-gray-400" />
                      </button>
                    </div>
                    
                    <p className="text-gray-700 mb-4 leading-relaxed">{review.comment}</p>
                    
                    <div className="flex items-center gap-3 text-sm">
                      {review.experience_date && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded">
                          <Calendar className="h-3 w-3" />
                          Visited {formatDate(review.experience_date)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Stats and Info */}
          <div className="space-y-6">
            {/* Rating Breakdown */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
              <div className="space-y-4">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const percentage = getRatingPercentage(rating);
                  const count = ratingBreakdown[rating] || 0;
                  return (
                    <div key={rating} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{rating} stars</span>
                          {renderStars(rating, 'sm')}
                        </div>
                        <div className="text-sm text-gray-600">
                          {count} ({percentage.toFixed(0)}%)
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percentage}%` }}
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Business Info */}
            {selectedBusiness && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business ID
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-gray-50 text-sm font-mono border border-gray-300 rounded truncate">
                        {selectedBusiness.id}
                      </code>
                      <button
                        onClick={() => copyToClipboard(selectedBusiness.id)}
                        className="p-2 hover:bg-gray-100 rounded"
                        title="Copy Business ID"
                      >
                        {copied ? (
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <Copy className="h-5 w-5 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {selectedBusiness.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-emerald-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-700">Email</div>
                          <div className="text-gray-900">{selectedBusiness.email}</div>
                        </div>
                      </div>
                    )}
                    
                    {selectedBusiness.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-emerald-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-700">Phone</div>
                          <div className="text-gray-900">{selectedBusiness.phone}</div>
                        </div>
                      </div>
                    )}
                    
                    {selectedBusiness.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-emerald-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-700">Website</div>
                          <a 
                            href={selectedBusiness.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-800"
                          >
                            {selectedBusiness.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* API Integration */}
            <div className="bg-emerald-900 text-white rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-4">API Integration</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-emerald-200 mb-2">API Endpoint</div>
                  <div className="bg-emerald-800 p-3 rounded">
                    <code className="text-sm text-emerald-300 break-all">
                      GET {apiUrl}/api/business/{'{business_id}'}/reviews
                    </code>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-emerald-200 mb-2">Example Usage</div>
                  <div className="bg-emerald-800 p-3 rounded">
                    <pre className="text-sm text-emerald-300 overflow-x-auto">
{`fetch('https://ahmed7241-aitimaadapi.hf.space/api/business/${selectedBusiness?.id}/reviews')
  .then(res => res.json())
  .then(data => console.log(data.reviews));`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}