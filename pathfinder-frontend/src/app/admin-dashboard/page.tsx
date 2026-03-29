'use client'

import React, { useState } from 'react';
// Updated imports to use the single widgets file
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/globalComponents';
import { UserProvider, CheckUser } from '@/app/components/authComponents';
import { BarChart3, Briefcase, Building, Users, Lightbulb } from 'lucide-react';
import { Header } from '@/app/components/header';
import AdminReports from '@/app/admin-dashboard/reports';
import AdminJobManagement from '@/app/admin-dashboard/jobManagement';
import StartupContactsManager from '@/app/admin-dashboard/StartupContactsManager';
import EmployerManagement from '@/app/admin-dashboard/employerManagement';
import CareerInsightsManagement from '@/app/admin-dashboard/careerInsightsManagement';

export default function AdminDashboardPage() {
  const [analyticsRefreshKey, setAnalyticsRefreshKey] = useState(0);

  return (
    <UserProvider userType={"admin"}>
        <CheckUser requireUser={true}>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4">
                    <Header title="Admin Dashboard" />
                    <p className="text-gray-600 mb-6">Overview of platform performance and job data management.</p>

                    <Tabs defaultValue="reports" className="space-y-6">
                    {/* Updated TabsList to be cleaner without grid constraints */}
                    <TabsList className="mb-6">
                        <TabsTrigger value="reports" className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Reports
                        </TabsTrigger>
                        <TabsTrigger value="jobs" className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Job Management
                        </TabsTrigger>
                        <TabsTrigger value="employers" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Employer Management
                        </TabsTrigger>
                        <TabsTrigger value="insights" className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Career Insights
                        </TabsTrigger>
                        <TabsTrigger value="startups" className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Startup Contacts
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="reports" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                        <AdminReports refreshKey={analyticsRefreshKey} />
                    </TabsContent>

                    <TabsContent value="jobs" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                        <AdminJobManagement onJobDeleted={() => setAnalyticsRefreshKey(k => k + 1)} />
                    </TabsContent>

                    <TabsContent value="employers" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                        <EmployerManagement />
                    </TabsContent>

                    <TabsContent value="insights" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                        <CareerInsightsManagement />
                    </TabsContent>

                    <TabsContent value="startups" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                        <StartupContactsManager />
                    </TabsContent>
                    </Tabs>
                </div>
            </div>
        </CheckUser>
    </UserProvider>
  );
}