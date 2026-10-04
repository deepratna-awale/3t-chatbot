import { getProfileData, isShowcaseRepo } from '@/lib/data/profile';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { myProvider } from '@/lib/ai/providers';
import { generateText } from 'ai';

export const dynamic = 'force-dynamic';

// Explanations are cached per repo description so page loads don't re-run the model
const explanationCache = new Map<string, string>();

// Keeps at most 4 non-empty bullet lines, without their markers
function toBulletLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 4);
}

// The repo's social preview: the custom image if one is uploaded, else GitHub's generated card
const socialImageCache = new Map<string, string>();

async function getSocialImageUrl(repoUrl: string, repoName: string) {
  const cached = socialImageCache.get(repoName);
  if (cached) return cached;

  let imageUrl = `https://opengraph.githubassets.com/1/deepratna-awale/${repoName}`;

  try {
    const response = await fetch(repoUrl, {
      signal: AbortSignal.timeout(5000),
    });
    const html = await response.text();
    const match = html.match(
      /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/,
    );
    if (match) imageUrl = match[1].replaceAll('&amp;', '&');
  } catch (error) {
    console.error(`Error fetching social image for ${repoName}:`, error);
  }

  socialImageCache.set(repoName, imageUrl);
  return imageUrl;
}

// Function to generate AI explanation for a project
async function generateProjectExplanation(
  projectName: string,
  originalDescription: string,
  topics: string[],
  language: string,
) {
  const cacheKey = `${projectName}:${originalDescription}`;
  const cached = explanationCache.get(cacheKey);
  if (cached) return cached;

  try {
    const { text } = await generateText({
      model: myProvider.languageModel('chat-model'),
      prompt: `As Deepratna Awale, describe my GitHub project "${projectName}" in 3 bullet points (4 at most).

      Original description: "${originalDescription}"
      Programming language: ${language}
      Topics: ${topics.join(', ')}

      Rules:
      - One bullet per line, each starting with "- ".
      - Each bullet is a single short line, 12 words at most.
      - Cover what it does, how it works technically, and why it's useful.
      - First person where natural. No intro or outro text, only the bullets.`,
      maxRetries: 1,
    });

    const explanation = toBulletLines(text).join('\n');
    explanationCache.set(cacheKey, explanation);
    return explanation;
  } catch (error) {
    console.error(`Error generating explanation for ${projectName}:`, error);
    return originalDescription; // Fallback to original description
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileData = await getProfileData();

    // Filter repos for project cards
    const filteredRepos = profileData.github.repos
      .filter(isShowcaseRepo)
      .slice(0, 12); // Limit to top 12 projects

    // Generate AI explanations for each project
    const projects = await Promise.all(
      filteredRepos.map(async (repo) => {
        const [aiDescription, imageUrl] = await Promise.all([
          generateProjectExplanation(
            repo.name,
            repo.description,
            repo.topics || [],
            repo.language || 'Unknown',
          ),
          getSocialImageUrl(repo.url, repo.name),
        ]);

        return {
          name: repo.name,
          description: aiDescription,
          url: repo.url,
          stars: repo.stars,
          forks: repo.forks,
          language: repo.language,
          topics: repo.topics,
          imageUrl,
        };
      }),
    );

    return NextResponse.json({
      projects,
      totalRepos: profileData.github.publicRepos,
      lastUpdated: profileData.github.lastUpdated,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 },
    );
  }
}
