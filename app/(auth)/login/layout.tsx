import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Deepratna Awale',
  description:
    'Sign in to access AI chat features and your personal conversations. Experience advanced AI models with code execution and file analysis.',
  keywords: ['login', 'sign in', 'AI chat', 'authentication', 'user account'],
  openGraph: {
    title: 'Login - Deepratna Awale',
    description:
      'Sign in to access AI chat features and your personal conversations. Experience advanced AI models with code execution and file analysis.',
    type: 'website',
    url: 'https://3tchat.vercel.app/login',
    images: [
      {
        url: '/images/open-graph.png',
        width: 1200,
        height: 630,
        alt: 'Login to AI Chat',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Login - Deepratna Awale',
    description:
      'Sign in to access AI chat features and your personal conversations.',
    images: ['/images/open-graph.png'],
    creator: '@deepratna_awale',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
