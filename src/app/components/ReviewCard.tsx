'use client';

import { Verified, Star } from 'lucide-react';
import { Review } from '../types';
import { motion } from 'framer-motion';

interface ReviewCardProps {
  review: Review;
  index: number;
}

export default function ReviewCard({ review, index }: ReviewCardProps) {
  const greenColor = '#16a34a';
  const lightGreen = '#f0fdf4';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white p-6 rounded-xl shadow-sm border"
      style={{ borderColor: lightGreen }}
    >
      <div className="flex items-start mb-4">
        <div 
          className="h-14 w-14 rounded-full flex items-center justify-center font-bold text-xl text-white"
          style={{ backgroundColor: greenColor }}
        >
          {review.name.charAt(0)}
        </div>
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <h4 className="font-bold text-gray-900">{review.name}</h4>
                {review.verified && (
                  <Verified className="h-5 w-5 ml-2" style={{ color: greenColor }} />
                )}
              </div>
              <p className="text-sm text-gray-600">
                {review.role || 'Verified User'} • {review.timeAgo}
              </p>
            </div>
            <div 
              className="flex items-center px-3 py-1 rounded-full"
              style={{ backgroundColor: lightGreen }}
            >
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="ml-1 font-bold" style={{ color: greenColor }}>4.5</span>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-gray-700 mb-4 leading-relaxed">{review.content}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span 
            className="px-3 py-1 rounded-lg font-medium"
            style={{ backgroundColor: lightGreen, color: greenColor }}
          >
            {review.business}
          </span>
        </div>
        <button 
          className="text-sm font-medium"
          style={{ color: greenColor }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#15803d'}
          onMouseLeave={(e) => e.currentTarget.style.color = greenColor}
        >
          Helpful ✓
        </button>
      </div>
    </motion.div>
  );
}