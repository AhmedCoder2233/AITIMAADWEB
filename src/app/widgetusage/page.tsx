'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../app/contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { 
  Star, 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  MessageSquare,
  Calendar,
  Copy,
  CheckCircle,
  ChevronDown,
  Building,
  Globe,
  Mail,
  BarChart3,
  Users,
  Filter,
  Search,
  Download,
  MoreVertical,
  Briefcase,
  ShieldCheck,
  Lock,
  ExternalLink,
  ArrowRight,
  Zap,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Award,
  LineChart,
  PieChart,
  BarChart,
  FileText,
  FileJson,
  FileArchive,
  Printer
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface Review {
  rating: number;
  comment: string;
  experience_date?: string;
  proof_url?: string;
  proof_type?: string;
  created_at: string;
  updated_at: string;
  business_id: string;
  business_user_id: string;
  user_full_name: string;
  user_avatar_url: string;
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
  logo_url?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  subscription_status?: string;
}

interface AnalyticsData {
  totalRating: number;
  reviewsCount: number;
  ratingBreakdown: Record<number, number>;
  monthlyTrend: { month: string; count: number; avgRating: number }[];
  sentimentScore: number;
  responseRate: number;
  topReviewers: { name: string; count: number }[];
  ratingTrend: number;
  reviewsTrend: number;
}

interface ExportData {
  businessInfo: Business;
  reviews: Review[];
  analytics: AnalyticsData;
  summary: {
    totalReviews: number;
    averageRating: number;
    dateRange: string;
    ratingDistribution: Record<number, number>;
  };
}

export default function ReviewsWidgetPage() {
  const { profile, user, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [copied, setCopied] = useState(false);
  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Filter reviews based on search query
  const filteredReviews = reviews.filter(review =>
    review.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.user_full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.rating.toString().includes(searchQuery)
  );

  // Fetch user's businesses
  const fetchUserBusinesses = async () => {
    if (!user?.id) {
      console.log('No user ID found');
      return;
    }
    
    if (profile?.user_type !== 'business') {
      console.log('User is not a business account');
      return;
    }

    try {
      setBusinessLoading(true);
      setError(null);
      
      // Try different approaches to fetch businesses
      let businessesData: any[] = [];

      // Method 1: Try by user_id
      const { data: byUserId, error: userIdError } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id);
      
      if (!userIdError && byUserId && byUserId.length > 0) {
        businessesData = byUserId;
      } 
      // Method 2: Try by created_by
      else {
        const { data: byCreatedBy, error: createdByError } = await supabase
          .from('businesses')
          .select('*')
          .eq('created_by', user.id);
        
        if (!createdByError && byCreatedBy && byCreatedBy.length > 0) {
          businessesData = byCreatedBy;
        }
      }

      if (businessesData && businessesData.length > 0) {
        // Ensure each business has user_id field
        const formattedBusinesses = businessesData.map(business => ({
          ...business,
          user_id: business.user_id || business.created_by || user.id,
          is_verified: business.is_verified || false,
          subscription_status: business.subscription_status || 'inactive'
        }));
        
        setBusinesses(formattedBusinesses);
        // Select first business by default
        setSelectedBusiness(formattedBusinesses[0]);
      } else {
        // Create fallback business
        const fallbackBusiness: Business = {
          id: user.id,
          name: profile?.business_name || user.email?.split('@')[0] || 'My Business',
          email: user.email || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: user.id,
          is_verified: false,
          subscription_status: 'inactive'
        };
        setBusinesses([fallbackBusiness]);
        setSelectedBusiness(fallbackBusiness);
      }
    } catch (err) {
      console.error('Error fetching businesses:', err);
      setError('Failed to load businesses');
      
      // Create fallback business
      if (user?.id) {
        const fallbackBusiness: Business = {
          id: user.id,
          name: profile?.business_name || user.email?.split('@')[0] || 'My Business',
          email: user.email || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: user.id,
          is_verified: false,
          subscription_status: 'inactive'
        };
        setBusinesses([fallbackBusiness]);
        setSelectedBusiness(fallbackBusiness);
      }
    } finally {
      setBusinessLoading(false);
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
      
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (
            full_name,
            profile_url
          )
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      // Transform data to match your Review interface
      const formattedReviews: Review[] = (reviewsData || []).map(review => ({
        rating: review.rating,
        comment: review.comment,
        experience_date: review.experience_date,
        proof_url: review.proof_url,
        proof_type: review.proof_type,
        created_at: review.created_at,
        updated_at: review.updated_at,
        business_id: review.business_id,
        business_user_id: review.business_user_id || review.business_id,
        user_full_name: review.profiles?.full_name || 'Anonymous Customer',
        user_avatar_url: review.profiles?.profile_url || ''
      }));
      
      setReviews(formattedReviews);
      
      // Calculate analytics only for verified businesses
      if (selectedBusiness?.is_verified) {
        calculateAnalytics(formattedReviews);
      }
      
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, [selectedBusiness]);

  // Calculate analytics from reviews (only for verified businesses)
  const calculateAnalytics = (reviewsData: Review[]) => {
    if (reviewsData.length === 0) {
      setAnalytics({
        totalRating: 0,
        reviewsCount: 0,
        ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        monthlyTrend: [],
        sentimentScore: 0,
        responseRate: 0,
        topReviewers: [],
        ratingTrend: 0,
        reviewsTrend: 0
      });
      return;
    }

    const avg = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
    
    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsData.forEach(review => {
      const rating = Math.round(review.rating);
      if (rating >= 1 && rating <= 5) {
        breakdown[rating]++;
      }
    });

    // Calculate monthly trend (last 6 months)
    const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleString('default', { month: 'short' });
      const monthReviews = reviewsData.filter(review => {
        const reviewDate = new Date(review.created_at);
        return reviewDate.getMonth() === date.getMonth() && 
               reviewDate.getFullYear() === date.getFullYear();
      });
      return {
        month,
        count: monthReviews.length,
        avgRating: monthReviews.length > 0 ? 
          monthReviews.reduce((sum, r) => sum + r.rating, 0) / monthReviews.length : 0
      };
    }).reverse();

    // Calculate sentiment score (based on ratings)
    const sentimentScore = Math.min(100, Math.floor(avg * 20));

    // Calculate trends
    const ratingTrend = monthlyTrend.length >= 2 ? 
      ((monthlyTrend[monthlyTrend.length - 1].avgRating - monthlyTrend[monthlyTrend.length - 2].avgRating) / monthlyTrend[monthlyTrend.length - 2].avgRating) * 100 : 0;
    
    const reviewsTrend = monthlyTrend.length >= 2 ? 
      ((monthlyTrend[monthlyTrend.length - 1].count - monthlyTrend[monthlyTrend.length - 2].count) / monthlyTrend[monthlyTrend.length - 2].count) * 100 : 0;

    // Get top reviewers
    const reviewerCounts: Record<string, number> = {};
    reviewsData.forEach(review => {
      const name = review.user_full_name || 'Anonymous';
      reviewerCounts[name] = (reviewerCounts[name] || 0) + 1;
    });
    const topReviewers = Object.entries(reviewerCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Simulated response rate
    const responseRate = Math.min(100, Math.floor(Math.random() * 40) + 60);

    setAnalytics({
      totalRating: parseFloat(avg.toFixed(1)),
      reviewsCount: reviewsData.length,
      ratingBreakdown: breakdown,
      monthlyTrend,
      sentimentScore,
      responseRate,
      topReviewers,
      ratingTrend,
      reviewsTrend
    });
  };

  // ============ EXPORT FUNCTIONS ============
  const exportToCSV = () => {
    if (!selectedBusiness || !analytics) return;
    
    setExportLoading(true);
    
    try {
      // Prepare CSV data
      const csvData = [];
      
      // Header
      csvData.push('AITIMAAD - Business Analytics Report');
      csvData.push(`Business: ${selectedBusiness.name}`);
      csvData.push(`Generated: ${new Date().toLocaleString()}`);
      csvData.push('');
      
      // Summary Stats
      csvData.push('SUMMARY STATISTICS');
      csvData.push(`Total Reviews,${analytics.reviewsCount}`);
      csvData.push(`Average Rating,${analytics.totalRating.toFixed(1)}`);
      csvData.push(`Sentiment Score,${analytics.sentimentScore}/100`);
      csvData.push(`Response Rate,${analytics.responseRate}%`);
      csvData.push('');
      
      // Rating Distribution
      csvData.push('RATING DISTRIBUTION');
      csvData.push('Stars,Count,Percentage');
      for (let i = 5; i >= 1; i--) {
        const count = analytics.ratingBreakdown[i] || 0;
        const percentage = ((count / analytics.reviewsCount) * 100).toFixed(1);
        csvData.push(`${i},${count},${percentage}%`);
      }
      csvData.push('');
      
      // Monthly Trend
      csvData.push('MONTHLY TREND');
      csvData.push('Month,Review Count,Average Rating');
      analytics.monthlyTrend.forEach(item => {
        csvData.push(`${item.month},${item.count},${item.avgRating.toFixed(1)}`);
      });
      csvData.push('');
      
      // Top Reviewers
      csvData.push('TOP REVIEWERS');
      csvData.push('Rank,Name,Review Count');
      analytics.topReviewers.forEach((reviewer, index) => {
        csvData.push(`${index + 1},${reviewer.name},${reviewer.count}`);
      });
      csvData.push('');
      
      // Individual Reviews
      csvData.push('INDIVIDUAL REVIEWS');
      csvData.push('Date,Rating,Reviewer,Comment,Experience Date');
      reviews.forEach(review => {
        csvData.push([
          formatDate(review.created_at),
          review.rating,
          review.user_full_name || 'Anonymous',
          `"${review.comment.replace(/"/g, '""')}"`,
          review.experience_date ? formatDate(review.experience_date) : 'N/A'
        ].join(','));
      });
      
      // Create CSV blob
      const csvContent = csvData.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics_${selectedBusiness.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export data');
    } finally {
      setExportLoading(false);
      setShowExportMenu(false);
    }
  };

  const exportToJSON = () => {
    if (!selectedBusiness || !analytics) return;
    
    setExportLoading(true);
    
    try {
      const exportData: ExportData = {
        businessInfo: selectedBusiness,
        reviews: reviews,
        analytics: analytics,
        summary: {
          totalReviews: analytics.reviewsCount,
          averageRating: analytics.totalRating,
          dateRange: `${timeRange}`,
          ratingDistribution: analytics.ratingBreakdown
        }
      };
      
      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics_${selectedBusiness.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export data');
    } finally {
      setExportLoading(false);
      setShowExportMenu(false);
    }
  };

  const printReport = () => {
    if (!selectedBusiness || !analytics) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setError('Please allow popups to print report');
      return;
    }
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Analytics Report - ${selectedBusiness.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
          .header h1 { color: #10b981; margin: 0; }
          .section { margin-bottom: 30px; }
          .section h2 { color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
          .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px; }
          .stat-card { background: #f9fafb; padding: 15px; border-radius: 8px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #10b981; }
          .stat-label { color: #6b7280; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f9fafb; font-weight: bold; color: #374151; }
          .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; }
          @media print {
            body { padding: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>AITIMAAD Analytics Report</h1>
          <h2>${selectedBusiness.name}</h2>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="section">
          <h2>Summary Statistics</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${analytics.totalRating.toFixed(1)}</div>
              <div class="stat-label">Average Rating</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${analytics.reviewsCount}</div>
              <div class="stat-label">Total Reviews</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${analytics.sentimentScore}/100</div>
              <div class="stat-label">Sentiment Score</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${analytics.responseRate}%</div>
              <div class="stat-label">Response Rate</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2>Rating Distribution</h2>
          <table>
            <thead>
              <tr>
                <th>Stars</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${[5, 4, 3, 2, 1].map(rating => {
                const count = analytics.ratingBreakdown[rating] || 0;
                const percentage = ((count / analytics.reviewsCount) * 100).toFixed(1);
                return `
                  <tr>
                    <td>${'★'.repeat(rating)}</td>
                    <td>${count}</td>
                    <td>${percentage}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>Monthly Trend</h2>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Review Count</th>
                <th>Average Rating</th>
              </tr>
            </thead>
            <tbody>
              ${analytics.monthlyTrend.map(item => `
                <tr>
                  <td>${item.month}</td>
                  <td>${item.count}</td>
                  <td>${item.avgRating.toFixed(1)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>Top Reviewers</h2>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Review Count</th>
              </tr>
            </thead>
            <tbody>
              ${analytics.topReviewers.map((reviewer, index) => `
                <tr>
                  <td>#${index + 1}</td>
                  <td>${reviewer.name}</td>
                  <td>${reviewer.count}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>Recent Reviews (${reviews.length > 10 ? 'First 10' : 'All'})</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Rating</th>
                <th>Reviewer</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              ${reviews.slice(0, 10).map(review => `
                <tr>
                  <td>${formatDate(review.created_at)}</td>
                  <td>${'★'.repeat(Math.round(review.rating))}</td>
                  <td>${review.user_full_name || 'Anonymous'}</td>
                  <td>${review.comment.substring(0, 100)}${review.comment.length > 100 ? '...' : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>Report generated by AITIMAAD Analytics Dashboard</p>
          <p>${window.location.origin}</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 1000);
          }
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // ============ HELPER FUNCTIONS ============
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

  // Get user initials for avatar
  const getUserInitials = (fullName: string) => {
    if (!fullName) return 'U';
    const names = fullName.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  };

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
  if (authLoading || businessLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] gap-3 p-4">
        <div className="relative">
          <div className="w-12 h-12 border-3 border-emerald-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-12 h-12 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-600 text-sm">
          {businessLoading ? 'Loading businesses...' : 'Loading dashboard...'}
        </p>
      </div>
    );
  }

  // ============ UNVERIFIED BUSINESS UI ============
  if (selectedBusiness && !selectedBusiness.is_verified) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Reviews Dashboard</h1>
              <p className="text-sm text-gray-600">Manage your business reviews</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Business Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowBusinessDropdown(!showBusinessDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-emerald-500 transition-colors"
                >
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{selectedBusiness?.name}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                
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
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center justify-between ${
                            selectedBusiness?.id === business.id ? 'bg-gray-50' : ''
                          }`}
                        >
                          <div>
                            <div className="font-medium text-gray-900">{business.name}</div>
                            <div className="text-sm text-gray-500">
                              {business.is_verified ? (
                                <span className="text-emerald-600 flex items-center gap-1">
                                  <ShieldCheck className="h-3 w-3" />
                                  Premium
                                </span>
                              ) : (
                                <span className="text-gray-500">Free Plan</span>
                              )}
                            </div>
                          </div>
                          {business.is_verified && (
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Unverified Business Message - NO STATS SHOWN */}
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-6">
              <Lock className="h-10 w-10 text-gray-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Upgrade to Premium Analytics
            </h2>
            
            <p className="text-gray-600 mb-8 text-lg">
              Unlock advanced analytics and insights for {selectedBusiness.name}
            </p>
          </div>

          {/* Premium Features */}
          <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-xl p-6 text-white mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Premium Analytics Features
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center">
                  <LineChart className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">Interactive Charts</div>
                  <div className="text-emerald-200 text-sm">Real-time trends & graphs</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">Rating Analytics</div>
                  <div className="text-emerald-200 text-sm">Detailed breakdown & insights</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center">
                  <Download className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">Export Reports</div>
                  <div className="text-emerald-200 text-sm">CSV, JSON & Print formats</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">Sentiment Analysis</div>
                  <div className="text-emerald-200 text-sm">Customer satisfaction scores</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center">
                  <PieChart className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">Visual Reports</div>
                  <div className="text-emerald-200 text-sm">Pie charts & distribution graphs</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">Detailed Analytics</div>
                  <div className="text-emerald-200 text-sm">Monthly trends & comparisons</div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <a
              href="/pricing"
              className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold text-lg mb-4 shadow-lg hover:shadow-xl"
            >
              <Sparkles className="h-5 w-5" />
              Upgrade Now - $49/month
              <ArrowRight className="h-5 w-5" />
            </a>
            
            <p className="text-sm text-gray-600">
              Start 14-day free trial • Cancel anytime
            </p>
            
            <p className="text-xs text-gray-500 mt-2">
              Already have a subscription? <a href="/contact" className="text-emerald-600 hover:text-emerald-700">Contact support</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============ VERIFIED BUSINESS UI ============
  // Prepare chart data
  const ratingDistributionData = analytics ? [
    { name: '5 Stars', value: analytics.ratingBreakdown[5] || 0, color: '#10b981' },
    { name: '4 Stars', value: analytics.ratingBreakdown[4] || 0, color: '#34d399' },
    { name: '3 Stars', value: analytics.ratingBreakdown[3] || 0, color: '#6ee7b7' },
    { name: '2 Stars', value: analytics.ratingBreakdown[2] || 0, color: '#a7f3d0' },
    { name: '1 Star', value: analytics.ratingBreakdown[1] || 0, color: '#d1fae5' },
  ] : [];

  const monthlyTrendData = analytics?.monthlyTrend || [];
  const topReviewersData = analytics?.topReviewers || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-emerald-100 px-4 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              Premium Analytics Dashboard
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                <ShieldCheck className="h-3 w-3" />
                Verified Business
              </span>
            </h1>
            <p className="text-sm text-gray-600">Advanced insights for {selectedBusiness?.name}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Business Selector */}
            <div className="relative">
              <button
                onClick={() => setShowBusinessDropdown(!showBusinessDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 rounded-lg hover:border-emerald-500 transition-colors"
              >
                <Building className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">{selectedBusiness?.name}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              
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
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center justify-between ${
                          selectedBusiness?.id === business.id ? 'bg-gray-50' : ''
                        }`}
                      >
                        <div>
                          <div className="font-medium text-gray-900">{business.name}</div>
                          <div className="text-sm text-gray-500">
                            {business.is_verified ? (
                              <span className="text-emerald-600 flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" />
                                Premium
                              </span>
                            ) : (
                              <span className="text-gray-500">Free Plan</span>
                            )}
                          </div>
                        </div>
                        {business.is_verified && (
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Export Menu */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={exportLoading || loading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {exportLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export
              </button>
              
              {showExportMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-30 bg-black/20" 
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-40">
                    <button
                      onClick={exportToCSV}
                      disabled={exportLoading || !analytics}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 flex items-center gap-3 disabled:opacity-50"
                    >
                      <FileArchive className="h-4 w-4 text-emerald-600" />
                      <div>
                        <div className="font-medium">Export as CSV</div>
                        <div className="text-xs text-gray-500">Spreadsheet format</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={exportToJSON}
                      disabled={exportLoading || !analytics}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 flex items-center gap-3 disabled:opacity-50"
                    >
                      <FileJson className="h-4 w-4 text-emerald-600" />
                      <div>
                        <div className="font-medium">Export as JSON</div>
                        <div className="text-xs text-gray-500">Data format</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={printReport}
                      disabled={exportLoading || !analytics}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 disabled:opacity-50"
                    >
                      <Printer className="h-4 w-4 text-emerald-600" />
                      <div>
                        <div className="font-medium">Print Report</div>
                        <div className="text-xs text-gray-500">Printable format</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
            
            <button
              onClick={() => selectedBusiness && fetchReviews(selectedBusiness.id)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="flex items-center gap-2 mt-4">
          <span className="text-sm text-gray-600">Time Range:</span>
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {/* Search Bar */}
        <div className="mb-6">
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

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="relative">
              <div className="w-12 h-12 border-3 border-emerald-200 rounded-full"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        ) : (
          <>
            {/* Analytics Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Star className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    analytics?.ratingTrend && analytics.ratingTrend >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {analytics?.ratingTrend && analytics.ratingTrend >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {analytics?.ratingTrend ? Math.abs(analytics.ratingTrend).toFixed(1) : '0.0'}%
                  </div>
                </div>
                <div className="mb-2">
                  <div className="text-2xl font-bold text-gray-900">{analytics?.totalRating.toFixed(1) || '0.0'}</div>
                  <div className="text-sm text-gray-600">Average Rating</div>
                </div>
                <div className="flex items-center gap-2">
                  {renderStars(analytics?.totalRating || 0, 'sm')}
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    analytics?.reviewsTrend && analytics.reviewsTrend >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {analytics?.reviewsTrend && analytics.reviewsTrend >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {analytics?.reviewsTrend ? Math.abs(analytics.reviewsTrend).toFixed(1) : '0.0'}%
                  </div>
                </div>
                <div className="mb-2">
                  <div className="text-2xl font-bold text-gray-900">{analytics?.reviewsCount || 0}</div>
                  <div className="text-sm text-gray-600">Total Reviews</div>
                </div>
                <div className="text-sm text-gray-500">
                  {analytics?.monthlyTrend[analytics.monthlyTrend.length - 1]?.count || 0} this month
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="text-sm font-medium text-emerald-600">
                    +5.2%
                  </div>
                </div>
                <div className="mb-2">
                  <div className="text-2xl font-bold text-gray-900">{analytics?.responseRate || 0}%</div>
                  <div className="text-sm text-gray-600">Response Rate</div>
                </div>
                <div className="text-sm text-gray-500">
                  Industry average: 68%
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Target className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="text-sm font-medium text-emerald-600">
                    Excellent
                  </div>
                </div>
                <div className="mb-2">
                  <div className="text-2xl font-bold text-gray-900">{analytics?.sentimentScore || 0}/100</div>
                  <div className="text-sm text-gray-600">Sentiment Score</div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${analytics?.sentimentScore || 0}%` }}
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Monthly Trend Chart */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-emerald-600" />
                  Monthly Review Trends
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        name="Reviews Count" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avgRating" 
                        name="Avg Rating" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Rating Distribution Pie Chart */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-emerald-600" />
                  Rating Distribution
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                     <Pie
  data={ratingDistributionData}
  cx="50%"
  cy="50%"
  labelLine={false}
  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
  outerRadius={80}
  fill="#8884d8"
  dataKey="value"
>
  {ratingDistributionData.map((entry, index) => (
    <Cell key={`cell-${index}`} fill={entry.color} />
  ))}
</Pie>
                      <Tooltip 
                        formatter={(value) => [`${value} reviews`, 'Count']}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {ratingDistributionData.map((item, index) => (
                    <div key={index} className="text-center">
                      <div className="text-sm font-medium text-gray-900">{item.value}</div>
                      <div className="text-xs text-gray-500">{item.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Reviews */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Reviews</h3>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Filter className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
                    <MessageSquare className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Reviews Yet</h3>
                  <p className="text-gray-600">Start collecting reviews from your customers.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.slice(0, 5).map((review, index) => (
                    <div 
                      key={`${review.business_user_id}-${index}`}
                      className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <span className="font-medium text-emerald-700">
                              {getUserInitials(review.user_full_name)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {review.user_full_name || 'Anonymous Customer'}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              {renderStars(review.rating, 'sm')}
                              <span>{review.rating}.0</span>
                              <span>•</span>
                              <span>{formatDate(review.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <button className="p-1 hover:bg-gray-100 rounded-lg">
                          <MoreVertical className="h-5 w-5 text-gray-400" />
                        </button>
                      </div>
                      
                      <p className="text-gray-700 mb-3 leading-relaxed">{review.comment}</p>
                      
                      <div className="flex items-center gap-2 text-sm">
                        {review.experience_date && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
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

            {/* Business Info & API */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Business Info */}
              {selectedBusiness && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
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
              <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-xl p-5 text-white">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  API Integration
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-emerald-200 mb-2">API Endpoint</div>
                    <div className="bg-emerald-800 p-3 rounded">
                      <code className="text-sm text-emerald-300 break-all">
                        GET https://ahmed7241-aitimaadapi.hf.space/api/business/{'{business_id}'}/reviews
                      </code>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-emerald-200 mb-2">JavaScript Example</div>
                    <div className="bg-emerald-800 p-3 rounded">
                      <pre className="text-sm text-emerald-300 overflow-x-auto">
{`fetch('https://ahmed7241-aitimaadapi.hf.space/api/business/your_id/reviews')
  .then(res => res.json())
  .then(data => console.log(data));`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}