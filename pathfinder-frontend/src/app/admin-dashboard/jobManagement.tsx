'use client'

import React, { useState, useEffect } from 'react';
// Updated imports to use the single widgets file
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, Badge, Tabs, TabsContent, TabsList, TabsTrigger, Alert, AlertDescription } from '@/app/components/globalComponents';
import { Upload, RefreshCw, FileSpreadsheet, Server, CheckCircle2, AlertCircle, Plus, ExternalLink, Search, MapPin, ChevronLeft, ChevronRight, Trash2, Briefcase } from 'lucide-react';
import JobDetailsSidebar from '@/app/components/JobDetailsSidebar';
import type { Job, JobSkill } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import fastAxiosInstance from '@/axiosConfig/axiosfig';

interface JobSource {
  id: string;
  name: string;
  url: string;
  lastPull: Date;
  jobCount: number;
  status: 'active' | 'error' | 'pending';
}


export default function AdminJobManagement({ onJobDeleted }: { onJobDeleted?: () => void } = {}) {
  // Browse Jobs state
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [browsePage, setBrowsePage] = useState(1);
  const browsePageSize = 10;
  const [browseKeyword, setBrowseKeyword] = useState('');
  const [browseUploadedBy, setBrowseUploadedBy] = useState<'all' | 'admin' | 'employer'>('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  useEffect(() => {
    fastAxiosInstance.get('/api/jobs', { params: { page: 1, page_size: 100 } })
      .then(res => { setAllJobs(res.data.jobs || []); setJobsLoading(false); })
      .catch(() => setJobsLoading(false));
  }, []);

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) return;
    setDeletingJobId(jobId);
    try {
      await fastAxiosInstance.delete(`/api/admin/jobs/${jobId}`);
      setAllJobs(prev => prev.filter(j => j.id !== jobId));
      onJobDeleted?.();
    } catch (err) {
      console.error('Failed to delete job', err);
    } finally {
      setDeletingJobId(null);
    }
  };

  // Browse Jobs filtering + pagination
  const filteredBrowseJobs = allJobs
    .filter(job => {
      if (browseUploadedBy !== 'all' && job.uploaded_by !== browseUploadedBy) return false;
      if (browseKeyword) {
        const kw = browseKeyword.toLowerCase();
        const text = `${job.title} ${job.employer || ''} ${job.description || ''}`.toLowerCase();
        if (!text.includes(kw)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

  const browseTotalJobs = filteredBrowseJobs.length;
  const browseTotalPages = Math.ceil(browseTotalJobs / browsePageSize);
  const browsePaginatedJobs = filteredBrowseJobs.slice((browsePage - 1) * browsePageSize, browsePage * browsePageSize);

  useEffect(() => { setBrowsePage(1); }, [browseKeyword, browseUploadedBy]);

  // Upload state
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<{jobs_added: number; jobs_skipped: number; errors: string[]} | null>(null); // store response from backend to indicate how many jobs were added, skipped

  const [sources, setSources] = useState<JobSource[]>([
    { id: '1', name: 'LinkedIn Jobs API', url: 'https://api.linkedin.com/jobs', lastPull: new Date('2026-01-27T08:00:00'), jobCount: 234, status: 'active' },
    { id: '2', name: 'Indeed Scraper', url: 'https://indeed.com/jobs', lastPull: new Date('2026-01-27T07:30:00'), jobCount: 189, status: 'active' },
    { id: '3', name: 'Wellfound API', url: 'https://api.wellfound.com/v1/jobs', lastPull: new Date('2026-01-27T06:00:00'), jobCount: 67, status: 'active' },
    { id: '4', name: 'Company Website Crawler', url: 'https://crawler.canworks.com', lastPull: new Date('2026-01-26T22:00:00'), jobCount: 145, status: 'error' },
  ]);
  const [repullingSources, setRepullingSources] = useState<Set<string>>(new Set());

  // Actions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus('idle');
    }
  };

  // async await function because must wait for server to respond 
  const handleUploadViaUI = async () => {
    if (!selectedFile) return;
    setUploadStatus('uploading');
    setUploadResult(null);

    try {
      // FormData is browser's built-in way to send files over HTTP
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fastAxiosInstance.post('/api/upload-jobs', formData, {
        timeout: 60000 // 1 minute for file upload with AI processing
      }); 
      setUploadResult(response.data);
      setUploadStatus('success');
    } catch (error) {
      setUploadStatus('error');
    }
  };

  const handleSFTPUpload = () => {
    setUploadStatus('uploading');
    setTimeout(() => {
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }, 3000);
  };

  const handleRepull = (sourceId: string) => {
    setRepullingSources(prev => new Set(prev).add(sourceId));
    setTimeout(() => {
      setSources(prev => prev.map(source => source.id === sourceId ? { ...source, lastPull: new Date(), status: 'active' as const } : source));
      setRepullingSources(prev => {
        const next = new Set(prev);
        next.delete(sourceId);
        return next;
      });
    }, 2000);
  };

  // Helpers
  const formatDateTime = (date: Date) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);

  const getStatusBadge = (status: JobSource['status']) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'error': return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  return (
    <Tabs defaultValue="browse" className="space-y-6">
      {/* Updated TabsList to be cleaner without grid constraints */}
      <TabsList className="mb-6">
        <TabsTrigger value="browse" className="flex items-center gap-2"><Briefcase className="w-4 h-4" />Browse Jobs</TabsTrigger>
        <TabsTrigger value="upload" className="flex items-center gap-2"><Upload className="w-4 h-4" />Upload Jobs</TabsTrigger>
        <TabsTrigger value="sources" className="flex items-center gap-2"><Server className="w-4 h-4" />Job Sources</TabsTrigger>
      </TabsList>

      <TabsContent value="browse" className="space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by title, employer, or description..."
              value={browseKeyword}
              onChange={(e) => setBrowseKeyword(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={browseUploadedBy}
            onChange={(e) => setBrowseUploadedBy(e.target.value as 'all' | 'admin' | 'employer')}
            className="h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
          >
            <option value="all">All Sources</option>
            <option value="admin">Admin Uploaded</option>
            <option value="employer">Employer Posted</option>
          </select>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {browseTotalJobs} Job{browseTotalJobs !== 1 ? 's' : ''} on Platform
          </h3>
          {browseTotalPages > 1 && (
            <p className="text-sm text-gray-500">
              Showing {(browsePage - 1) * browsePageSize + 1}–{Math.min(browsePage * browsePageSize, browseTotalJobs)} of {browseTotalJobs}
            </p>
          )}
        </div>

        {/* Job List */}
        {jobsLoading ? (
          <p className="text-center text-gray-500 py-8">Loading jobs...</p>
        ) : browseTotalJobs === 0 ? (
          <Card className="p-12 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg mb-2">No jobs found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {browsePaginatedJobs.map(job => (
              <Card key={job.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedJob(job)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium">{job.title}</h3>
                        <Badge className={job.uploaded_by === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}>
                          {job.uploaded_by === 'admin' ? 'Admin' : 'Employer'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-600">{job.employer || 'No employer specified'}</p>
                        {job.employer_website && (
                          <a
                            href={job.employer_website.startsWith('http') ? job.employer_website : `https://${job.employer_website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 text-sm hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Website
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {(() => {
                        const city = job.city && job.city.toLowerCase() !== 'not specified' ? job.city : null;
                        const prov = job.province && job.province.toLowerCase() !== 'not specified' ? job.province : null;
                        return city && prov ? `${city}, ${prov}` : city || prov || 'Remote';
                      })()}
                    </div>

                    <p className="text-sm text-gray-700 line-clamp-2">{job.description}</p>

                    <div className="flex flex-wrap gap-2">
                      {job.employment_type && (
                        <Badge className="bg-gray-100 text-gray-700">{job.employment_type}</Badge>
                      )}
                      {job.skills?.slice(0, 3).map((s: JobSkill, i: number) => (
                        <Badge key={`${job.id}-${s.skill_name}-${i}`} variant="outline">{s.skill_name}</Badge>
                      ))}
                      {job.skills && job.skills.length > 3 && (
                        <Badge variant="outline">+{job.skills.length - 3} more</Badge>
                      )}
                    </div>

                    <div className="text-xs text-gray-500">
                      {job.created_at && <span>Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-red-600 border-red-200 hover:bg-red-50"
                    disabled={deletingJobId === job.id}
                    onClick={(e) => { e.stopPropagation(); handleDeleteJob(job.id); }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    {deletingJobId === job.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {browseTotalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBrowsePage(p => Math.max(1, p - 1))}
              disabled={browsePage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {Array.from({ length: browseTotalPages }, (_, i) => i + 1).map(p => (
              <Button
                key={p}
                variant={p === browsePage ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBrowsePage(p)}
                className="min-w-9"
              >
                {p}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setBrowsePage(p => Math.min(browseTotalPages, p + 1))}
              disabled={browsePage === browseTotalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        <JobDetailsSidebar job={selectedJob} onClose={() => setSelectedJob(null)} />
      </TabsContent>

      <TabsContent value="upload" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="w-5 h-5" />Upload Spreadsheet</CardTitle>
            <CardDescription>Upload a CSV or Excel file containing job postings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Select File</Label>
              <Input id="file-upload" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} className="mt-2" />
              {selectedFile && <p className="text-sm text-gray-600 mt-2">Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)</p>}
            </div>

            {uploadStatus === 'success' && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Upload complete! {uploadResult?.jobs_added} jobs added,
                  {uploadResult?.jobs_skipped} jobs skipped.
                  {uploadResult?.errors && uploadResult.errors.length > 0 && (
                    <span>{uploadResult.errors.length} rows had errors.</span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {uploadStatus === 'error' && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">Upload failed. Please check the file format and try again.</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleUploadViaUI} disabled={!selectedFile || uploadStatus === 'uploading'} className="w-full">
              {uploadStatus === 'uploading' ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Uploading...</> : <><Upload className="w-4 h-4 mr-2" />Upload File</>}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="sources" className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Job Data Sources</CardTitle>
                <CardDescription className="mt-2">Manage and refresh job data from external sources</CardDescription>
              </div>
              <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" />Add Source</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sources.map((source) => (
                <div key={source.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{source.name}</h3>
                        {getStatusBadge(source.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <ExternalLink className="w-3 h-3" />
                        <span className="break-all">{source.url}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Last pull: {formatDateTime(source.lastPull)}</span>
                        <span>•</span>
                        <span>{source.jobCount} jobs collected</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => handleRepull(source.id)} disabled={repullingSources.has(source.id)}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${repullingSources.has(source.id) ? 'animate-spin' : ''}`} />
                        {repullingSources.has(source.id) ? 'Pulling...' : 'Repull'}
                      </Button>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

    </Tabs>
  );
}