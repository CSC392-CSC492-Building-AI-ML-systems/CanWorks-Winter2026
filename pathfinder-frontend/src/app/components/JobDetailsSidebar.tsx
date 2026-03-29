import React, { useEffect, useRef } from 'react';
import { X, ExternalLink, ArrowRight } from 'lucide-react';
import type { Job } from '@/types';
import fastAxiosInstance from '@/axiosConfig/axiosfig';

interface Props {
    job: Job | null;
    onClose: () => void;
    onViewInExplore?: () => void;
}

export default function JobDetailsSidebar({ job, onClose, onViewInExplore }: Props) {
    const sentRef = useRef(false);

    useEffect(() => {
        sentRef.current = false;
    }, [job?.id]);

    useEffect(() => {
        if (!job || sentRef.current) return;

        (async () => {
            try {
                await fastAxiosInstance.post('/api/job-events', { job_id: job.id, event_type: 'view' });
            } catch (err) {
                // non-fatal; log for debugging
                console.error('Failed to log job view event', err);
            }
            sentRef.current = true;
        })();
    }, [job]);

    if (!job) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex"
            role="dialog"
            aria-modal="true"
        >
            {/* overlay */}
            <div
                className="fixed inset-0 bg-transparent z-40" // no darkening; sits under the panel
                onClick={onClose}
            />

            {/* panel */}
            <aside
                className="ml-auto w-full max-w-md bg-white shadow-xl overflow-y-auto transform transition-transform duration-200 z-50 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold line-clamp-2">{job.title}</h3>
                        <p className="text-sm text-gray-500">
                            {job.employer}
                            {' — '}
                            {(() => {
                                const city = job.city && job.city.toLowerCase() !== 'not specified' ? job.city : null;
                                const prov = job.province && job.province.toLowerCase() !== 'not specified' ? job.province : null;
                                return city && prov ? `${city}, ${prov}` : city || prov || 'Remote';
                            })()}
                        </p>
                    </div>
                    <button onClick={onClose} aria-label="Close" className="p-2 rounded hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="space-y-1">
                        <h4 className="text-sm text-gray-600">Job Type</h4>
                        <p className="text-sm">{job.employment_type} · {job.mode}</p>
                    </div>

                    {job.job_function && (
                        <div className="space-y-1">
                            <h4 className="text-sm text-gray-600">Job Function</h4>
                            <p className="text-sm">{job.job_function}</p>
                        </div>
                    )}

                    {(job.start_month || job.duration_months) && (
                        <div className="space-y-1">
                            <h4 className="text-sm text-gray-600">Duration</h4>
                            <p className="text-sm">
                                {[
                                    job.start_month && `Starts ${job.start_month}`,
                                    job.duration_months && `${job.duration_months} month${job.duration_months !== 1 ? 's' : ''}`,
                                ].filter(Boolean).join(' · ')}
                            </p>
                        </div>
                    )}

                    <div>
                        <h4 className="text-sm text-gray-600">Description</h4>
                        <p className="prose text-sm max-w-none whitespace-pre-wrap">{job.description || 'No description available.'}</p>
                    </div>

                    {job.qualifications && (
                        <div>
                            <h4 className="text-sm text-gray-600">Qualifications</h4>
                            <p className="prose text-sm max-w-none whitespace-pre-wrap">{job.qualifications}</p>
                        </div>
                    )}

                    {job.other_academic_requirements && (
                        <div>
                            <h4 className="text-sm text-gray-600">Other Academic Requirements</h4>
                            <p className="prose text-sm max-w-none whitespace-pre-wrap">{job.other_academic_requirements}</p>
                        </div>
                    )}

                    {job.skills && job.skills.length > 0 && (
                        <div>
                            <h4 className="text-sm text-gray-600">Skills</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {job.skills.map(s => (
                                    <span key={s.skill_name} className="px-3 py-1 bg-gray-100 rounded-full text-sm">{s.skill_name}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-2 border-t flex items-center justify-between">
                        <div className="text-sm text-gray-500">Posted: {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Unknown'}</div>
                        {job.link_to_posting ? (
                            <a
                                href={job.link_to_posting}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-sm"
                                onClick={() => {
                                    fastAxiosInstance.post('/api/track-click', {
                                        job_id: job.id,
                                        job_type: job.employment_type || null,
                                        url: job.link_to_posting || '',
                                    }).catch(() => {});
                                }}
                            >
                                <ExternalLink className="w-4 h-4" />
                                View Posting
                            </a>
                        ) : onViewInExplore ? (
                            <button
                                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-sm"
                                onClick={() => {
                                    onClose();
                                    onViewInExplore();
                                }}
                            >
                                <ArrowRight className="w-4 h-4" />
                                View in Explore
                            </button>
                        ) : null}
                    </div>
                </div>
            </aside>
        </div>
    );
}