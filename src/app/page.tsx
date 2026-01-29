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
import ContactSection from './components/ContactSection';
import { getCookie, deleteCookie, removeDraftId, } from './lib/cookieUtils';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Migrate all local drafts from cookies to database when user logs in
  useEffect(() => {
    if (user) {
      migrateAllCookieDraftsToDatabase();
    }
  }, [user]);

const migrateAllCookieDraftsToDatabase = async () => {
  if (!user) return;
  
  try {
    // Get list of all draft IDs from tracking cookie
    const draftIds = await getCookie('draft_review_ids');
    
    if (!draftIds || !Array.isArray(draftIds) || draftIds.length === 0) {
      return;
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const businessId of draftIds) {
      try {
        const cookieName = `draft_review_${businessId}`;
        const draftData = await getCookie(cookieName);
        
        if (!draftData) {
          // Clean up tracking if cookie doesn't exist
          await removeDraftId(businessId);
          continue;
        }
        
        // Retrieve large data from localStorage if exists
        if (draftData.large_data_id) {
          const largeData = localStorage.getItem(draftData.large_data_id);
          if (largeData) {
            draftData.proof_file_data = largeData;
            localStorage.removeItem(draftData.large_data_id);
          }
          draftData.large_data_id = undefined;
          draftData.has_large_proof = undefined;
        }
        
        // Check if business exists
        const { data: business, error: businessError } = await supabase
          .from('businesses')
          .select('id, user_id')
          .eq('id', businessId)
          .maybeSingle();
        
        if (businessError || !business) {
          // Business doesn't exist, delete the draft
          await deleteCookie(cookieName);
          await removeDraftId(businessId);
          skippedCount++;
          continue;
        }
        
        // Check for existing draft in database
        const { data: existingDraft } = await supabase
          .from('draft_reviews')
          .select('id')
          .eq('business_id', business.id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        // Prepare proof data
        let proofUrl = null;
        let proofType = null;
        let proofFileName = null;
        
        if (draftData.proof_file_data && draftData.proof_file_data.startsWith('data:')) {
          try {
            const base64Data = draftData.proof_file_data.split(',')[1];
            const mimeType = draftData.proof_file_data.split(';')[0].split(':')[1];
            const fileExt = mimeType.split('/')[1] || 'jpg';
            
            proofFileName = `draft_${user.id}_${Date.now()}.${fileExt}`;
            const filePath = `draft_reviews/${business.user_id}/${proofFileName}`;
            
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
              const { data: { publicUrl } } = supabase.storage
                .from('review-proofs')
                .getPublicUrl(filePath);
              
              proofUrl = publicUrl;
              proofType = mimeType.startsWith('image/') ? 'image' : 'video';
            }
          } catch (uploadError) {
            console.error('Error uploading proof during migration:', uploadError);
          }
        }
        
        const now = new Date().toISOString();
        const dbDraftData = {
          business_id: business.id,
          user_id: user.id,
          device_id: draftData.device_id || 'cookie_migrated',
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
          const { error: updateError } = await supabase
            .from('draft_reviews')
            .update(dbDraftData)
            .eq('id', existingDraft.id);
          
          if (!updateError) {
            await deleteCookie(cookieName);
            await removeDraftId(businessId);
            migratedCount++;
          } else {
            skippedCount++;
          }
        } else {
          // Create new draft
          const { error: insertError } = await supabase
            .from('draft_reviews')
            .insert({
              ...dbDraftData,
              created_at: now
            });
          
          if (!insertError) {
            await deleteCookie(cookieName);
            await removeDraftId(businessId);
            migratedCount++;
          } else {
            skippedCount++;
          }
        }
      } catch (error) {
        console.error('Error migrating draft for business:', businessId, error);
        skippedCount++;
      }
    }
    
    // Show console log for debugging
    if (migratedCount > 0) {
      console.log(`✅ Migrated ${migratedCount} drafts from cookies to database`);
    }
    if (skippedCount > 0) {
      console.log(`⚠️ Skipped ${skippedCount} drafts during migration`);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

// Clean up old localStorage data (older than 7 days)
const cleanupOldLocalStorage = () => {
  try {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // Clean up large_data entries
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('large_data_')) {
        // Extract timestamp from key: large_data_timestamp_random
        const match = key.match(/large_data_(\d+)_/);
        if (match) {
          const timestamp = parseInt(match[1]);
          if (timestamp < oneWeekAgo) {
            localStorage.removeItem(key);
          }
        }
      }
    }
  } catch (error) {
    // Silently fail
  }
};

// Use in useEffect
useEffect(() => {
  cleanupOldLocalStorage();
}, []);
  // Function to get all cookie names from the server
  const getAllCookieNames = async (): Promise<string[]> => {
    try {
      const response = await fetch('/api/cookies/list');
      if (response.ok) {
        const data = await response.json();
        return data.cookieNames || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting cookie names:', error);
      return [];
    }
  };


  // Optional: Clean up old drafts (older than 30 days)
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
      <ContactSection/>
      <Footer />
    </div>
  );
}