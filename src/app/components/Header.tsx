'use client';

import { Menu, X, User, Building, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const greenColor = '#16a34a';
  const lightGreen = '#15803D';

  const handleLogout = async () => {
    try {
      await signOut();
      setIsProfileMenuOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/98 backdrop-blur-lg border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo Section */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-1 group">
              <div className="relative h-12 w-12 md:h-14 md:w-14 transition-transform group-hover:scale-105">
                <Image 
                  src="/logo.png" 
                  alt="AITIMAAD.PK Logo" 
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 768px) 48px, 56px"
                />
              </div>
              <div className="flex flex-col leading-none">
                <div className="text-xl md:text-2xl font-bold tracking-tight">
                  <span className="text-gray-900">AITIMAAD.</span>
                  <span className="bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent" style={{ color: lightGreen }}>PK</span>
                </div>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              href="/"
              className="relative px-4 py-2 text-sm font-medium text-green-600 transition-colors duration-200 group"
            >
              <span className="relative z-10">Home</span>
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-green-600 rounded-full"></span>
              <span className="absolute inset-0 bg-green-50 rounded-lg opacity-100 group-hover:opacity-100 transition-opacity"></span>
            </Link>
            
            {profile?.user_type === 'business' && (
              <Link
                href="/pricing"
                className="relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200 group"
              >
                <span className="relative z-10">Pricing</span>
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-green-600 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                <span className="absolute inset-0 bg-gray-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </Link>
            )}
            
            {profile?.user_type === 'customer' && (
              <Link
                href="/verification"
                className="relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200 group"
              >
                <span className="relative z-10">Verification</span>
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-green-600 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                <span className="absolute inset-0 bg-gray-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </Link>
            )}
          </nav>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              /* User Profile Menu - Desktop */
              <div className="hidden md:block relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-200 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-sm group"
                >
                  {profile?.profile_url ? (
                    <div className="relative h-8 w-8 ring-2 ring-green-100 rounded-full">
                      <img 
                        src={profile.profile_url} 
                        alt="Profile" 
                        className="h-full w-full rounded-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center ring-2 ring-green-100">
                      {profile?.user_type === 'business' ? (
                        <Building className="h-4 w-4 text-white" />
                      ) : (
                        <User className="h-4 w-4 text-white" />
                      )}
                    </div>
                  )}
                  <div className="text-left min-w-0 max-w-[100px] lg:max-w-[140px]">
                    <p className="text-xs font-semibold text-gray-900 truncate">
                      {profile?.full_name || 'User'}
                    </p>
                    <p className="text-[10px] text-gray-500 capitalize truncate">
                      {profile?.user_type || 'User'}
                    </p>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
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
                      
                      <div className="p-2">
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
              /* Login Buttons - Desktop */
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login?type=customer">
                  <button 
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-gray-300 hover:border-green-500 text-gray-700 hover:text-green-600 hover:bg-green-50 group"
                  >
                    <User className="h-4 w-4 transition-transform group-hover:scale-110" />
                    <span>User Login</span>
                  </button>
                </Link>
                
                <Link href="/login?type=business">
                  <button 
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-white shadow-md hover:shadow-lg group"
                    style={{ backgroundColor: greenColor }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = greenColor}
                  >
                    <Building className="h-4 w-4 transition-transform group-hover:scale-110" />
                    <span>Business Login</span>
                  </button>
                </Link>
              </div>
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-all active:scale-95"
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
                  <Link
                    href="/"
                    className="flex items-center py-2.5 px-4 text-sm font-medium rounded-lg transition-colors bg-green-50 text-green-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>Home</span>
                  </Link>
                  
                  {profile?.user_type === 'business' && (
                    <Link
                      href="/pricing"
                      className="flex items-center py-2.5 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>Pricing</span>
                    </Link>
                  )}
                  
                  {profile?.user_type === 'customer' && (
                    <Link
                      href="/verification"
                      className="flex items-center py-2.5 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>Verification</span>
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
                    
                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {profile?.user_type === 'business' && (
                        <Link
                          href="/business/profile"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all border border-gray-300 hover:border-green-500 hover:bg-green-50 bg-white">
                            <Building className="h-4 w-4" />
                            <span>Business Profile</span>
                          </button>
                        </Link>
                      )}
                      
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