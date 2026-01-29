import { NextRequest, NextResponse } from 'next/server';

// In-memory temporary storage (in production, use Redis or database)
const tempStorage = new Map<string | number, any>();

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Generate unique ID
    const storageId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store with 24 hour expiry
    tempStorage.set(storageId, {
      data,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    });
    
    // Clean up expired entries
    cleanupExpired();
    
    return NextResponse.json({ 
      success: true, 
      storageId 
    });
  } catch (error) {
    console.error('Error storing temporary data:', error);
    return NextResponse.json(
      { error: 'Failed to store data' },
      { status: 500 }
    );
  }
}

function cleanupExpired() {
  const now = Date.now();
  for (const [key, value] of Array.from(tempStorage.entries())) {
    if (value.expiresAt < now) {
      tempStorage.delete(key);
    }
  }
}