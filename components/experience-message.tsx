import { experience } from '@/lib/data/experience';

export function ExperienceMessage() {
  return (
    <div className="w-full space-y-5">
      {experience.map((role) => (
        <div key={`${role.company}-${role.duration}`} className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <p className="text-foreground">
              <span className="font-semibold">{role.title}</span>
              <span className="text-muted-foreground"> · {role.company}</span>
            </p>
            <p className="text-sm text-muted-foreground whitespace-nowrap">
              {role.duration}
            </p>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {role.bullets.map((bullet) => (
              <li key={bullet} className="truncate" title={bullet}>
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
