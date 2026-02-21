'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input } from '@/app/components/globalComponents';
import { Search, MapPin, Building2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

interface JobPosting {
    id: number;
    title: string;
    employer: string;
    posting_date: string | null;
    application_deadline: string | null;
    link_to_posting: string | null;
    mode: string | null;
    job_type: string | null;
    province: string | null;
    city: string | null;
    target_audience: string | null;
    description: string | null;
}

export default function JobListings() {
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const pageSize = 10;

    const [expandedJob, setExpandedJob] = useState<number | null>(null); // store the id of the currently expanded job

    // fetch jobs reruns every time a page loads
    useEffect(() => {
        fetchJobs();
    }, [page]);

    const fetchJobs = () => {
        let url = `http://127.0.0.1:8000/api/jobs?page=${page}&page_size=${pageSize}`;
        if (search) {
            url += `&search=${encodeURIComponent(search)}`; // to prevent if user includes special characters in the query
        }
        axios.get(url).then(
            response => {
                setJobs(response.data.jobs);
                setTotal(response.data.total);
            }
        ).catch(
            error => console.error("Failed to fetch jobs", error)
        );
    };

    const handleSearch = () => {
        setPage(1);
        fetchJobs();
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="space-y-6">
            <div className="flex gap-2">
                <Input 
                    placeholder="Search jobs by title, employer, or description..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        handleSearch();
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                />
                <Button onClick={handleSearch}>
                    <Search className="w-4 h-4 mr-2"/>Search
                </Button>
            </div>
            <p className="text-sm text-gray-500">{total} jobs found</p>
            
            <div className="space-y-4">
                {jobs.map((job) => (
                    <Card
                        key={job.id}
                        className="hover:shadow-md transition-shadow"
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-lg">
                                        {job.title}
                                    </CardTitle>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                                        <Building2 className="w-4 h-4"/>
                                        <span>{job.employer}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {job.job_type && <Badge>{job.job_type}</Badge>}
                                    {job.mode && <Badge className="bg-blue-100 text-blue-800">{job.mode}</Badge>}
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                {(job.city || job.province) && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3"/>
                                        {[job.city, job.province].filter(Boolean).join(', ')}
                                    </span>
                                )}
                                {job.application_deadline && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3"/>
                                        Deadline: {job.application_deadline}
                                    </span>
                                )}
                            </div>
                            {job.description && (
                                <p className={`text-sm text-gray-600 ${expandedJob === job.id ? '' : 'line-clamp-2'}`}>
                                    {job.description}
                                </p>
                            )}
                            <div className="flex justify-between items-center mt-2">
                                {job.description ? (
                                    <button
                                        onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        {expandedJob === job.id ? 'Show less' : 'Show more'}
                                    </button>
                                ) : <span />} {/* add <span/> as a fallback in case of no job description so that the link to posting can still be in the bottom right corner*/}
                                
                                <a
                                    href={job.link_to_posting}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    View Posting
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p - 1)}
                        disabled={page <= 1}
                    >
                        <ChevronLeft className="w-4 h-4"/> Previous
                    </Button>
                    <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= totalPages}
                    >
                        Next <ChevronRight className="w-4 h-4"/>
                    </Button>
                </div>
            )}
        </div>
    );
}