"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap } from 'lucide-react';
import { signUp } from '@/app/components/supabaseComponents';

export function SignUpPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { id, value } = e.target;
        setFormData(prev => ({
        ...prev,
        [id]: value
        }));
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const user = await signUp({
            email: formData.email,
            password: formData.password,
            type: "student",
            typeData: {}
        });
        console.log('Submitting:', formData);
        console.log('received:', user);
        if (user != null) {
            router.push('/student-dashboard');
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md">
            
            {/* Header */}
            <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <GraduationCap className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl mb-2 font-bold text-gray-900">Welcome</h1>
            <p className="text-gray-600">Create your account to get started</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
            
            <div className="space-y-2">
                <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700"
                >
                Email Address
                </label>
                <input
                id="email"
                type="email"
                required
                placeholder="you@university.edu"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.email}
                onChange={handleChange}
                />
            </div>

            <div className="space-y-2">
                <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700"
                >
                Password
                </label>
                <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.password}
                onChange={handleChange}
                />
            </div>

            <button 
                type="submit" 
                className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
                Create Account
            </button>
            
            </form>
        </div>
        </div>
    );
}