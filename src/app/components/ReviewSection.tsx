'use client';

import ReviewCard from './ReviewCard';
import { Review } from '../types';
import ScrollAnimationWrapper from './ScrollAnimationWrapper';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const reviews: Review[] = [
  {
    id: 1,
    name: 'Ahmed Raza',
    verified: true,
    role: 'Verified Customer',
    content: 'Finally, a review platform in Pakistan that actually verifies users! No more fake reviews. AITIMAAD.PK changed how I make purchase decisions.',
  },
  {
    id: 2,
    name: 'Sana Khan',
    verified: true,
    role: 'Business Owner',
    content: 'As a small business owner, this platform helped me build trust with customers. The verification process ensures only genuine reviews appear on my profile.',
  },
  {
    id: 3,
    name: 'Usman Ali',
    verified: true,
    role: 'Verified Customer',
    content: 'The dual verification system is brilliant. I can trust the reviews here because I know every reviewer is verified with their NIC/Passport.',
  },
  {
    id: 4,
    name: 'Maria Tariq',
    verified: true,
    role: 'Marketing Manager',
    content: 'Our company\'s ratings improved dramatically after joining AITIMAAD.PK. Genuine reviews from verified customers help us improve our services.',
  },
];

export default function ReviewSection() {
  const greenColor = '#15803D';
  
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper direction="up" amount={0.1}>
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-50 rounded-full mb-4">
              <Star className="w-7 h-7" style={{ color: greenColor }} fill={greenColor} />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Users Say About <span style={{ color: greenColor }}>AITIMAAD.PK</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Real feedback from verified customers and businesses about our platform
            </p>
          </div>
        </ScrollAnimationWrapper>
        
        {/* Rating Summary */}
        <ScrollAnimationWrapper direction="up" delay={0.1}>
          <div className="max-w-xl mx-auto mb-10">
            <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className="w-6 h-6 mx-1" 
                    style={{ color: greenColor }} 
                    fill={greenColor}
                  />
                ))}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">4.8/5 Rating</h3>
              <p className="text-gray-600">Based on verified reviews from trusted users</p>
            </div>
          </div>
        </ScrollAnimationWrapper>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {reviews.map((review, index) => (
            <ScrollAnimationWrapper 
              key={review.id} 
              direction="up" 
              delay={0.2 + index * 0.1}
              amount={0.1}
            >
              <div className="h-full">
                <ReviewCard 
                  review={review} 
                  index={index}
                />
              </div>
            </ScrollAnimationWrapper>
          ))}
        </div>
        
        <ScrollAnimationWrapper direction="up" delay={0.6} amount={0.1}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-center mt-12"
          >
            <button 
              className="text-white px-8 py-3 rounded-xl transition-colors duration-300 font-semibold shadow-md hover:shadow-lg"
              style={{ backgroundColor: greenColor }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#166534'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = greenColor}
            >
              <a href="mailto:admin@bigbulldigital.com">              Share Your Experience
</a>
            </button>
            <p className="text-gray-500 text-sm mt-3">
              Join thousands of verified users sharing authentic experiences
            </p>
          </motion.div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
}