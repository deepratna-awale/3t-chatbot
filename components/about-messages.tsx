'use client';

import type { Vote } from '@/lib/db/schema';
import { AboutMessage } from './about-message';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';
import { useEffect, useMemo } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';

interface AboutMessagesProps {
  chatId: string;
  status: UseChatHelpers<ChatMessage>['status'];
  votes: Array<Vote> | undefined;
  messages: Array<ChatMessage>;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  isReadonly: boolean;
  isArtifactVisible: boolean;
}

export function AboutMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  regenerate,
  sendMessage,
  isReadonly,
  isArtifactVisible,
}: AboutMessagesProps) {
  const { scrollToBottom, isAtBottom, endRef } = useScrollToBottom();

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Also scroll when streaming status changes to ensure smooth auto-scroll during AI responses
  useEffect(() => {
    if (status === 'streaming') {
      scrollToBottom('smooth');
    }
  }, [status, scrollToBottom]);

  // Scroll when messages content changes (for streaming updates)
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && status === 'streaming') {
      scrollToBottom('smooth');
    }
  }, [messages, status, scrollToBottom]);

  const votesArray = useMemo(() => {
    return votes ? Array.from(votes) : [];
  }, [votes]);

  const getVoteByMessageId = (messageId: string) => {
    return votesArray.find((vote) => vote.messageId === messageId);
  };

  return (
    <div className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-auto py-4 scroll-smooth">
      {messages.map((message, index) => {
        const vote = getVoteByMessageId(message.id);
        const isLastMessage = index === messages.length - 1;
        const isLoading = status === 'streaming' && isLastMessage;

        return (
          <AboutMessage
            key={message.id}
            chatId={chatId}
            message={message}
            vote={vote}
            isLoading={isLoading}
            setMessages={setMessages}
            regenerate={regenerate}
            sendMessage={sendMessage}
            isReadonly={isReadonly}
            requiresScrollPadding={
              isLastMessage && !isAtBottom && !isArtifactVisible
            }
          />
        );
      })}

      <div ref={endRef} />
    </div>
  );
}
