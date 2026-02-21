export type UserType = 'student' | 'employer' | 'admin' | 'super-admin';

export interface User {
    id: string;
    email: string
    userData: UserData;
}

export interface StudentUser extends User {
    userData: StudentUserData;
}

export interface EmployerUser extends User {
    userData: EmployerUserData;
}

export interface AdminUser extends User {
    userData: AdminUserData;
}
export interface SuperAdminUser extends User {
    userData: SuperAdminUserData;
}

export interface BaseUserData {
    userType: UserType;
}

export interface StudentUserData extends BaseUserData {
    userType: 'student';
    university: string;
    graduationMonth: string;
    graduationYear: string;
    lookingFor: ('internship' | 'coop' | 'new-grad')[];
    coopSchool?: string | null;
    major: string;
    skills: string[];
}

export interface EmployerUserData extends BaseUserData {
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

export interface AdminUserData extends BaseUserData {
    userType: 'admin';
}

export interface SuperAdminUserData extends BaseUserData {
    userType: 'super-admin';
}

export type UserData = StudentUserData | EmployerUserData | AdminUserData | SuperAdminUserData;

export type UserDataMap = {
    'student': StudentUserData;
    'employer': EmployerUserData;
    'admin': AdminUserData;
    'super-admin': SuperAdminUserData;
};

export type UserMap = {
    'student': StudentUser;
    'employer': EmployerUser;
    'admin': AdminUser;
    'super-admin': SuperAdminUser;
};

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