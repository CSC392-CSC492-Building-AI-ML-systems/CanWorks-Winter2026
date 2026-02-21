import React from 'react';
import { SignUpPage } from '@/app/components/SignUpPage';
import { UserProvider, CheckUser } from '@/app/components/authComponents';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
        <UserProvider>
            <CheckUser requireUser={false}>
                <SignUpPage />
            </CheckUser>
        </UserProvider>
    </div>
  );
}