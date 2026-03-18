import { cookies } from 'next/headers';
import type { Metadata } from 'next';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { auth } from '../(auth)/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'AI Chat - Deepratna Awale',
  description:
    'Start a conversation with AI-powered chat assistant. Experience advanced AI models with code execution, file analysis, and intelligent responses. Built by Deepratna Awale.',
  keywords: [
    'AI chat',
    'artificial intelligence',
    'chatbot',
    'AI assistant',
    'code execution',
    'file analysis',
    'AI models',
  ],
  openGraph: {
    title: 'AI Chat - Deepratna Awale',
    description:
      'Start a conversation with AI-powered chat assistant. Experience advanced AI models with code execution, file analysis, and intelligent responses.',
    type: 'website',
    url: 'https://3tchat.vercel.app',
    images: [
      {
        url: '/images/open-graph.png',
        width: 1200,
        height: 630,
        alt: 'AI Chat by Deepratna Awale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Chat - Deepratna Awale',
    description:
      'Start a conversation with AI-powered chat assistant. Experience advanced AI models with code execution, file analysis, and intelligent responses.',
    images: ['/images/open-graph.png'],
    creator: '@deepratna_awale',
  },
};

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          isReadonly={false}
          session={session}
          autoResume={false}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={modelIdFromCookie.value}
        initialVisibilityType="private"
        isReadonly={false}
        session={session}
        autoResume={false}
      />
      <DataStreamHandler />
    </>
  );
}
