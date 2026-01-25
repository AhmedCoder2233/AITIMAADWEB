'use client';

import { Shield, Target, Users, Award } from 'lucide-react';
import ScrollAnimationWrapper from './ScrollAnimationWrapper';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function TrustSection() {
  const greenColor = '#16a34a';
  const lightGreen = '#f0fdf4';

  return (
    <section 
      className="py-16"
      style={{ backgroundColor: lightGreen }}
    >
      <div className="container mx-auto px-4 text-center">
        <ScrollAnimationWrapper direction="up" amount={0.2}>
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className="inline-block p-4 mb-8 bg-green-100"
          >
            <Image src={"/logo.png"} alt='Logo' width={80} height={60}/>
          </motion.div>
        </ScrollAnimationWrapper>
        
        <ScrollAnimationWrapper direction="up" delay={0.1} amount={0.2}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Trust AITIMAAD.<span style={{ color: greenColor }}>PK</span>?
          </h2>
        </ScrollAnimationWrapper>
        
        <ScrollAnimationWrapper direction="up" delay={0.2} amount={0.2}>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            We ensure every review is authentic, verified, and helpful for making informed decisions.
          </p>
        </ScrollAnimationWrapper>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { 
              icon: Target, 
              title: 'Verified Reviews', 
              desc: 'All reviews are from real customers'
            },
            { 
              icon: Users, 
              title: 'Real Users', 
              desc: 'Feedback from genuine customers only'
            },
            { 
              icon: Shield, 
              title: 'Secure Platform', 
              desc: 'Your data is protected and private'
            },
            { 
              icon: Award, 
              title: 'Trusted', 
              desc: '98% user satisfaction rate from AITIMAAD.PK'
            },
          ].map((item, index) => (
            <ScrollAnimationWrapper 
              key={item.title} 
              direction="up" 
              delay={0.3 + index * 0.1}
              amount={0.2}
            >
              <motion.div
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.2 }
                }}
                className="bg-white p-8 rounded-xl shadow-sm border text-center"
                style={{ borderColor: lightGreen }}
              >
                <motion.div 
                  className="inline-block p-4 rounded-xl mb-6"
                  style={{ backgroundColor: lightGreen }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  <item.icon className="h-10 w-10" style={{ color: greenColor }} />
                </motion.div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </motion.div>
            </ScrollAnimationWrapper>
          ))}
        </div>
      </div>
    </section>
  );
}