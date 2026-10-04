import { EducationMessage } from './education-message';
import { ExperienceMessage } from './experience-message';
import Link from 'next/link';
import React, { memo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './code-block';
import { ProjectsMessage } from './projects-message';
import { PortfolioHeader } from './portfolio-header';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';

const components: Partial<Components> = {
  // @ts-expect-error
  code: CodeBlock,
  pre: ({ children }) => <>{children}</>,
  ol: ({ node, children, ...props }) => {
    return (
      <ol className="list-decimal list-outside ml-4" {...props}>
        {children}
      </ol>
    );
  },
  li: ({ node, children, ...props }) => {
    return (
      <li className="py-1" {...props}>
        {children}
      </li>
    );
  },
  ul: ({ node, children, ...props }) => {
    return (
      <ul className="list-decimal list-outside ml-4" {...props}>
        {children}
      </ul>
    );
  },
  strong: ({ node, children, ...props }) => {
    return (
      <span className="font-semibold" {...props}>
        {children}
      </span>
    );
  },
  a: ({ node, children, ...props }) => {
    return (
      // @ts-expect-error
      <Link
        className="text-blue-500 hover:underline"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </Link>
    );
  },
  h1: ({ node, children, ...props }) => {
    return (
      <h1 className="text-3xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h1>
    );
  },
  h2: ({ node, children, ...props }) => {
    return (
      <h2 className="text-2xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h2>
    );
  },
  h3: ({ node, children, ...props }) => {
    return (
      <h3 className="text-xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h3>
    );
  },
  h4: ({ node, children, ...props }) => {
    return (
      <h4 className="text-lg font-semibold mt-6 mb-2" {...props}>
        {children}
      </h4>
    );
  },
  h5: ({ node, children, ...props }) => {
    return (
      <h5 className="text-base font-semibold mt-6 mb-2" {...props}>
        {children}
      </h5>
    );
  },
  h6: ({ node, children, ...props }) => {
    return (
      <h6 className="text-sm font-semibold mt-6 mb-2" {...props}>
        {children}
      </h6>
    );
  },
};

const remarkPlugins = [remarkGfm];

const NonMemoizedAboutMarkdown = ({
  children,
  sendMessage,
}: {
  children: string;
  sendMessage?: UseChatHelpers<ChatMessage>['sendMessage'];
}) => {
  // Check if the content contains the projects marker (exact match only)
  const hasProjectsMarker = children.trim() === '[SHOW_PROJECTS]';

  const hasExperienceMarker = children.trim() === '[SHOW_EXPERIENCE]';

  const hasEducationMarker = children.trim() === '[SHOW_EDUCATION]';

  // Check if the content contains the portfolio header marker (exact match only)
  const hasPortfolioHeader = children.trim() === '[PORTFOLIO_HEADER]';

  // If portfolio header marker is present, show only the portfolio header
  if (hasPortfolioHeader) {
    return <PortfolioHeader sendMessage={sendMessage} />;
  }

  if (hasExperienceMarker) {
    return <ExperienceMessage />;
  }

  if (hasEducationMarker) {
    return <EducationMessage />;
  }

  // If projects marker is present, show only the project cards
  if (hasProjectsMarker) {
    return <ProjectsMessage isVisible={true} />;
  }

  // Regular markdown rendering if no special markers
  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
      {children}
    </ReactMarkdown>
  );
};

export const AboutMarkdown = memo(
  NonMemoizedAboutMarkdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.sendMessage === nextProps.sendMessage,
);
