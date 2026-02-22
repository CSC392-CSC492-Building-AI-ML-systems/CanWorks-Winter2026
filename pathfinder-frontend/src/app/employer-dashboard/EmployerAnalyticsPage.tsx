import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger, Badge, Button } from '@/app/components/globalComponents';
import { BarChart3, Users, UserCheck, TrendingUp, Calendar, Eye, Download } from 'lucide-react';

interface Application {
  id: string;
  studentName: string;
  position: string;
  appliedDate: string;
  status: 'pending' | 'reviewing' | 'interview' | 'offer' | 'rejected' | 'hired';
  university: string;
}

export function EmployerAnalyticsPage() {
    const [applications, setApplications] = useState<Application[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('employerApplications');
        if (stored) {
        setApplications(JSON.parse(stored));
        } else {
        const mockApplications: Application[] = [
            {
            id: '1',
            studentName: 'Sarah Johnson',
            position: 'Software Engineering Intern',
            appliedDate: '2026-01-20',
            status: 'interview',
            university: 'MIT',
            },
            {
            id: '2',
            studentName: 'Michael Chen',
            position: 'Product Manager Intern',
            appliedDate: '2026-01-19',
            status: 'reviewing',
            university: 'Stanford',
            },
            {
            id: '3',
            studentName: 'Emily Rodriguez',
            position: 'Data Analyst Intern',
            appliedDate: '2026-01-18',
            status: 'offer',
            university: 'UC Berkeley',
            },
            {
            id: '4',
            studentName: 'David Kim',
            position: 'Software Engineering Intern',
            appliedDate: '2026-01-17',
            status: 'hired',
            university: 'Carnegie Mellon',
            },
            {
            id: '5',
            studentName: 'Jessica Williams',
            position: 'UX Design Intern',
            appliedDate: '2026-01-15',
            status: 'hired',
            university: 'RISD',
            },
        ];
        setApplications(mockApplications);
        localStorage.setItem('employerApplications', JSON.stringify(mockApplications));
        }
    }, []);

    const stats = {
        totalApplications: applications.length,
        pendingReview: applications.filter(a => a.status === 'pending' || a.status === 'reviewing').length,
        interviews: applications.filter(a => a.status === 'interview').length,
        offers: applications.filter(a => a.status === 'offer').length,
        hired: applications.filter(a => a.status === 'hired').length,
        hiredFromCanWorks: applications.filter(a => a.status === 'hired').length,
        profileViews: 247,
        jobPostViews: 1849,
    };

    const getStatusColor = (status: Application['status']) => {
        const colors = {
        pending: 'bg-gray-100 text-gray-700',
        reviewing: 'bg-blue-100 text-blue-700',
        interview: 'bg-purple-100 text-purple-700',
        offer: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
        hired: 'bg-emerald-100 text-emerald-700',
        };
        return colors[status];
    };

    const getStatusLabel = (status: Application['status']) => {
        const labels = {
        pending: 'Pending',
        reviewing: 'Reviewing',
        interview: 'Interview',
        offer: 'Offer Extended',
        rejected: 'Rejected',
        hired: 'Hired',
        };
        return labels[status];
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
            <div className="mb-6">
            <h1 className="text-2xl mb-2">Analytics & Applications</h1>
            <p className="text-gray-600">Track your hiring metrics and manage applications</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Total Applications</CardTitle>
                <Users className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl">{stats.totalApplications}</div>
                <p className="text-xs text-gray-500 mt-1">All time</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Active Interviews</CardTitle>
                <Calendar className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl">{stats.interviews}</div>
                <p className="text-xs text-gray-500 mt-1">In progress</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Hired from CanWorks</CardTitle>
                <UserCheck className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl">{stats.hiredFromCanWorks}</div>
                <p className="text-xs text-gray-500 mt-1">+2 from last month</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Profile Views</CardTitle>
                <Eye className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl">{stats.profileViews}</div>
                <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                </CardContent>
            </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="applications" className="space-y-4">
            <TabsList>
                <TabsTrigger value="applications">Applications</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="applications" className="space-y-4">
                <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Recent Applications</CardTitle>
                        <CardDescription>Manage and track candidate applications</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                    {applications.map((application) => (
                        <div
                        key={application.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-medium">{application.studentName}</h3>
                            <Badge variant="secondary" className="text-xs">
                                {application.university}
                            </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{application.position}</p>
                            <p className="text-xs text-gray-500 mt-1">
                            Applied on {new Date(application.appliedDate).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(application.status)}>
                            {getStatusLabel(application.status)}
                            </Badge>
                            <Button variant="ghost" size="sm">View</Button>
                        </div>
                        </div>
                    ))}
                    </div>
                </CardContent>
                </Card>

                {/* Application Pipeline */}
                <Card>
                <CardHeader>
                    <CardTitle>Application Pipeline</CardTitle>
                    <CardDescription>Overview of applications by stage</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl mb-1">{stats.pendingReview}</div>
                        <div className="text-sm text-gray-600">Pending Review</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl mb-1">{stats.interviews}</div>
                        <div className="text-sm text-gray-600">Interviews</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl mb-1">{stats.offers}</div>
                        <div className="text-sm text-gray-600">Offers Extended</div>
                    </div>
                    </div>
                </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                    <CardTitle>Hiring Metrics</CardTitle>
                    <CardDescription>Key performance indicators</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Time to Hire (avg)</span>
                        <span className="font-medium">21 days</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Offer Acceptance Rate</span>
                        <span className="font-medium">85%</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Applications per Position</span>
                        <span className="font-medium">24</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Interview to Hire Ratio</span>
                        <span className="font-medium">1:3</span>
                    </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                    <CardTitle>Engagement Stats</CardTitle>
                    <CardDescription>Platform engagement metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Job Post Views</span>
                        <span className="font-medium">{stats.jobPostViews}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Profile Views</span>
                        <span className="font-medium">{stats.profileViews}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Application Rate</span>
                        <span className="font-medium">13.4%</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Saves/Bookmarks</span>
                        <span className="font-medium">89</span>
                    </div>
                    </CardContent>
                </Card>
                </div>

                <Card>
                <CardHeader>
                    <CardTitle>Top Universities</CardTitle>
                    <CardDescription>Applications by university</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                    {['MIT', 'Stanford', 'UC Berkeley', 'Carnegie Mellon', 'Cornell'].map((uni, index) => (
                        <div key={uni} className="flex items-center justify-between">
                        <span className="text-sm">{uni}</span>
                        <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${100 - index * 15}%` }}
                            />
                            </div>
                            <span className="text-sm text-gray-600 w-8">{5 - index}</span>
                        </div>
                        </div>
                    ))}
                    </div>
                </CardContent>
                </Card>
            </TabsContent>
            </Tabs>
        </div>
        </div>
    );
}
