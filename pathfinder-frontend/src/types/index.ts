export type UserType = 'student' | 'employer' | 'admin' | 'super-admin';

export interface BaseUser {
    id: string;
    email: string;
    userType: UserType;
}

export interface StudentUser extends BaseUser {
    userType: 'student';
    university: string;
    graduationMonth: string;
    graduationYear: string;
    lookingFor: ('internship' | 'coop' | 'new-grad')[];
    coopSchool?: string;
    major: string;
    skills: string[];
}

export interface EmployerUser extends BaseUser {
    userType: 'employer';
    companyName: string;
    contactInfo: {
        phone: string;
        website: string;
        address: string;
    };
    availableForEvents: boolean;
    sponsor: boolean;
    specialNotes: string;
}

export interface AdminUser extends BaseUser {
    userType: 'admin';
    password: string;
}

export interface SuperAdminUser extends BaseUser {
    userType: 'super-admin';
    password: string;
}

export type User = StudentUser | EmployerUser | AdminUser | SuperAdminUser;

export interface JobPosting {
    id: string;
    title: string;
    company: string;
    location: string;
    type: 'internship' | 'coop' | 'new-grad';
    coopCredits?: string;
    description: string;
    skills: string[];
    applyUrl: string;
    applySite: string;
    datePosted: Date;
    lastRefresh: Date;
    applicationDeadline?: Date;
    mode: 'remote' | 'on-site' | 'hybrid';
    term: 'summer' | 'fall' | 'spring' | 'winter';
    withPay: boolean;
    durationMonths: number;
    studentOrGraduate: 'Student' | 'New Graduate';
    responsibilities?: string;
    requirements?: string;
}

export interface SavedSearch {
    id: string;
    query: string;
    filters: {
        type?: ('internship' | 'coop' | 'new-grad')[];
        location?: string;
        keywords?: string[];
    };
    alertEnabled: boolean;
    createdAt: Date;
}

export interface CareerInsight {
    id: string;
    title: string;
    category: string;
    excerpt: string;
    imageUrl: string;
    readTime: string;
    url: string;
}

export interface EmployerPermissions {
    employerId: string;
    companyName: string;
    email: string;
    canPostJobs: boolean;
    canAccessAnalytics: boolean;
    canParticipateInEvents: boolean;
    canSponsor: boolean;
    maxJobPostings: number;
    accountStatus: 'active' | 'suspended' | 'pending';
    lastActive: Date;
    memberSince: Date;
}