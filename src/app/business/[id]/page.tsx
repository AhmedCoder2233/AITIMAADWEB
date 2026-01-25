'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Star, MapPin, Phone, Globe, Mail, Shield, Lock, AlertCircle, UserPlus, CheckCircle, XCircle, Building, ExternalLink, X, Upload, Calendar } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  profile_url: string;
  logo_url: string;
  google_rating: number;
  google_reviews_count: number;
  our_rating: number;
  is_verified: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  experience_date: string;
  proof_url: string;
  proof_type: string;
  profiles: {
    full_name: string;
    profile_url: string | null;
    is_verified: boolean;
  };
}

interface Notification {
  message: string;
  type: 'success' | 'error' | 'warning';
}

export default function BusinessPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showBusinessUserModal, setShowBusinessUserModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [experienceDate, setExperienceDate] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchBusiness();
      fetchReviews();
    }
  }, [params.id]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message: string, type: 'success' | 'error' | 'warning') => {
    setNotification({ message, type });
  };

  const fetchBusiness = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setBusiness(data);
    } catch (error) {
      console.error('Error fetching business:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (
            full_name,
            profile_url,
            is_verified
          )
        `)
        .eq('business_id', params.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleAddReview = () => {
    if (business?.verification_status !== 'verified') return;
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (profile?.user_type === 'business') {
      setShowBusinessUserModal(true);
      return;
    }
    if (profile?.user_type === 'customer' && !profile.is_verified) {
      setShowVerificationModal(true);
      return;
    }
    setShowReviewForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showNotification('File is too large! Please upload a file smaller than 10MB.', 'error');
      e.target.value = '';
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      showNotification('Invalid file type! Please upload JPG, PNG, GIF or MP4 files only.', 'error');
      e.target.value = '';
      return;
    }

    setProofFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rating || !comment || !experienceDate || !proofFile) {
      showNotification('Please fill in all required fields before submitting.', 'warning');
      return;
    }

    try {
      setSubmitting(true);

      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('business_id', business?.id)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (existingReview) {
        showNotification('You already reviewed this business. Only one review per business is allowed.', 'warning');
        setSubmitting(false);
        return;
      }

      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `reviews/${business?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('review-proofs')
        .upload(filePath, proofFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('review-proofs')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('reviews')
        .insert({
          business_id: business?.id,
          user_id: user?.id,
          rating,
          comment,
          experience_date: experienceDate,
          proof_url: publicUrl,
          proof_type: proofFile.type.startsWith('image/') ? 'image' : 'video',
        });

      if (insertError) throw insertError;

      setShowReviewForm(false);
      setRating(0);
      setComment('');
      setExperienceDate('');
      setProofFile(null);
      setProofPreview(null);
      
      await fetchReviews();
      showNotification('Review submitted successfully! Thank you for sharing your experience.', 'success');
    } catch (error) {
      console.error('Error submitting review:', error);
      showNotification('Failed to submit review. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto mb-3"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Business Not Found</h1>
          <p className="text-gray-600">The business you're looking for doesn't exist or may have been removed.</p>
        </div>
      </div>
    );
  }

  const avgRating = business.google_rating || business.our_rating || 0;
  const reviewCount = business.google_reviews_count || reviews.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-slideIn">
          <div className={`rounded-lg shadow-xl p-4 flex items-start gap-3 ${
            notification.type === 'success' ? 'bg-green-50 border-l-4 border-green-500' :
            notification.type === 'error' ? 'bg-red-50 border-l-4 border-red-500' :
            'bg-amber-50 border-l-4 border-amber-500'
          }`}>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                notification.type === 'success' ? 'text-green-800' :
                notification.type === 'error' ? 'text-red-800' :
                'text-amber-800'
              }`}>
                {notification.message}
              </p>
            </div>
            <button onClick={() => setNotification(null)} className="flex-shrink-0 text-gray-600 hover:text-gray-800">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Login Required</h3>
            </div>
            <p className="text-gray-600 mb-6">You need to be logged in as a verified customer to add a review.</p>
            <div className="space-y-3">
              <button
                onClick={() => { setShowLoginModal(false); router.push('/login?type=customer'); }}
                className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
              >
                Login as Customer
              </button>
              <button
                onClick={() => { setShowLoginModal(false); router.push('/signup?type=customer'); }}
                className="w-full px-4 py-2.5 border-2 border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50 transition flex items-center justify-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Sign up as Customer
              </button>
              <button onClick={() => setShowLoginModal(false)} className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showVerificationModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Verification Required</h3>
            </div>
            <p className="text-gray-600 mb-6">To maintain trust and prevent fake reviews, we require all customers to verify their accounts before posting reviews.</p>
            <div className="space-y-3">
              <button
                onClick={() => { setShowVerificationModal(false); router.push('/verify-account'); }}
                className="w-full px-4 py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition"
              >
                Verify Your Account
              </button>
              <button onClick={() => setShowVerificationModal(false)} className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showBusinessUserModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Building className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Business Account Detected</h3>
            </div>
            <p className="text-gray-600 mb-6">Business accounts cannot post reviews. Please login with a customer account to share your experience.</p>
            <div className="space-y-3">
              <button
                onClick={() => { setShowBusinessUserModal(false); router.push('/login?type=customer'); }}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Login as Customer
              </button>
              <button
                onClick={() => { setShowBusinessUserModal(false); router.push('/signup?type=customer'); }}
                className="w-full px-4 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition flex items-center justify-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Create Customer Account
              </button>
              <button onClick={() => setShowBusinessUserModal(false)} className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {business.profile_url ? (
                <img src={business.profile_url} alt={business.name} className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover flex-shrink-0 border" />
              ) : (
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 border">
                  <span className="text-2xl font-bold text-gray-400">{business.name.charAt(0)}</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{business.name}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs sm:text-sm font-medium">{business.category}</span>
                  {business.verification_status === 'verified' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-100 text-green-700 rounded text-xs sm:text-sm font-medium">
                      <Shield className="h-3 w-3" />Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-100 text-red-700 rounded text-xs sm:text-sm font-medium">
                      <Lock className="h-3 w-3" />Unverified
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-1 sm:gap-2 bg-green-50 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg">
                <Star className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 fill-current flex-shrink-0" />
                <span className="font-bold text-gray-900 text-lg sm:text-xl">{avgRating.toFixed(1)}</span>
              </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
  {/* Claim Business Button */}
  <button
    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm transition whitespace-nowrap hover:bg-blue-700 w-full sm:w-auto text-center"
  >
    Claim this business? 
    <br className="sm:hidden" />
    <br  className='hidden sm:block'/>
    Call us at (+92 331-2705270)
  </button>
  
  {/* Write Review Button */}
  <button
    onClick={handleAddReview}
    disabled={business.verification_status !== 'verified'}
    className={`px-4 py-2.5 rounded-lg font-medium text-sm transition whitespace-nowrap w-full sm:w-auto text-center ${
      business.verification_status === 'verified' 
        ? 'bg-green-600 text-white hover:bg-green-700' 
        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
    }`}
  >
    Write Review
  </button>
</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            {business.description && (
              <div className="bg-white rounded-lg p-4 sm:p-6 border">
                <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
                <p className="text-gray-700 leading-relaxed">{business.description}</p>
              </div>
            )}

            {showReviewForm && (
              <div className="bg-white rounded-lg border shadow-lg overflow-hidden">
                <div className="bg-green-600 px-4 sm:px-6 py-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Write Your Review</h3>
                  <button onClick={() => setShowReviewForm(false)} className="text-white hover:bg-green-700 p-1 rounded-lg transition">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmitReview} className="p-4 sm:p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                    <input type="text" value={profile?.full_name || ''} disabled className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating <span className="text-red-500">*</span></label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star className={`h-8 w-8 sm:h-10 sm:w-10 transition-colors ${star <= (hoverRating || rating) ? 'text-green-500 fill-current' : 'text-gray-300'}`} />
                        </button>
                      ))}
                      {rating > 0 && <span className="ml-2 text-sm font-medium text-gray-700">{rating} star{rating !== 1 ? 's' : ''}</span>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Experience <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        value={experienceDate}
                        onChange={(e) => setExperienceDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Proof <span className="text-red-500">*</span></label>
                    <p className="text-xs text-gray-500 mb-2">Max 10MB • JPG, PNG, GIF, MP4</p>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-green-500 transition">
                      {proofPreview ? (
                        <div className="relative">
                          {proofFile?.type.startsWith('image/') ? (
                            <img src={proofPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                          ) : (
                            <video src={proofPreview} controls className="max-h-48 mx-auto rounded-lg" />
                          )}
                          <button
                            type="button"
                            onClick={() => { setProofFile(null); setProofPreview(null); }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                          <input type="file" accept="image/*,video/*" onChange={handleFileChange} required className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Review <span className="text-red-500">*</span></label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={5}
                      required
                      placeholder="Share details of your experience..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">{comment.length} characters</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-lg p-4 sm:p-6 border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Reviews</h2>
                  <p className="text-sm text-gray-600 mt-0.5">{reviewCount} total reviews</p>
                </div>
              </div>

              {business.verification_status !== 'verified' && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Reviews Unavailable</p>
                      <p className="text-sm text-gray-600 mt-1">This business is currently unverified. Reviews will be enabled once verification is complete.</p>
                    </div>
                  </div>
                </div>
              )}

              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-t pt-4 first:border-t-0 first:pt-0">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {review.profiles.profile_url ? (
                            <img src={review.profiles.profile_url} alt={review.profiles.full_name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-sm font-semibold text-gray-400">{review.profiles.full_name?.charAt(0) || 'U'}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900 truncate">{review.profiles.full_name || 'Anonymous'}</p>
                            {review.profiles.is_verified && <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-green-600 fill-current' : 'text-gray-300'}`} />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                          </div>
                          {review.proof_url && (
                            <div className="mb-2">
                              {review.proof_type === 'image' ? (
                                <img src={review.proof_url} alt="Review proof" className="max-h-48 rounded-lg border" />
                              ) : (
                                <video src={review.proof_url} controls className="max-h-48 rounded-lg border" />
                              )}
                            </div>
                          )}
                          <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                          <p className="text-xs text-gray-500 mt-2">Experience date: {new Date(review.experience_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No reviews yet</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {business.verification_status === 'verified' ? 'Be the first to review this business!' : 'Reviews will be enabled once this business is verified.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-4 sm:p-6 border">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700 min-w-0">
                    <p>{business.address}</p>
                    <p>{business.city}, {business.country}</p>
                  </div>
                </div>
                {business.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <a href={`tel:${business.phone}`} className="text-sm text-gray-700 hover:text-green-600 transition">{business.phone}</a>
                  </div>
                )}
                {business.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <a href={`mailto:${business.email}`} className="text-sm text-gray-700 hover:text-green-600 transition truncate">{business.email}</a>
                  </div>
                )}
                {business.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:text-green-700 transition inline-flex items-center gap-1 truncate">
                      Visit Website
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 sm:p-6 text-white">
              <h3 className="text-lg font-bold mb-4">Review Guidelines</h3>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-300">Share your genuine experience</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-300">Be specific and helpful</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-300">Verified customers only</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-300">Provide photo/video proof</p>
                </div>
              </div>
            </div>

            {!user && (
              <div className="bg-green-600 rounded-lg p-4 sm:p-6 text-white">
                <h3 className="text-lg font-bold mb-2">Join Our Community</h3>
                <p className="text-green-100 text-sm mb-4">Sign up to share your experiences and help others.</p>
                <div className="space-y-2">
                  <button onClick={() => router.push('/signup?type=customer')} className="w-full px-4 py-2 bg-white text-green-600 rounded-lg font-medium hover:bg-gray-100 transition text-sm">
                    Sign Up Free
                  </button>
                  <button onClick={() => router.push('/login?type=customer')} className="w-full px-4 py-2 border-2 border-white text-white rounded-lg font-medium hover:bg-white/10 transition text-sm">
                    Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}