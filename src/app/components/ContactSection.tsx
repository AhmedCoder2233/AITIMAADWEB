// components/SimpleContactSection.tsx
'use client';

import { motion } from 'framer-motion';
import { Mail, Phone, MapPin } from 'lucide-react';

const SimpleContactSection = () => {
  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      value: 'info@aitimaad.com',
      link: 'mailto:info@aitimaad.com'
    },
    {
      icon: Phone,
      title: 'Phone',
      value: '+92 332 2705270',
      link: 'tel:+923322705270'
    },
    {
      icon: MapPin,
      title: 'Address',
      value: '1C Lane 7th Zamzama Commercial Phase V DHA',
      link: 'https://maps.google.com/?q=1C+Lane+7th+Zamzama+Commercial+Phase+V+DHA'
    }
  ];

  return (
    <section className="flex items-center justify-center bg-white py-20 px-4" id='contact'>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Contact <span className="text-[#15803D]">Us</span>
          </h1>
          <p className="text-gray-600 text-lg">
            Get in touch through any of these channels
          </p>
        </motion.div>

        <div className="space-y-8">
          {contactInfo.map((item, index) => (
            <motion.a
              key={index}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ x: 10 }}
              className="group block"
            >
              <div className="flex items-center p-6 rounded-2xl border border-green-200 hover:border-[#15803D] hover:bg-green-50 transition-all duration-300">
                <div className="p-3 rounded-lg bg-[#15803D]/10 group-hover:bg-[#15803D]/20 transition-colors mr-6">
                  <item.icon className="w-6 h-6 text-[#15803D]" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 group-hover:text-[#15803D] transition-colors">
                    {item.value}
                  </p>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SimpleContactSection;