'use client';

import { Users, Building, Shield, TrendingUp } from 'lucide-react';
import ScrollAnimationWrapper from './ScrollAnimationWrapper';
import { motion } from 'framer-motion';

const stats = [
  { icon: Users, value: '2K+', label: 'Reviews' },
  { icon: Building, value: '1K+', label: 'Companies' },
  { icon: Shield, value: '98%', label: 'Trust Score' },
  { icon: TrendingUp, value: '4.5', label: 'Avg Rating' },
];

export default function StatsBar() {
  const greenColor = '#16a34a';
  const lightGreen = '#f0fdf4';

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <ScrollAnimationWrapper 
            key={stat.label} 
            direction="up" 
            delay={index * 0.1}
            amount={0.2}
          >
            <motion.div
              whileHover={{ 
                scale: 1.05,
                y: -10,
                transition: { duration: 0.2 }
              }}
              className="bg-white p-6 rounded-xl shadow-sm text-center border"
              style={{ borderColor: lightGreen }}
            >
              <div 
                className="inline-block p-3 rounded-full mb-4"
                style={{ backgroundColor: lightGreen }}
              >
                <stat.icon className="h-8 w-8" style={{ color: greenColor }} />
              </div>
              <motion.div 
                className="text-3xl font-bold text-gray-900 mb-1"
                initial={{ scale: 0.5 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  delay: 0.3 + index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
              >
                {stat.value}
              </motion.div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </motion.div>
          </ScrollAnimationWrapper>
        ))}
      </div>
    </div>
  );
}