import { NextRequest, NextResponse } from 'next/server';
import { processFinanceMessage, TelegramMessage } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook secret
    const webhookSecret = request.headers.get('x-telegram-bot-api-secret-token');
    if (webhookSecret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Process message or voice note
    if (body.message) {
      const message: TelegramMessage = body.message;
      
      // Process text message for finance data
      if (message.text) {
        await processFinanceMessage(message);
      }
      
      // Process voice message
      if (message.voice) {
        // Here you would implement voice-to-text conversion
        // For now, we'll just acknowledge the voice message
        console.log('Voice message received:', message.voice);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}