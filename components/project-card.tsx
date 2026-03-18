'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Star, GitFork } from 'lucide-react';

export interface ProjectCardData {
  name: string;
  description: string;
  url: string;
  stars: number;
  forks?: number;
  language?: string;
  topics?: string[];
}

interface ProjectCardProps {
  project: ProjectCardData;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const handleOpenProject = () => {
    window.open(project.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="relative size-full border border-border/40 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-200 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-foreground truncate">
              {project.name}
            </CardTitle>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              {project.language && (
                <span className="flex items-center gap-1">
                  <div
                    className="size-2 rounded-full"
                    style={{
                      backgroundColor: getLanguageColor(project.language),
                    }}
                  />
                  {project.language}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Star className="size-3" />
                {project.stars || 0}
              </span>
              <span className="flex items-center gap-1">
                <GitFork className="size-3" />
                {project.forks || 0}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 p-2 hover:bg-accent/50"
            onClick={handleOpenProject}
            title="Open in GitHub"
          >
            <ExternalLink className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {project.description || 'No description available'}
        </CardDescription>
        {project.topics && project.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {project.topics.slice(0, 4).map((topic) => (
              <span
                key={topic}
                className="inline-flex items-center px-2 py-1 text-xs font-medium bg-secondary/50 text-secondary-foreground rounded-md"
              >
                {topic}
              </span>
            ))}
            {project.topics.length > 4 && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-muted-foreground">
                +{project.topics.length - 4} more
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to get language colors (simplified version)
function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    TypeScript: '#3178C6',
    JavaScript: '#F7DF1E',
    Python: '#3776AB',
    Java: '#ED8B00',
    'C++': '#00599C',
    C: '#A8B9CC',
    HTML: '#E34F26',
    CSS: '#1572B6',
    Go: '#00ADD8',
    Rust: '#DEA584',
    PHP: '#777BB4',
    Ruby: '#CC342D',
    Swift: '#FA7343',
    Kotlin: '#7F52FF',
    Dart: '#0175C2',
    Shell: '#89E051',
    Jupyter: '#DA5B0B',
  };

  return colors[language] || '#6B7280';
}
