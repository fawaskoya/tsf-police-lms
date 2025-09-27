import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'API routes are working',
    timestamp: new Date().toISOString(),
    deployed: true
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'POST method works',
    timestamp: new Date().toISOString()
  });
}
