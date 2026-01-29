import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get all cookies from request
    const cookies = request.cookies.getAll();
    const cookieNames = cookies.map(cookie => cookie.name);
    
    return NextResponse.json({ cookieNames });
  } catch (error) {
    console.error('Error listing cookies:', error);
    return NextResponse.json({ cookieNames: [] });
  }
}