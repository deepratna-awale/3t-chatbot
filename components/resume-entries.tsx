export interface ResumeEntry {
  title: string;
  organization: string;
  duration: string;
  bullets: string[];
}

// Classic resume layout: title and organization on the left, dates on the right, then bullets
export function ResumeEntries({ entries }: { entries: ResumeEntry[] }) {
  return (
    <div className="w-full space-y-5">
      {entries.map((entry) => (
        <div
          key={`${entry.organization}-${entry.duration}`}
          className="space-y-2"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <p className="text-foreground">
              <span className="font-semibold">{entry.title}</span>
              <span className="text-muted-foreground">
                {' '}
                · {entry.organization}
              </span>
            </p>
            <p className="text-sm text-muted-foreground whitespace-nowrap">
              {entry.duration}
            </p>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {entry.bullets.map((bullet) => (
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
