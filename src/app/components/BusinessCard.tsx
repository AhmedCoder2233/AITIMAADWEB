'use client';

import { Star } from 'lucide-react';
import { Business } from '../types';
import { motion } from 'framer-motion';

interface BusinessCardProps {
  business: Business;
  index: number;
}

export default function BusinessCard({ business, index }: BusinessCardProps) {
  const greenColor = '#16a34a';
  const lightGreen = '#f0fdf4';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.1 }}
      whileHover={{ scale: 1.03, y: -5 }}
      className="bg-white p-6 rounded-xl shadow-sm border h-full flex flex-col"
      style={{ borderColor: lightGreen }}
    >
      <div className="flex justify-between items-start mb-4 flex-shrink-0">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">{business.name}</h3>
          <p className="text-gray-600 text-sm line-clamp-2">{business.category}</p>
        </div>
        <div 
          className="flex items-center px-3 py-1 rounded-full flex-shrink-0 ml-2"
          style={{ backgroundColor: lightGreen }}
        >
          <Star className="h-4 w-4 text-yellow-500 fill-current" />
          <span className="ml-1 font-semibold" style={{ color: greenColor }}>{business.rating}</span>
        </div>
      </div>
      
      <div className="mt-auto pt-4">
        <div className="text-gray-500 text-sm">
          {business.reviews.toLocaleString()} reviews
        </div>
      </div>
    </motion.div>
  );
}