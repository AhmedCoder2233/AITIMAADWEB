'use client';

import { useState, useEffect, useRef, MutableRefObject } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  CheckCircle, Shield, Star, Globe, 
  Mail, Link as LinkIcon, Eye,
  ArrowRight, XCircle, BadgeCheck,
  ChevronRight, PlayCircle, Users,
  Target, TrendingUp, Zap,
  MessageSquare, QrCode, BarChart,
  ThumbsUp, Award, Clock
} from 'lucide-react';

const GetMoreReviewsPage = () => {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
const sections: MutableRefObject<(HTMLElement | null)[]> = useRef([]);
  const [visibleSections, setVisibleSections] = useState<number[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sections.current.indexOf(entry.target as HTMLDivElement);
            if (index !== -1 && !visibleSections.includes(index)) {
              setVisibleSections(prev => [...prev, index]);
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    sections.current.forEach(section => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const handleGetStarted = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    if (profile?.user_type !== 'business') {
      setShowLoginPrompt(true);
      return;
    }

    // Direct payment for $49/month
    router.push('/pricing');
  };

  const realFeatures = [
    {
      icon: <BadgeCheck className="h-6 w-6" />,
      title: "Business Verification",
      description: "Get verified blue checkmark on your business profile"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Show Reviews on Website",
      description: "Display your reviews directly on your website"
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Analytics Dashboard",
      description: "Full Analytics Dashboard of your Business"
    },
    {
      icon: <LinkIcon className="h-6 w-6" />,
      title: "Fetch Reviews via API",
      description: "Get an API key to show reviews on your site"
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Pay $49/month",
      description: "Subscribe to Business Pro plan"
    },
    {
      number: "2",
      title: "Get Verified",
      description: "Receive verified badge on your profile"
    },
    {
      number: "3",
      title: "Analytics Dashboard",
      description: "Full Analytics Dashboard of your Business"
    },
    {
      number: "4",
      title: "Fetch Reviews in your Website",
      description: "Get an API key to show reviews on your site"
    },
    {
      number: "5",
      title: "Build Trust",
      description: "Showcase reviews to gain customer trust"
    }
  ];
  

  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Section */}
      <section 
        ref={(el) => { sections.current[0] = el; }}
        className={`pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-green-50 transition-all duration-1000 ${
          visibleSections.includes(0) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 border border-green-200 mb-6">
              <span className="text-sm font-medium text-green-700">For Business Owners Only</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Get Verified & Collect Reviews
              <span className="text-green-600 block">For Your Business</span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Pay $49/month, get your business verified, and start collecting reviews 
              to build trust with customers.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button 
                onClick={handleGetStarted}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                Pay $49/month & Start
                <ArrowRight className="h-5 w-5" />
              </button>
              <button className="border-2 border-green-600 text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition flex items-center justify-center gap-2">
                <PlayCircle className="h-5 w-5" />
                See How It Works
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What You Get for $49/month</h2>
            <p className="text-gray-600">Simple features that actually work</p>
          </div>

          <div 
            ref={(el) => { sections.current[1] = el; }}
            className={`grid grid-cols-1 md:grid-cols-2 gap-8 transition-all duration-1000 delay-300 ${
              visibleSections.includes(1) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            {realFeatures.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-green-300 transition-all hover:shadow-md">
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600">Simple 4-step process</p>
          </div>

          <div 
            ref={(el) => { sections.current[2] = el; }}
            className={`flex flex-wrap justify-center gap-8 transition-all duration-1000 delay-500 ${
              visibleSections.includes(2) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-2xl font-bold mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            ref={(el) => { sections.current[3] = el; }}
            className={`bg-gradient-to-br from-green-50 to-white rounded-2xl border border-green-200 p-8 md:p-12 transition-all duration-1000 delay-700 ${
              visibleSections.includes(3) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Get Verified?</h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-gray-900">Build Trust</h4>
                      <p className="text-gray-600">Verified badge shows customers you're a real business</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-gray-900">Showcase Reviews</h4>
                      <p className="text-gray-600">Display authentic reviews on your website</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-gray-900">Easy Invitations</h4>
                      <p className="text-gray-600">Send simple links to customers asking for reviews</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Business Pro Plan</h3>
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900">$49</span>
                    <span className="text-lg text-gray-600 ml-2">/month</span>
                  </div>
                  <p className="text-gray-500 mt-2">No free trial. Pay monthly, cancel anytime.</p>
                </div>
                
                <button
                  onClick={handleGetStarted}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  Subscribe for $49/month
                  <ArrowRight className="h-5 w-5" />
                </button>
                
                <div className="mt-6 space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Business verification included</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Website review display</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Full Analytics Dashboard</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Common Questions</h2>
          </div>
          
          <div 
            ref={(el) => { sections.current[4] = el; }}
            className={`space-y-4 transition-all duration-1000 delay-900 ${
              visibleSections.includes(4) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            {[
              {
                question: "Is there a free trial?",
                answer: "No, there's no free trial. You pay $49/month and get immediate access to all features."
              },
              {
                question: "What do I get exactly?",
                answer: "1) Verified business badge, 2) Ability to show reviews on your website, 3) Full Analytics Dashboard of your Business."
              },
              {
                question: "Can I cancel anytime?",
                answer: "Yes, cancel your subscription anytime. No long-term commitment required."
              },
              {
                question: "How do reviews help my business?",
                answer: "Verified businesses with displayed reviews gain more customer trust and get more business."
              },
              {
                question: "Is this only for businesses?",
                answer: "Yes, this plan is only available for business accounts. Personal accounts cannot subscribe."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Get Verified?
          </h2>
          <p className="text-green-100 text-xl mb-8">
            Pay $49/month. Get verified. Collect reviews. Build trust.
          </p>
          
          <button
            onClick={handleGetStarted}
            className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition flex items-center justify-center gap-2 mx-auto"
          >
            Subscribe Now - $49/month
            <ArrowRight className="h-5 w-5" />
          </button>
          
          <p className="text-green-200 mt-4">
            Cancel anytime • No hidden fees • Business accounts only
          </p>
        </div>
      </section>

      <Footer />

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                {user && profile?.user_type !== 'business' ? (
                  <XCircle className="h-6 w-6 text-red-600" />
                ) : (
                  <Shield className="h-6 w-6 text-green-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {user && profile?.user_type !== 'business' 
                    ? "Business Account Required" 
                    : "Login Required"}
                </h3>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              {user && profile?.user_type !== 'business' 
                ? "The Business Pro plan ($49/month) is only available for verified business accounts. Please upgrade your account or login with a business account."
                : "Please login with your business account to subscribe to the Business Pro plan."}
            </p>
            
            <div className="space-y-3">
              {user && profile?.user_type !== 'business' ? (
                <>
                  <button
                    onClick={() => {
                      setShowLoginPrompt(false);
                      router.push('/account/upgrade?type=business');
                    }}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                  >
                    Upgrade to Business Account
                  </button>
                  <button
                    onClick={() => {
                      setShowLoginPrompt(false);
                      router.push('/login?type=business');
                    }}
                    className="w-full px-4 py-3 border-2 border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50 transition"
                  >
                    Login with Business Account
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowLoginPrompt(false);
                      router.push('/login?type=business');
                    }}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                  >
                    Login as Business
                  </button>
                  <button
                    onClick={() => {
                      setShowLoginPrompt(false);
                      router.push('/signup?type=business');
                    }}
                    className="w-full px-4 py-3 border-2 border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50 transition"
                  >
                    Create Business Account
                  </button>
                </>
              )}
              <button 
                onClick={() => setShowLoginPrompt(false)} 
                className="w-full px-4 py-3 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GetMoreReviewsPage;