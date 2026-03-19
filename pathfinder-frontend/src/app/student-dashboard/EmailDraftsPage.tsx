'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Badge, Textarea } from '@/app/components/globalComponents';
import { Send, Pencil, Trash2, Check, AlertTriangle, CheckCheck } from 'lucide-react';
import { outreachApi } from './outreach-api';

interface EmailDraft {
    id: string;
    student_user_id: string;
    startup_contact_id: string;
    role_interest: string;
    subject: string;
    body: string;
    status: string;
    moderation_result: string | null;
    sent_at: string | null;
    created_at: string | null;
    startup_contact: {
        id: string;
        contact_name: string;
        email: string;
        company_name: string;
        website: string | null;
        industry: string | null;
    } | null;
}

const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    sent: 'bg-green-100 text-green-800 border-green-200',
    flagged: 'bg-orange-100 text-orange-800 border-orange-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    sending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

export function EmailDraftsPage() {
    const [drafts, setDrafts] = useState<EmailDraft[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editSubject, setEditSubject] = useState('');
    const [editBody, setEditBody] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchDrafts = () => {
        setLoading(true);
        outreachApi.listDrafts()
            .then(res => {
                setDrafts(res.data.drafts || res.data || []);
            })
            .catch(() => {
                setDrafts([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchDrafts();
    }, []);

    const hasDraftStatus = drafts.some(d => d.status === 'draft');

    const handleApproveAll = async () => {
        setActionLoading('approve-all');
        try {
            await outreachApi.approveAllDrafts();
            fetchDrafts();
        } catch {
            // silently fail
        } finally {
            setActionLoading(null);
        }
    };

    const startEditing = (draft: EmailDraft) => {
        setEditingId(draft.id);
        setEditSubject(draft.subject);
        setEditBody(draft.body);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditSubject('');
        setEditBody('');
    };

    const handleSave = async (id: string) => {
        setActionLoading(id);
        try {
            await outreachApi.updateDraft(id, { subject: editSubject, body: editBody });
            setEditingId(null);
            fetchDrafts();
        } catch {
            // silently fail
        } finally {
            setActionLoading(null);
        }
    };

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        try {
            await outreachApi.approveDraft(id);
            fetchDrafts();
        } catch {
            // silently fail
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = window.confirm('Are you sure you want to delete this draft?');
        if (!confirmed) return;

        setActionLoading(id);
        try {
            await outreachApi.deleteDraft(id);
            fetchDrafts();
        } catch {
            // silently fail
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12 text-slate-500">
                Loading drafts...
            </div>
        );
    }

    if (drafts.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                <p className="text-lg font-medium">No email drafts yet</p>
                <p className="text-sm mt-1">Go to the Outreach tab to generate email drafts for startup contacts.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Top bar */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                    Email Drafts ({drafts.length})
                </h2>
                {hasDraftStatus && (
                    <Button
                        onClick={handleApproveAll}
                        disabled={actionLoading === 'approve-all'}
                    >
                        {actionLoading === 'approve-all' ? (
                            'Approving...'
                        ) : (
                            <><CheckCheck className="w-4 h-4 mr-2" /> Approve All</>
                        )}
                    </Button>
                )}
            </div>

            {/* Draft cards */}
            {drafts.map(draft => {
                const isEditing = editingId === draft.id;
                const isActionLoading = actionLoading === draft.id;
                const contact = draft.startup_contact;

                return (
                    <Card key={draft.id}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">
                                    {contact?.company_name || 'Unknown Company'}
                                    {contact && (
                                        <span className="text-sm font-normal text-slate-500 ml-2">
                                            {contact.contact_name} ({contact.email})
                                        </span>
                                    )}
                                </CardTitle>
                                <Badge className={statusColors[draft.status] || statusColors.draft}>
                                    {draft.status}
                                </Badge>
                            </div>
                            {draft.role_interest && (
                                <p className="text-xs text-slate-400 mt-1">
                                    Role: {draft.role_interest}
                                </p>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {/* Subject */}
                                <div>
                                    <Label className="text-xs text-slate-500">Subject</Label>
                                    {isEditing ? (
                                        <Input
                                            value={editSubject}
                                            onChange={e => setEditSubject(e.target.value)}
                                            className="mt-1"
                                        />
                                    ) : (
                                        <p className="text-sm font-medium mt-1">{draft.subject}</p>
                                    )}
                                </div>

                                {/* Body */}
                                <div>
                                    <Label className="text-xs text-slate-500">Body</Label>
                                    {isEditing ? (
                                        <Textarea
                                            value={editBody}
                                            onChange={e => setEditBody(e.target.value)}
                                            className="mt-1 min-h-[200px]"
                                        />
                                    ) : (
                                        <p className="text-sm mt-1 whitespace-pre-wrap bg-slate-50 rounded-md p-3">
                                            {draft.body}
                                        </p>
                                    )}
                                </div>

                                {/* Flagged alert */}
                                {draft.status === 'flagged' && draft.moderation_result && (
                                    <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 p-3">
                                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                        <div className="text-sm text-red-700">
                                            <p className="font-medium">Moderation Flag</p>
                                            <p>{draft.moderation_result}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-2 border-t">
                                    {isEditing ? (
                                        <>
                                            <Button
                                                size="sm"
                                                onClick={() => handleSave(draft.id)}
                                                disabled={isActionLoading}
                                            >
                                                <Check className="w-4 h-4 mr-1" />
                                                Save
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={cancelEditing}
                                            >
                                                Cancel
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => startEditing(draft)}
                                            >
                                                <Pencil className="w-4 h-4 mr-1" />
                                                Edit
                                            </Button>
                                            {draft.status === 'draft' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApprove(draft.id)}
                                                    disabled={isActionLoading}
                                                >
                                                    <Send className="w-4 h-4 mr-1" />
                                                    Approve &amp; Send
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDelete(draft.id)}
                                                disabled={isActionLoading}
                                            >
                                                <Trash2 className="w-4 h-4 mr-1" />
                                                Delete
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
