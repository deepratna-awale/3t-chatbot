import { getProfileData } from '@/lib/data/profile';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { myProvider } from '@/lib/ai/providers';
import { generateText } from 'ai';

export const dynamic = 'force-dynamic';

// Function to generate AI explanation for a project
async function generateProjectExplanation(
  projectName: string,
  originalDescription: string,
  topics: string[],
  language: string,
) {
  try {
    const { text } = await generateText({
      model: myProvider.languageModel('chat-model'),
      prompt: `As Deepratna Awale, write a brief, engaging explanation (max 2 sentences) for my GitHub project "${projectName}". 
      
      Original description: "${originalDescription}"
      Programming language: ${language}
      Topics: ${topics.join(', ')}

      Write it from first person perspective as if I'm explaining the purpose of the project, why it was conceived and why it's useful. Be technical but accessible. Focus on the value and functionality.`,
      maxRetries: 1,
    });

    return text.trim();
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
      .filter(
        (repo) =>
          !repo.name.includes('fork') &&
          repo.description &&
          repo.description.trim() !== '',
      )
      .slice(0, 12); // Limit to top 12 projects

    // Generate AI explanations for each project
    const projects = await Promise.all(
      filteredRepos.map(async (repo) => {
        const aiDescription = await generateProjectExplanation(
          repo.name,
          repo.description,
          repo.topics || [],
          repo.language || 'Unknown',
        );

        return {
          name: repo.name,
          description: aiDescription,
          url: repo.url,
          stars: repo.stars,
          forks: repo.forks,
          language: repo.language,
          topics: repo.topics,
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
