'use client'

import React from 'react';
// Updated imports to use the single widgets file
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/globalComponents';
import { BarChart3, Briefcase } from 'lucide-react';
import AdminReports from '@/app/admin-dashboard/reports';
import AdminJobManagement from '@/app/admin-dashboard/jobManagement';

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl mb-2 font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of platform performance and job data management.</p>
        </div>

        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Job Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
            <AdminReports />
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
            <AdminJobManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}