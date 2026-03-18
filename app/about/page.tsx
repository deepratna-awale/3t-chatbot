import { cookies } from 'next/headers';
import { AboutChat } from '@/components/about-chat';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DataStreamProvider } from '@/components/data-stream-provider';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { auth } from '../(auth)/auth';
import { redirect } from 'next/navigation';

// Initial messages to make it feel like chatting with Deepratna
const initialMessages = [
  {
    id: 'welcome',
    role: 'assistant' as const,
    parts: [
      {
        type: 'text' as const,
        text: '[PORTFOLIO_HEADER]',
      },
    ],
    metadata: {
      createdAt: new Date().toISOString(),
    },
  },
];

export const metadata = {
  title: 'About Deepratna Awale - Interactive Portfolio & Chat',
  description:
    'Get to know Deepratna Awale through an interactive chat experience. Explore his projects, work experience, education, and AI expertise. Features GitHub integration and AI-powered project descriptions.',
  keywords: [
    'Deepratna Awale',
    'portfolio',
    'AI developer',
    'web development',
    'GitHub projects',
    'interactive chat',
    'artificial intelligence',
    'software engineer',
  ],
  openGraph: {
    title: 'About Deepratna Awale - Interactive Portfolio & Chat',
    description:
      'Get to know Deepratna Awale through an interactive chat experience. Explore his projects, work experience, education, and AI expertise.',
    type: 'profile',
    url: 'https://3tchat.vercel.app/about',
    images: [
      {
        url: '/images/open-graph.png',
        width: 1200,
        height: 630,
        alt: 'Deepratna Awale - Interactive Portfolio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Deepratna Awale - Interactive Portfolio & Chat',
    description:
      'Get to know Deepratna Awale through an interactive chat experience. Explore his projects, work experience, education, and AI expertise.',
    images: ['/images/open-graph.png'],
    creator: '@deepratna_awale',
  },
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
      {
        url: '/favicon.png',
        type: 'image/png',
      },
    ],
  },
};

export default async function AboutPage() {
  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  const id = generateUUID();
  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <DataStreamProvider>
      <SidebarProvider defaultOpen={!isCollapsed}>
        <AppSidebar user={session?.user} />
        <SidebarInset>
          <AboutChat
            key={id}
            id={id}
            initialMessages={initialMessages}
            initialChatModel={modelIdFromCookie?.value || 'chat-model'}
            initialVisibilityType="private"
            isReadonly={false}
            session={session}
            autoResume={false}
          />
        </SidebarInset>
      </SidebarProvider>
      <DataStreamHandler />
    </DataStreamProvider>
  );
}
