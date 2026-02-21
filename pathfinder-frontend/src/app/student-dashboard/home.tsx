
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button } from '@/app/components/globalComponents';
import axios from 'axios';

export default function StudentDashboardPage() {
  const [totalJobs, setTotalJobs] = useState<number>(0);

  useEffect(() => {
    // get total job counts
    axios.get('http://127.0.0.1:8000/api/jobs/stats').then(
      response => setTotalJobs(response.data.total_jobs)
    ).catch(
      error => console.error('Failed to fetch stats', error)
    );
  }, []);

    return (
        <div className="space-y-6">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Job Postings</CardDescription>
              <CardTitle className="text-3xl">{totalJobs}</CardTitle>
            </CardHeader>
            
          </Card>
          </div>
        </div>
    )
}