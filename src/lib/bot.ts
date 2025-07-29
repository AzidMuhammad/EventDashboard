import { initializeTelegramBot } from './telegram';

if (process.env.NODE_ENV !== 'test') {
  initializeTelegramBot();
}