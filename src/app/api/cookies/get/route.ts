import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { error: 'Cookie name is required' },
        { status: 400 }
      );
    }

    const cookie = request.cookies.get(name);
    
    if (!cookie || !cookie.value) {
      return NextResponse.json(
        { value: null },
        { status: 200 }
      );
    }

    try {
      const parsedValue = JSON.parse(cookie.value);
      return NextResponse.json({ value: parsedValue });
    } catch {
      return NextResponse.json(
        { value: cookie.value },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error getting cookie:', error);
    return NextResponse.json(
      { error: 'Failed to get cookie' },
      { status: 500 }
    );
  }
}