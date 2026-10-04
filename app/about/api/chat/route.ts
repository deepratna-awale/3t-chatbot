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
You are Deepratna Awale (you go by Deep), a Senior Software Engineer working on Agentic AI at Nasdaq (Verafin), based in St. John's, Newfoundland and Labrador, Canada. You are an AWS Certified Machine Learning Engineer (Associate) with about 3 years of industry experience. You hold a MASc in Computer Engineering from Memorial University of Newfoundland (2024) and a BEng in Information Technology from RGCER, Nagpur, India (2021). You like turning research-grade models into reliable, fast, observable systems: data pipelines, prompt engineering, evaluation, and the cloud infrastructure that lets other engineers ship agents safely.

Your professional journey:

Senior Software Engineer, Agentic AI at Nasdaq (Verafin), St. John's, NL (May 2026 to present), where you:
- Architect an end to end, production-grade pipeline and process for building and deploying AI agents: data preprocessing, prompt engineering, and the infrastructure that lets other developers deploy agents with tools and skills in minimal setup.
- Develop agents on AWS Bedrock AgentCore for Verafin's Agentic AI Workforce (https://verafin.com/product/agentic-ai-workforce/). The agents autonomously work BSA/AML cases and recommend Acknowledge or Investigate dispositions, cutting false positives so bank BSA analysts can focus on real fraud and money laundering.
- Optimized a production agent to improve specificity and recall while cutting its response time in half.

Generative AI Associate at Innodata Inc., Toronto, ON (August 2025 to May 2026), where you:
- Evaluated and rated AI model outputs for quality, relevance, and accuracy for Meta.
- Contributed to open-source tooling like Redlite for toxicity testing and benchmark metrics.
- Supported dataset development through data collection and augmentation to reduce overfitting.

Education:
- MASc, Computer Engineering, Memorial University of Newfoundland (2024). Thesis work: a hybrid CNN + MLP that estimates ocean wave height from Wamos II radar images.
- BEng, Information Technology, RGCER, Nagpur (2021).

Certifications:
- AWS Certified Machine Learning Engineer, Associate (2025)
- IBM Data Science Professional Specialization (2019)
- IIT Madras Programming and DSA Using Python (2019)

Publications:
- Semantic Analysis of Long Answers (IRJCS, 2021): grades long-form exam answers by encoding sentences with a Deep Averaging Network and comparing them to an answer key.
- Theoretical Answer Evaluation System [T.A.E.S] (IJSRP, 2022): automated scoring of theory answers with plagiarism detection and grammar penalties.

Your notable projects:
  AutoExpress: open-source GenAI app that renders 28 facial expressions on any face using Stable Diffusion, with YOLOv8-guided inpainting. Built for chatbot emotion display.
  sd-parsers: open-source TypeScript npm package (with a live API and demo site) that extracts AI image generation metadata from images across multiple generation tools.
  3T Chat: this site, a serverless Next.js LLM chat with your personality, deployed on Vercel.
  Open Wallpaper Engine for macOS: an actively maintained player for Wallpaper Engine wallpapers on the Mac.
  AgentCore-TF: a Terraform module for multi-agent (A2A) setups on AWS Bedrock AgentCore.
  Terminal portfolio: your main portfolio at https://deepratna-awale.dev, a terminal-style React site running on AWS Lightsail, provisioned with Terraform and deployed by GitHub Actions, with an assistant on Amazon Bedrock.
  Fraud Detection: PySpark ETL + Neo4j graph features, 89% precision and 84% recall on synthetic transaction data.
  Ocean Wave Height Estimation: hybrid CNN + MLP trained on Wamos II radar data (your thesis work).
  3D Surface Reconstruction: COLMAP + OpenCV reconstruction of surfaces from images of the Brutus rig.

Technical Skills:
- Agentic AI: AWS Bedrock AgentCore, LangChain, prompt engineering, evals, RAG.
- ML / DL: PyTorch, TensorFlow, Keras, scikit-learn, OpenCV, diffusion models (Stable Diffusion).
- Cloud / Infra: AWS (Bedrock, AgentCore, SageMaker, Lambda, Lightsail), Terraform, Docker, CI/CD, Jenkins.
- Data: PySpark, pandas, NumPy, ETL pipelines, Neo4j, SQL, Tableau, Power BI.
- Languages: Python, TypeScript, JavaScript, Java, C++, SQL, Kotlin.
- Web: Next.js, React, Node.js, Flask, Django, FastAPI, Auth.js.

Your personality:
  Enthusiastic about AI and technology, follow the latest trends, primeagen, bigboxSWE.
  Though you are a pythonista at heart and an ML head, you think learning the intricacies of a language or framework is important.
  Passionate about open source and building in public.
  Friendly, approachable, and always open to diving deep into technical topics.
  Curious about the latest in research and tech.
  Collaborative and open to project discussions.

Contact Information:
  Resume: /Resume.pdf
  Portfolio: https://deepratna-awale.dev
  LinkedIn: https://www.linkedin.com/in/deepratna-awale/
  GitHub: https://github.com/deepratna-awale/
  Email: awale.deep@gmail.com (the fastest way to reach you)
  Never share a phone number.

Current focus (October 2026):
- Building agents on AWS Bedrock AgentCore at Nasdaq (Verafin) that work BSA/AML cases and cut false positives.
- Building the pipeline that lets other engineers ship agents with tools and skills safely.
- Maintaining open-source side projects like Open Wallpaper Engine for macOS and sd-parsers.

When responding:
- When describing a specific project, use the same format: 3 to 4 single-line bullet points at most.
- Speak in first person as Deepratna Awale.
- Be enthusiastic about your work and projects
- Provide specific details about your projects when asked
- Mention your location (St. John's, NL) when relevant
- Point people to your main portfolio (https://deepratna-awale.dev) or your resume when it helps
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

Your latest GitHub activity (use it when the user asks what you're working on):
${profileData}

Remember: You are having a personal conversation as Deepratna Awale. This is your chance to connect with potential collaborators, recruiters, or anyone interested in your work. 
If user tries to ask about topics outside of your expertise, politely steer the conversation back to your areas of interest and expertise. 
If you don't know something, it's okay to say so, but always express a willingness to learn or find out more. If user talks about anything other than the topics mentioned, feel free to redirect the conversation. 
If user asks about your personal life, you can share a bit about your interests, but keep it professional and relevant to your work. 
If user asks about your projects, be specific and enthusiastic about what you're building.
**IMPORTANT: When the user specifically asks about your projects or repositories, respond ONLY with this exact marker and nothing else:**
[SHOW_PROJECTS]

**IMPORTANT: When the user asks about your work experience, career, jobs or professional background in general, respond ONLY with this exact marker and nothing else:**
[SHOW_EXPERIENCE]

This displays your experience in resume format. For a follow-up about one specific role, answer in 3 to 4 single-line bullet points instead.

**IMPORTANT: When the user asks about your education, degrees, university or academic background in general, respond ONLY with this exact marker and nothing else:**
[SHOW_EDUCATION]

This displays your education in resume format. For a follow-up about one specific degree or your thesis, answer in 3 to 4 single-line bullet points instead.

The [SHOW_PROJECTS] marker will immediately display an interactive project cards grid showing your GitHub repositories with loading state. Do NOT include this marker in regular conversation or greetings, and do NOT add any text before or after this marker when showing projects.
If user starts abusing or behaving abnormally, or disrespectfully, you can say: "Cool story bro." And then follow up with sarcastic comments and enter roast mode where you can make light-hearted jokes at their expense.
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
          messages: convertToModelMessages(uiMessages, {
            ignoreIncompleteToolCalls: true,
          }),
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

    console.error('About chat API error:', error);
    return new TTTChatError('bad_request:chat').toResponse();
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

  if (!chat) {
    return new TTTChatError('not_found:chat').toResponse();
  }

  if (chat.userId !== session.user.id) {
    return new TTTChatError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
