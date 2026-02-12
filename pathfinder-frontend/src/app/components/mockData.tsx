import { JobPosting } from '@/app/components/types';

export const mockJobs: JobPosting[] = [
  { id: '1', title: 'Software Eng Intern', company: 'TechCorp', location: 'Toronto, ON', type: 'internship', description: 'Great internship.', skills: ['React', 'Node'] },
  { id: '2', title: 'Data Scientist Co-op', company: 'DataSys', location: 'Vancouver, BC', type: 'coop', description: 'Data roles.', skills: ['Python', 'SQL'] },
  { id: '3', title: 'Frontend New Grad', company: 'WebSolutions', location: 'Remote', type: 'new-grad', description: 'New grad position.', skills: ['HTML', 'CSS'] },
  { id: '4', title: 'Backend Co-op', company: 'ServerTech', location: 'Montreal, QC', type: 'coop', description: 'Backend systems.', skills: ['Go', 'Postgres'] },
  { id: '5', title: 'Fullstack Intern', company: 'FullStackCo', location: 'Toronto, ON', type: 'internship', description: 'Do it all.', skills: ['Vue', 'Ruby'] },
  { id: '6', title: 'UI/UX Design Co-op', company: 'DesignWorks', location: 'Toronto, ON', type: 'coop', description: 'Creative design.', skills: ['Figma', 'UI'] },
];

export const careerInsights = [
  { id: '1', title: 'Resume Tips for 2026', category: 'Resume', excerpt: 'How to write a great resume that beats ATS systems.', imageUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80', readTime: '5 min' },
  { id: '2', title: 'Ace Your Technical Interview', category: 'Interview', excerpt: 'Prepare like a pro for whiteboarding and LeetCode.', imageUrl: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&q=80', readTime: '10 min' },
  { id: '3', title: 'Negotiating Your First Salary', category: 'Career Growth', excerpt: 'A guide to getting paid what you are worth.', imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80', readTime: '7 min' },
];
