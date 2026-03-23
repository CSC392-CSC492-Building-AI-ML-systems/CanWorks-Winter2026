'use client'

import { Suspense } from 'react';
import StudentDashboardContent from './StudentDashboardContent';

export default function StudentDashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 py-8"><p className="text-center text-gray-500">Loading dashboard...</p></div>}>
            <StudentDashboardContent />
        </Suspense>
    );
}