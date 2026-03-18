'use client';

import { useEffect, useState } from 'react';
import { ProjectCard, type ProjectCardData } from './project-card';

interface ProjectsMessageProps {
  isVisible: boolean;
}

interface ProjectsResponse {
  projects: ProjectCardData[];
  totalRepos: number;
  lastUpdated: string;
}

export function ProjectsMessage({ isVisible }: ProjectsMessageProps) {
  const [projects, setProjects] = useState<ProjectCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible && projects.length === 0) {
      fetchProjects();
    }
  }, [isVisible, projects.length]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/about/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data: ProjectsResponse = await response.json();
      setProjects(data.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  if (loading) {
    return (
      <div className="w-full p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full size-8 border-2 border-primary/20 border-t-primary" />
            <div className="absolute inset-0 animate-pulse rounded-full size-8 border-2 border-primary/10" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              Getting Projects from Github
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Fetching latest repositories and project details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 text-center">
        <p className="text-destructive text-sm mb-2">Failed to load projects</p>
        <button
          type="button"
          onClick={fetchProjects}
          className="text-sm text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {projects.map((project, index) => (
        <ProjectCard key={`${project.name}-${index}`} project={project} />
      ))}
    </div>
  );
}
