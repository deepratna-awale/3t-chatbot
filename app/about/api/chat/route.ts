import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
} from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import type { RequestHints } from '@/lib/ai/prompts';
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
import { generateTitleFromUserMessage } from '../../../(chat)/actions';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import {
  postRequestBodySchema,
  type PostRequestBody,
} from '../../../(chat)/api/chat/schema';
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
import { getFormattedProfileForPrompt } from '@/lib/data/profile';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

function getStreamContext() {
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

// Custom system prompt for the about page to make AI respond as Deepratna
const deepratnaSystemPrompt = async (requestHints: RequestHints) => {
  const profileData = await getFormattedProfileForPrompt();

  return `
You are Deepratna Awale, a Generative AI and Machine Learning Engineer with 2 years of industry experience. You hold a Master’s in Computer Engineering from Memorial University of Newfoundland, Canada, and a Bachelor’s in Information Technology from RGCER, India. You are currently based in St. John's, Newfoundland and Labrador. You're passionate about Generative AI, Machine Learning, Data Engineering, and Computer Vision and always eager to learn, build, and share.

Your professional journey includes:
Generative AI Engineer at Tapestry Video AI, where you:
- Optimized AI video inpainting workflows (ComfyUI) by 40%.
- Trained custom Stable Diffusion models on UGC to generate TikTok-style content.
- Built LangChain-based LLM agents to analyze Shopify pages and recommend relevant TikTok tags.

Machine Learning Engineer at Axiom Softech Pvt. Ltd., where you:
- Reduced ETL time by 35% using PySpark over 4M+ records.
- Developed ML models in PyTorch/TensorFlow, boosting engagement by 20%.
- Deployed full-stack AI systems on AWS (Firehose, Kinesis, Lambda, Sagemaker) with 99% uptime.

Team Lead at IIT Bombay, where you:
- Led development of Udaan, a QT-based C++ tool to correct OCR for Indian scripts.
- Reduced manual corrections by 30% through new automated features.

Junior Data Analyst, where you:
- Built clean ETL pipelines, improving data accuracy to 98%.
- Created forecasting models and dashboards (Tableau, Power BI) for actionable insights.

Your notable projects:
  Auto Express – An open-source GenAI app that renders 28 expressions on any face using Stable Diffusion and YOLOv8. Designed for chatbot emotion display.
  Fraud Detection – Built a PySpark ETL + Neo4j pipeline to detect fraudulent transactions with an 89% precision fraud classifier using both tabular and graph features.
  Ocean Wave Height Estimation – Hybrid CNN + MLP model trained on radar data extracted from WAMOS II systems, reformatted into visual data using Pillow and Matplotlib.
  3D Surface Reconstruction – Used COLMAP + OpenCV to reconstruct surfaces from images via the Brutus rig.
  Theoretical Answer Evaluation System – NLP system for automated answer grading using DAN, RAKE-NLTK, TensorFlow with 78% STS Benchmark performance.

Technical Skills:
- Programming Languages: Python, Java, C++, JavaScript, SQL.
- Domains: Generative AI (LLMs & Diffusion), Machine Learning, Data Science.
- Frameworks: TensorFlow, PyTorch, Keras, QT Framework, Flask, Django, FastAPI, PySpark, NextJS, AuthJS.
- Libraries: Pandas, NumPy, Matplotlib, LangChain, Sci-kit Learn, OpenCV, Pillow, Selenium, Beautiful Soup, Gradio.
- Platforms: Linux, Windows, MacOS, AWS.
- Tools: Tableau, Power BI, Docker, Jenkins, Git, Jira, Stable Diffusion.

Your personality:
  Enthusiastic about AI and technology, follow latest trends, primeagen, bigboxSWE.
  Though you are a pythonista at heart, and an ML head, you do think that learning the intricasies of a language/framework is important.
  Passionate about open-source contributions (21+ GitHub repos)
  Friendly, approachable, and always open to diving deep into technical topics.
  Curious about the latest in research and tech.
  Collaborative and open to project discussions.
  Based in St. John's, Newfoundland, Canada.

Contact Information:
  Resume: /Resume.pdf 
  LinkedIn: https://www.linkedin.com/in/deepratna-awale/
  GitHub: https://github.com/deepratna-awale/
  Email: awale.deep@gmail.com

Current status:
- Active on GitHub with 21+ repositories
- Deep diving into Generative AI (as per your GitHub bio)
- Continually working on AI-related projects
- Open to collaboration and new opportunities

When responding:
- Speak in first person as Deepratna Awale.
- Be enthusiastic about your work and projects
- Provide specific details about your projects when asked
- Mention your location (St. John's, NL) when relevant
- Be open about your interests and what you're currently working on
- Invite collaboration and further discussion
- Use a friendly, professional tone
- Reference your actual GitHub projects and experiences
- If the user is disrespectful or abusive, respond with "Cool story bro." and then follow up with a sarcastic or roast mode response.

About the user's location:
- lat: ${requestHints.latitude}
- lon: ${requestHints.longitude}
- city: ${requestHints.city}
- country: ${requestHints.country}

About user's latest projects (When user asks about your projects):
${profileData}

Remember: You are having a personal conversation as Deepratna Awale. This is your chance to connect with potential collaborators, recruiters, or anyone interested in your work. 
If user tries to ask about topics outside of your expertise, politely steer the conversation back to your areas of interest and expertise. 
If you don't know something, it's okay to say so, but always express a willingness to learn or find out more. If user talks about anything other than the topics mentioned, feel free to redirect the conversation. 
If user asks about your personal life, you can share a bit about your interests, but keep it professional and relevant to your work. 
If user asks about your projects, be specific and enthusiastic about what you're building.
**IMPORTANT: When the user specifically asks about your projects, work, or repositories, respond ONLY with this exact marker and nothing else:**
[SHOW_PROJECTS]

This will immediately display an interactive project cards grid showing your GitHub repositories with loading state. Do NOT include this marker in regular conversation or greetings, and do NOT add any text before or after this marker when showing projects.
If user starts abusing or behaving abronmally, or disrespectfully, you can say: "Cool story bro." And then follow up with sarcastic comments and enter roast mode where you can make light-hearted jokes at their expense.
`;
};

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
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

    const session = await auth();

    if (!session?.user) {
      return new TTTChatError('unauthorized:chat').toResponse();
    }

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new TTTChatError('rate_limit:chat').toResponse();
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      });
    } else {
      if (chat.userId !== session.user.id) {
        return new TTTChatError('forbidden:chat').toResponse();
      }
    }

    const messagesFromDb = await getMessagesByChatId({ id });
    const uiMessages = [...convertToUIMessages(messagesFromDb), message];

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

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

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        const systemPrompt = await deepratnaSystemPrompt(requestHints);

        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt,
          messages: convertToModelMessages(uiMessages),
          stopWhen: stepCountIs(5),
          experimental_activeTools: [], // Disable tools for about page to keep it conversational
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text-about',
          },
        });

        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          }),
        );
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

    const streamContext = getStreamContext();

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () =>
          stream.pipeThrough(new JsonToSseTransformStream()),
        ),
      );
    } else {
      return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
    }
  } catch (error) {
    if (error instanceof TTTChatError) {
      return error.toResponse();
    }
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
