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
  
  console.log('Starting migration of local drafts...');
  
  try {
    // Get all draft keys from localStorage
    const draftKeys = Object.keys(localStorage).filter(key => key.startsWith('draft_review_'));
    
    console.log('Found draft keys:', draftKeys);
    
    if (draftKeys.length === 0) {
      console.log('No drafts found in localStorage');
      return;
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const key of draftKeys) {
      try {
        const savedDraft = localStorage.getItem(key);
        if (!savedDraft) continue;
        
        let draftData;
        try {
          draftData = JSON.parse(savedDraft);
        } catch (parseError) {
          console.error('Failed to parse draft:', parseError);
          continue;
        }
        
        // Extract business ID from key (draft_review_<business_id>)
        const businessIdMatch = key.match(/draft_review_(.+)/);
        if (!businessIdMatch) continue;
        
        // This is the business ID from URL (businesses.id)
        const businessIdFromKey = businessIdMatch[1];
        
        if (!businessIdFromKey) {
          console.log('No business ID found from key');
          continue;
        }
        
        console.log('Processing draft for business ID:', businessIdFromKey);
        
        // ✅ Check if business exists in businesses table
        const { data: business, error: businessError } = await supabase
          .from('businesses')
          .select('id, user_id')
          .eq('id', businessIdFromKey)
          .maybeSingle();
        
        if (businessError) {
          console.error('Error checking business:', businessError);
          skippedCount++;
          continue;
        }
        
        if (!business) {
          console.log('Business not found, skipping draft...');
          skippedCount++;
          continue;
        }
        
        console.log('Found business:', business);
        
        // First, upload proof file if exists
        let proofUrl = null;
        let proofType = null;
        let proofFileName = null;
        
        // Check proof_file_data (base64)
        if (draftData.proof_file_data && typeof draftData.proof_file_data === 'string') {
          try {
            let base64Data = draftData.proof_file_data;
            let mimeType = '';
            
            // Handle data URL format
            if (base64Data.startsWith('data:')) {
              const parts = base64Data.split(',');
              const mimePart = parts[0].split(':')[1].split(';')[0];
              mimeType = mimePart;
              base64Data = parts[1];
            } else {
              // Assume it's image/jpeg if no mime type
              mimeType = 'image/jpeg';
            }
            
            const fileExt = mimeType.split('/')[1] || 'jpg';
            proofFileName = `draft_${user.id}_${Date.now()}.${fileExt}`;
            // ✅ Use business.user_id for storage path (not business.id)
            const filePath = `draft_reviews/${business.user_id}/${proofFileName}`;
            
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
              console.log('Proof uploaded successfully:', proofUrl);
            }
          } catch (uploadError) {
            console.error('Error uploading proof:', uploadError);
            // Continue without proof
          }
        } else if (draftData.proof_url) {
          // If proof_url already exists
          proofUrl = draftData.proof_url;
          proofType = draftData.proof_type || 'image';
        }

        // ✅ IMPORTANT: Use business.id for draft_reviews.business_id (to match foreign key)
        // Check for existing draft in database
        const { data: existingDraft, error: checkError } = await supabase
          .from('draft_reviews')
          .select('id')
          .eq('business_id', business.id) // ✅ Use business.id (not business.user_id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (checkError) {
          console.error('Error checking existing draft:', checkError);
          skippedCount++;
          continue;
        }
        
        const now = new Date().toISOString();
        const dbDraftData = {
          business_id: business.id, // ✅ Use business.id (to match foreign key constraint)
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
          const { error: updateError } = await supabase
            .from('draft_reviews')
            .update(dbDraftData)
            .eq('id', existingDraft.id);
          
          if (!updateError) {
            localStorage.removeItem(key);
            migratedCount++;
            console.log('Updated existing draft for business:', business.id);
          } else {
            console.error('Error updating draft:', updateError);
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
            localStorage.removeItem(key);
            migratedCount++;
            console.log('Created new draft for business:', business.id);
          } else {
            console.error('Error inserting draft:', insertError);
            skippedCount++;
          }
        }
      } catch (error) {
        console.error('Error processing draft:', error);
        skippedCount++;
      }
    }
    
    console.log(`Migration complete. ${migratedCount} drafts migrated, ${skippedCount} skipped.`);
    
  } catch (error) {
    console.error('Migration failed:', error);
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
      <ContactSection/>
      <Footer />
    </div>
  );
}