'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';

type UserType = 'business' | 'customer' | null;

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  profile_url: string | null;
  user_type: UserType;
  is_verified: boolean;
  
  // Business specific fields
  business_name: string | null;
  business_description: string | null;
  business_category: string | null;
  business_address: string | null;
  business_city: string | null;
  business_country: string | null;
  business_phone_number: string | null;
  business_email: string | null;
  business_website: string | null;
  business_logo_url: string | null;
  
  // Customer specific fields
  phone_number: string | null;
}

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  userType: UserType;
  signIn: (email: string, password: string, userType: UserType, captchaToken?: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, userType: UserType, phoneNumber?: string, businessDetails?: Partial<Profile>, profilePicture?: File, captchaToken?: string | null) => Promise<{success: boolean, message: string}>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  uploadProfilePicture: (file: File, userId: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const uploadProfilePicture = async (file: File, userId: string): Promise<string> => {
    try {
      console.log('📤 Uploading to ImgBB...');
      
      // Use ImgBB (free image hosting) as alternative
      const formData = new FormData();
      formData.append('image', file);
      formData.append('key', 'cde8cd9347156176152a7a516c136ef8'); // Get free key from imgbb.com
      
      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.data.url;
      } else {
        // Fallback to Supabase if ImgBB fails
        const timestamp = Date.now();
        const fileName = `profile_${userId}_${timestamp}.jpg`;
        
        const { data, error } = await supabase.storage
          .from('profile-pictures')
          .upload(fileName, file);
          
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(data.path);
        
        return publicUrl;
      }
      
    } catch (error) {
      console.error('Upload failed, using placeholder');
      return `https://ui-avatars.com/api/?name=${userId.substring(0, 2)}&background=16a34a&color=fff&size=150`;
    }
  };

  const checkAuth = async () => {
    try {
      setLoading(true);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (session?.user) {
        setUser(session.user);
        
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();
          
        if (profileError) {
          console.error('Profile fetch error:', profileError);
        } else {
          setProfile(profileData);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      // Don't auto-set user on SIGNED_IN if we're handling login manually
      if (event === 'SIGNED_IN') {
        console.log('SIGNED_IN event - letting signIn function handle this');
        return;
      }
      
      if (session?.user) {
        setUser(session.user);
        
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();
          
        setProfile(profileData || null);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ✅ UPDATED: signIn now accepts captchaToken parameter
  const signIn = async (email: string, password: string, userType: UserType, captchaToken?: string) => {
    try {
      setLoading(true);
      console.log(`🔐 Attempting ${userType} login for:`, email);
      
      // 🔥 PRE-CHECK: Verify user hasn't auto-logged in from signup
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('⚠️ Active session found, signing out first...');
        await supabase.auth.signOut();
      }
      
      // 1. Authenticate with Supabase Auth WITH CAPTCHA
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken: captchaToken || undefined, // ✅ Pass captchaToken if provided
        },
      });

      if (error) {
        console.error('Auth error:', error);
        throw error;
      }

      if (data.user) {
        console.log('✅ Auth successful, fetching profile...');
        
        // 2. Fetch profile for this user
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          throw new Error('Profile not found. Please sign up again.');
        }

        if (!profileData) {
          throw new Error('Profile not found. Please sign up first.');
        }

        console.log('📋 Profile found:', {
          email: profileData.email,
          user_type: profileData.user_type,
          name: profileData.user_type === 'business' ? profileData.business_name : profileData.full_name
        });

        // ✅ STRICT CHECK: Profile type must match login type
        if (profileData.user_type !== userType) {
          console.log(`❌ User type mismatch: Profile is ${profileData.user_type}, trying to login as ${userType}`);
          
          // Sign out the user
          await supabase.auth.signOut();
          
          const actualType = profileData.user_type === 'business' ? 'Business' : 'Customer';
          const accountName = profileData.user_type === 'business' 
            ? profileData.business_name 
            : profileData.full_name;
          
          throw new Error(
            `This email is registered as a ${actualType} account (${accountName}). ` +
            `Please use "${actualType} Login" or sign up with a different email.`
          );
        }

        // 3. Set user and profile
        setUser(data.user);
        setProfile(profileData);
        
        console.log('✅ Login successful, redirecting to home...');
        router.push('/');
      }
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      
      // Better error messages
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please try again.');
      } else if (error.message.includes('Email not confirmed')) {
        throw new Error('Please verify your email before logging in.');
      } else if (error.message.includes('captcha verification process failed')) {
        throw new Error('Security verification failed. Please complete the captcha.');
      } else {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    fullName: string, 
    userType: UserType, 
    phoneNumber?: string,
    businessDetails?: Partial<Profile>,
    profilePicture?: File,
    captchaToken?: string | null  
  ): Promise<{success: boolean, message: string}> => {
    try {
      setLoading(true);
      console.log('🚀 Starting signup for:', email, 'as', userType);

      // ✅ STEP 0: Validate captcha token exists
      if (!captchaToken) {
        return {
          success: false,
          message: 'Security verification required. Please complete the captcha.'
        };
      }

      // ✅ STEP 1: Check if email exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_type, email, business_name, full_name')
        .eq('email', email)
        .maybeSingle();

      if (existingProfile) {
        const existingType = existingProfile.user_type === 'business' ? 'Business' : 'Customer';
        const existingName = existingProfile.user_type === 'business' 
          ? existingProfile.business_name 
          : existingProfile.full_name;
        
        return {
          success: false,
          message: `This email is already registered as a ${existingType} account (${existingName}). Please use a different email.`
        };
      }

      // ✅ STEP 2: Create auth user WITH CAPTCHA TOKEN
      console.log('📧 Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: userType,
          },
          captchaToken: captchaToken, // ✅ Pass captcha token to Supabase
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        console.error('Auth error:', authError);
        return {
          success: false,
          message: authError.message.includes('already registered') 
            ? 'This email already has an account. Please login.'
            : 'Signup failed. Please try again.'
        };
      }

      // Get user ID - Supabase returns user even if email verification is required
      const userId = authData.user?.id;

      if (!userId) {
        console.error('❌ No user ID returned from signup');
        return {
          success: false,
          message: 'User creation failed. Please try again.'
        };
      }

      // ✅ STEP 3: UPLOAD PROFILE PICTURE (After auth user is created)
      let profileUrl: string | null = null;
      if (profilePicture) {
        try {
          console.log('🖼️ Uploading profile picture...');
          profileUrl = await uploadProfilePicture(profilePicture, userId);
        } catch (uploadError: any) {
          console.warn('⚠️ Profile picture upload failed:', uploadError.message);
          profileUrl = null; // Explicitly set to null on failure
        }
      }

      // ✅ STEP 4: Create profile with uploaded picture URL
      
      const profileData: any = {
        user_id: userId,
        email: email,
        full_name: fullName,
        user_type: userType,
        profile_url: profileUrl || null,
      };

      console.log('📸 Profile URL being saved:', profileData.profile_url);

      if (userType === 'business') {
        if (phoneNumber) profileData.business_phone_number = phoneNumber;
        if (businessDetails) {
          profileData.business_name = businessDetails.business_name || fullName;
          profileData.business_category = businessDetails.business_category || '';
          profileData.business_address = businessDetails.business_address || '';
          profileData.business_city = businessDetails.business_city || '';
          profileData.business_country = businessDetails.business_country || 'Pakistan';
          profileData.business_email = businessDetails.business_email || email;
          profileData.business_description = businessDetails.business_description || '';
          profileData.business_website = businessDetails.business_website || '';
        }
      } else {
        if (phoneNumber) profileData.phone_number = phoneNumber;
      }

      // Insert profile
      const { data: profileResponse, error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'user_id' })
        .select()
        .single();

      if (profileError) {
        console.error('❌ Profile creation error:', profileError);
        return {
          success: false,
          message: 'Profile creation failed. Please try again.'
        };
      }


      // ✅ STEP 5: Force sign out
      console.log('🔒 Forcing sign out after signup...');
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);

      // ✅ STEP 6: Success
      const successMessage = userType === 'business' 
        ? `🎉 Business "${businessDetails?.business_name || fullName}" registered! ✅ Please check ${email} for verification link.`
        : `🎉 Account created successfully! ✅ Please check ${email} for verification link.`;
      
      setTimeout(() => router.push('/login'), 2000);
      
      return {
        success: true,
        message: successMessage
      };
      
    } catch (error: any) {
      console.error('💥 Signup error:', error);
      await supabase.auth.signOut();
      return {
        success: false,
        message: error.message || 'Signup failed. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  

  const value: AuthContextType = {
    user,
    profile,
    loading,
    userType: profile?.user_type || null,
    signIn,
    signUp,
    signOut,
    checkAuth,
    updateProfile,
    uploadProfilePicture,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}