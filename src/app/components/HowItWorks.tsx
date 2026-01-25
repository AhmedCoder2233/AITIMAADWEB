'use client';

import { useState } from 'react';
import ScrollAnimationWrapper from './ScrollAnimationWrapper';
import { 
  User, 
  Building, 
  Shield, 
  CheckCircle, 
  Search, 
  FileText,
  Star,
  TrendingUp
} from 'lucide-react';

export default function HowItWorksSection() {
  const [activeTab, setActiveTab] = useState<'customer' | 'business'>('customer');

  const customerSteps = [
    {
      icon: <User className="w-6 h-6" />,
      title: "Sign Up as Customer",
      description: "Create your account with basic information"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Verify Your Identity",
      description: "Verify using NIC, Passport, or Driving License"
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "Find Businesses",
      description: "Search and browse all businesses available in our platform"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Submit Review with Proof",
      description: "Provide proof of purchase and submit your review for only verified businesses"
    }
  ];

  const businessSteps = [
    {
      icon: <Building className="w-6 h-6" />,
      title: "Sign Up as Business",
      description: "Register your business details"
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "Get Listed Automatically",
      description: "Appear in search results (unverified status)"
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "Request Verification",
      description: "Fill verification form for pricing discussion and verified status"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Get Verified & Reviews",
      description: "Get verified and get reviews on your business"
    }
  ];

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <ScrollAnimationWrapper direction="up">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-4">
              <TrendingUp className="w-8 h-8 text-[#15803D]" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How AITIMAAD.<span className="text-[#15803D]">PK</span> Works
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              A trusted platform connecting verified customers with authentic businesses
            </p>
          </div>
        </ScrollAnimationWrapper>

        {/* Tab Selector */}
        <ScrollAnimationWrapper direction="up" delay={0.1}>
          <div className="flex justify-center mb-10">
            <div className="inline-flex bg-gray-100 p-1 rounded-xl">
              <button
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === 'customer'
                    ? 'bg-[#15803D] text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setActiveTab('customer')}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Customer Journey
                </div>
              </button>
              <button
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === 'business'
                    ? 'bg-[#15803D] text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setActiveTab('business')}
              >
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Business Journey
                </div>
              </button>
            </div>
          </div>
        </ScrollAnimationWrapper>

        {/* Steps Section */}
        <div className="max-w-4xl mx-auto">
          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {(activeTab === 'customer' ? customerSteps : businessSteps).map((step, index) => (
              <ScrollAnimationWrapper
                key={index}
                direction="up"
                delay={0.1 + index * 0.1}
                amount={0.1}
              >
                <div className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg transition-shadow duration-300 h-full">
                  <div className="flex flex-col items-center">
                    {/* Step Number */}
                    <div className="relative mb-4">
                      <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                        <div className="text-[#15803D]">
                          {step.icon}
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#15803D] text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                  </div>
                </div>
              </ScrollAnimationWrapper>
            ))}
          </div>

          {/* Detailed Explanation */}
          <ScrollAnimationWrapper direction="up" delay={0.5}>
            <div className="bg-green-50 border border-green-100 rounded-2xl p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Shield className="w-6 h-6 text-[#15803D] mt-1" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-3">
                    {activeTab === 'customer' ? 'Customer Verification Process' : 'Business Verification Benefits'}
                  </h3>
                  <div className="text-gray-700 space-y-3">
                    {activeTab === 'customer' ? (
                      <>
                        <p className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-[#15803D] flex-shrink-0 mt-0.5" />
                          <span>One-time verification using official documents (NIC/Passport/Driving License)</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-[#15803D] flex-shrink-0 mt-0.5" />
                          <span>Only verified customers can submit reviews to verified businesses</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-[#15803D] flex-shrink-0 mt-0.5" />
                          <span>Proof of purchase/service required for each review submission</span>
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-[#15803D] flex-shrink-0 mt-0.5" />
                          <span>Automatic listing upon signup with "unverified" status</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-[#15803D] flex-shrink-0 mt-0.5" />
                          <span>Complete verification form to discuss pricing and verification process</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-[#15803D] flex-shrink-0 mt-0.5" />
                          <span>Once verified, display all authentic reviews from verified customers</span>
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimationWrapper>

          {/* CTA Section */}
          <ScrollAnimationWrapper direction="up" delay={0.6}>
            <div className="mt-8 text-center">
              <div className="inline-flex flex-col sm:flex-row gap-4">
                <button className="px-8 py-3 bg-[#15803D] text-white font-semibold rounded-xl hover:bg-green-700 transition-colors duration-300 shadow-md hover:shadow-lg">
                  <a href="/login">                  {activeTab === 'customer' ? 'Sign Up as Customer' : 'Register Your Business'}</a>
                </button>
                <button className="px-8 py-3 bg-white text-[#15803D] font-semibold rounded-xl border-2 border-[#15803D] hover:bg-green-50 transition-colors duration-300">
                  <a href="mailto:admin@bigbulldigital.com">Contact Us To Verify your Business</a>
                </button>
              </div>
              <p className="text-gray-500 text-sm mt-4">
                Join Pakistan&apos;s most trusted review platform today
              </p>
            </div>
          </ScrollAnimationWrapper>
        </div>
      </div>
    </section>
  );
}