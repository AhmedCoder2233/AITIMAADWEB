'use client';

import { Shield, Facebook, Twitter, Instagram, Linkedin, Mail, Phone } from 'lucide-react';
import ScrollAnimationWrapper from './ScrollAnimationWrapper';
import { motion } from 'framer-motion';

export default function Footer() {
  const greenColor = '#16a34a';
  const lightGreen = '#f0fdf4';

  const resources = ['Help Center', 'Guidelines', 'Help', 'Contact'];
  const legal = ['Privacy Policy', 'Terms of Service', 'Policies', 'Verification'];
  


  return (
    <footer className="bg-gray-900 text-white pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <ScrollAnimationWrapper direction="up" amount={0.2}>
              <div className="flex items-center space-x-2 mb-6">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Shield className="h-8 w-8" style={{ color: greenColor }} />
                </motion.div>
                <h2 className="text-2xl font-bold">
                  AITIMAAD<span style={{ color: greenColor }}>.PK</span>
                </h2>
              </div>
            </ScrollAnimationWrapper>
            
            <ScrollAnimationWrapper direction="up" delay={0.1} amount={0.2}>
              <p className="text-gray-400 mb-6">
                Pakistan's most trusted review platform for companies, products, and services.
              </p>
            </ScrollAnimationWrapper>
            
          
          </div>

          {/* Resources */}
          <div>
            <ScrollAnimationWrapper direction="up" delay={0.2} amount={0.2}>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
            </ScrollAnimationWrapper>
            <ul className="space-y-2">
              {resources.map((item, index) => (
                <ScrollAnimationWrapper 
                  key={item} 
                  direction="left" 
                  delay={0.3 + index * 0.1}
                  amount={0.2}
                >
                  <li>
                    <motion.a
                      href="mailto:admin@bigbulldigital.com"
                      whileHover={{ x: 5, color: greenColor }}
                      transition={{ duration: 0.2 }}
                      className="text-gray-400 transition-colors duration-300 block"
                    >
                      {item}
                    </motion.a>
                  </li>
                </ScrollAnimationWrapper>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <ScrollAnimationWrapper direction="up" delay={0.3} amount={0.2}>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
            </ScrollAnimationWrapper>
            <ul className="space-y-2">
              {legal.map((item, index) => (
                <ScrollAnimationWrapper 
                  key={item} 
                  direction="left" 
                  delay={0.4 + index * 0.1}
                  amount={0.2}
                >
                  <li>
                    <motion.a
                      href="mailto:admin@bigbulldigital.com"
                      whileHover={{ x: 5, color: greenColor }}
                      transition={{ duration: 0.2 }}
                      className="text-gray-400 transition-colors duration-300 block"
                    >
                      {item}
                    </motion.a>
                  </li>
                </ScrollAnimationWrapper>
              ))}
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <ScrollAnimationWrapper direction="up" delay={0.4} amount={0.2}>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
            </ScrollAnimationWrapper>
            <ScrollAnimationWrapper direction="up" delay={0.5} amount={0.2}>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-400">
                  <Mail className="h-5 w-5 mr-3" />
                  <span>info@bigbulldigital.com</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <Phone className="h-5 w-5 mr-3" />
                  <span>+92 331 2705270</span>
                </div>
              </div>
            </ScrollAnimationWrapper>
            
          
          </div>
        </div>

        <ScrollAnimationWrapper direction="up" delay={0.8} amount={0.2}>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">
              © 2026 AITIMAAD.PK. All rights reserved.
            </p>
            <p className="text-gray-500 mt-2 text-sm">
              Powered by AITIMAAD.PK
            </p>
          </div>
        </ScrollAnimationWrapper>
      </div>
    </footer>
  );
}