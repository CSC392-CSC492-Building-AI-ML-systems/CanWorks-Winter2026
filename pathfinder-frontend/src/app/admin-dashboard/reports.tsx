'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button } from '@/app/components/globalComponents';
import { AlertTriangle, TrendingUp, ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DeadLink {
  jobId: string;
  jobTitle: string;
  company: string;
  url: string;
  lastChecked: Date;
  statusCode: number;
  datePosted: Date;
}

interface CategoryStats {
  category: string;
  totalJobs: number;
  totalViews: number;
  totalApplies: number;
  applyRate: number;
}

export default function AdminReports() {
  const [isCheckingLinks, setIsCheckingLinks] = useState(false);
  const [lastLinkCheck, setLastLinkCheck] = useState(new Date('2026-01-27T10:30:00'));
  
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Mock Data
  const deadLinks: DeadLink[] = [
    { jobId: '8', jobTitle: 'DevOps Intern', company: 'InfraTech', url: 'https://infratech.com/careers', lastChecked: new Date('2026-01-27T10:30:00'), statusCode: 404, datePosted: new Date('2026-01-17') },
    { jobId: '12', jobTitle: 'Marketing Analyst Co-op', company: 'BrandFlow', url: 'https://brandflow.com/jobs/analyst', lastChecked: new Date('2026-01-27T10:30:00'), statusCode: 403, datePosted: new Date('2026-01-15') },
    { jobId: '19', jobTitle: 'UX Research Intern', company: 'UserFirst', url: 'https://userfirst.io/careers/ux-intern', lastChecked: new Date('2026-01-27T10:30:00'), statusCode: 500, datePosted: new Date('2026-01-10') },
  ];

  const categoryStats: CategoryStats[] = [
    { category: 'Software Engineering', totalJobs: 145, totalViews: 12450, totalApplies: 3890, applyRate: 31.2 },
    { category: 'Data Science', totalJobs: 89, totalViews: 8920, totalApplies: 2945, applyRate: 33.0 },
    { category: 'Product Design', totalJobs: 67, totalViews: 5630, totalApplies: 2034, applyRate: 36.1 },
    { category: 'Product Management', totalJobs: 52, totalViews: 4890, totalApplies: 1823, applyRate: 37.3 },
    { category: 'Business Analytics', totalJobs: 78, totalViews: 6240, totalApplies: 1810, applyRate: 29.0 },
    { category: 'Marketing', totalJobs: 95, totalViews: 7120, totalApplies: 1895, applyRate: 26.6 },
    { category: 'Finance', totalJobs: 61, totalViews: 4580, totalApplies: 1465, applyRate: 32.0 },
    { category: 'Mechanical Engineering', totalJobs: 43, totalViews: 3210, totalApplies: 865, applyRate: 26.9 },
  ];

  const topCategories = [...categoryStats]
    .sort((a, b) => b.applyRate - a.applyRate)
    .slice(0, 6);

  const handleCheckLinks = () => {
    setIsCheckingLinks(true);
    setTimeout(() => {
      setIsCheckingLinks(false);
      setLastLinkCheck(new Date());
    }, 2000);
  };

  const getStatusBadgeColor = (statusCode: number) => {
    if (statusCode === 404) return 'bg-red-100 text-red-800';
    if (statusCode === 403) return 'bg-orange-100 text-orange-800';
    if (statusCode >= 500) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: Date) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  const formatDateTime = (date: Date) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);

  // Custom Tick Component for precise control
  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="end"
          fill="#666"
          transform="rotate(-45)"
          fontSize={12}
        >
          {payload.value}
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-6">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Job Postings</CardDescription>
              <CardTitle className="text-3xl">630</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>+12% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Dead Links Detected</CardDescription>
              <CardTitle className="text-3xl text-red-600">{deadLinks.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertTriangle className="w-4 h-4" />
                <span>Requires immediate attention</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Average Apply Rate</CardDescription>
              <CardTitle className="text-3xl">31.2%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>+2.3% from last week</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Dead Links
                </CardTitle>
                <CardDescription className="mt-2">
                  Job postings with broken or inaccessible URLs
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  Last checked: {isMounted ? formatDateTime(lastLinkCheck) : 'Loading...'}
                </span>
                <Button
                  onClick={handleCheckLinks}
                  disabled={isCheckingLinks}
                  size="sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isCheckingLinks ? 'animate-spin' : ''}`} />
                  {isCheckingLinks ? 'Checking...' : 'Check All Links'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {deadLinks.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <p className="text-gray-600">No dead links detected. All job postings are accessible!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deadLinks.map((link) => (
                  <div key={link.jobId} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{link.jobTitle}</h3>
                          <Badge className={getStatusBadgeColor(link.statusCode)}>
                            {link.statusCode === 404 ? 'Not Found' : link.statusCode === 403 ? 'Forbidden' : 'Server Error'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{link.company}</p>
                        <p className="text-sm text-gray-500">
                          Posted: {isMounted ? formatDate(link.datePosted) : ''} • Last checked: {isMounted ? formatDateTime(link.lastChecked) : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Visit
                          </a>
                        </Button>
                        <Button variant="destructive" size="sm">Remove</Button>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-xs text-gray-600 break-all">{link.url}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Categories by Apply Rate
            </CardTitle>
            <CardDescription>
              Job categories with the highest application conversion rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 mb-8">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={topCategories} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="category" 
                      interval={0}
                      tick={<CustomXAxisTick />}
                      height={100}
                    />
                    <YAxis 
                      label={{ value: 'Apply Rate (%)', angle: -90, position: 'insideLeft', offset: 0 }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Apply Rate']}
                    />
                    <Bar 
                      dataKey="applyRate" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded text-sm text-gray-400">
                  Loading Chart...
                </div>
              )}
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Category</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-600">Jobs</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-600">Views</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-600">Applies</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-600">Apply Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryStats
                    .sort((a, b) => b.applyRate - a.applyRate)
                    .map((stat, index) => (
                      <tr key={stat.category} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{stat.category}</span>
                            {index < 3 && <Badge className="bg-blue-100 text-blue-800">Top {index + 1}</Badge>}
                          </div>
                        </td>
                        <td className="p-4 text-right text-sm">{stat.totalJobs}</td>
                        <td className="p-4 text-right text-sm">{stat.totalViews.toLocaleString()}</td>
                        <td className="p-4 text-right text-sm">{stat.totalApplies.toLocaleString()}</td>
                        <td className="p-4 text-right">
                          <span className="text-sm font-medium text-blue-600">{stat.applyRate.toFixed(1)}%</span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}