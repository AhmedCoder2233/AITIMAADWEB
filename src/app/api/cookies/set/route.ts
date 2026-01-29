import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, value, expiresDays = 7 } = body;

    if (!name || value === undefined) {
      return NextResponse.json(
        { error: 'Name and value are required' },
        { status: 400 }
      );
    }

    const expires = new Date();
    expires.setDate(expires.getDate() + expiresDays);

    const response = NextResponse.json({ success: true });
    
    response.cookies.set({
      name,
      value: JSON.stringify(value),
      expires,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return response;
  } catch (error) {
    console.error('Error setting cookie:', error);
    return NextResponse.json(
      { error: 'Failed to set cookie' },
      { status: 500 }
    );
  }
}