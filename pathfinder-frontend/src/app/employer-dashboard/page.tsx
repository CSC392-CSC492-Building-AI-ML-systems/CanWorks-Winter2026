'use client'

// Updated imports to use the single widgets file
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/globalComponents';
import { Header } from '@/app/components/header'
import { BarChart3, Briefcase } from 'lucide-react';
import { EmployerAnalyticsPage } from './EmployerAnalyticsPage';
import { EmployerProfilePage } from './EmployerProfilePage';
import { UserProvider, CheckUser } from '@/app/components/authComponents';

export default function EmployerDashboardPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <UserProvider userType={"employer"}>
                <CheckUser requireUser={true}>
                    <div className="max-w-7xl mx-auto px-4">
                        <Header
                            title={"Employer Dashboard"}
                        >
                        </Header>

                        <Tabs defaultValue="analytics" className="space-y-6">
                        {/* Updated TabsList to be cleaner without grid constraints */}
                        <TabsList className="mb-6">
                            <TabsTrigger value="analytics" className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Analytics
                            </TabsTrigger>
                            <TabsTrigger value="profile" className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Profile
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="analytics" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                                <EmployerAnalyticsPage>
                                </EmployerAnalyticsPage>
                        </TabsContent>

                        <TabsContent value="profile" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                                <EmployerProfilePage>
                                </EmployerProfilePage>
                        </TabsContent>
                        </Tabs>
                    </div>
                </CheckUser>
            </UserProvider>
        </div>
    );
}