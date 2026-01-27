'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, MessageSquare, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Cache configuration
const CACHE_KEYS = {
  LATEST_BUSINESSES: 'latest_businesses_cache',
  LAST_FETCH: 'last_fetch_timestamp'
};

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export default function LatestBusinessesSlider() {
  const greenColor = '#15803D';
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoSlideInterval = useRef<NodeJS.Timeout | null>(null);
  
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [duplicatedBusinesses, setDuplicatedBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const autoSlideSpeed = 3000; // 3 seconds per slide

  // Helper function to get emoji based on category
  const getCategoryEmoji = (category: string): string => {
    const categoryLower = category?.toLowerCase() || '';
    const emojiMap: Record<string, string> = {
      'fashion': '👔',
      'clothing': '👗',
      'textile': '🧵',
      'garments': '👚',
      'linen': '🛏️',
      'home': '🏠',
      'retail': '🏢',
      'furniture': '🛋️',
      'electronics': '📱',
      'food': '🍽️',
      'restaurant': '🍴',
      'beauty': '💄',
      'health': '🏥',
      'medical': '⚕️',
      'education': '📚',
      'school': '🏫',
      'automotive': '🚗',
      'sports': '⚽',
      'entertainment': '🎬',
      'travel': '✈️',
      'hotel': '🏨',
      'service': '🛠️',
      'technology': '💻',
      'software': '🔧',
      'consulting': '📊',
      'manufacturing': '🏭',
      'wholesale': '📦',
      'retailer': '🛒'
    };

    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (categoryLower.includes(key)) {
        return emoji;
      }
    }

    const defaultEmojis = ['🏢', '🏭', '🏪', '🏣', '🏤', '🏦', '💼', '🎯', '⭐', '🏆'];
    return defaultEmojis[Math.floor(Math.random() * defaultEmojis.length)];
  };

  // Format date to relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Fetch latest businesses
  const fetchLatestBusinesses = async () => {
    setLoading(true);
    
    // Check cache first
    const cachedData = localStorage.getItem(CACHE_KEYS.LATEST_BUSINESSES);
    const lastFetch = localStorage.getItem(CACHE_KEYS.LAST_FETCH);
    
    if (cachedData && lastFetch) {
      const timeDiff = Date.now() - parseInt(lastFetch);
      if (timeDiff < CACHE_DURATION) {
        const cachedBusinesses = JSON.parse(cachedData);
        setBusinesses(cachedBusinesses);
        setDuplicatedBusinesses([...cachedBusinesses, ...cachedBusinesses]);
        setLoading(false);
        return;
      }
    }

    try {
      // Fetch latest 15 businesses regardless of verification status
      const { data: latestBusinesses, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) throw error;

      // Transform businesses with emojis and formatted dates
      const transformedBusinesses = (latestBusinesses || []).map((business: any) => ({
        id: business.id,
        name: business.name,
        logo: getCategoryEmoji(business.category),
        rating: business.our_rating ? parseFloat(business.our_rating) : null,
        reviews: business.our_reviews_count || 0,
        category: business.category,
        city: business.city,
        country: business.country,
        isVerified: business.is_verified,
        createdAt: business.created_at,
        description: business.description,
        phone: business.phone,
        email: business.email,
        addedTime: formatRelativeTime(business.created_at)
      }));

      setBusinesses(transformedBusinesses);
      setDuplicatedBusinesses([...transformedBusinesses, ...transformedBusinesses]);

      // Update cache
      localStorage.setItem(CACHE_KEYS.LATEST_BUSINESSES, JSON.stringify(transformedBusinesses));
      localStorage.setItem(CACHE_KEYS.LAST_FETCH, Date.now().toString());

    } catch (error) {
      console.error('Error fetching latest businesses:', error);
      
      // Fallback to dummy data
      const fallbackBusinesses = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `New Business ${i + 1}`,
        logo: ['🏢', '🏭', '🏪', '🏣', '🏤'][i % 5],
        rating: 4.0 + Math.random() * 1.0,
        reviews: Math.floor(Math.random() * 100),
        category: ['Retail', 'Service', 'Food', 'Technology', 'Fashion'][i % 5],
        city: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad'][i % 5],
        country: 'Pakistan',
        isVerified: Math.random() > 0.5,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        addedTime: `${i === 0 ? 'Just now' : `${i}d ago`}`
      }));
      
      setBusinesses(fallbackBusinesses);
      setDuplicatedBusinesses([...fallbackBusinesses, ...fallbackBusinesses]);
    } finally {
      setLoading(false);
    }
  };

  // Start auto-slide with smooth animation
  const startAutoSlide = () => {
    if (autoSlideInterval.current) {
      clearInterval(autoSlideInterval.current);
    }
    
    autoSlideInterval.current = setInterval(() => {
      setCurrentPosition(prev => {
        const cardWidth = 300; // Width of each card
        const gap = 24; // Gap between cards
        const nextPosition = prev + cardWidth + gap;
        
        // Reset to start when we reach the end of the duplicated set
        if (nextPosition >= (cardWidth + gap) * businesses.length) {
          // Instantly jump back to start (this creates infinite loop illusion)
          setTimeout(() => {
            setCurrentPosition(0);
          }, 50);
          return 0;
        }
        
        return nextPosition;
      });
    }, autoSlideSpeed);
  };

  // Stop auto-slide
  const stopAutoSlide = () => {
    if (autoSlideInterval.current) {
      clearInterval(autoSlideInterval.current);
      autoSlideInterval.current = null;
    }
  };

  // Initialize auto-slide
  useEffect(() => {
    if (businesses.length > 0 && !isHovered) {
      startAutoSlide();
    }
    
    return () => {
      stopAutoSlide();
    };
  }, [businesses.length, isHovered]);

  // Handle hover
  const handleMouseEnter = () => {
    setIsHovered(true);
    stopAutoSlide();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (businesses.length > 0) {
      startAutoSlide();
    }
  };

  // Manual navigation
  const nextSlide = () => {
    stopAutoSlide();
    const cardWidth = 300;
    const gap = 24;
    const nextPosition = currentPosition + cardWidth + gap;
    
    if (nextPosition >= (cardWidth + gap) * businesses.length) {
      setCurrentPosition(0);
    } else {
      setCurrentPosition(nextPosition);
    }
    
    // Resume auto-slide after manual interaction
    setTimeout(() => {
      if (!isHovered && businesses.length > 0) {
        startAutoSlide();
      }
    }, 1000);
  };

  const prevSlide = () => {
    stopAutoSlide();
    const cardWidth = 300;
    const gap = 24;
    const prevPosition = currentPosition - cardWidth - gap;
    
    if (prevPosition < 0) {
      // Go to end
      setCurrentPosition((cardWidth + gap) * (businesses.length - 1));
    } else {
      setCurrentPosition(prevPosition);
    }
    
    // Resume auto-slide after manual interaction
    setTimeout(() => {
      if (!isHovered && businesses.length > 0) {
        startAutoSlide();
      }
    }, 1000);
  };

  // Initialize
  useEffect(() => {
    fetchLatestBusinesses();
  }, []);

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center mb-4 px-4 py-2 bg-green-50 rounded-full border border-green-200">
            <Calendar className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-700">Recently Added</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Latest Businesses on <span style={{ color: greenColor }}>AITIMAAD</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Discover the newest additions to our platform. Fresh businesses added daily!
          </p>
        </motion.div>

        {/* Premium Carousel Container */}
        <div className="relative max-w-7xl mx-auto">
          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-20 h-20 border-4 border-green-200 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-20 h-20 border-4 border-green-500 rounded-full animate-spin border-t-transparent"></div>
                </div>
                <p className="mt-4 text-gray-600">Loading latest businesses...</p>
              </div>
            </div>
          ) : businesses.length > 0 ? (
            <>
              {/* Navigation Buttons */}
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-8 z-20 w-12 h-12 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all duration-300 hover:scale-110"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>

              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-8 z-20 w-12 h-12 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all duration-300 hover:scale-110"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>

              {/* Carousel Window with Gradient Edges */}
              <div 
                className="relative overflow-hidden py-8"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {/* Left gradient fade */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
                
                {/* Right gradient fade */}
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />
                
                {/* Carousel Track */}
                <div 
                  ref={containerRef}
                  className="relative"
                >
                  <motion.div
                    ref={sliderRef}
                    className="flex gap-6"
                    animate={{ x: -currentPosition }}
                    transition={{ type: "tween", duration: 0.7, ease: "easeInOut" }}
                    style={{ width: 'max-content' }}
                  >
                    {duplicatedBusinesses.map((business, index) => (
                      <div
                        key={`${business.id}-${index}`}
                        className="flex-shrink-0 w-[300px]"
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.05 }}
                          className="h-full bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 group relative overflow-hidden"
                        >
                          {/* New Badge - Only for first 3 cards in the original set */}
                          {index < 3 && (
                            <div className="absolute top-4 right-4 z-10">
                              <div className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                                NEW
                              </div>
                            </div>
                          )}
                          
                          {/* Logo/Category */}
                          <div className="flex justify-center mb-6">
                            <div className="relative">
                              <div className="text-6xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                {business.logo}
                              </div>
                              <div className="absolute -inset-4 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>
                          </div>
                          
                          {/* Business Name */}
                          <h3 className="text-xl font-bold text-gray-900 text-center mb-3 line-clamp-1 group-hover:text-green-700 transition-colors duration-300">
                            {business.name}
                          </h3>
                          
                          {/* Category & Location */}
                          <div className="flex flex-col items-center justify-center mb-4 space-y-2">
                            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                              {business.category || 'Business'}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span className="line-clamp-1">{business.city || 'Location'}, {business.country}</span>
                            </div>
                          </div>
                          
                          {/* Added Time */}
                          <div className="flex items-center justify-center mb-4">
                            <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                              <Calendar className="w-3 h-3 mr-1" />
                              Added {business.addedTime}
                            </div>
                          </div>
                          
                          {/* Rating & Reviews */}
                          <div className="flex flex-col items-center justify-center mb-4 space-y-2">
                            {business.rating !== null ? (
                              <>
                                <div className="flex items-center">
                                  <div className="flex items-center space-x-0.5">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-5 h-5 ${
                                          i < Math.floor(business.rating) 
                                            ? 'text-yellow-400 fill-yellow-400' 
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="ml-2 text-gray-800 font-bold">
                                    {business.rating.toFixed(1)}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600">
                                  <MessageSquare className="w-4 h-4 inline mr-1" />
                                  {business.reviews} reviews
                                </div>
                              </>
                            ) : (
                              <div className="text-sm text-gray-500 italic">
                                No ratings yet
                              </div>
                            )}
                          </div>
                          
                          {/* Verification Status */}
                          <div className="text-center mb-2">
                            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                              business.isVerified
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                              <div className={`w-2 h-2 rounded-full mr-2 ${business.isVerified ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                              {business.isVerified ? 'Verified Business' : 'Pending Verification'}
                            </div>
                          </div>
                          
                          {/* Hover Gradient Border */}
                          <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-green-300 transition-all duration-500 pointer-events-none"></div>
                        </motion.div>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </div>
                      </>
          ) : (
            <div className="text-center py-16 text-gray-500">
              No businesses found. Check back later for new additions!
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        /* Custom scrollbar hiding */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}