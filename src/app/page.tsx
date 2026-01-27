'use client';

import { useState, useEffect } from 'react';
import HeroSection from '@/app/components/HeroSection';
import SearchBar from '@/app/components/SearchBar';
import StatsBar from '@/app/components/StatsBar';
import BusinessSection from '@/app/components/HowItWorks';
import RecentSearchesSection from '@/app/components/ExploreBusiness';
import ReviewSection from '@/app/components/ReviewSection';
import TrustSection from '@/app/components/TrustSection';
import VerificationProcess from '@/app/components/VerificationProcess';
import Footer from '@/app/components/Footer';
import { supabase } from './lib/supabaseClient';
import { useAuth } from './contexts/AuthContext';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Migrate all local drafts to database when user logs in (silently in background)
  useEffect(() => {
    if (user) {
      migrateAllLocalDraftsToDatabase();
    }
  }, [user]);

  const migrateAllLocalDraftsToDatabase = async () => {
    if (!user) return;
    
    try {
      // Get all draft keys from localStorage
      const draftKeys = Object.keys(localStorage).filter(key => key.startsWith('draft_review_'));
      
      if (draftKeys.length === 0) {
        return;
      }
      
      for (const key of draftKeys) {
        try {
          const savedDraft = localStorage.getItem(key);
          if (savedDraft) {
            const draftData = JSON.parse(savedDraft);
            
            // Skip if no business_id
            if (!draftData.business_id) {
              continue;
            }
            
            // First, upload proof file if exists
            let proofUrl = null;
            let proofType = null;
            let proofFileName = null;

            if (draftData.proof_file_data && draftData.proof_file_data.startsWith('data:')) {
              try {
                const base64Data = draftData.proof_file_data.split(',')[1];
                const mimeType = draftData.proof_file_data.split(';')[0].split(':')[1];
                const fileExt = mimeType.split('/')[1];
                
                proofFileName = `draft_${user.id}_${Date.now()}.${fileExt}`;
                const filePath = `draft_reviews/${draftData.business_id}/${proofFileName}`;
                
                // Convert base64 to blob
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: mimeType });
                
                // Upload to Supabase Storage
                const { error: uploadError } = await supabase.storage
                  .from('review-proofs')
                  .upload(filePath, blob);

                if (!uploadError) {
                  // Get public URL
                  const { data: { publicUrl } } = supabase.storage
                    .from('review-proofs')
                    .getPublicUrl(filePath);
                  
                  proofUrl = publicUrl;
                  proofType = mimeType.startsWith('image/') ? 'image' : 'video';
                }
              } catch (uploadError) {
                // Silently continue without proof
              }
            }

            // Check if draft already exists in database for this user and business
            const { data: existingDraft } = await supabase
              .from('draft_reviews')
              .select('id')
              .eq('business_id', draftData.business_id)
              .eq('user_id', user.id)
              .maybeSingle();
            
            const now = new Date().toISOString();
            const dbDraftData = {
              business_id: draftData.business_id,
              user_id: user.id,
              device_id: draftData.device_id || 'local_migrated',
              user_email: user.email,
              rating: draftData.rating || 0,
              comment: draftData.comment || '',
              experience_date: draftData.experience_date || '',
              proof_url: proofUrl,
              proof_type: proofType,
              proof_file_name: proofFileName,
              status: 'draft',
              updated_at: now
            };

            if (existingDraft) {
              // Update existing draft
              await supabase
                .from('draft_reviews')
                .update(dbDraftData)
                .eq('id', existingDraft.id);
              
              localStorage.removeItem(key);
            } else {
              // Create new draft in database
              await supabase
                .from('draft_reviews')
                .insert({
                  ...dbDraftData,
                  created_at: now
                });
              
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Silently skip this draft on error
        }
      }
      
    } catch (error) {
      // Silently fail - user doesn't need to know
    }
  };

  // Optional: Clean up old drafts (older than 30 days) - also silent
  const cleanupOldDrafts = async () => {
    if (!user) return;
    
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Delete old drafts from database
      await supabase
        .from('draft_reviews')
        .delete()
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .lt('updated_at', thirtyDaysAgo.toISOString());
      
    } catch (error) {
      // Silently fail
    }
  };

  // Clean up old drafts on component mount
  useEffect(() => {
    if (user) {
      cleanupOldDrafts();
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: '#16a34a' }}
        ></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <SearchBar />
      <StatsBar />
      <BusinessSection />
      <RecentSearchesSection />
      <ReviewSection />
      <TrustSection />
      <VerificationProcess />
      <Footer />
    </div>
  );
}