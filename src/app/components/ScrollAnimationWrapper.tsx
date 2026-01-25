'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ScrollAnimationWrapperProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  amount?: number;
}

export default function ScrollAnimationWrapper({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  amount = 0.1
}: ScrollAnimationWrapperProps) {
  const directionMap = {
    up: { y: 50 },
    down: { y: -50 },
    left: { x: 50 },
    right: { x: -50 },
    none: { x: 0, y: 0 }
  };

  return (
    <motion.div
      initial={{ 
        opacity: 0,
        ...directionMap[direction]
      }}
      whileInView={{ 
        opacity: 1,
        x: 0,
        y: 0 
      }}
      viewport={{ once: true, amount }}
      transition={{ 
        duration: 0.6,
        delay,
        ease: "easeOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}