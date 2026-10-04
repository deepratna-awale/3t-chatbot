/**
 * Data fetcher for Deepratna's GitHub and resume information
 * This module handles fetching and caching profile data
 */

export interface GitHubRepo {
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  url: string;
  updatedAt: string;
  topics: string[];
  isFork: boolean;
  isArchived: boolean;
}

export interface ProfileData {
  github: {
    repos: GitHubRepo[];
    bio: string;
    location: string;
    publicRepos: number;
    followers: number;
    following: number;
    lastUpdated: string;
  };
  resume: {
    content: string;
    lastUpdated: string;
  };
}

// Forks that are actively maintained and worth showing as projects
const FEATURED_FORKS = new Set(['open-wallpaper-engine-mac']);

export function isShowcaseRepo(repo: GitHubRepo) {
  return (
    (!repo.isFork || FEATURED_FORKS.has(repo.name)) &&
    !repo.isArchived &&
    repo.description.trim() !== ''
  );
}

// In-memory cache (in production, you'd want to use Redis or similar)
let cachedData: ProfileData | null = null;
let lastFetched: Date | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function fetchGitHubData(): Promise<ProfileData['github']> {
  try {
    const response = await fetch(
      'https://api.github.com/users/deepratna-awale',
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          // Add GitHub token if available
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
          }),
        },
      },
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const userData = await response.json();

    // Fetch repositories
    const reposResponse = await fetch(
      `https://api.github.com/users/deepratna-awale/repos?sort=updated&per_page=50`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
          }),
        },
      },
    );

    if (!reposResponse.ok) {
      throw new Error(`GitHub repos API error: ${reposResponse.statusText}`);
    }

    const reposData = await reposResponse.json();

    const repos: GitHubRepo[] = reposData.map((repo: any) => ({
      name: repo.name,
      description: repo.description || '',
      language: repo.language || '',
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      url: repo.html_url,
      updatedAt: repo.updated_at,
      topics: repo.topics || [],
      isFork: Boolean(repo.fork),
      isArchived: Boolean(repo.archived),
    }));

    return {
      repos,
      bio: userData.bio || '',
      location: userData.location || '',
      publicRepos: userData.public_repos,
      followers: userData.followers,
      following: userData.following,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    // Return cached data if available, otherwise return empty data
    return (
      cachedData?.github || {
        repos: [],
        bio: '',
        location: '',
        publicRepos: 0,
        followers: 0,
        following: 0,
        lastUpdated: new Date().toISOString(),
      }
    );
  }
}

export async function fetchResumeData(): Promise<ProfileData['resume']> {
  // For now, return a placeholder. In a real implementation, you might:
  // 1. Parse the PDF using a library like pdf-parse
  // 2. Store key resume information in a structured format
  // 3. Update this data periodically

  return {
    content: `
      Current role: Senior Software Engineer, Agentic AI at Nasdaq (Verafin), May 2026 to present
      Previous role: Generative AI Associate at Innodata Inc., Aug 2025 to May 2026

      Education:
      - MASc Computer Engineering, Memorial University of Newfoundland (2024)
      - BEng Information Technology, RGCER Nagpur (2021)
      - AWS Certified Machine Learning Engineer, Associate (2025)

      Skills:
      - Agentic AI: AWS Bedrock AgentCore, LangChain, prompt engineering, evals, RAG
      - ML/DL: PyTorch, TensorFlow, scikit-learn, OpenCV, diffusion models
      - Cloud/Infra: AWS, Terraform, Docker, CI/CD
      - Data: PySpark, pandas, Neo4j, SQL
      - Languages: Python, TypeScript, Java, C++, SQL

      Notable Projects:
      - AutoExpress: character expression generation using Stable Diffusion
      - sd-parsers: TypeScript package for AI image generation metadata
      - Open Wallpaper Engine for macOS
      - AgentCore-TF: Terraform module for multi-agent A2A on Bedrock AgentCore
      - Fraud detection pipeline with PySpark and Neo4j
    `,
    lastUpdated: new Date().toISOString(),
  };
}

export async function getProfileData(
  forceRefresh = false,
): Promise<ProfileData> {
  const now = new Date();

  // Check if we need to refresh the cache
  const shouldRefresh =
    forceRefresh ||
    !cachedData ||
    !lastFetched ||
    now.getTime() - lastFetched.getTime() > CACHE_DURATION;

  if (!shouldRefresh && cachedData) {
    return cachedData;
  }

  console.log('Fetching fresh profile data...');

  try {
    const [github, resume] = await Promise.all([
      fetchGitHubData(),
      fetchResumeData(),
    ]);

    cachedData = { github, resume };
    lastFetched = now;

    return cachedData;
  } catch (error) {
    console.error('Error fetching profile data:', error);
    // Return cached data if available, otherwise return minimal data
    return (
      cachedData || {
        github: {
          repos: [],
          bio: '',
          location: '',
          publicRepos: 0,
          followers: 0,
          following: 0,
          lastUpdated: new Date().toISOString(),
        },
        resume: {
          content: '',
          lastUpdated: new Date().toISOString(),
        },
      }
    );
  }
}

// Function to get formatted data for the AI prompt
export async function getFormattedProfileForPrompt(): Promise<string> {
  const data = await getProfileData();

  const topRepos = data.github.repos.filter(isShowcaseRepo).slice(0, 15);

  return `
Recent GitHub Activity (as of ${data.github.lastUpdated}):
${topRepos
  .map(
    (repo) =>
      `- ${repo.name}: ${repo.description} (${repo.language}${repo.stars > 0 ? `, ${repo.stars} stars` : ''})`,
  )
  .join('\n')}

GitHub Stats:
- ${data.github.publicRepos} public repositories
- ${data.github.followers} followers
- Location: ${data.github.location}

Professional Background:
${data.resume.content}

Last updated: ${data.github.lastUpdated}
  `.trim();
}
