import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, message, history } = body;

    if (!model || !message) {
      return NextResponse.json(
        { error: 'Model and message are required' },
        { status: 400 }
      );
    }

    // When running in Docker, use host.docker.internal to reach host machine
    // When running locally, use localhost
    const backendUrl = process.env.BACKEND_URL || 'http://host.docker.internal:8080';
    
    console.log('Calling backend API:', `${backendUrl}/api/v1/playground/chat`);
    
    const response = await fetch(`${backendUrl}/api/v1/playground/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        message,
        history: history || [],
      }),
      cache: 'no-store',
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 429) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            message: errorData.message || 'You can send up to 5 messages. The limit refills gradually over time.'
          },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: errorData.error || 'Failed to get response from backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Playground API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Cannot connect to backend server.',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
