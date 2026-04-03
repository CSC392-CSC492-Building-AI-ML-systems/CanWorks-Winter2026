'use client'

import { Card, CardContent, Button, Badge,
    AlertDialog, AlertDialogTrigger, AlertDialogContent,
    AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
    AlertDialogFooter, AlertDialogAction, AlertDialogCancel
} from '@/app/components/globalComponents';
import { Pencil, Copy, Trash2, Send, XCircle } from 'lucide-react';
import type { Job } from '@/types';

interface JobDescriptionCardProps {
    job: Job;
    onEdit?: (id: string) => void;
    onDuplicate?: (id: string) => void;
    onDelete?: (id: string) => void;
    onPublish?: (id: string) => void;
    onUnpublish?: (id: string) => void;
}

export function JobDescriptionCard({ job, onEdit, onDuplicate, onDelete, onPublish, onUnpublish }: JobDescriptionCardProps) {
    const statusVariant = job.status === 'published' ? 'default' : 'secondary';
    const statusLabel = job.status === 'published' ? 'Published' : 'Draft';

    const formattedDate = job.updated_at
        ? new Date(job.updated_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
        : '—';

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    {/* Left side: job info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold truncate">{job.title}</h3>
                            <Badge variant={statusVariant}>{statusLabel}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                            {job.employment_type && <span>{job.employment_type}</span>}
                            {job.mode && <span>{job.mode}</span>}
                            {job.city && <span>{job.city}</span>}
                            <span>Updated {formattedDate}</span>
                        </div>
                        {job.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {job.skills.slice(0, 4).map((skill) => (
                                    <Badge key={skill.skill_id} variant="outline" className="text-xs">
                                        {skill.skill_name}
                                    </Badge>
                                ))}
                                {job.skills.length > 4 && (
                                    <Badge variant="outline" className="text-xs">+{job.skills.length - 4} more</Badge>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right side: action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                        {onEdit && (
                            <Button variant="ghost" size="sm" onClick={() => onEdit(job.id)}>
                                <Pencil className="w-4 h-4 mr-1" />Edit
                            </Button>
                        )}
                        {onDuplicate && (
                            <Button variant="ghost" size="sm" onClick={() => onDuplicate(job.id)}>
                                <Copy className="w-4 h-4 mr-1" />Duplicate
                            </Button>
                        )}
                        {onPublish && job.status === 'draft' && (
                            <Button variant="ghost" size="sm" onClick={() => onPublish(job.id)}>
                                <Send className="w-4 h-4 mr-1" />Publish
                            </Button>
                        )}
                        {onUnpublish && job.status === 'published' && (
                            <Button variant="ghost" size="sm" onClick={() => onUnpublish(job.id)}>
                                <XCircle className="w-4 h-4 mr-1" />Unpublish
                            </Button>
                        )}
                        {onDelete && (
                            <AlertDialog>
                                <AlertDialogTrigger>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                                        <Trash2 className="w-4 h-4 mr-1" />Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Job Description</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete &quot;{job.title}&quot;? This action can be viewed in your History tab.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onDelete(job.id)} className="bg-red-500 hover:bg-red-600">
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
