'use client';

import { Menu, X, User, Building, LogOut, ChevronDown, Home, Users, MessageSquare, Phone, Package, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMediumScreen, setIsMediumScreen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const greenColor = '#16a34a';
  const lightGreen = '#15803D';

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMediumScreen(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      setIsProfileMenuOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '#howitworks', label: 'About Us', icon: Info },
    { href: '#whyaitimaad', label: 'Why Aitimaad', icon: Users },
    { href: '#contact', label: 'Contact Us', icon: Phone },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/98 backdrop-blur-lg border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo Section - Made more compact for medium screens */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-1 group">
              <div className={`relative transition-transform group-hover:scale-105 ${
                isMediumScreen ? 'h-10 w-10' : 'h-12 w-12 md:h-14 md:w-14'
              }`}>
                <Image 
                  src="/logo.png" 
                  alt="AITIMAAD.PK Logo" 
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 768px) 40px, (max-width: 1024px) 48px, 56px"
                />
              </div>
              <div className="flex flex-col leading-none">
                <div className={`font-bold tracking-tight ${
                  isMediumScreen ? 'text-lg' : 'text-xl md:text-2xl'
                }`}>
                  <span className="text-gray-900">AITI</span>
                  <span className="bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent" style={{ color: lightGreen }}>MAAD</span>
                </div>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation - Adjusted for medium screens */}
          <nav className="hidden md:flex items-center space-x-0.5 lg:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = typeof window !== 'undefined' && window.location.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-2 py-1.5 lg:px-4 lg:py-2 text-sm font-medium transition-colors duration-200 group ${
                    isMediumScreen ? 'min-w-0' : ''
                  }`}
                >
                  <span className={`relative z-10 flex items-center gap-1.5 lg:gap-2 ${
                    isActive ? 'text-green-600' : 'text-gray-600 hover:text-gray-900'
                  } ${isMediumScreen ? 'text-xs' : ''}`}>
                    <Icon className={`${isMediumScreen ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
                    <span className={`${isMediumScreen ? 'truncate max-w-[70px]' : ''}`}>
                      {isMediumScreen ? item.label.replace(' Us', '') : item.label}
                    </span>
                  </span>
                  <span className={`absolute inset-x-0 bottom-0 h-0.5 bg-green-600 rounded-full ${
                    isActive ? '' : 'scale-x-0 group-hover:scale-x-100'
                  } transition-transform origin-left`}></span>
                  <span className={`absolute inset-0 rounded-lg ${
                    isActive ? 'bg-green-50 opacity-100' : 'bg-gray-50 opacity-0 group-hover:opacity-100'
                  } transition-opacity`}></span>
                </Link>
              );
            })}
            
            {/* Purchasing Link - Only for Business Users */}
            {profile?.user_type === 'business' && (
              <>
              <Link
                href="/pricing"
                className="relative px-2 py-1.5 lg:px-4 lg:py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200 group"
              >
                <span className={`relative z-10 flex items-center gap-1.5 lg:gap-2 ${
                  isMediumScreen ? 'text-xs' : ''
                }`}>
                  <Package className={`${isMediumScreen ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
                  <span className={isMediumScreen ? 'truncate max-w-[70px]' : ''}>
                    {isMediumScreen ? 'Purchase' : 'Purchasing'}
                  </span>
                </span>
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-green-600 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                <span className="absolute inset-0 bg-gray-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </Link>
              <Link
                href="/widgetusage"
                className="relative px-2 py-1.5 lg:px-4 lg:py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200 group"
              >
                <span className={`relative z-10 flex items-center gap-1.5 lg:gap-2 ${
                  isMediumScreen ? 'text-xs' : ''
                }`}>
                  <Package className={`${isMediumScreen ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
                  <span className={isMediumScreen ? 'truncate max-w-[70px]' : ''}>
                    {isMediumScreen ? 'Widget' : 'Widget Usage'}
                  </span>
                </span>
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-green-600 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                <span className="absolute inset-0 bg-gray-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </Link>
                </>
            )}
          </nav>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 md:gap-3">
            {user ? (
              /* User Profile Menu - Desktop - Made more compact */
              <div className="hidden md:block relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-1.5 lg:gap-2.5 px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg transition-all duration-200 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-sm group"
                >
                  {profile?.profile_url ? (
                    <div className={`relative ring-2 ring-green-100 rounded-full ${
                      isMediumScreen ? 'h-7 w-7' : 'h-8 w-8'
                    }`}>
                      <img 
                        src={profile.profile_url} 
                        alt="Profile" 
                        className="h-full w-full rounded-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className={`rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center ring-2 ring-green-100 ${
                      isMediumScreen ? 'h-7 w-7' : 'h-8 w-8'
                    }`}>
                      {profile?.user_type === 'business' ? (
                        <Building className={`${isMediumScreen ? 'h-3 w-3' : 'h-4 w-4'} text-white`} />
                      ) : (
                        <User className={`${isMediumScreen ? 'h-3 w-3' : 'h-4 w-4'} text-white`} />
                      )}
                    </div>
                  )}
                  <div className="text-left min-w-0 max-w-[80px] lg:max-w-[140px]">
                    <p className={`font-semibold text-gray-900 truncate ${
                      isMediumScreen ? 'text-xs' : 'text-xs'
                    }`}>
                      {profile?.full_name?.split(' ')[0] || 'User'}
                    </p>
                    <p className={`text-gray-500 capitalize truncate ${
                      isMediumScreen ? 'text-[9px]' : 'text-[10px]'
                    }`}>
                      {profile?.user_type || 'User'}
                    </p>
                  </div>
                  <ChevronDown className={`text-gray-400 transition-transform duration-200 ${
                    isProfileMenuOpen ? 'rotate-180' : ''
                  } ${isMediumScreen ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} />
                </button>

                {/* Profile Dropdown */}
                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                      onMouseLeave={() => setIsProfileMenuOpen(false)}
                    >
                      <div className="p-4 bg-gradient-to-br from-green-50 to-white">
                        <div className="flex items-center gap-3">
                          {profile?.profile_url ? (
                            <div className="relative h-12 w-12 ring-2 ring-green-200 rounded-full">
                              <img 
                                src={profile.profile_url} 
                                alt="Profile" 
                                className="h-full w-full rounded-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center ring-2 ring-green-200 shadow-md">
                              {profile?.user_type === 'business' ? (
                                <Building className="h-6 w-6 text-white" />
                              ) : (
                                <User className="h-6 w-6 text-white" />
                              )}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate text-sm">{profile?.full_name}</p>
                            <p className="text-xs text-gray-600 truncate">{profile?.email}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded-full capitalize">
                              {profile?.user_type}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-2 space-y-1">
                        {/* Verification Link for Customer Users */}
                        {profile?.user_type === 'customer' && (
                          <Link href="/verification" onClick={() => setIsProfileMenuOpen(false)}>
                            <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-green-50 text-gray-700 w-full text-left transition-all rounded-lg group">
                              <div className="h-8 w-8 flex items-center justify-center bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                                <Users className="h-4 w-4 text-green-600" />
                              </div>
                              <span className="text-sm font-medium">Verification</span>
                            </div>
                          </Link>
                        )}
                        
                        {/* Purchasing Link for Business Users */}
                        {profile?.user_type === 'business' && (
                          <>
                          <Link href="/pricing" onClick={() => setIsProfileMenuOpen(false)}>
                            <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-green-50 text-gray-700 w-full text-left transition-all rounded-lg group">
                              <div className="h-8 w-8 flex items-center justify-center bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                                <Package className="h-4 w-4 text-green-600" />
                              </div>
                              <span className="text-sm font-medium">Purchasing</span>
                            </div>
                          </Link>
                          <Link
                href="/widgetusage"
                className="relative px-2 py-1.5 lg:px-4 lg:py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200 group"
              >
                <span className={`relative z-10 flex items-center gap-1.5 lg:gap-2 ${
                  isMediumScreen ? 'text-xs' : ''
                }`}>
                  <Package className={`${isMediumScreen ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
                  <span className={isMediumScreen ? 'truncate max-w-[70px]' : ''}>
                    {isMediumScreen ? 'Widget' : 'Widget Usage'}
                  </span>
                </span>
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-green-600 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                <span className="absolute inset-0 bg-gray-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </Link>
                          </>
                        )}
                        
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 text-red-600 w-full text-left transition-all rounded-lg group"
                        >
                          <div className="h-8 w-8 flex items-center justify-center bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                            <LogOut className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium">Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Login Buttons - Desktop - Made more compact */
              <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
                <Link href="/login?type=customer">
                  <button 
                    className={`flex items-center gap-1.5 lg:gap-2 px-2.5 py-1.5 lg:px-3.5 lg:py-2 rounded-lg font-medium transition-all duration-200 border border-gray-300 hover:border-green-500 text-gray-700 hover:text-green-600 hover:bg-green-50 group ${
                      isMediumScreen ? 'text-xs' : 'text-sm'
                    }`}
                  >
                    <User className={`transition-transform group-hover:scale-110 ${
                      isMediumScreen ? 'h-3.5 w-3.5' : 'h-4 w-4'
                    }`} />
                    <span>{isMediumScreen ? 'User' : 'User Login'}</span>
                  </button>
                </Link>
                
                <Link href="/login?type=business">
                  <button 
                    className={`flex items-center gap-1.5 lg:gap-2 px-2.5 py-1.5 lg:px-3.5 lg:py-2 rounded-lg font-medium transition-all duration-200 text-white shadow-md hover:shadow-lg group ${
                      isMediumScreen ? 'text-xs' : 'text-sm'
                    }`}
                    style={{ backgroundColor: greenColor }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = greenColor}
                  >
                    <Building className={`transition-transform group-hover:scale-110 ${
                      isMediumScreen ? 'h-3.5 w-3.5' : 'h-4 w-4'
                    }`} />
                    <span>{isMediumScreen ? 'Business' : 'Business Login'}</span>
                  </button>
                </Link>
              </div>
            )}
            
            {/* Mobile Menu Button - Adjusted positioning */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-all active:scale-95 ml-1"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5 text-gray-700" />
              ) : (
                <Menu className="h-5 w-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-gray-100"
            >
              <div className="py-4 space-y-4">
                {/* Navigation Links */}
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = typeof window !== 'undefined' && window.location.pathname === item.href;
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 py-2.5 px-4 text-sm font-medium rounded-lg transition-colors ${
                          isActive ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                  
                  {/* Purchasing Link - Only for Business Users */}
                  {profile?.user_type === 'business' && (
                    <Link
                      href="/pricing"
                      className="flex items-center gap-3 py-2.5 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Package className="h-4 w-4" />
                      <span>Purchasing</span>
                    </Link>
                  )}
                </div>
                
                {/* Mobile User Section */}
                {user ? (
                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    {/* Profile Card */}
                    <div className="p-3 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100">
                      <div className="flex items-center gap-3">
                        {profile?.profile_url ? (
                          <div className="relative h-12 w-12 ring-2 ring-green-200 rounded-full flex-shrink-0">
                            <img 
                              src={profile.profile_url} 
                              alt="Profile" 
                              className="h-full w-full rounded-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center ring-2 ring-green-200 flex-shrink-0">
                            {profile?.user_type === 'business' ? (
                              <Building className="h-6 w-6 text-white" />
                            ) : (
                              <User className="h-6 w-6 text-white" />
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate text-sm">{profile?.full_name}</p>
                          <p className="text-xs text-gray-600 truncate">{profile?.email}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded-full capitalize">
                            {profile?.user_type}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* User-specific Links */}
                    <div className="space-y-1">
                      {/* Verification Link for Customer Users */}
                      {profile?.user_type === 'customer' && (
                        <Link href="/verification" onClick={() => setIsMenuOpen(false)}>
                          <div className="flex items-center gap-3 py-2.5 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                            <Users className="h-4 w-4" />
                            <span>Verification</span>
                          </div>
                        </Link>
                      )}
                      
                      {/* Purchasing Link for Business Users */}
                      {profile?.user_type === 'business' && (
                        <Link href="/pricing" onClick={() => setIsMenuOpen(false)}>
                          <div className="flex items-center gap-3 py-2.5 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                            <Package className="h-4 w-4" />
                            <span>Purchasing</span>
                          </div>
                        </Link>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-gray-100 space-y-2">
                    <Link href="/login?type=customer" onClick={() => setIsMenuOpen(false)}>
                      <button 
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all border border-gray-300 hover:border-green-500 hover:bg-green-50 bg-white text-gray-700"
                      >
                        <User className="h-4 w-4" />
                        <span>User Login</span>
                      </button>
                    </Link>
                    
                    <Link href="/login?type=business" onClick={() => setIsMenuOpen(false)}>
                      <button 
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all shadow-md text-white"
                        style={{ backgroundColor: greenColor }}
                      >
                        <Building className="h-4 w-4" />
                        <span>Business Login</span>
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
