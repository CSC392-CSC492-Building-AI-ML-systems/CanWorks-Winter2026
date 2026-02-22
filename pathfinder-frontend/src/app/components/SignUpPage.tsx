'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/components/authComponents';
import { Button, Input, CheckBox, Textarea, Switch, Card, CardContent, Label, Alert, AlertDescription  } from '@/app/components/globalComponents';
import { GraduationCap, Building2, Shield, Crown } from 'lucide-react';
import type { UserType, UserData, User } from '@/types';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 6 }, (_, i) => currentYear + i);
const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export function SignUpPage() {
    const router = useRouter();
    const { user, signUp } = useUser();
    const [userType, setUserType] = useState<UserType>('student');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSignUp(email: string, password: string, userData: UserData) {
        setError(null);
        setLoading(true);

        try {
            if (!email || !password) {
                throw new Error("Email and password are required.");
            }

            const user: User | null = await signUp(email, password, userData);
            if (!user) {
                setError("Invalid email or password.");
            } else {

            }
        } catch (err: any) {
            setError("Something went wrong.");
        } finally {
            setLoading(false);
        }
    }
    
    // Student form data
    const [studentFormData, setStudentFormData] = useState({
        university: '',
        graduationMonth: '',
        graduationYear: '',
        major: '',
        skills: '',
    });
    const [lookingFor, setLookingFor] = useState<('internship' | 'coop' | 'new-grad')[]>([]);
    const [coopSchool, setCoopSchool] = useState('');

    // Employer form data
    const [employerFormData, setEmployerFormData] = useState({
        companyName: '',
        phone: '',
        website: '',
        address: '',
        availableForEvents: false,
        sponsor: false,
        specialNotes: '',
    });

    // User form data
    const [userFormData, setUserFormData] = useState({
        email: '',
        password: '',
    });

    const handleStudentSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        handleSignUp(userFormData.email, userFormData.password, {
            userType: 'student',
            university: studentFormData.university,
            graduationMonth: studentFormData.graduationMonth,
            graduationYear: studentFormData.graduationYear,
            lookingFor,
            coopSchool: lookingFor.includes('coop') ? coopSchool : undefined,
            major: studentFormData.major,
            skills: studentFormData.skills.split(',').map(s => s.trim()).filter(Boolean),
        });
    };

    const handleEmployerSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        handleSignUp(userFormData.email, userFormData.password, {
            userType: 'employer',
            companyName: employerFormData.companyName,
            contactInfo: {
                phone: employerFormData.phone,
                website: employerFormData.website,
                address: employerFormData.address,
            },
            availableForEvents: employerFormData.availableForEvents,
            sponsor: employerFormData.sponsor,
            specialNotes: employerFormData.specialNotes,
        });
    };

    const handleAdminSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        handleSignUp(userFormData.email, userFormData.password, {
            userType: 'admin',
        });
    };

    const handleSuperAdminSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        handleSignUp(userFormData.email, userFormData.password, {
            userType: 'super-admin',
        });
    };

    const toggleLookingFor = (type: 'internship' | 'coop' | 'new-grad') => {
        setLookingFor(prev =>
        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    };

    const userTypes: { type: UserType; label: string; icon: any; description: string }[] = [
        { type: 'student', label: 'Student', icon: GraduationCap, description: 'Find internships and jobs' },
        { type: 'employer', label: 'Employer', icon: Building2, description: 'Recruit top talent' },
        { type: 'admin', label: 'Admin', icon: Shield, description: 'Manage platform' },
        { type: 'super-admin', label: 'Super Admin', icon: Crown, description: 'Full access' },
    ];
    

    return (
        <div>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
                <div className="w-full max-w-2xl">
                    <div className="text-center mb-8">
                    <h1 className="text-3xl mb-2">Welcome to CanWorks</h1>
                    <p className="text-gray-600">Select your account type to get started</p>
                    </div>

                    {/* User Type Selector */}
                    <div className="mb-6">
                    <Label className="text-sm text-gray-600 mb-3 block">Account Type (Debug Mode)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {userTypes.map((type) => (
                        <Card
                            key={type.type}
                            className={`cursor-pointer transition-all ${
                            userType === type.type
                                ? 'ring-2 ring-blue-600 bg-blue-50'
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() => setUserType(type.type)}
                        >
                            <CardContent className="p-4 text-center">
                            <type.icon className={`w-8 h-8 mx-auto mb-2 ${
                                userType === type.type ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                            <div className="text-sm mb-1">{type.label}</div>
                            <div className="text-xs text-gray-500">{type.description}</div>
                            </CardContent>
                        </Card>
                        ))}
                    </div>
                    </div>

                    {error && (
                    <Alert className="mb-4 border-red-500 bg-red-50">
                        <AlertDescription className="text-red-700">
                        {error}
                        </AlertDescription>
                    </Alert>
                    )}

                    {/* Student Form */}
                    {userType === 'student' && (
                    <form onSubmit={handleStudentSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="text"
                                inputMode="email"
                                autoComplete="email"
                                required
                                value={userFormData.email}
                                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                                placeholder="you@university.edu"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="student-password">Password</Label>
                            <Input
                                id="student-password"
                                type="password"
                                required
                                autoComplete="new-password"
                                value={userFormData.password}
                                onChange={(e) =>
                                setUserFormData({ ...userFormData, password: e.target.value })
                                }
                                placeholder=""
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="university">University</Label>
                            <Input
                                id="university"
                                required
                                value={studentFormData.university}
                                onChange={(e) => setStudentFormData({ ...studentFormData, university: e.target.value })}
                                placeholder="e.g., MIT, Stanford"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="month">Graduation Month</Label>
                            <select
                            id="month"
                            required
                            value={studentFormData.graduationMonth}
                            onChange={(e) => setStudentFormData({ ...studentFormData, graduationMonth: e.target.value })}
                            className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                            >
                            <option value="">Select...</option>
                            {months.map(month => (
                                <option key={month} value={month}>{month}</option>
                            ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="year">Graduation Year</Label>
                            <select
                            id="year"
                            required
                            value={studentFormData.graduationYear}
                            onChange={(e) => setStudentFormData({ ...studentFormData, graduationYear: e.target.value })}
                            className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                            >
                            <option value="">Select...</option>
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                            </select>
                        </div>
                        </div>

                        <div className="space-y-2">
                        <Label htmlFor="major">Major</Label>
                        <Input
                            id="major"
                            required
                            value={studentFormData.major}
                            onChange={(e) => setStudentFormData({ ...studentFormData, major: e.target.value })}
                            placeholder="e.g., Computer Science"
                        />
                        </div>

                        <div className="space-y-3">
                        <Label>Looking For</Label>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                            <CheckBox
                                id="internship"
                                checked={lookingFor.includes('internship')}
                                onChange={() => toggleLookingFor('internship')}
                            />
                            <Label htmlFor="internship" className="cursor-pointer">Internships</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                            <CheckBox
                                id="coop"
                                checked={lookingFor.includes('coop')}
                                onChange={() => toggleLookingFor('coop')}
                            />
                            <Label htmlFor="coop" className="cursor-pointer">Co-op Programs</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                            <CheckBox
                                id="new-grad"
                                checked={lookingFor.includes('new-grad')}
                                onChange={() => toggleLookingFor('new-grad')}
                            />
                            <Label htmlFor="new-grad" className="cursor-pointer">New Grad Roles</Label>
                            </div>
                        </div>
                        </div>

                        {lookingFor.includes('coop') && (
                        <div className="space-y-2">
                            <Label htmlFor="coopSchool">Co-op Credits School</Label>
                            <Input
                            id="coopSchool"
                            value={coopSchool}
                            onChange={(e) => setCoopSchool(e.target.value)}
                            placeholder="e.g., Northeastern University"
                            />
                        </div>
                        )}

                        <div className="space-y-2">
                        <Label htmlFor="skills">Skills (comma-separated)</Label>
                        <Input
                            id="skills"
                            value={studentFormData.skills}
                            onChange={(e) => setStudentFormData({ ...studentFormData, skills: e.target.value })}
                            placeholder="e.g., React, Python, Design"
                        />
                        <p className="text-sm text-gray-500">This helps us suggest roles you might not think about</p>
                        </div>

                        <Button type="submit" className="w-full" loading={loading}>
                            Create Student Account
                        </Button>
                    </form>
                    )}

                    {/* Employer Form */}
                    {userType === 'employer' && (
                    <form onSubmit={handleEmployerSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
                        <div className="space-y-2">
                        <Label htmlFor="employer-email">Email Address</Label>
                        <Input
                            id="employer-email"
                            type="text"
                            inputMode="email"
                            autoComplete="email"
                            required
                            value={userFormData.email}
                            onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                            placeholder="recruiter@company.com"
                        />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="employer-password">Password</Label>
                            <Input
                                id="employer-password"
                                type="password"
                                required
                                autoComplete="new-password"
                                value={userFormData.password}
                                onChange={(e) =>
                                setUserFormData({ ...userFormData, password: e.target.value })
                                }
                                placeholder=""
                            />
                        </div>

                        <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                            id="companyName"
                            required
                            value={employerFormData.companyName}
                            onChange={(e) => setEmployerFormData({ ...employerFormData, companyName: e.target.value })}
                            placeholder="e.g., Tech Corp Inc."
                        />
                        </div>

                        <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={employerFormData.phone}
                            onChange={(e) => setEmployerFormData({ ...employerFormData, phone: e.target.value })}
                            placeholder="(555) 123-4567"
                        />
                        </div>

                        <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                            id="website"
                            type="url"
                            value={employerFormData.website}
                            onChange={(e) => setEmployerFormData({ ...employerFormData, website: e.target.value })}
                            placeholder="https://www.example.com"
                        />
                        </div>

                        <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                            id="address"
                            value={employerFormData.address}
                            onChange={(e) => setEmployerFormData({ ...employerFormData, address: e.target.value })}
                            placeholder="Street address, city, state, ZIP"
                            rows={2}
                        />
                        </div>

                        <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                            <Label htmlFor="availableForEvents">Available for Events</Label>
                            <p className="text-sm text-gray-500">Participate in career fairs</p>
                            </div>
                            <Switch
                            id="availableForEvents"
                            checked={employerFormData.availableForEvents}
                            onCheckedChange={(checked) => setEmployerFormData({ ...employerFormData, availableForEvents: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                            <Label htmlFor="sponsor">Sponsor</Label>
                            <p className="text-sm text-gray-500">Sponsor platform events</p>
                            </div>
                            <Switch
                            id="sponsor"
                            checked={employerFormData.sponsor}
                            onCheckedChange={(checked) => setEmployerFormData({ ...employerFormData, sponsor: checked })}
                            />
                        </div>
                        </div>

                        <div className="space-y-2">
                        <Label htmlFor="specialNotes">Special Notes</Label>
                        <Textarea
                            id="specialNotes"
                            value={employerFormData.specialNotes}
                            onChange={(e) => setEmployerFormData({ ...employerFormData, specialNotes: e.target.value })}
                            placeholder="Any special notes or requirements..."
                            rows={3}
                        />
                        </div>

                        <Button type="submit" className="w-full" loading={loading}>
                        Create Employer Account
                        </Button>
                    </form>
                    )}

                    {/* Admin Form */}
                    {userType === 'admin' && (
                    <form onSubmit={handleAdminSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
                        <div className="space-y-2">
                        <Label htmlFor="admin-email">Email Address</Label>
                        <Input
                            id="admin-email"
                            type="text"
                            inputMode="email"
                            autoComplete="email"
                            required
                            value={userFormData.email}
                            onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                            placeholder="admin@canworks.com"
                        />
                        </div>

                        <div className="space-y-2">
                        <Label htmlFor="admin-password">Password</Label>
                        <Input
                            id="admin-password"
                            type="password"
                            required
                            value={userFormData.password}
                            onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                            placeholder="Enter a strong password"
                        />
                        </div>

                        <Button type="submit" className="w-full" loading={loading}>
                        Create Admin Account
                        </Button>
                    </form>
                    )}

                    {/* Super Admin Form */}
                    {userType === 'super-admin' && (
                    <form onSubmit={handleSuperAdminSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
                        <div className="space-y-2">
                        <Label htmlFor="admin-email">Email Address</Label>
                        <Input
                            id="admin-email"
                            type="text"
                            inputMode="email"
                            autoComplete="email"
                            required
                            value={userFormData.email}
                            onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                            placeholder="admin@canworks.com"
                        />
                        </div>

                        <div className="space-y-2">
                        <Label htmlFor="admin-password">Password</Label>
                        <Input
                            id="admin-password"
                            type="password"
                            required
                            value={userFormData.password}
                            onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                            placeholder="Enter a strong password"
                        />
                        </div>

                        <Button type="submit" className="w-full" loading={loading}>
                        Create Super Admin Account
                        </Button>
                    </form>
                    )}
                    <span className="text-sm text-gray-600">
                        Already have an account?
                    </span>{' '}
                    <button
                        type="button"
                        onClick={() => router.push('/')}
                        className="text-blue-600 hover:underline text-sm"
                    >
                        Sign in
                    </button>
                </div>
            </div>
        </div>
    );
}