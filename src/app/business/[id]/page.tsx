'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Star, MapPin, Phone, Globe, Mail, Shield, Lock, AlertCircle, 
  UserPlus, CheckCircle, XCircle, Building, ExternalLink, X, 
  Upload, Calendar, MessageSquare, ThumbsUp, HelpCircle,
  ChevronLeft, ChevronRight, Users, Award, Clock, Sparkles,
  TrendingUp, Filter, Search, MessageCircle, Plus, Save
} from 'lucide-react';

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
  user_id: string;
}

interface Review {
  id: string;
  business_id: string;
  business_user_id: string; // ✅ New column
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

interface Comment {
  id: string;
  business_id: string;
  user_id: string;
  content: string;
  likes: number;
  is_answer: boolean;
  parent_id: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    profile_url: string | null;
    is_verified: boolean;
    user_type: string;
  };
  replies?: Comment[];
  user_liked?: boolean;
}

interface Notification {
  message: string;
  type: 'success' | 'error' | 'warning';
}

interface DraftReview {
  id?: string;
  business_id: string;
  user_id?: string;
  device_id?: string;
  user_email?: string;
  rating: number;
  comment: string;
  experience_date: string;
  proof_file_data?: string;
  proof_file_name?: string;
  proof_file_type?: string;
  proof_url?: string;
  proof_type?: string;
  status: 'draft' | 'pending' | 'published';
  created_at: string;
  updated_at: string;
}

export default function BusinessPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [similarBusinesses, setSimilarBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showBusinessUserModal, setShowBusinessUserModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [activeTab, setActiveTab] = useState<'reviews' | 'questions'>('reviews');
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [experienceDate, setExperienceDate] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [draftReview, setDraftReview] = useState<DraftReview | null>(null);
  const [isEditingDraft, setIsEditingDraft] = useState(false);

  const getDeviceId = () => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  };

  useEffect(() => {
    if (params.id) {
      fetchBusiness();
    }
  }, [params.id]);

  useEffect(() => {
    if (business) {
      fetchReviews();
      fetchComments();
      fetchSimilarBusinesses();
      checkForDraftReview();
    }
  }, [business, user]);

  useEffect(() => {
    if (business?.id) {
      const channel = supabase
        .channel(`comments-${business.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'comments',
            filter: `business_id=eq.${business.id}`
          },
          () => {
            fetchComments();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [business?.id]);

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
    if (!business?.user_id) return;
    
    try {
      // ✅ FIXED: Use business_user_id instead of business_id
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
        .eq('business_user_id', business.user_id) // ✅ Changed to business_user_id
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select('*')
        .eq('business_id', business?.id)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      const allCommentIds: string[] = [];
      const allUserIds = new Set<string>();

      commentsData.forEach((comment: any) => {
        allCommentIds.push(comment.id);
        if (comment.user_id) allUserIds.add(comment.user_id);
      });

      const { data: allRepliesData } = await supabase
        .from('comments')
        .select('*')
        .in('parent_id', allCommentIds)
        .order('created_at', { ascending: true });

      const repliesByParentId: Record<string, any[]> = {};
      if (allRepliesData) {
        allRepliesData.forEach((reply: any) => {
          if (reply.user_id) allUserIds.add(reply.user_id);
          
          if (!repliesByParentId[reply.parent_id]) {
            repliesByParentId[reply.parent_id] = [];
          }
          repliesByParentId[reply.parent_id].push(reply);
        });
      }

      let profileMap: Record<string, any> = {};
      if (allUserIds.size > 0) {
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, profile_url, user_type')
          .in('user_id', Array.from(allUserIds));

        if (allProfiles) {
          allProfiles.forEach((profile: any) => {
            profileMap[profile.user_id] = profile;
          });
        }
      }

      const userLikes = new Set<string>();
      if (user && allCommentIds.length > 0) {
        const { data: likeData } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .in('comment_id', allCommentIds)
          .eq('user_id', user.id);

        if (likeData) {
          likeData.forEach((like: any) => {
            userLikes.add(like.comment_id);
          });
        }
      }

      const defaultProfile = {
        full_name: 'Unknown User',
        profile_url: null,
        is_verified: false,
        user_type: 'customer'
      };

      const commentsWithDetails: Comment[] = commentsData.map((comment: any) => {
        const replies = (repliesByParentId[comment.id] || []).map((reply: any) => ({
          ...reply,
          profiles: profileMap[reply.user_id] || defaultProfile
        }));

        return {
          ...comment,
          profiles: profileMap[comment.user_id] || defaultProfile,
          replies,
          user_liked: userLikes.has(comment.id)
        };
      });

      setComments(commentsWithDetails);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchSimilarBusinesses = async () => {
    try {
      const { data: currentBusiness, error: businessError } = await supabase
        .from('businesses')
        .select('category, city')
        .eq('id', params.id)
        .single();

      if (businessError) {
        console.error('Error fetching current business:', businessError);
        return;
      }

      if (currentBusiness) {
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('category', currentBusiness.category)
          .neq('id', params.id)
          .limit(8);

        if (error) {
          console.error('Error fetching similar businesses:', error);
          return;
        }
        
        setSimilarBusinesses(data || []);
      }
    } catch (error) {
      console.error('Error in fetchSimilarBusinesses:', error);
    }
  };

  const checkForDraftReview = async () => {
    if (!business) return;
    
    console.log('Checking for draft review for business:', business.id);
    
    try {
      if (user) {
        // ✅ Use business.id for draft_reviews.business_id
        const { data: dbDraft, error } = await supabase
          .from('draft_reviews')
          .select('*')
          .eq('business_id', business.id)
          .eq('user_id', user.id)
          .eq('status', 'draft')
          .maybeSingle();

        if (error) throw error;
        
        if (dbDraft) {
          console.log('Found draft in database:', dbDraft);
          setDraftReview(dbDraft);
          setRating(dbDraft.rating);
          setComment(dbDraft.comment);
          setExperienceDate(dbDraft.experience_date);
          
          if (dbDraft.proof_url) {
            setProofPreview(dbDraft.proof_url);
          } else if (dbDraft.proof_file_data) {
            setProofPreview(dbDraft.proof_file_data);
          }
          
          // Remove from localStorage if exists
          const localStorageKey = `draft_review_${business.id}`;
          if (localStorage.getItem(localStorageKey)) {
            localStorage.removeItem(localStorageKey);
            console.log('Removed matching localStorage draft');
          }
          
          // ✅ Return here, don't check localStorage if database has draft
          return;
        }
        
        // If no draft in database, check localStorage
        console.log('No draft in database, checking localStorage...');
        const localDraft = getLocalDraft();
        if (localDraft) {
          console.log('Found draft in localStorage');
          setDraftReview(localDraft);
          setRating(localDraft.rating);
          setComment(localDraft.comment);
          setExperienceDate(localDraft.experience_date);
          if (localDraft.proof_file_data) {
            setProofPreview(localDraft.proof_file_data);
          }
          
          // Try to migrate in background
          try {
            await migrateLocalDraftToDatabase();
          } catch (migrateError) {
            console.error('Migration failed:', migrateError);
          }
        }
      } else {
        // User not logged in - check localStorage only
        const localDraft = getLocalDraft();
        if (localDraft) {
          setDraftReview(localDraft);
          setRating(localDraft.rating);
          setComment(localDraft.comment);
          setExperienceDate(localDraft.experience_date);
          if (localDraft.proof_file_data) {
            setProofPreview(localDraft.proof_file_data);
          }
        }
      }
    } catch (error) {
      console.error('Error checking for draft review:', error);
    }
  };

  const getLocalDraft = (): DraftReview | null => {
    if (!business?.id) {
      console.log('No business ID available');
      return null;
    }
    
    const localStorageKey = `draft_review_${business.id}`;
    console.log('Looking for localStorage key:', localStorageKey);
    
    const savedDraft = localStorage.getItem(localStorageKey);
    
    if (savedDraft) {
      console.log('Found localStorage draft string');
      try {
        const draft = JSON.parse(savedDraft);
        console.log('Parsed draft data:', {
          hasProof: !!draft.proof_file_data,
          hasRating: !!draft.rating,
          hasComment: !!draft.comment
        });
        
        // Ensure proof_file_data is properly set
        if (draft.proof_file_data && typeof draft.proof_file_data === 'string') {
          if (!draft.proof_file_data.startsWith('data:')) {
            console.log('Adding data: prefix to proof');
            if (draft.proof_file_type?.startsWith('image/')) {
              draft.proof_file_data = `data:${draft.proof_file_type};base64,${draft.proof_file_data}`;
            } else {
              draft.proof_file_data = `data:image/jpeg;base64,${draft.proof_file_data}`;
            }
          }
        }
        
        return draft;
      } catch (error) {
        console.error('Error parsing saved draft:', error);
        return null;
      }
    }
    
    console.log('No draft found in localStorage');
    return null;
  };

  const saveToLocalStorage = (draftData: Partial<DraftReview>) => {
    if (!business?.id) return null;
    
    const deviceId = getDeviceId();
    const localStorageKey = `draft_review_${business.id}`;
    
    const draftToSave = {
      ...draftData,
      device_id: deviceId,
      business_id: business.id,
      user_email: draftData.user_email || '',
      updated_at: new Date().toISOString()
    };
    
    localStorage.setItem(localStorageKey, JSON.stringify(draftToSave));
    return draftToSave;
  };

  const saveDraftToDatabase = async (draftData: Partial<DraftReview>): Promise<DraftReview | null> => {
    if (!user || !business?.id) return null;

    try {
      const now = new Date().toISOString();
      let proofUrl = null;
      let proofType = null;
      let proofFileName = null;

      if (proofFile) {
        const fileExt = proofFile.name.split('.').pop();
        proofFileName = `draft_${user.id}_${Date.now()}.${fileExt}`;
        const filePath = `draft_reviews/${business.id}/${proofFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('review-proofs')
          .upload(filePath, proofFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('review-proofs')
          .getPublicUrl(filePath);
        
        proofUrl = publicUrl;
        proofType = proofFile.type.startsWith('image/') ? 'image' : 'video';
      } else if (draftData.proof_file_data && draftData.proof_file_data.startsWith('data:')) {
        const base64Data = draftData.proof_file_data.split(',')[1];
        const mimeType = draftData.proof_file_data.split(';')[0].split(':')[1];
        const fileExt = mimeType.split('/')[1];
        
        proofFileName = `draft_${user.id}_${Date.now()}.${fileExt}`;
        const filePath = `draft_reviews/${business.id}/${proofFileName}`;
        
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        
        const { error: uploadError } = await supabase.storage
          .from('review-proofs')
          .upload(filePath, blob);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('review-proofs')
          .getPublicUrl(filePath);
        
        proofUrl = publicUrl;
        proofType = mimeType.startsWith('image/') ? 'image' : 'video';
      }

      const dbDraftData = {
        business_id: business.id,
        user_id: user.id,
        user_email: user.email,
        device_id: draftData.device_id,
        rating: draftData.rating || 0,
        comment: draftData.comment || '',
        experience_date: draftData.experience_date || '',
        proof_url: proofUrl,
        proof_type: proofType,
        proof_file_name: proofFileName,
        status: 'draft',
        updated_at: now
      };

      // ✅ PEHLE CHECK KARO KI DRAFT EXISTS HAI YA NAHI
      const { data: existingDraft } = await supabase
        .from('draft_reviews')
        .select('id')
        .eq('business_id', business.id)
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .maybeSingle();

      let result;
      
      if (existingDraft) {
        // ✅ AGAR DRAFT EXISTS HAI, TO UPDATE KARO
        result = await supabase
          .from('draft_reviews')
          .update(dbDraftData)
          .eq('id', existingDraft.id)
          .select()
          .single();
      } else {
        // ✅ AGAR DRAFT NAHI HAI, TO INSERT KARO
        result = await supabase
          .from('draft_reviews')
          .insert({
            ...dbDraftData,
            created_at: now
          })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      const updatedDraft: any = {
        ...dbDraftData,
        id: result.data.id,
        created_at: result.data.created_at || now,
        updated_at: result.data.updated_at || now
      };

      // ✅ REMOVE FROM LOCALSTORAGE AFTER MIGRATION
      const localStorageKey = `draft_review_${business.id}`;
      localStorage.removeItem(localStorageKey);

      return updatedDraft;
    } catch (error) {
      console.error('Error saving draft to database:', error);
      throw error;
    }
  };

  const migrateLocalDraftToDatabase = async () => {
    if (!user || !business?.id) return;
    
    const localDraft = getLocalDraft();
    if (!localDraft) return;
    
    try {
      // ✅ PEHLE CHECK KARO KI DATABASE MEIN DRAFT TO NAHI HAI
      const { data: existingDraft } = await supabase
        .from('draft_reviews')
        .select('id')
        .eq('business_id', business.id)
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .maybeSingle();
      
      // ✅ AGAR DATABASE MEIN DRAFT HAI, TO LOCAL DRAFT KO MIGRATE NA KARO
      if (existingDraft) {
        console.log('Draft already exists in database, skipping migration');
        // LocalStorage se delete kar do
        const localStorageKey = `draft_review_${business.id}`;
        localStorage.removeItem(localStorageKey);
        return;
      }
      
      const migratedDraft = await saveDraftToDatabase(localDraft);
      if (migratedDraft) {
        setDraftReview(migratedDraft);
        showNotification('Draft migrated to your account!', 'success');
      }
    } catch (error) {
      console.error('Error migrating draft:', error);
      // Error handle karo gracefully
    }
  };

  const handleAskQuestion = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setShowQuestionForm(true);
    setActiveTab('questions');
  };

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim()) {
      showNotification('Please enter a question', 'warning');
      return;
    }

    try {
      setSubmittingQuestion(true);
      const { error } = await supabase
        .from('comments')
        .insert({
          business_id: business?.id,
          user_id: user?.id,
          content: newQuestion.trim(),
          likes: 0,
          is_answer: false,
          parent_id: null
        });

      if (error) throw error;

      setNewQuestion('');
      setShowQuestionForm(false);
      showNotification('Question posted successfully!', 'success');
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Error posting question:', error);
      showNotification('Failed to post question. Please try again.', 'error');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) {
      showNotification('Please enter a reply', 'warning');
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          business_id: business?.id,
          user_id: user?.id,
          content: replyContent.trim(),
          likes: 0,
          is_answer: false,
          parent_id: parentId
        });

      if (error) throw error;

      setReplyContent('');
      setReplyingTo(null);
      showNotification('Reply posted successfully!', 'success');
    } catch (error) {
      console.error('Error posting reply:', error);
      showNotification('Failed to post reply. Please try again.', 'error');
    }
  };

  const handleLikeComment = async (commentId: string, currentLikes: number, isLiked: boolean) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        if (error) throw error;

        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likes: currentLikes - 1,
              user_liked: false
            };
          }
          return comment;
        }));
      } else {
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id
          });

        if (error) throw error;

        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likes: currentLikes + 1,
              user_liked: true
            };
          }
          return comment;
        }));
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      showNotification('Failed to update like. Please try again.', 'error');
    }
  };

  const handleAddReview = () => {
    if (user && profile?.user_type === 'business') {
      showNotification('Business accounts cannot write reviews. Please use a customer account.', 'warning');
      return;
    }
    
    if (user?.id === business?.user_id) {
      showNotification('You cannot review your own business.', 'warning');
      return;
    }
    
    setShowReviewForm(true);
    if (draftReview) {
      setIsEditingDraft(true);
      showNotification('You have a saved draft. You can edit it or start fresh.', 'success');
    }
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

  const saveDraftReview = async () => {
    if (user) {
      showNotification('Logged in users cannot save drafts. Please publish directly.', 'warning');
      return;
    }
    
    if (!business?.id) {
      showNotification('Business not found', 'error');
      return;
    }

    if (!rating || !comment || !experienceDate || !proofPreview) {
      showNotification('Please fill in rating, comment, experience date and proof to save draft', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      
      const draftData = {
        rating,
        comment,
        experience_date: experienceDate,
        proof_file_data: proofPreview || undefined,
        proof_file_name: proofFile?.name,
        proof_file_type: proofFile?.type
      };

      const savedDraft = saveToLocalStorage(draftData);
      if (savedDraft) {
        setDraftReview(savedDraft as DraftReview);
        showNotification('Draft saved locally! Sign up to publish it.', 'success');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      showNotification('Failed to save draft. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAndSignUp = async () => {
    if (!rating || !comment || !experienceDate) {
      showNotification('Please fill in rating, comment, and experience date to save draft', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      
      const draftData = {
        rating,
        comment,
        experience_date: experienceDate,
        proof_file_data: proofPreview || undefined,
        proof_file_name: proofFile?.name,
        proof_file_type: proofFile?.type
      };

      const savedDraft = saveToLocalStorage(draftData);
      if (savedDraft) {
        setDraftReview(savedDraft as DraftReview);
        showNotification('Draft saved locally! Please sign up to continue.', 'success');
        
        setTimeout(() => {
          setShowLoginModal(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      showNotification('Failed to save draft. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (user && profile?.user_type === 'business') {
      showNotification('Business accounts cannot publish reviews.', 'error');
      return;
    }
    
    if (user?.id === business?.user_id) {
      showNotification('You cannot review your own business.', 'error');
      return;
    }
    
    if (!rating || !comment || !experienceDate || !proofPreview) {
      showNotification('Please fill in all required fields.', 'warning');
      return;
    }

    if (!user) {
      await handleSaveAndSignUp();
      return;
    }

    if (!profile?.is_verified) {
      showNotification('Please verify your account to publish reviews.', 'warning');
      setShowVerificationModal(true);
      return;
    }

    try {
      setSubmitting(true);

      // ✅ Check existing review using business_user_id
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('business_user_id', business?.user_id) // ✅ business.user_id use karo
        .eq('user_id', user?.id)
        .maybeSingle();

      if (existingReview) {
        showNotification('You already reviewed this business.', 'warning');
        setSubmitting(false);
        return;
      }

      let proofUrl = null;
      let proofType = null;

      if (proofFile) {
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
        const filePath = `reviews/${business?.user_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('review-proofs')
          .upload(filePath, proofFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('review-proofs')
          .getPublicUrl(filePath);
        
        proofUrl = publicUrl;
        proofType = proofFile.type.startsWith('image/') ? 'image' : 'video';
      } else if (draftReview?.proof_url) {
        proofUrl = draftReview.proof_url;
        proofType = draftReview.proof_type;
      } else if (draftReview?.proof_file_data) {
        const base64Data = draftReview.proof_file_data.split(',')[1];
        const mimeType = draftReview.proof_file_data.split(';')[0].split(':')[1];
        const fileExt = mimeType.split('/')[1];
        
        const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
        const filePath = `reviews/${business?.user_id}/${fileName}`;
        
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        
        const { error: uploadError } = await supabase.storage
          .from('review-proofs')
          .upload(filePath, blob);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('review-proofs')
          .getPublicUrl(filePath);
        
        proofUrl = publicUrl;
        proofType = mimeType.startsWith('image/') ? 'image' : 'video';
      }

      // ✅ IMPORTANT: Insert with BOTH IDs
      const { error: insertError } = await supabase
        .from('reviews')
        .insert({
          business_id: business?.id, // ✅ For foreign key constraint
          business_user_id: business?.user_id, // ✅ For your logic (business owner ka user_id)
          user_id: user?.id,
          rating,
          comment,
          experience_date: experienceDate,
          proof_url: proofUrl,
          proof_type: proofType,
        });

      if (insertError) throw insertError;

      // Delete draft from draft_reviews table
      if (draftReview?.id) {
        await supabase
          .from('draft_reviews')
          .delete()
          .eq('id', draftReview.id);
      }
      
      // Remove from localStorage
      const localStorageKey = `draft_review_${business?.id}`;
      localStorage.removeItem(localStorageKey);

      setShowReviewForm(false);
      setRating(0);
      setComment('');
      setExperienceDate('');
      setProofFile(null);
      setProofPreview(null);
      setDraftReview(null);
      setIsEditingDraft(false);
      
      await fetchReviews();
      showNotification('Review submitted successfully!', 'success');
    } catch (error) {
      console.error('Error submitting review:', error);
      showNotification('Failed to submit review.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteDraftReview = async () => {
    if (!draftReview) return;

    try {
      setSubmitting(true);
      
      if (draftReview.id && user) {
        if (draftReview.proof_file_name) {
          const filePath = `draft_reviews/${business?.id}/${draftReview.proof_file_name}`;
          await supabase.storage
            .from('review-proofs')
            .remove([filePath]);
        }

        await supabase
          .from('draft_reviews')
          .delete()
          .eq('id', draftReview.id);
      }
      
      const localStorageKey = `draft_review_${business?.id}`;
      localStorage.removeItem(localStorageKey);

      setDraftReview(null);
      setIsEditingDraft(false);
      setRating(0);
      setComment('');
      setExperienceDate('');
      setProofFile(null);
      setProofPreview(null);
      
      showNotification('Draft deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting draft:', error);
      showNotification('Failed to delete draft. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const nextSlide = () => {
    if (slidesCount <= 1) return;
    setCurrentSlide(prev => 
      prev === slidesCount - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    if (slidesCount <= 1) return;
    setCurrentSlide(prev => 
      prev === 0 ? slidesCount - 1 : prev - 1
    );
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-3"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-md">
          <XCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Business Not Found</h1>
          <p className="text-gray-600">The business you're looking for doesn't exist or may have been removed.</p>
        </div>
      </div>
    );
  }

  const avgRating = business.google_rating || business.our_rating || 0;
  const reviewCount = business.google_reviews_count || reviews.length || 0;
  const slidesCount = Math.ceil(similarBusinesses.length / 4);

  return (
    <div className="min-h-screen bg-white">
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-slideIn">
          <div className={`rounded-lg p-4 flex items-start gap-3 border ${
            notification.type === 'success' ? 'bg-green-50 border-green-200' :
            notification.type === 'error' ? 'bg-red-50 border-red-200' :
            'bg-amber-50 border-amber-200'
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
            <button onClick={() => setNotification(null)} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {draftReview ? 'Continue Your Review' : 'Login Required'}
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              {draftReview 
                ? user 
                  ? 'Your draft is saved to your account. Verify your account to publish it.'
                  : 'Your draft is saved locally. Sign up to save it permanently and publish it.'
                : 'You need to be logged in to publish reviews.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => { 
                  setShowLoginModal(false); 
                  router.push('/login?type=customer&redirect=' + encodeURIComponent(window.location.pathname)); 
                }}
                className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
              >
                Login as Customer
              </button>
              <button
                onClick={() => { 
                  setShowLoginModal(false); 
                  router.push('/signup?type=customer&redirect=' + encodeURIComponent(window.location.pathname)); 
                }}
                className="w-full px-4 py-2.5 border-2 border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50 transition flex items-center justify-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Sign up as Customer
              </button>
              <button 
                onClick={() => setShowLoginModal(false)} 
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showVerificationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Verification Required</h3>
            </div>
            <p className="text-gray-600 mb-6">
              To maintain trust and prevent fake reviews, we require all customers to verify their accounts before publishing reviews. 
              {draftReview && ' Your draft review will be submitted automatically once your account is verified.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => { 
                  setShowVerificationModal(false); 
                  router.push('/verify-account'); 
                }}
                className="w-full px-4 py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition"
              >
                Verify Your Account
              </button>
              <button 
                onClick={() => setShowVerificationModal(false)} 
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showBusinessUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
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

      <div className="bg-gradient-to-r from-green-50 to-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8">
            <div className="relative w-full lg:w-1/3">
              <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-green-100 to-white border border-green-200">
                {business.profile_url ? (
                  <img 
                    src={business.profile_url} 
                    alt={business.name} 
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl font-bold text-green-800">{business.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              {business.verification_status === 'verified' ? (
                <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Verified
                </div>
              ) : (
                <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Not Verified
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="mb-6">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{business.name}</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {business.category}
                  </span>
                  <span className="text-gray-600 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {business.city}, {business.country}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-green-600 fill-current" />
                    <span className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}</span>
                  </div>
                  <span className="text-gray-600">({reviewCount} reviews)</span>
                </div>
                <div className="h-8 w-px bg-gray-300"></div>
                <div className="text-gray-600">
                  Joined {new Date(business.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddReview}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  <Star className="h-5 w-5" />
                  {draftReview ? 'Continue Review' : 'Write a Review'}
                </button>

                <button
                  onClick={handleAskQuestion}
                  className="px-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 bg-white border-2 border-green-600 text-green-600 hover:bg-green-50"
                >
                  <HelpCircle className="h-5 w-5" />
                  Ask a Question
                </button>

                <div className="px-6 py-3 rounded-lg font-medium bg-blue-50 border-2 border-blue-600 text-blue-700 flex items-center justify-center gap-2">
                  <Phone className="h-5 w-5" />
                  <span>Claim: +92 331-2705270</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {business.description && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed">{business.description}</p>
              </div>
            )}

            <div>
              <div className="border-b border-gray-200 mb-6">
                <div className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`pb-4 text-sm font-medium transition ${
                      activeTab === 'reviews'
                        ? 'text-green-600 border-b-2 border-green-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Reviews ({reviewCount})
                  </button>
                  <button
                    onClick={() => setActiveTab('questions')}
                    className={`pb-4 text-sm font-medium transition ${
                      activeTab === 'questions'
                        ? 'text-green-600 border-b-2 border-green-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Questions ({comments.length})
                  </button>
                </div>
              </div>

              {activeTab === 'reviews' && (
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={handleAddReview}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {draftReview ? 'Continue Draft' : 'Write Review'}
                  </button>
                  <button
                    onClick={handleAskQuestion}
                    className="px-4 py-2 border border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50 transition flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Ask Question
                  </button>
                </div>
              )}

              {activeTab === 'reviews' ? (
                <>
                  {draftReview && !showReviewForm && (
                    <div className="mb-6 p-4 border border-amber-200 rounded-lg bg-amber-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Save className="h-5 w-5 text-amber-600" />
                          <div>
                            <h4 className="font-medium text-amber-800">You have a saved draft review</h4>
                            <p className="text-sm text-amber-600">
                              Rating: {draftReview.rating}/5 • 
                              {user ? ' Saved to your account' : ' Saved locally'} • 
                              Last saved: {new Date(draftReview.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleAddReview}
                          className="px-3 py-1 bg-amber-500 text-white rounded text-sm hover:bg-amber-600"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  )}

                  {showReviewForm && (
                    <div className="mb-8 p-6 border border-green-200 rounded-xl bg-green-50">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {isEditingDraft ? 'Edit Your Draft Review' : 'Write Your Review'}
                          </h3>
                          {isEditingDraft && draftReview?.updated_at && (
                            <p className="text-sm text-gray-600 mt-1">
                              Last saved: {new Date(draftReview.updated_at).toLocaleString()}
                              {user ? ' (Saved to your account)' : ' (Saved locally)'}
                            </p>
                          )}
                        </div>
                        <button 
                          onClick={() => {
                            setShowReviewForm(false);
                            setIsEditingDraft(false);
                          }}
                          className="p-1 rounded hover:bg-green-100"
                        >
                          <X className="h-5 w-5 text-gray-500" />
                        </button>
                      </div>
                      
                      <form onSubmit={handleSubmitReview} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                            <input 
                              type="text" 
                              value={profile?.full_name || (user ? 'User' : 'Guest User')} 
                              disabled 
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Experience *</label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <input
                                type="date"
                                value={experienceDate}
                                onChange={(e) => setExperienceDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                required
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">Your Rating *</label>
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
                                <Star className={`h-8 w-8 ${star <= (hoverRating || rating) ? 'text-green-600 fill-current' : 'text-gray-300'}`} />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload Proof {!user && '(Will be saved as draft)'}
                          </label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition cursor-pointer relative">
                            <label className="cursor-pointer block">
                              {proofPreview && (
                                <div className="relative">
                                  {proofPreview.startsWith('data:') || 
                                   proofPreview.includes('image') ||
                                   proofPreview.includes('.jpg') ||
                                   proofPreview.includes('.png') ? (
                                    <img 
                                      src={proofPreview} 
                                      alt="Proof Preview" 
                                      className="max-h-48 mx-auto rounded"
                                      onError={(e) => {
                                        console.error('Image failed to load:', proofPreview);
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  ) : proofPreview.includes('video') ? (
                                    <video 
                                      src={proofPreview} 
                                      controls 
                                      className="max-h-48 mx-auto rounded"
                                      onError={(e) => console.error('Video failed to load')}
                                    />
                                  ) : (
                                    <p className="text-red-500">Invalid proof format</p>
                                  )}
                                </div>
                              )}
                              {!proofPreview && (
                                <>
                                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                  <p className="text-sm text-gray-600">Click to upload proof</p>
                                  <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF or MP4 (max 10MB)</p>
                                </>
                              )}    
                              <input 
                                type="file" 
                                accept="image/*,video/*" 
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </label>
                          </div>

                          {!user && (
                            <p className="text-xs text-gray-500 mt-2">
                              ✓ Proof is saving as draft. After signup, it will be uploaded to your account.
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Your Review *</label>
                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            required
                            placeholder="Share your experience..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                          />
                        </div>

                        <div className="flex gap-3 flex-wrap">
                          {user ? (
                            <>
                              <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
                              >
                                {submitting ? 'Publishing...' : 'Publish Review'}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={handleSaveAndSignUp}
                                disabled={submitting}
                                className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                <Save className="h-4 w-4" />
                                Save & Sign Up
                              </button>
                            </>
                          )}
                          
                          {isEditingDraft && (
                            <button
                              type="button"
                              onClick={deleteDraftReview}
                              disabled={submitting}
                              className="px-6 py-2 border border-red-600 text-red-600 rounded-lg font-medium hover:bg-red-50 transition"
                            >
                              Delete Draft
                            </button>
                          )}
                          
                          <button
                            type="button"
                            onClick={() => {
                              setShowReviewForm(false);
                              setIsEditingDraft(false);
                            }}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                          >
                            Cancel
                          </button>
                        </div>
                        
                        {!user && (
                          <p className="text-sm text-gray-600 text-center">
                            ✓ Draft saved to this device. Sign up to save it permanently to your account.
                          </p>
                        )}
                      </form>
                    </div>
                  )}

                  {reviews.length > 0 ? (
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-t pt-6 first:border-t-0 first:pt-0">
                          <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                              <span className="font-medium text-green-800">
                                {review.profiles.full_name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium text-gray-900">
                                  {review.profiles.full_name || 'User'}
                                </h4>
                                {review.profiles.is_verified && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 mb-3">
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-4 w-4 ${star <= review.rating ? 'text-green-600 fill-current' : 'text-gray-300'}`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </span>
                              </div>

                              {review.proof_url && (
                                <div className="mb-3">
                                  {review.proof_type === 'image' ? (
                                    <img 
                                      src={review.proof_url} 
                                      alt="Proof" 
                                      className="max-h-48 rounded"
                                    />
                                  ) : (
                                    <video 
                                      src={review.proof_url} 
                                      controls 
                                      className="max-h-48 rounded"
                                    />
                                  )}
                                </div>
                              )}

                              <p className="text-gray-700 mb-2">{review.comment}</p>
                              <p className="text-sm text-gray-500">
                                Experience date: {new Date(review.experience_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                      <p className="text-gray-600">Be the first to review this business!</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {showQuestionForm && (
                    <div className="mb-8 p-6 border border-green-200 rounded-xl bg-green-50">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Ask a Question</h3>
                        <button 
                          onClick={() => setShowQuestionForm(false)}
                          className="p-1 rounded hover:bg-green-100"
                        >
                          <X className="h-5 w-5 text-gray-500" />
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Your Question</label>
                          <textarea
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            placeholder="What would you like to know about this business?"
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                          />
                        </div>
                        
                        <div className="flex gap-3">
                          <button
                            onClick={handleSubmitQuestion}
                            disabled={submittingQuestion || !newQuestion.trim()}
                            className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
                          >
                            {submittingQuestion ? 'Posting...' : 'Post Question'}
                          </button>
                          <button
                            onClick={() => setShowQuestionForm(false)}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {comments.length > 0 ? (
                    <div className="space-y-6">
                      {comments.map((comment) => (
                        <div key={comment.id} className="border-t pt-6 first:border-t-0 first:pt-0">
                          <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                              <span className="font-medium text-green-800">
                                {comment.profiles.full_name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium text-gray-900">
                                  {comment.profiles.full_name || 'User'}
                                </h4>
                                {comment.profiles.is_verified && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-500 mb-3">
                                {new Date(comment.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                              
                              <p className="text-gray-800 mb-4">{comment.content}</p>
                              
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                  className="text-sm text-gray-500 hover:text-green-600"
                                >
                                  Reply
                                </button>
                              </div>

                              {replyingTo === comment.id && (
                                <div className="mt-4">
                                  <div className="flex items-start gap-3">
                                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                      <span className="text-xs font-medium">You</span>
                                    </div>
                                    <div className="flex-1">
                                      <textarea
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        placeholder="Write your reply..."
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm"
                                      />
                                      <div className="flex gap-2 mt-2">
                                        <button
                                          onClick={() => handleReply(comment.id)}
                                          disabled={!replyContent.trim()}
                                          className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                                        >
                                          Post Reply
                                        </button>
                                        <button
                                          onClick={() => {
                                            setReplyingTo(null);
                                            setReplyContent('');
                                          }}
                                          className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {comment.replies && comment.replies.length > 0 && (
                                <div className="mt-4 space-y-3 pl-4 border-l border-gray-300">
                                  {comment.replies.map((reply) => (
                                    <div key={reply.id}>
                                      <div className="flex items-start gap-3">
                                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                          <span className="text-xs font-medium">
                                            {reply.profiles.full_name?.charAt(0) || 'R'}
                                          </span>
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-medium text-gray-900">
                                              {reply.profiles.full_name || 'User'}
                                            </p>
                                          </div>
                                          <p className="text-sm text-gray-800">{reply.content}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
                      <p className="text-gray-600">Be the first to ask a question!</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {similarBusinesses.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Similar Businesses in {business.city}</h2>
                  <div className="flex gap-2">
                    {slidesCount > 1 && (
                      <>
                        <button
                          onClick={prevSlide}
                          className="p-2 rounded-full hover:bg-gray-100 transition"
                        >
                          <ChevronLeft className="h-5 w-5 text-gray-600" />
                        </button>
                        <button
                          onClick={nextSlide}
                          className="p-2 rounded-full hover:bg-gray-100 transition"
                        >
                          <ChevronRight className="h-5 w-5 text-gray-600" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="relative overflow-hidden">
                  <div 
                    ref={carouselRef}
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                  >
                    {Array.from({ length: slidesCount }).map((_, slideIndex) => (
                      <div key={slideIndex} className="w-full flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {similarBusinesses.slice(slideIndex * 4, slideIndex * 4 + 4).map((similar) => (
                          <div
                            key={similar.id}
                            onClick={() => router.push(`/business/${similar.id}`)}
                            className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition cursor-pointer"
                          >
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
                              {similar.profile_url ? (
                                <img 
                                  src={similar.profile_url} 
                                  alt={similar.name} 
                                  className="w-full h-full object-contain p-2"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-2xl font-bold text-gray-400">{similar.name.charAt(0)}</span>
                                </div>
                              )}
                            </div>
                            <h3 className="font-medium text-gray-900 truncate">{similar.name}</h3>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="h-4 w-4 text-green-600 fill-current" />
                              <span className="text-sm text-gray-600">
                                {(similar.google_rating || similar.our_rating || 0).toFixed(1)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <p>{business.address}</p>
                    <p className="text-gray-600">{business.city}, {business.country}</p>
                  </div>
                </div>
                
                {business.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <a 
                      href={`tel:${business.phone}`} 
                      className="text-sm text-gray-700 hover:text-green-600 transition"
                    >
                      {business.phone}
                    </a>
                  </div>
                )}
                
                {business.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <a 
                      href={`mailto:${business.email}`} 
                      className="text-sm text-gray-700 hover:text-green-600 transition truncate"
                    >
                      {business.email}
                    </a>
                  </div>
                )}
                
                {business.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <a 
                      href={business.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm text-green-600 hover:text-green-700 transition flex items-center gap-1"
                    >
                      Visit Website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Review Guidelines</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">Share genuine experiences only</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">Be specific and constructive</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">Include photo/video proof</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Save className="h-3 w-3 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600">Save draft anytime, publish after verification</p>
                </div>
              </div>
            </div>

            {!user && (
              <div className="bg-gradient-to-r from-green-50 to-white border border-green-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Join Our Community</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Sign up to publish your saved drafts and ask questions
                </p>
                <div className="space-y-2">
                  <button 
                    onClick={() => router.push('/signup?type=customer')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                  >
                    Sign Up Free
                  </button>
                  <button 
                    onClick={() => router.push('/login?type=customer')}
                    className="w-full px-4 py-2 border border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50 transition"
                  >
                    Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}