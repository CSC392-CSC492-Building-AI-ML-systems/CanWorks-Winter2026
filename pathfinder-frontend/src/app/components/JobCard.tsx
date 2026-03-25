import React from 'react';
import { Card, Badge, Button } from '@/app/components/globalComponents';
import { ExternalLink, Bookmark, BookmarkCheck, MapPin, Send } from 'lucide-react';
import type { Job } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import fastAxiosInstance from '@/axiosConfig/axiosfig';

interface JobCardProps {
  job: Job;
  isSaved: boolean;
  onToggleSave: (jobId: string, job?: Job) => void;
  onApply?: (jobId: string) => void;
  applied?: boolean;
}

export function JobCard({ job, isSaved, onToggleSave, onApply, applied }: JobCardProps) {
    const typeColors: Record<string, string> = {
        'intern': 'bg-blue-100 text-blue-700',
        'coop': 'bg-purple-100 text-purple-700',
        'new-grad': 'bg-green-100 text-green-700',
        'part-time': 'bg-orange-100 text-orange-700',
        'full-time': 'bg-indigo-100 text-indigo-700',
    };

    return (
        <Card className="p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
            <div>
                <h3 className="text-lg mb-1">{job.title}</h3>
                <p className="text-gray-600">{job.employer}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {(() => {
                    const city = job.city && job.city.toLowerCase() !== 'not specified' ? job.city : null;
                    const prov = job.province && job.province.toLowerCase() !== 'not specified' ? job.province : null;
                    return city && prov ? `${city}, ${prov}` : city || prov || 'Remote';
                })()}
                </div>
            </div>

            <p className="text-sm text-gray-700 line-clamp-2">{job.description}</p>

            <div className="flex flex-wrap gap-2">
                {job.employment_type && (
                    <Badge className={typeColors[job.employment_type]}>
                    {job.employment_type === 'new-grad' ? 'New Grad' :
                     job.employment_type === 'part-time' ? 'Part Time' :
                     job.employment_type === 'full-time' ? 'Full Time' :
                     job.employment_type === 'intern' ? 'Internship' :
                     job.employment_type.charAt(0).toUpperCase() + job.employment_type.slice(1)}
                    </Badge>
                )}
                {job.skills?.slice(0, 3).map((s, index) => (
                <Badge key={`${job.id}-skill-${s.skill_name}-${index}`} variant="outline">{s.skill_name}</Badge>
                ))}
                {job.skills && job.skills.length > 3 && (
                <Badge variant="outline">+{job.skills.length - 3} more</Badge>
                )}
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500">
                {job.created_at && <span>Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>}
            </div>
            </div>

            <div className="flex flex-col gap-2">
            <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onToggleSave(job.id.toString(), job); }}
                className="shrink-0"
            >
                {isSaved ? (
                <BookmarkCheck className="w-5 h-5 text-blue-600" />
                ) : (
                <Bookmark className="w-5 h-5" />
                )}
            </Button>

            {job.link_to_posting && (
            <Button
                size="sm"
                asChild
                className="shrink-0"
            >
                <a
                    href={job.link_to_posting}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                    onClick={() => {
                        fastAxiosInstance.post('/api/track-click', {
                            job_id: job.id,
                            job_type: job.employment_type || null,
                            url: job.link_to_posting || '',
                        }).catch(() => {});
                    }}
                >
                <ExternalLink className="w-4 h-4" />
                {new URL(job.link_to_posting).hostname.replace('www.', '').replace('.com', '')}
                </a>
            </Button>
            )}

            {onApply && !job.link_to_posting && (
                applied ? (
                    <Button variant="outline" size="sm" className="shrink-0" disabled>
                        Applied
                    </Button>
                ) : (
                    <Button size="sm" className="shrink-0" onClick={() => onApply(job.id)}>
                        <Send className="w-4 h-4 mr-1" />
                        Apply
                    </Button>
                )
            )}
            </div>
        </div>
        </Card>
    );
}
