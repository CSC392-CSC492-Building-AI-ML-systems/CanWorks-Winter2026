'use client'

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, CheckBox, Badge } from '@/app/components/globalComponents';
import { Upload, FileText, Mail, ExternalLink, Loader2 } from 'lucide-react';
import { outreachApi } from './outreach-api';

interface StartupContact {
    id: string;
    contact_name: string;
    email: string;
    company_name: string;
    website: string | null;
    industry: string | null;
}

interface ResumeInfo {
    id: string;
    resume_url: string;
    resume_filename: string | null;
    uploaded_at: string | null;
}

export function OutreachPage() {
    // --- Resume state ---
    const [resume, setResume] = useState<ResumeInfo | null>(null);
    const [resumeLoading, setResumeLoading] = useState(true);
    const [resumeUploading, setResumeUploading] = useState(false);
    const [resumeError, setResumeError] = useState<string | null>(null);
    const [resumeSuccess, setResumeSuccess] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Contacts state ---
    const [contacts, setContacts] = useState<StartupContact[]>([]);
    const [contactsLoading, setContactsLoading] = useState(true);
    const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
    const [roleInterest, setRoleInterest] = useState('');
    const [generating, setGenerating] = useState(false);
    const [generateMessage, setGenerateMessage] = useState<string | null>(null);
    const [generateError, setGenerateError] = useState<string | null>(null);

    // --- Gmail state ---
    const [gmailConnected, setGmailConnected] = useState(false);
    const [gmailEmail, setGmailEmail] = useState<string | null>(null);
    const [gmailLoading, setGmailLoading] = useState(true);

    // --- Fetch resume on mount ---
    useEffect(() => {
        outreachApi.getResume()
            .then(res => {
                setResume(res.data);
            })
            .catch(err => {
                if (err.response?.status === 404) {
                    setResume(null);
                } else {
                    setResumeError('Failed to load resume information.');
                }
            })
            .finally(() => setResumeLoading(false));
    }, []);

    // --- Fetch contacts on mount ---
    useEffect(() => {
        outreachApi.listContacts()
            .then(res => {
                setContacts(res.data.contacts || res.data || []);
            })
            .catch(() => {
                setContacts([]);
            })
            .finally(() => setContactsLoading(false));
    }, []);

    // --- Fetch Gmail status on mount ---
    useEffect(() => {
        outreachApi.getGmailStatus()
            .then(res => {
                setGmailConnected(res.data.connected === true);
                setGmailEmail(res.data.email || null);
            })
            .catch(() => {
                setGmailConnected(false);
                setGmailEmail(null);
            })
            .finally(() => setGmailLoading(false));
    }, []);

    // --- Resume handlers ---
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setResumeUploading(true);
        setResumeError(null);
        setResumeSuccess(null);

        const formData = new FormData();
        formData.append('resume', file);

        try {
            const res = await outreachApi.uploadResume(formData);
            setResume(res.data);
            setResumeSuccess('Resume uploaded successfully!');
        } catch {
            setResumeError('Failed to upload resume. Please try again.');
        } finally {
            setResumeUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // --- Contact selection handlers ---
    const toggleContact = (id: string) => {
        setSelectedContactIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // --- Generate drafts handler ---
    const handleGenerateDrafts = async () => {
        setGenerating(true);
        setGenerateMessage(null);
        setGenerateError(null);

        try {
            const res = await outreachApi.generateDrafts({
                startup_contact_ids: Array.from(selectedContactIds),
                role_interest: roleInterest,
            });
            const drafts = Array.isArray(res.data) ? res.data : res.data.drafts || [];
            const count = drafts.length;
            setGenerateMessage(`Successfully generated ${count} email draft(s)!`);
            setSelectedContactIds(new Set());
            setRoleInterest('');
        } catch {
            setGenerateError('Failed to generate email drafts. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    // --- Gmail connect handler ---
    const handleConnectGmail = async () => {
        try {
            const res = await outreachApi.getGmailAuthUrl();
            const url = res.data.url || res.data.auth_url;
            if (url) {
                window.location.href = url;
            }
        } catch {
            // silently fail
        }
    };

    const canGenerate = selectedContactIds.size > 0 && roleInterest.trim().length > 0 && !generating && gmailConnected;

    return (
        <div className="space-y-6">
            {/* Section A - Your Resume */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Your Resume
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {resumeLoading ? (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading resume info...
                        </div>
                    ) : resume ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-slate-600" />
                                <div>
                                    <p className="text-sm font-medium">{resume.resume_filename || 'Resume'}</p>
                                    {resume.uploaded_at && (
                                        <p className="text-xs text-slate-500">
                                            Uploaded: {new Date(resume.uploaded_at).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={resumeUploading}
                            >
                                {resumeUploading ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                                ) : (
                                    <><Upload className="w-4 h-4 mr-2" /> Replace</>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-500">
                                No resume uploaded yet. Upload your resume (PDF) to get started with outreach.
                            </p>
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={resumeUploading}
                            >
                                {resumeUploading ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                                ) : (
                                    <><Upload className="w-4 h-4 mr-2" /> Upload Resume</>
                                )}
                            </Button>
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={handleFileSelect}
                    />

                    {resumeSuccess && (
                        <p className="mt-3 text-sm text-green-600">{resumeSuccess}</p>
                    )}
                    {resumeError && (
                        <p className="mt-3 text-sm text-red-600">{resumeError}</p>
                    )}
                </CardContent>
            </Card>

            {/* Section B - Gmail Connection */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Gmail Connection
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {gmailLoading ? (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Checking Gmail status...
                        </div>
                    ) : gmailConnected ? (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm font-medium text-green-800">
                                Email connected: {gmailEmail || 'Gmail account'}
                            </p>
                            <p className="text-xs text-green-600 mt-1">Ready to send outreach emails.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-500">
                                Connect your Gmail account to send outreach emails directly from the platform.
                            </p>
                            <Button onClick={handleConnectGmail}>
                                <Mail className="w-4 h-4 mr-2" />
                                Connect Gmail
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Section C - Startup Companies */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Browse Startup Companies
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {contactsLoading ? (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading contacts...
                        </div>
                    ) : contacts.length === 0 ? (
                        <p className="text-sm text-slate-500">No startup contacts available at this time.</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2 px-2 w-10">Select</th>
                                            <th className="text-left py-2 px-2">Company</th>
                                            <th className="text-left py-2 px-2">Contact</th>
                                            <th className="text-left py-2 px-2">Industry</th>
                                            <th className="text-left py-2 px-2">Website</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contacts.map(contact => (
                                            <tr key={contact.id} className="border-b hover:bg-slate-50">
                                                <td className="py-2 px-2">
                                                    <CheckBox
                                                        checked={selectedContactIds.has(contact.id)}
                                                        onChange={() => toggleContact(contact.id)}
                                                    />
                                                </td>
                                                <td className="py-2 px-2 font-medium">{contact.company_name}</td>
                                                <td className="py-2 px-2">{contact.contact_name}</td>
                                                <td className="py-2 px-2 text-slate-500">{contact.industry || '-'}</td>
                                                <td className="py-2 px-2">
                                                    {contact.website ? (
                                                        <a
                                                            href={contact.website}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                                                        >
                                                            Visit <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="roleInterest">Role you&apos;re interested in</Label>
                                <Input
                                    id="roleInterest"
                                    placeholder="e.g. Frontend Developer, Data Analyst"
                                    value={roleInterest}
                                    onChange={e => setRoleInterest(e.target.value)}
                                />
                            </div>

                            <Button
                                onClick={handleGenerateDrafts}
                                disabled={!canGenerate}
                            >
                                {generating ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                                ) : (
                                    'Generate Email Drafts'
                                )}
                            </Button>

                            {generateMessage && (
                                <p className="text-sm text-green-600">{generateMessage}</p>
                            )}
                            {generateError && (
                                <p className="text-sm text-red-600">{generateError}</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
