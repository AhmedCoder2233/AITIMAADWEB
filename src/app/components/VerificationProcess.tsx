'use client';

import { CheckCircle, ShieldCheck, Users, AlertCircle } from 'lucide-react';
import { VerificationStep } from '../types';
import { motion } from 'framer-motion';

const steps: VerificationStep[] = [
  {
    id: 1,
    title: 'Purchase Verification',
    description: 'We confirm reviewers made actual transactions',
  },
  {
    id: 2,
    title: 'Profile veridication',
    description: 'We verify user profiles from our experts',
  },
  {
    id: 3,
    title: 'Manual Moderation',
    description: 'Our team reviews flagged content for quality',
  },
  {
    id: 4,
    title: 'Zero Tolerance Policy',
    description: 'Immediate action against manipulation attempts',
  },
];

const icons = [CheckCircle, ShieldCheck, Users, AlertCircle];

export default function VerificationProcess() {
  const greenColor = '#16a34a';
  const lightGreen = '#f0fdf4';

  return (
    <motion.section 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="py-16 bg-white"
    >
      <div className="container mx-auto px-4">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-gray-900 mb-12 text-center"
        >
          How We Verify Reviews
        </motion.h2>
        
        <div className="relative">
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 z-0" 
            style={{ backgroundColor: lightGreen }}
          ></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => {
              const Icon = icons[index];
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ 
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  }}
                  className="relative"
                >
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
                    style={{ backgroundColor: greenColor }}
                  >
                    {index + 1}
                  </div>
                  
                  <div className="bg-white p-8 rounded-xl shadow-sm border text-center h-full"
                    style={{ borderColor: lightGreen }}
                  >
                    <motion.div 
                      className="inline-block p-4 rounded-xl mb-6"
                      style={{ backgroundColor: lightGreen }}
                      whileHover={{ rotate: 5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon className="h-10 w-10" style={{ color: greenColor }} />
                    </motion.div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 right-0 w-full">
                      <motion.div 
                        className="h-3 w-3 rounded-full absolute right-0 transform translate-x-1/2 -translate-y-1/2 shadow-md"
                        style={{ backgroundColor: greenColor }}
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      ></motion.div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.section>
  );
}