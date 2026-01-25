'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Building, Save, CheckCircle, XCircle } from 'lucide-react';

export default function SaveAllBusinessesButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState<{total: number; cities: number; categories: number} | null>(null);

  const saveAllBusinesses = async () => {
    if (!confirm(`🚀 This will save businesses from Google Maps including:
• Restaurants & Cafes
• Digital Marketing Companies
• Software Companies
• Hospitals & Clinics
• Banks & Offices
• And 20+ more categories
• From 10 major cities in Pakistan

Continue?`)) {
      return;
    }

    setLoading(true);
    setStatus('loading');
    setMessage('Starting to fetch businesses from Google Maps...');
    setStats(null);

    try {
      const response = await fetch('/api/save-businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setMessage(result.message);
        setStats({
          total: result.totalSaved,
          cities: result.citiesSearched,
          categories: result.categoriesSearched
        });
        
        // Refresh the page to show new businesses
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setStatus('error');
        setMessage(result.error || 'Failed to save businesses');
      }

    } catch (error: any) {
      setStatus('error');
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex flex-col items-end gap-3">
        {/* Status Card */}
        {(status === 'loading' || status === 'success' || status === 'error') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg shadow-xl p-4 min-w-72 border ${
              status === 'loading' 
                ? 'bg-blue-50 border-blue-200' 
                : status === 'success' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {status === 'loading' ? (
                <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mt-1"></div>
              ) : status === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mt-1" />
              )}
              
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1 text-sm">
                  {status === 'loading' 
                    ? '📡 Fetching from Google Maps...' 
                    : status === 'success' 
                    ? '✅ Businesses Saved!' 
                    : '❌ Error'}
                </h3>
                
                <p className="text-xs text-gray-700 mb-2">{message}</p>
                
                {stats && (
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary-600">{stats.total}</div>
                      <div className="text-xs text-gray-600">Saved</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary-600">{stats.cities}</div>
                      <div className="text-xs text-gray-600">Cities</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary-600">{stats.categories}</div>
                      <div className="text-xs text-gray-600">Categories</div>
                    </div>
                  </div>
                )}
                
                {status === 'loading' && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <motion.div 
                        className="bg-primary-600 h-1.5 rounded-full"
                        animate={{ 
                          width: ['0%', '100%', '0%'] 
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={saveAllBusinesses}
          disabled={loading}
          className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-5 py-3 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 font-medium flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="relative">
            <MapPin className="h-5 w-5" />
            <Building className="h-3 w-3 absolute -bottom-1 -right-1 text-primary-200" />
          </div>
          <span>
            {loading ? 'Saving...' : 'Fetch Google Maps'}
          </span>
          <Save className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  );
}