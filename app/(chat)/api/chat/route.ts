import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
} from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import { TTTChatError } from '@/lib/errors';
import type { ChatMessage } from '@/lib/types';
import type { ChatModel } from '@/lib/ai/models';
import type { VisibilityType } from '@/components/visibility-selector';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  console.log('Chat API POST request started');
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    console.log('Request JSON parsed successfully');
    requestBody = postRequestBodySchema.parse(json);
    console.log('Request body schema validation passed');
  } catch (error) {
    console.error('Request parsing error:', error);
    return new TTTChatError('bad_request:api').toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel['id'];
      selectedVisibilityType: VisibilityType;
    } = requestBody;

    console.log('Request body destructured, chat ID:', id);

    const session = await auth();
    console.log(
      'Auth session retrieved:',
      session?.user?.id ? 'authenticated' : 'not authenticated',
    );

    if (!session?.user) {
      return new TTTChatError('unauthorized:chat').toResponse();
    }

    const userType: UserType = session.user.type;
    console.log('User type:', userType);

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });
    console.log('Message count retrieved:', messageCount);

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      console.log('Rate limit exceeded for user:', session.user.id);
      return new TTTChatError('rate_limit:chat').toResponse();
    }

    console.log('Rate limit check passed');

    const chat = await getChatById({ id });
    console.log('Chat retrieved from DB:', chat ? 'exists' : 'not found');

    if (!chat) {
      console.log('Creating new chat...');
      const title = await generateTitleFromUserMessage({
        message,
      });
      console.log('Title generated:', title);

      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      });
      console.log('New chat saved');
    } else {
      if (chat.userId !== session.user.id) {
        console.log('Chat belongs to different user');
        return new TTTChatError('forbidden:chat').toResponse();
      }
    }

    console.log('Chat access validated');

    const messagesFromDb = await getMessagesByChatId({ id });
    console.log('Messages retrieved from DB, count:', messagesFromDb.length);

    const uiMessages = [...convertToUIMessages(messagesFromDb), message];
    console.log('UI messages prepared, count:', uiMessages.length);

    const { longitude, latitude, city, country } = geolocation(request);
    console.log('Geolocation extracted:', {
      longitude,
      latitude,
      city,
      country,
    });

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    console.log('Saving user message...');
    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: 'user',
          parts: message.parts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });
    console.log('User message saved');

    const streamId = generateUUID();
    console.log('Generated stream ID:', streamId);

    await createStreamId({ streamId, chatId: id });
    console.log('Stream ID created in DB');

    console.log('Creating UI message stream...');
    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        console.log('Stream execution started');
        console.log('Selected chat model:', selectedChatModel);

        try {
          console.log('Getting language model from provider...');
          const languageModel = myProvider.languageModel(selectedChatModel);
          console.log('Language model obtained');

          const result = streamText({
            model: languageModel,
            system: systemPrompt({ selectedChatModel, requestHints }),
            messages: convertToModelMessages(uiMessages),
            stopWhen: stepCountIs(5),
            experimental_activeTools:
              selectedChatModel === 'chat-model-reasoning'
                ? []
                : [
                    'getWeather',
                    'createDocument',
                    'updateDocument',
                    'requestSuggestions',
                  ],
            experimental_transform: smoothStream({ chunking: 'word' }),
            tools: {
              getWeather,
              createDocument: createDocument({ session, dataStream }),
              updateDocument: updateDocument({ session, dataStream }),
              requestSuggestions: requestSuggestions({
                session,
                dataStream,
              }),
            },
            experimental_telemetry: {
              isEnabled: isProductionEnvironment,
              functionId: 'stream-text',
            },
          });

          console.log('streamText result created');
          result.consumeStream();

          dataStream.merge(
            result.toUIMessageStream({
              sendReasoning: true,
            }),
          );

          console.log('Stream setup completed');
        } catch (streamError) {
          console.error('Error in stream execution:', streamError);
          throw streamError;
        }
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        await saveMessages({
          messages: messages.map((message) => ({
            id: message.id,
            role: message.role,
            parts: message.parts,
            createdAt: new Date(),
            attachments: [],
            chatId: id,
          })),
        });
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });

    console.log('UI message stream created');
    const streamContext = getStreamContext();
    console.log(
      'Stream context obtained:',
      streamContext ? 'resumable' : 'direct',
    );

    if (streamContext) {
      console.log('Using resumable stream');
      const response = new Response(
        await streamContext.resumableStream(streamId, () =>
          stream.pipeThrough(new JsonToSseTransformStream()),
        ),
      );
      console.log('Resumable stream response created');
      return response;
    } else {
      console.log('Using direct stream');
      const response = new Response(
        stream.pipeThrough(new JsonToSseTransformStream()),
      );
      console.log('Direct stream response created');
      return response;
    }
  } catch (error) {
    console.error('Chat API Error:', error);

    if (error instanceof TTTChatError) {
      return error.toResponse();
    }

    // Handle any other unexpected errors
    return new TTTChatError(
      'bad_request:chat',
      'An unexpected error occurred while processing your request.',
    ).toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new TTTChatError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new TTTChatError('unauthorized:chat').toResponse();
  }

  const chat = await getChatById({ id });

  if (chat.userId !== session.user.id) {
    return new TTTChatError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
