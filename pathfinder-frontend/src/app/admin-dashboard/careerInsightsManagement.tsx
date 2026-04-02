'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label, Textarea, Badge, Alert, AlertDescription } from '@/app/components/globalComponents';
import { Search, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Upload, RefreshCw, CheckCircle2, X, Lightbulb, ExternalLink } from 'lucide-react';
import fastAxiosInstance from '@/axiosConfig/axiosfig';

interface CareerInsight {
    id: number;
    title: string;
    category: string;
    excerpt: string | null;
    content: string | null;
    articleLink: string | null;
    imageUrl: string | null;
    readTime: string | null;
    created_at: string | null;
    updated_at: string | null;
}

interface InsightDraft {
    title: string;
    category: string;
    excerpt: string;
    content: string;
    articleLink: string;
    image: File | null;
    imageUrl: string;
}

const emptyDraft: InsightDraft = { title: '', category: '', excerpt: '', content: '', articleLink: '', image: null, imageUrl: '' };

export default function CareerInsightsManagement() {
    const [insights, setInsights] = useState<CareerInsight[]>([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // Create/Edit state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draft, setDraft] = useState<InsightDraft>(emptyDraft);
    const [contentType, setContentType] = useState<'content' | 'link'>('content');
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const fetchInsights = () => {
        setLoading(true);
        fastAxiosInstance.get('/api/career-insights')
            .then(res => setInsights(res.data || []))
            .catch(err => console.error('Failed to fetch career insights', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchInsights(); }, []);

    const filtered = insights.filter(i => {
        if (!keyword) return true;
        const kw = keyword.toLowerCase();
        return i.title.toLowerCase().includes(kw) || i.category.toLowerCase().includes(kw);
    });

    const totalInsights = filtered.length;
    const totalPages = Math.ceil(totalInsights / pageSize);
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    useEffect(() => { setPage(1); }, [keyword]);

    const handleEdit = (insight: CareerInsight) => {
        setEditingId(insight.id);
        setDraft({
            title: insight.title,
            category: insight.category,
            excerpt: insight.excerpt || '',
            content: insight.content || '',
            articleLink: insight.articleLink || '',
            image: null,
            imageUrl: insight.imageUrl || '',
        });
        setContentType(insight.articleLink ? 'link' : 'content');
        setShowForm(true);
    };

    const handleCreate = () => {
        setEditingId(null);
        setDraft(emptyDraft);
        setContentType('content');
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setDraft(emptyDraft);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let imageUrl = draft.imageUrl;

            if (draft.image) {
                const formData = new FormData();
                formData.append('file', draft.image);
                const uploadRes = await fastAxiosInstance.post('/api/upload-career-image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                imageUrl = uploadRes.data.url;
            }

            const payload = {
                title: draft.title,
                category: draft.category,
                excerpt: draft.excerpt,
                content: contentType === 'content' ? draft.content : '',
                articleLink: contentType === 'link' ? draft.articleLink : '',
                imageUrl,
                readTime: '5 min read',
            };

            if (editingId) {
                await fastAxiosInstance.put(`/api/career-insights/${editingId}`, payload);
            } else {
                await fastAxiosInstance.post('/api/create-career-insights', payload);
            }

            handleCancel();
            fetchInsights();
        } catch (err) {
            console.error('Failed to save career insight', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this career insight?')) return;
        setDeletingId(id);
        try {
            await fastAxiosInstance.delete(`/api/career-insights/${id}`);
            setInsights(prev => prev.filter(i => i.id !== id));
        } catch (err) {
            console.error('Failed to delete career insight', err);
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return <p className="text-center text-gray-500 py-8">Loading career insights...</p>;
    }

    // Show create/edit form
    if (showForm) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5" />
                        {editingId ? 'Edit Career Insight' : 'Create Career Insight'}
                    </CardTitle>
                    <CardDescription>
                        {editingId ? 'Update this article' : 'Publish helpful career advice and guidance for students'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="insight-title">Title</Label>
                        <Input id="insight-title" placeholder="e.g., How to Ace Your Technical Interview" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="mt-2" />
                    </div>
                    <div>
                        <Label htmlFor="insight-category">Category</Label>
                        <Input id="insight-category" placeholder="e.g., Interview Tips, Resume Tips" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="mt-2" />
                    </div>
                    <div>
                        <Label htmlFor="insight-image">Featured Image</Label>
                        {!draft.image && !draft.imageUrl ? (
                            <div className="mt-2">
                                <Input
                                    id="insight-image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) setDraft({ ...draft, image: file });
                                    }}
                                    className="hidden"
                                />
                                <Button type="button" variant="outline" onClick={() => document.getElementById('insight-image')?.click()} className="w-full">
                                    <Upload className="w-4 h-4 mr-2" />Upload Image
                                </Button>
                            </div>
                        ) : (
                            <div className="mt-2 flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                {draft.image ? (
                                    <span className="text-sm text-gray-700">{draft.image.name}</span>
                                ) : (
                                    <a href={draft.imageUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate">{draft.imageUrl}</a>
                                )}
                                <Button type="button" variant="ghost" size="sm" onClick={() => setDraft({ ...draft, image: null, imageUrl: '' })}>Remove</Button>
                            </div>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="insight-excerpt">Excerpt</Label>
                        <Textarea id="insight-excerpt" placeholder="Brief summary (150-200 characters)" value={draft.excerpt} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} className="mt-2 resize-none" rows={3} />
                    </div>
                    <div>
                        <Label>Content Type</Label>
                        <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="contentType" value="content" checked={contentType === 'content'} onChange={() => { setContentType('content'); setDraft({ ...draft, articleLink: '' }); }} />
                                Write Content
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="contentType" value="link" checked={contentType === 'link'} onChange={() => { setContentType('link'); setDraft({ ...draft, content: '' }); }} />
                                External Article Link
                            </label>
                        </div>
                    </div>
                    {contentType === 'content' ? (
                        <div>
                            <Label htmlFor="insight-content">Content</Label>
                            <Textarea id="insight-content" placeholder="Full article content" value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} className="mt-2 resize-none" rows={12} />
                        </div>
                    ) : (
                        <div>
                            <Label htmlFor="insight-link">Article Link</Label>
                            <Input id="insight-link" type="url" placeholder="https://example.com/article" value={draft.articleLink} onChange={(e) => setDraft({ ...draft, articleLink: e.target.value })} className="mt-2" />
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Button onClick={handleSave} disabled={!draft.title || saving} className="flex-1">
                            {saving ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />{editingId ? 'Updating...' : 'Publishing...'}</> : <><CheckCircle2 className="w-4 h-4 mr-2" />{editingId ? 'Update Insight' : 'Publish Insight'}</>}
                        </Button>
                        <Button variant="outline" onClick={handleCancel} className="flex-1">Cancel</Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Browse view
    return (
        <div className="space-y-6">
            {/* Header + Create button */}
            <div className="flex items-center justify-between">
                <div className="flex-1 relative mr-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                    <Input
                        placeholder="Search by title or category..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="!pl-10"
                    />
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />New Insight
                </Button>
            </div>

            {/* Count */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                    {totalInsights} Article{totalInsights !== 1 ? 's' : ''}
                </h3>
                {totalPages > 1 && (
                    <p className="text-sm text-gray-500">
                        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalInsights)} of {totalInsights}
                    </p>
                )}
            </div>

            {/* List */}
            {totalInsights === 0 ? (
                <Card className="p-12 text-center">
                    <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg mb-2">No career insights yet</h3>
                    <p className="text-gray-600 mb-4">Create your first article to help students</p>
                    <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" />Create Insight</Button>
                </Card>
            ) : (
                <div className="space-y-4">
                    {paginated.map(insight => (
                        <Card key={insight.id} className="p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-4">
                                {insight.imageUrl && (
                                    <img
                                        src={insight.imageUrl}
                                        alt={insight.title}
                                        className="w-20 h-20 rounded-lg object-cover shrink-0"
                                    />
                                )}
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-medium">{insight.title}</h3>
                                        <Badge className="bg-blue-100 text-blue-700">{insight.category}</Badge>
                                        {insight.articleLink && (
                                            <a href={insight.articleLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                <ExternalLink className="w-3 h-3" />Link
                                            </a>
                                        )}
                                    </div>
                                    {insight.excerpt && <p className="text-sm text-gray-600 line-clamp-2">{insight.excerpt}</p>}
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        {insight.readTime && <span>{insight.readTime}</span>}
                                        {insight.created_at && <span>Created {new Date(insight.created_at).toLocaleDateString()}</span>}
                                        {insight.updated_at && <span>Updated {new Date(insight.updated_at).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(insight)}>
                                        <Pencil className="w-4 h-4 mr-1" />Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        disabled={deletingId === insight.id}
                                        onClick={() => handleDelete(insight.id)}
                                    >
                                        <Trash2 className="w-4 h-4 mr-1" />{deletingId === insight.id ? 'Deleting...' : 'Delete'}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <Button key={p} variant={p === page ? 'default' : 'outline'} size="sm" onClick={() => setPage(p)} className="min-w-9">
                            {p}
                        </Button>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
