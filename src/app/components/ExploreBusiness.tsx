'use client';

import { MapPin } from 'lucide-react';
import ScrollAnimationWrapper from './ScrollAnimationWrapper';

const cities = [
  { id: 1, name: 'Karachi' },
  { id: 2, name: 'Lahore' },
  { id: 3, name: 'Islamabad' },
];

export default function CitiesSection() {
  const greenColor = '#15803D';

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <ScrollAnimationWrapper direction="up" amount={0.1}>
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-50 rounded-full mb-4">
              <MapPin className="w-7 h-7" style={{ color: greenColor }} />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Explore Businesses by City
            </h2>
            <p className="text-gray-600 text-lg max-w-xl mx-auto">
              Discover verified businesses in major Pakistani cities
            </p>
          </div>
        </ScrollAnimationWrapper>

        {/* City Cards */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cities.map((city, index) => (
              <ScrollAnimationWrapper
                key={city.id}
                direction="up"
                delay={0.1 + index * 0.1}
                amount={0.1}
              >
                <button
                  className="group relative bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-200 focus:ring-offset-2 w-full text-left"
                  style={{
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  }}
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Icon Container */}
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                      style={{ 
                        backgroundColor: `${greenColor}15`,
                        border: `2px solid ${greenColor}30`
                      }}
                    >
                      <MapPin className="w-8 h-8" style={{ color: greenColor }} />
                    </div>
                    
                    {/* City Name */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {city.name}
                    </h3>
                    
                    {/* Explore Text */}
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span 
                        className="text-sm font-medium transition-all duration-300 group-hover:translate-x-1"
                        style={{ color: greenColor }}
                      >
                        Explore Businesses
                      </span>
                      <svg 
                        className="w-4 h-4 transition-all duration-300 group-hover:translate-x-1" 
                        style={{ color: greenColor }}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Hover border effect */}
                  <div 
                    className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-green-300 transition-all duration-300 pointer-events-none"
                  ></div>
                </button>
              </ScrollAnimationWrapper>
            ))}
          </div>
        </div>

        {/* View All Button */}
        <ScrollAnimationWrapper direction="up" delay={0.4}>
          <div className="text-center mt-10">
            <button
              className="px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg"
              style={{ 
                backgroundColor: greenColor,
                color: 'white'
              }}
            >
              <a href="mailto:admin@bigbulldigital.com">Contact Us to Verify your Business</a>
            </button>
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
}