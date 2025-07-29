import TelegramBot from 'node-telegram-bot-api';
import { getDatabase } from './mongodb';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {
  polling: true,
});

export interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    username?: string;
    first_name: string;
  };
  chat: {
    id: number;
  };
  text?: string;
  voice?: {
    file_id: string;
    duration: number;
  };
}

export async function processFinanceMessage(message: TelegramMessage) {
  const db = await getDatabase();
  const text = message.text || '';
  
  const incomeRegex = /(?:dana|terima|masuk|dapat)\s+(?:rp\.?\s*)?(\d+(?:\.\d+)?(?:k|rb|ribu|jt|juta)?)(?:\s+(?:dari|dr)\s+(.+?))?(?:\s+(?:untuk|buat|keperluan)\s+(.+?))?/i;
  const expenseRegex = /(?:keluar|bayar|beli|buat)\s+(?:rp\.?\s*)?(\d+(?:\.\d+)?(?:k|rb|ribu|jt|juta)?)(?:\s+(?:untuk|buat|keperluan)\s+(.+?))?(?:\s+(?:kepada|ke)\s+(.+?))?/i;
  
  let type: 'income' | 'expense' | null = null;
  let amount = 0;
  let description = text;
  let donorName = '';
  let recipientName = '';
  let purpose = '';
  
  const incomeMatch = text.match(incomeRegex);
  const expenseMatch = text.match(expenseRegex);
  
  if (incomeMatch) {
    type = 'income';
    amount = parseAmount(incomeMatch[1]);
    donorName = incomeMatch[2]?.trim() || '';
    purpose = incomeMatch[3]?.trim() || '';
  } else if (expenseMatch) {
    type = 'expense';
    amount = parseAmount(expenseMatch[1]);
    purpose = expenseMatch[2]?.trim() || '';
    recipientName = expenseMatch[3]?.trim() || '';
  }
  
  if (type && amount > 0) {
    try {
      let finalDescription = description;
      if (type === 'income' && donorName) {
        finalDescription = `Dana masuk dari ${donorName}${purpose ? ` untuk ${purpose}` : ''}`;
      } else if (type === 'expense' && (purpose || recipientName)) {
        finalDescription = `Pengeluaran${purpose ? ` untuk ${purpose}` : ''}${recipientName ? ` kepada ${recipientName}` : ''}`;
      } else {
        finalDescription = description || `${type === 'income' ? 'Pemasukan' : 'Pengeluaran'} dari Telegram`;
      }

      await db.collection('finances').insertOne({
        type,
        amount,
        description: finalDescription,
        category: 'telegram',
        date: new Date(),
        source: 'telegram',
        donorName: type === 'income' ? donorName : '',
        recipientName: type === 'expense' ? recipientName : '',
        purpose: purpose || '',
        telegramData: {
          messageId: message.message_id.toString(),
          chatId: message.chat.id.toString(),
          username: message.from.username,
          originalMessage: text,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      await db.collection('notifications').insertOne({
        type: 'finance_update',
        title: `${type === 'income' ? 'Pemasukan' : 'Pengeluaran'} Baru`,
        message: `${type === 'income' ? 'Dana masuk' : 'Dana keluar'} sebesar Rp ${amount.toLocaleString('id-ID')}${type === 'income' && donorName ? ` dari ${donorName}` : ''}${type === 'expense' && recipientName ? ` kepada ${recipientName}` : ''} via Telegram`,
        data: { 
          amount, 
          type, 
          source: 'telegram',
          donorName: type === 'income' ? donorName : '',
          recipientName: type === 'expense' ? recipientName : '',
          purpose: purpose || ''
        },
        read: false,
        createdAt: new Date(),
      });
      
      let responseMessage = `✅ ${type === 'income' ? 'Pemasukan' : 'Pengeluaran'} sebesar Rp ${amount.toLocaleString('id-ID')} berhasil dicatat!`;
      
      if (type === 'income' && donorName) {
        responseMessage += `\n👤 Dari: ${donorName}`;
      }
      if (type === 'expense' && recipientName) {
        responseMessage += `\n👤 Kepada: ${recipientName}`;
      }
      if (purpose) {
        responseMessage += `\n📝 Keperluan: ${purpose}`;
      }
      
      await bot.sendMessage(message.chat.id, responseMessage);
      
      return true;
    } catch (error) {
      console.error('Error processing finance message:', error);
      await bot.sendMessage(
        message.chat.id,
        '❌ Gagal mencatat transaksi. Silakan coba lagi.'
      );
      return false;
    }
  }
  
  return false;
}

function parseAmount(amountStr: string): number {
  let amount = parseFloat(amountStr.replace(/[^\d.]/g, ''));
  
  if (amountStr.toLowerCase().includes('k') || amountStr.toLowerCase().includes('rb') || amountStr.toLowerCase().includes('ribu')) {
    amount = amount * 1000;
  } else if (amountStr.toLowerCase().includes('jt') || amountStr.toLowerCase().includes('juta')) {
    amount = amount * 1000000;
  }
  
  return amount;
}

export function initializeTelegramBot() {

  bot.on('message', async (msg) => {
    if (msg.text) {
      const message: TelegramMessage = {
        message_id: msg.message_id,
        from: {
          id: msg.from!.id,
          username: msg.from!.username,
          first_name: msg.from!.first_name,
        },
        chat: {
          id: msg.chat.id,
        },
        text: msg.text,
      };
      
      await processFinanceMessage(message);
    }
  });

  bot.on('voice', async (msg) => {
    if (msg.voice) {
      const message: TelegramMessage = {
        message_id: msg.message_id,
        from: {
          id: msg.from!.id,
          username: msg.from!.username,
          first_name: msg.from!.first_name,
        },
        chat: {
          id: msg.chat.id,
        },
        voice: {
          file_id: msg.voice.file_id,
          duration: msg.voice.duration,
        },
      };
      
      console.log('Voice message received:', message.voice);
      
      await bot.sendMessage(
        msg.chat.id,
        '🎤 Pesan suara diterima. Fitur konversi suara ke teks akan segera tersedia.'
      );
    }
  });

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `
🤖 Selamat datang di Bot Keuangan!

Saya dapat membantu Anda mencatat pemasukan dan pengeluaran dengan mudah.

📈 **Contoh Pemasukan:**
• "dana masuk 50000" - pemasukan tanpa detail
• "terima 50k dari John" - pemasukan dari seseorang
• "dapat 100rb dari Ahmad untuk modal" - pemasukan dengan keperluan
• "masuk 75000 dari dr Bu Sari untuk kegiatan"

📉 **Contoh Pengeluaran:**
• "bayar 25000" - pengeluaran sederhana
• "beli 25rb untuk makan" - pengeluaran dengan keperluan
• "keluar 50000 untuk transport kepada driver"
• "bayar 100k untuk listrik kepada PLN"

💡 **Tips:**
- Gunakan kata kunci: dana/terima/masuk/dapat untuk pemasukan
- Gunakan kata kunci: keluar/bayar/beli/buat untuk pengeluaran  
- Tambahkan "dari [nama]" untuk nama pemberi dana
- Tambahkan "kepada [nama]" untuk nama penerima
- Tambahkan "untuk [keperluan]" untuk menjelaskan tujuan

Kirim pesan Anda sekarang!
    `;
    
    await bot.sendMessage(chatId, welcomeMessage);
  });

  bot.on('polling_error', (error) => {
    console.error('Telegram polling error:', error);
  });

  console.log('Telegram bot initialized with polling');
}

export { bot };