'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Verifying your email...');

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Parse hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('🔍 Auth callback - Type:', type, 'Token:', access_token ? 'YES' : 'NO');

        if (!access_token || type !== 'signup') {
          console.log('⚠️ Not a signup verification, redirecting...');
          router.push('/');
          return;
        }

        // Set session with tokens
        const { data: { user }, error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token: refresh_token || '',
        });

        if (sessionError || !user) {
          console.error('❌ Session error:', sessionError);
          setStatus('Verification failed. Please try again.');
          setTimeout(() => router.push('/login'), 3000);
          return;
        }

        console.log('✅ Email verified for user:', user.id);
        setStatus('Email verified! Setting up your account...');

        // Fetch user profile to check if business
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profile) {
          console.error('❌ Profile fetch error:', profileError);
          setStatus('Profile not found. Redirecting...');
          setTimeout(() => router.push('/'), 2000);
          return;
        }

        console.log('✅ Profile fetched:', profile.email, 'Type:', profile.user_type);

        // If business user, create business entry
        if (profile.user_type === 'business') {
          console.log('🏢 Business user verified, checking if business entry exists...');
          setStatus('Setting up your business profile...');

          // Check if business entry already exists
          const { data: existingBusiness } = await supabase
            .from('businesses')
            .select('id')
            .eq('email', profile.business_email || profile.email)
            .maybeSingle();

          if (!existingBusiness) {
            console.log('📝 Creating business entry...');

            const businessData = {
              name: profile.business_name || profile.full_name,
              description: profile.business_description || null,
              category: profile.business_category || '',
              address: profile.business_address || '',
              city: profile.business_city || '',
              country: profile.business_country || 'Pakistan',
              phone: profile.business_phone_number || '',
              email: profile.business_email || profile.email,
              website: profile.business_website || null,
              profile_url: profile.profile_url,
              is_verified: false,
              verification_status: 'pending',
              our_rating: 0,
              our_reviews_count: 0,
              source_city: profile.business_city || '',
              source_category: profile.business_category || '',
            };

            console.log('💾 Creating business entry:', businessData);

            const { data: businessResponse, error: businessError } = await supabase
              .from('businesses')
              .insert(businessData)
              .select()
              .single();

            if (businessError) {
              console.error('❌ Business entry creation error:', businessError);
            } else {
              console.log('✅ Business entry created:', businessResponse.id);
            }
          } else {
            console.log('✅ Business entry already exists:', existingBusiness.id);
          }
        }

        // Success - redirect to home
        setStatus('Success! Redirecting to home...');
        console.log('🏠 Redirecting to home...');
        setTimeout(() => router.push('/'), 1500);

      } catch (error) {
        console.error('💥 Verification error:', error);
        setStatus('An error occurred. Redirecting...');
        setTimeout(() => router.push('/'), 2000);
      }
    };

    handleEmailVerification();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{status}</h2>
        <p className="text-gray-600">Please wait...</p>
      </div>
    </div>
  );
}