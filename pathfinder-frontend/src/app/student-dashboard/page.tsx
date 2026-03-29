'use client'

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/globalComponents';
import { Header } from '@/app/components/header'
import { BarChart3, Briefcase, FileText, Mail } from 'lucide-react';
import { HomePage } from './HomePage';
import { ExplorePage } from './ExplorePage';
import { CareerInsightsPage } from './CareerInsightsPage';
import { ProfilePage } from './ProfilePage';
import { MyApplicationsPage } from './MyApplicationsPage';
import { OutreachPage } from './OutreachPage';
import { EmailDraftsPage } from './EmailDraftsPage';
import { UserProvider, CheckUser } from '@/app/components/authComponents';
import fastAxiosInstance from '@/axiosConfig/axiosfig';
import type { Job } from '@/types';

export default function StudentDashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 py-8 text-center text-gray-500">Loading...</div>}>
            <StudentDashboardContent />
        </Suspense>
    );
}

function StudentDashboardContent() {
    const searchParams = useSearchParams();
    const tabFromUrl = searchParams.get('tab') || 'home';
    const [jobs, setJobs] = useState<Job[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [recommended, setRecommended] = useState<Job[]>([]);
    const [activeTab, setActiveTab] = useState(tabFromUrl);
    const [sharedSelectedJob, setSharedSelectedJob] = useState<Job | null>(null);

    useEffect(() => {
        setActiveTab(tabFromUrl);
    }, [tabFromUrl]);

    useEffect(() => {
        fetchJobs();
        fetchRecommendations();
        fastAxiosInstance.post('/api/track-visit').catch(() => {});
    }, []);

    // Re-fetch recommendations when switching back to home tab (picks up profile changes)
    useEffect(() => {
        if (activeTab === 'home') {
            fetchRecommendations();
        }
    }, [activeTab]);

    const fetchJobs = () => {
        let url = `/api/jobs?page=${1}&page_size=${10}`;

        fastAxiosInstance.get(url).then(
            response => {
                setJobs(response.data.jobs);
                setTotal(response.data.total);
            }
        ).catch(
            error => console.error("Failed to fetch jobs", error)
        );
    };

    const fetchRecommendations = async () => {
        try {
            const res = await fastAxiosInstance.get('/api/recommendations?k=4');
            const recs: Job[] = res.data.jobs || [];
            setRecommended(recs);
        } catch (error) {
            console.error('Failed to fetch recommendations', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <UserProvider userType={"student"}>
                <CheckUser requireUser={true}>
                    <div className="max-w-7xl mx-auto px-4">
                        <Header
                            title={"Dashboard"}
                        >
                        </Header>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="mb-6">
                            <TabsTrigger value="home" className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Home
                            </TabsTrigger>
                            <TabsTrigger value="explore" className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Explore
                            </TabsTrigger>
                            <TabsTrigger value="career" className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Career Insights
                            </TabsTrigger>
                            <TabsTrigger value="applications" className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            My Applications
                            </TabsTrigger>
                            <TabsTrigger value="profile" className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Profile
                            </TabsTrigger>
                            <TabsTrigger value="outreach" className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Outreach
                            </TabsTrigger>
                            <TabsTrigger value="email-drafts" className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Email Drafts
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="home" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                            <HomePage totalJobs={total} recommendedJobs={recommended} onSwitchTab={setActiveTab} onViewJobInExplore={(job) => { setSharedSelectedJob(job); setActiveTab('explore'); }}>
                            </HomePage>
                        </TabsContent>

                        <TabsContent value="explore" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                                <ExplorePage jobs={jobs} total={total} initialSelectedJob={sharedSelectedJob} onConsumeSelectedJob={() => setSharedSelectedJob(null)}>
                                </ExplorePage>
                        </TabsContent>

                        <TabsContent value="career" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                                <CareerInsightsPage>
                                </CareerInsightsPage>
                        </TabsContent>

                        <TabsContent value="applications" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                                <MyApplicationsPage />
                        </TabsContent>

                        <TabsContent value="profile" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                                <ProfilePage>
                                </ProfilePage>
                        </TabsContent>

                        <TabsContent value="outreach" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                                <OutreachPage />
                        </TabsContent>

                        <TabsContent value="email-drafts" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                                <EmailDraftsPage />
                        </TabsContent>
                        </Tabs>
                    </div>
                </CheckUser>
            </UserProvider>
        </div>
    );
}