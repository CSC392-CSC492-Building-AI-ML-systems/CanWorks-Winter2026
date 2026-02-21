'use client'

import React from 'react';
// Updated imports to use the single widgets file
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/globalComponents';
import { BarChart3, Briefcase } from 'lucide-react';
import AdminReports from '@/app/admin-dashboard/reports';
import JobListings from './jobs';
import StudentDashboardPage from './home';

export default function StudentDashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl mb-2 font-bold tracking-tight">Student Dashboard</h1>
        </div>

        <Tabs defaultValue="home" className="space-y-6">
          {/* Updated TabsList to be cleaner without grid constraints */}
          <TabsList className="mb-6">
            <TabsTrigger value="home" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Home
            </TabsTrigger>
            <TabsTrigger value="explore" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Explore
            </TabsTrigger>
            <TabsTrigger value="career-insights" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Career Insights
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
            <StudentDashboardPage />
          </TabsContent>

          <TabsContent value="explore" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
            <JobListings />
          </TabsContent>
           <TabsContent value="career-insights" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
            <AdminReports />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}