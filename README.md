<a href="https://3tchat.vercel.app/">
  <img alt="3T Chat - Your intelligent AI assistant." src="app/(chat)/opengraph-image.png">
  <h1 align="center">3T Chat</h1>
</a>

<p align="center">
    3T Chat is a powerful AI assistant built with Next.js and the AI SDK that provides intelligent conversations and advanced AI capabilities.
</p>

<p align="center">
  <a href="https://chat-sdk.dev"><strong>Read Docs</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Features

- [Next.js](https://nextjs.org) App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering and increased performance
- [AI SDK](https://sdk.vercel.ai/docs)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
  - Supports xAI (default), OpenAI, Fireworks, and other model providers
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility
- Data Persistence
  - [Neon Serverless Postgres](https://vercel.com/marketplace/neon) for saving chat history and user data
  - [Vercel Blob](https://vercel.com/storage/blob) for efficient file storage
- [Auth.js](https://authjs.dev)
  - Simple and secure authentication
- **"About" Page - Chat with Deepratna**
  - Personalized chat experience where users can interact directly with Deepratna Awale
  - Real-time GitHub repository data integration
  - Automated daily refresh of profile information
  - Professional networking and recruitment-focused conversations

## Model Providers

This application ships with [xAI](https://x.ai) Grok 4.1 Fast as the default chat model, served through the [Vercel AI Gateway](https://vercel.com/ai-gateway) (authenticated automatically with OIDC on Vercel, or with `AI_GATEWAY_API_KEY` elsewhere). Set `XAI_API_KEY` to call xAI directly instead. However, with the [AI SDK](https://sdk.vercel.ai/docs), you can switch LLM providers to [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Cohere](https://cohere.com/), and [many more](https://sdk.vercel.ai/providers/ai-sdk-providers) with just a few lines of code.

## Deploy Your Own

You can deploy your own version of 3T Chat to Vercel. Make sure to set up the required environment variables from the `.env.example` file.

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run 3T Chat. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various AI and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm dev
```

Your app should now be running on [localhost:3000](http://localhost:3000).
