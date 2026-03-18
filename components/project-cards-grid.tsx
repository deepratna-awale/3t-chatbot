'use client';

import { ProjectCard, type ProjectCardData } from './project-card';

interface ProjectCardsGridProps {
  projects: ProjectCardData[];
  title?: string;
}

export function ProjectCardsGrid({
  projects,
  title = 'Featured Projects',
}: ProjectCardsGridProps) {
  if (!projects || projects.length === 0) {
    return (
      <div className="w-full p-6 text-center text-muted-foreground">
        <p>No projects to display at the moment.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <span className="text-sm text-muted-foreground">
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project, index) => (
          <div key={`${project.name}-${index}`} className="h-full">
            <ProjectCard project={project} />
          </div>
        ))}
      </div>
    </div>
  );
}
