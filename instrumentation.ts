import { registerOTel } from '@vercel/otel';

export function register() {
  registerOTel({ serviceName: '3t-chat' });
}
