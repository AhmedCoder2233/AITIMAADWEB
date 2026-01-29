import { NextRequest, NextResponse } from 'next/server';

const tempStorage = new Map<string | number, any>();

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Storage ID is required' },
        { status: 400 }
      );
    }

    const deleted = tempStorage.delete(id);
    
    return NextResponse.json({ 
      success: true, 
      deleted 
    });
  } catch (error) {
    console.error('Error deleting temporary data:', error);
    return NextResponse.json(
      { error: 'Failed to delete data' },
      { status: 500 }
    );
  }
}