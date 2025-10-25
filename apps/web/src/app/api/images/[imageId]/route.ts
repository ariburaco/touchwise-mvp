import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  const { imageId } = await params;

  if (!imageId) {
    return NextResponse.json(
      { error: 'Image ID is required' },
      { status: 400 }
    );
  }

  try {
    // Fetch the image from Convex
    const convexImageUrl = `https://avid-narwhal-394.convex.site/api/images/${imageId}`;
    const response = await fetch(convexImageUrl);

    if (!response.ok) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Failed to fetch image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}
