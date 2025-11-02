import { NextRequest, NextResponse } from 'next/server';

const BOT_API_URL = 'http://localhost:3022/api/submit';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();

    // Add app name to identify source
    const dataWithApp = {
      appName: 'ОКТАВА',
      ...formData
    };

    // Forward to universal form bot
    const response = await fetch(BOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataWithApp),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to submit form' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, message: 'Ваша заявка успешно отправлена!' });
  } catch (error) {
    console.error('Error submitting form:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
