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
// import SaveAllBusinessesButton from './components/Button';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

//   const testing = async () => {

//     // Example API call
// const response = await fetch('/api/save-businesses', {
//   method: 'POST',
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   body: JSON.stringify({
//     query: 'restaurants',  // What to search for
//     location: 'Karachi',   // Location to search in
//     limit: 20              // Number of businesses to fetch
//   })
// })

// const result = await response.json()
// console.log(result)
//   }
    

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

      {/* <SaveAllBusinessesButton/> */}
      
      {/* Top Reviewed Businesses Section */}
      <BusinessSection />
      
      {/* Separate Recent Searches Section */}
      <RecentSearchesSection />
      
      {/* Latest User Reviews Section */}
      <ReviewSection />
      
      {/* Why Trust Section */}
      <TrustSection />
      
      {/* Verification Process Section */}
      <VerificationProcess />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}