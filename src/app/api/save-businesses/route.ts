import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabaseClient'

const SERP_API_KEY = process.env.SERP_API_KEY
const SERP_API_URL = 'https://serpapi.com/search.json'

// Business categories to search
const BUSINESS_CATEGORIES = [
  'restaurants',
  'digital marketing companies',
  'software companies',
  'web development companies',
  'mobile app development',
  'IT companies',
  'SEO companies',
  'graphic design companies',
  'hospitals',
  'schools',
  'colleges',
  'universities',
  'coaching centers',
  'supermarkets',
  'shopping malls',
]

// Cities in Pakistan
const PAKISTAN_CITIES = ['Karachi','Lahore', 'Islamabad']

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting to save businesses from Google Maps via SERP API...')
    
    if (!SERP_API_KEY) {
      throw new Error('SERP_API_KEY is not configured in environment variables')
    }
    
    let totalSaved = 0
    const allBusinesses: any[] = []
    
    // Parallel processing for each city
    for (const city of PAKISTAN_CITIES) {
      console.log(`\n📍 Processing ${city}...`)
      
      // Get businesses for ALL categories in this city (parallel)
      const cityBusinesses = await getBusinessesForCity(city)
      allBusinesses.push(...cityBusinesses)
      
      console.log(`✅ Got ${cityBusinesses.length} businesses from ${city}`)
    }
    
    // Save ALL businesses to database in parallel batches
    console.log(`\n💾 Saving total ${allBusinesses.length} businesses to database...`)
    totalSaved = await saveAllBusinessesToDatabase(allBusinesses)
    
    console.log(`\n🎉 FINISHED! TOTAL SAVED: ${totalSaved} businesses!`)
    
    return NextResponse.json({
      success: true,
      message: `🎉 Successfully saved ${totalSaved} businesses from Google Maps!`,
      totalSaved,
      citiesSearched: PAKISTAN_CITIES.length,
      categoriesSearched: BUSINESS_CATEGORIES.length,
      sample: allBusinesses.slice(0, 5).map(b => ({
        name: b.name,
        category: b.category,
        city: b.city,
        profile_url: b.profile_url
      }))
    })

  } catch (error: any) {
    console.error('❌ Error in save-all-businesses API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to save businesses',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// Get businesses for ALL categories in a city (parallel)
async function getBusinessesForCity(city: string): Promise<any[]> {
  const allBusinesses: any[] = []
  const seenIds = new Set<string>()  
  
  // Process categories in batches of 3 (parallel)
  const batchSize = 3
  for (let i = 0; i < BUSINESS_CATEGORIES.length; i += batchSize) {
    const batch = BUSINESS_CATEGORIES.slice(i, i + batchSize)
    
    // Process batch in parallel
    const batchPromises = batch.map(async (category) => {
      try {
        console.log(`  🔍 ${category} in ${city}...`)
        const businesses = await getBusinessesFromSERP(category, city, seenIds)
        return businesses
      } catch (error) {
        console.error(`  ❌ Error with ${category} in ${city}:`, error)
        return []
      }
    })
    
    // Wait for all categories in batch to complete
    const batchResults = await Promise.allSettled(batchPromises)
    
    // Collect results
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        allBusinesses.push(...result.value)
      }
    })
    
    console.log(`  📊 Batch completed: ${allBusinesses.length} businesses so far`)
    
    // Delay between batches
    if (i + batchSize < BUSINESS_CATEGORIES.length) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  console.log(`  ✅ Total from ${city}: ${allBusinesses.length} businesses`)
  return allBusinesses
}

// Get businesses from SERP API with pagination
async function getBusinessesFromSERP(query: string, location: string, seenIds: Set<string>): Promise<any[]> {
  const businesses: any[] = []
  
  try {
    const params = new URLSearchParams({
      engine: 'google_maps',
      q: `${query} ${location} Pakistan`,
      start: '0',
      type: 'search',
      api_key: SERP_API_KEY!,
      hl: 'en',
      num: '100'
    })

    const response = await fetch(`${SERP_API_URL}?${params}`)
    const data = await response.json()
    
    // Extract businesses from response
    let businessData = []
    if (Array.isArray(data)) {
      businessData = data
    } else if (data.local_results && Array.isArray(data.local_results)) {
      businessData = data.local_results
    } else if (data.places && Array.isArray(data.places)) {
      businessData = data.places
    } else if (Array.isArray(data.results)) {
      businessData = data.results
    }
    
    if (!businessData || businessData.length === 0) {
      return []
    }
    
    // Filter duplicates and convert to business objects
    for (const place of businessData) {
      const placeId = place.data_id || place.place_id
      if (!placeId || seenIds.has(placeId)) {
        continue
      }
      
      seenIds.add(placeId)
      const business = createBusinessFromPlace(place, query, location)
      if (business) {
        businesses.push(business)
      }
    }
    
    console.log(`    📄 Got ${businesses.length} businesses for ${query}`)
    
  } catch (error) {
    console.error(`    ❌ Error fetching ${query}:`, error)
  }
  
  return businesses
}

// Create business object from SERP API place
function createBusinessFromPlace(place: any, category: string, location: string): any | null {
  if (!place || !place.title) return null
  
  // Extract profile/logo URL from various possible fields
  const profileUrl = place.thumbnail || 
                     place.image || 
                     place.photo || 
                     place.logo || 
                     place.icon ||
                     place.images?.[0] ||
                     place.photos?.[0] ||
                     null
  
  return {
    name: place.title,
    description: `${place.title} - ${category} in ${location}`,
    category: category,
    address: place.address || place.address_extensions?.[0] || `${location}, Pakistan`,
    city: location,
    country: 'Pakistan',
    phone: place.phone || place.contact?.[0]?.phone,
    website: place.website || place.links?.[0]?.link,
    profile_url: profileUrl,
    rating: 0,
    reviews_count: 0,
  }
}

// Save ALL businesses to database in parallel batches
async function saveAllBusinessesToDatabase(businesses: any[]): Promise<number> {
  let totalSaved = 0
  const batchSize = 10 // Reduced batch size for better error handling
  
  console.log(`  💾 Processing ${businesses.length} businesses in batches...`)
  
  for (let i = 0; i < businesses.length; i += batchSize) {
    const batch = businesses.slice(i, i + batchSize)
    
    try {
      const savedCount = await saveBusinessBatch(batch)
      totalSaved += savedCount
      
      console.log(`  📊 Batch ${Math.floor(i/batchSize) + 1}: Saved ${savedCount} businesses`)
      
      // Progress update
      if (i % 100 === 0 && i > 0) {
        console.log(`  ✅ Progress: ${i}/${businesses.length} processed`)
      }
      
    } catch (error) {
      console.error(`  ❌ Error saving batch ${Math.floor(i/batchSize) + 1}:`, error)
    }
    
    // Small delay between batches
    if (i + batchSize < businesses.length) {
      await new Promise(resolve => setTimeout(resolve, 300))
    }
  }
  
  console.log(`  🎉 Total saved to database: ${totalSaved}/${businesses.length}`)
  return totalSaved
}

// Helper: Filter out businesses that already exist in database
async function filterDuplicateBusinesses(businesses: any[]): Promise<any[]> {
  if (businesses.length === 0) return []
  
  // Extract all business names for checking
  const businessNames = businesses
    .map(b => b.name)
    .filter(name => name && typeof name === 'string')
  
  if (businessNames.length === 0) return []
  
  try {
    // Check which names already exist in database
    const { data: existingBusinesses, error } = await supabase
      .from('businesses')
      .select('name')
      .in('name', businessNames)
    
    if (error) {
      console.error('Error checking duplicates:', error.message)
      return businesses // If error, try to insert all
    }
    
    // Create a Set of existing names for fast lookup
    const existingNames = new Set(
      existingBusinesses?.map(b => b.name) || []
    )
    
    // Filter out businesses that already exist
    const uniqueBusinesses = businesses.filter(
      business => !existingNames.has(business.name)
    )
    
    console.log(`    🔍 Found ${existingNames.size} duplicates, ${uniqueBusinesses.length} unique businesses`)
    return uniqueBusinesses
    
  } catch (error) {
    console.error('Error checking duplicates:', error)
    return businesses // If error, try to insert all
  }
}

// Save a batch of businesses to database
async function saveBusinessBatch(businesses: any[]): Promise<number> {
  if (businesses.length === 0) return 0
  
  // Filter out businesses that already exist in database
  const uniqueBusinesses = await filterDuplicateBusinesses(businesses)
  
  if (uniqueBusinesses.length === 0) {
    console.log(`    All ${businesses.length} businesses already exist in database`)
    return 0
  }
  
  const businessData = uniqueBusinesses.map(business => ({
    name: business.name,
    description: business.description,
    category: business.category,
    address: business.address,
    city: business.city,
    country: business.country,
    phone: business.phone,
    website: business.website,
    profile_url: business.profile_url,
    is_verified: false,
    verification_status: 'pending',
    our_rating: 0.00,
    our_reviews_count: 0,
  })).filter(b => b.name)

  if (businessData.length === 0) return 0

  try {
    const { error } = await supabase
      .from('businesses')
      .insert(businessData)

    if (error) {
      console.error('Database batch insert error:', error.message)
      // If batch insert fails, try individual inserts
      return await saveBusinessesIndividually(businesses)
    }
    
    console.log(`    ✅ Inserted ${businessData.length} unique businesses`)
    return businessData.length
    
  } catch (error) {
    console.error('Batch save error:', error)
    return await saveBusinessesIndividually(businesses)
  }
}

// Fallback: Save businesses individually
async function saveBusinessesIndividually(businesses: any[]): Promise<number> {
  let savedCount = 0
  
  for (const business of businesses) {
    try {
      // Check if exists
      const { data: existing } = await supabase
        .from('businesses')
        .select('id')
        .eq('name', business.name)
        .single()

      if (existing) {
        continue
      }

      const businessData = {
        name: business.name,
        description: business.description,
        category: business.category,
        address: business.address,
        city: business.city,
        country: business.country,
        phone: business.phone,
        website: business.website,
        profile_url: business.profile_url,
        is_verified: false,
        verification_status: 'pending',
        our_rating: 0.00,
        our_reviews_count: 0,
      }

      const { error } = await supabase
        .from('businesses')
        .insert([businessData])

      if (!error) {
        savedCount++
        if (savedCount % 10 === 0) {
          console.log(`    💾 Individual progress: ${savedCount} saved`)
        }
      } else if (error.code === '23505') {
        // Unique constraint violation - duplicate
        console.log(`    ⚠️ Duplicate skipped: ${business.name}`)
      }
    } catch (error) {
      // Skip if duplicate or other error
      continue
    }
  }
  
  return savedCount
}