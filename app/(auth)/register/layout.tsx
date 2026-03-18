import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register - Deepratna Awale',
  description:
    'Create an account to access AI chat features and save your conversations. Experience advanced AI models with code execution and file analysis.',
  keywords: [
    'register',
    'sign up',
    'create account',
    'AI chat',
    'authentication',
  ],
  openGraph: {
    title: 'Register - Deepratna Awale',
    description:
      'Create an account to access AI chat features and save your conversations. Experience advanced AI models with code execution and file analysis.',
    type: 'website',
    url: 'https://3tchat.vercel.app/register',
    images: [
      {
        url: '/images/open-graph.png',
        width: 1200,
        height: 630,
        alt: 'Register for AI Chat',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Register - Deepratna Awale',
    description:
      'Create an account to access AI chat features and save your conversations.',
    images: ['/images/open-graph.png'],
    creator: '@deepratna_awale',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
