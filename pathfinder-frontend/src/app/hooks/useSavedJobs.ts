'use client'

import { useEffect, useState } from 'react';
import { useUser } from '@/app/components/authComponents';
import type { Job } from '@/types';
import fastAxiosInstance from '@/axiosConfig/axiosfig';

export function useSavedJobs() {
  const { user } = useUser();
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [savedJobDetails, setSavedJobDetails] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // -------------------------
  // Fetch saved jobs
  // -------------------------
  useEffect(() => {
    if (!user) {
      setSavedJobs(new Set());
      setSavedJobDetails([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchSavedJobs = async () => {
      setLoading(true);

      try {
        const res = await fastAxiosInstance.get('/api/saved-jobs');
        const data = res.data;

        if (!cancelled) {
          const jobs: Job[] = data.map((item: any) => item.job);
          const ids = new Set(jobs.map(job => job.id.toString()));

          setSavedJobs(ids);
          setSavedJobDetails(jobs);
          setLoading(false);
        }

      } catch (err) {
        if (!cancelled) {
          setSavedJobs(new Set());
          setSavedJobDetails([]);
          setLoading(false);
        }
      }
    };

    fetchSavedJobs();

    return () => {
      cancelled = true;
    };

  }, [user]);

  // -------------------------
  // Toggle Save
  // -------------------------
  const toggleSave = async (jobId: string) => {
    const isSaved = savedJobs.has(jobId);

    try {
      if (isSaved) {
        // DELETE
        await fastAxiosInstance.delete(`/api/saved-jobs/${jobId}`);

        // UI update
        setSavedJobs(prev => {
          const updated = new Set(prev);
          updated.delete(jobId);
          return updated;
        });

        setSavedJobDetails(prev =>
          prev.filter(job => job.id.toString() !== jobId)
        );

      } else {
        // POST
        await fastAxiosInstance.post('/api/saved-jobs', { job_id: jobId });

        // UI update
        setSavedJobs(prev => new Set(prev).add(jobId));
      }

    } catch (err) {
      console.error('Toggle save error:', err);
    }
  };

  return {
    savedJobs,
    savedJobDetails,
    toggleSave,
    loading,
  };
}
