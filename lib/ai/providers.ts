import {
  customProvider,
  extractReasoningMiddleware,
  gateway,
  wrapLanguageModel,
} from 'ai';
import { xai } from '@ai-sdk/xai';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';

/*
 * Models are served through the Vercel AI Gateway by default (OIDC on Vercel,
 * or AI_GATEWAY_API_KEY elsewhere). Setting XAI_API_KEY talks to xAI directly.
 */
const useXaiDirectly = Boolean(process.env.XAI_API_KEY);

const languageModel = (gatewayId: string, xaiId: string) =>
  useXaiDirectly ? xai(xaiId) : gateway(`xai/${gatewayId}`);

const imageModel = useXaiDirectly
  ? xai.imageModel('grok-2-image-1212')
  : gateway.imageModel('xai/grok-imagine-image');

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': languageModel(
          'grok-4.1-fast-non-reasoning',
          'grok-4-1-fast-non-reasoning',
        ),
        'chat-model-reasoning': wrapLanguageModel({
          model: languageModel(
            'grok-4.1-fast-reasoning',
            'grok-4-1-fast-reasoning',
          ),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': languageModel(
          'grok-4.1-fast-non-reasoning',
          'grok-4-1-fast-non-reasoning',
        ),
        'artifact-model': languageModel(
          'grok-4.1-fast-non-reasoning',
          'grok-4-1-fast-non-reasoning',
        ),
      },
      imageModels: {
        'small-model': imageModel,
      },
    });
