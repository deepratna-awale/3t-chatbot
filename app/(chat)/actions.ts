'use server';

import { generateText, type UIMessage } from 'ai';
import { cookies } from 'next/headers';
import { auth } from '@/app/(auth)/auth';
import {
  deleteMessagesByChatIdAfterTimestamp,
  getChatById,
  getMessageById,
  updateChatVisiblityById,
} from '@/lib/db/queries';
import type { VisibilityType } from '@/components/visibility-selector';
import { myProvider } from '@/lib/ai/providers';

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  const { text: title } = await generateText({
    model: myProvider.languageModel('title-model'),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

async function isChatOwner(chatId: string) {
  const session = await auth();
  if (!session?.user) return false;

  const chat = await getChatById({ id: chatId });
  return chat?.userId === session.user.id;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  if (!message || !(await isChatOwner(message.chatId))) return;

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  if (!(await isChatOwner(chatId))) return;

  await updateChatVisiblityById({ chatId, visibility });
}
