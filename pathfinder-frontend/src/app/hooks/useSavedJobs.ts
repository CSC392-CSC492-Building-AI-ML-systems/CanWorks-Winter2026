'use client'

import { useEffect, useState } from 'react';
import { useUser } from '@/app/components/authComponents';
import type { Job } from '@/types';
import fastAxiosInstance from '@/axiosConfig/axiosfig';

export interface RemovedJob {
  title: string;
  employer: string | null;
}

export function useSavedJobs() {
  const { user } = useUser();
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [savedJobDetails, setSavedJobDetails] = useState<Job[]>([]);
  const [removedJobs, setRemovedJobs] = useState<RemovedJob[]>([]);
  const [loading, setLoading] = useState(true);

  const clearRemovedJobs = () => setRemovedJobs([]);

  // -------------------------
  // Fetch saved jobs
  // -------------------------
  useEffect(() => {
    if (!user) {
      setSavedJobs(new Set());
      setSavedJobDetails([]);
      setRemovedJobs([]);
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
          const activeJobs: Job[] = (data.active || []).map((item: any) => item.job);
          const ids = new Set(activeJobs.map(job => job.id.toString()));

          setSavedJobs(ids);
          setSavedJobDetails(activeJobs);
          setRemovedJobs(data.removed || []);
          setLoading(false);
        }

      } catch (err) {
        if (!cancelled) {
          setSavedJobs(new Set());
          setSavedJobDetails([]);
          setRemovedJobs([]);
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
  const toggleSave = async (jobId: string, job?: Job) => {
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
          prev.filter(j => j.id.toString() !== jobId)
        );

      } else {
        // POST
        await fastAxiosInstance.post('/api/saved-jobs', { job_id: jobId });

        // UI update
        setSavedJobs(prev => new Set(prev).add(jobId));
        if (job) {
          setSavedJobDetails(prev => [...prev, job]);
        }
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
    removedJobs,
    clearRemovedJobs,
  };
}
