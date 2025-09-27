import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    "name": "TSF Police LMS",
    "short_name": "TSF LMS",
    "description": "Learning Management System for TSF Police",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#6B0023",
    "orientation": "portrait-primary",
    "scope": "/",
    "lang": "ar",
    "categories": ["education", "productivity"],
    "icons": [
      {
        "src": "/icon-192x192.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any maskable"
      },
      {
        "src": "/icon-512x512.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any maskable"
      }
    ]
  };

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  });
}
