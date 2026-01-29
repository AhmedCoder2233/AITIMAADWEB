import { NextRequest, NextResponse } from 'next/server';

const tempStorage = new Map<string | number, any>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Storage ID is required' },
        { status: 400 }
      );
    }

    const storedData = tempStorage.get(id);
    
    if (!storedData) {
      return NextResponse.json(
        { error: 'Data not found or expired' },
        { status: 404 }
      );
    }

    // Check if expired
    if (storedData.expiresAt < Date.now()) {
      tempStorage.delete(id);
      return NextResponse.json(
        { error: 'Data expired' },
        { status: 410 }
      );
    }

    return NextResponse.json(storedData.data);
  } catch (error) {
    console.error('Error retrieving temporary data:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve data' },
      { status: 500 }
    );
  }
}