import { experience } from '@/lib/data/experience';
import { ResumeEntries } from './resume-entries';

export function ExperienceMessage() {
  return (
    <ResumeEntries
      entries={experience.map((role) => ({
        title: role.title,
        organization: role.company,
        duration: role.duration,
        bullets: role.bullets,
      }))}
    />
  );
}
