export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'internship' | 'coop' | 'new-grad';
  description: string;
  skills: string[];
}

export interface SavedSearch {
  id: string;
  query: string;
  filters: any;
  alertEnabled: boolean;
  createdAt: Date;
}

export interface StudentUser {
  email: string;
  university: string;
  graduationMonth: string;
  graduationYear: string;
  major: string;
  lookingFor: ('internship' | 'coop' | 'new-grad')[];
  coopSchool?: string;
  skills: string[];
}