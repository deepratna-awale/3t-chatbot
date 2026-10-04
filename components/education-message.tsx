import { education } from '@/lib/data/education';
import { ResumeEntries } from './resume-entries';

export function EducationMessage() {
  return (
    <ResumeEntries
      entries={education.map((degree) => ({
        title: degree.degree,
        organization: degree.school,
        duration: degree.duration,
        bullets: degree.bullets,
      }))}
    />
  );
}
