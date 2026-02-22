import React from 'react';
import { SignInPage } from '@/app/components/SignInPage';
import { UserProvider, CheckUser } from '@/app/components/authComponents';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
        <UserProvider>
            <CheckUser requireUser={false}>
                <SignInPage />
            </CheckUser>
        </UserProvider>
    </div>
  );
}