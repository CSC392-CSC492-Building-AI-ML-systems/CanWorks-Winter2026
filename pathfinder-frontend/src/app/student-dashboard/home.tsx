
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button } from '@/app/components/globalComponents';

export default function StudentDashboardPage() {
    return (
        <div className="space-y-6">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Job Postings</CardDescription>
              <CardTitle className="text-3xl">630</CardTitle>
            </CardHeader>
            
          </Card>
          </div>
        </div>
    )
}