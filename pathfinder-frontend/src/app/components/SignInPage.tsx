"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { useUser } from "@/app/components/authComponents";
import { Button, Input, Label, Alert, AlertDescription } from "@/app/components/globalComponents";

export function SignInPage() {
    const router = useRouter();
    const { user, signIn } = useUser();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
        router.push("/dashboard"); // change to your route
        }
    }, [user, router]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { id, value } = e.target;
        setFormData((prev) => ({
        ...prev,
        [id]: value,
        }));
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (!formData.email || !formData.password) {
                setError("Email and password are required.");
            }

            const {user, error} = await signIn(formData.email, formData.password);

            if (error) {
                setError(error.message);
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
            </h1>
            <p className="text-gray-600">
                Sign in to your account
            </p>
            </div>

            {/* Form */}
            <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6"
            >

            {error && (
                <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-600">
                    {error}
                </AlertDescription>
                </Alert>
            )}

            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                id="email"
                type="text"
                inputMode="email"
                autoComplete="email"
                required
                placeholder="you@university.edu"
                value={formData.email}
                onChange={handleChange}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                id="password"
                type="password"
                required
                placeholder=""
                value={formData.password}
                onChange={handleChange}
                />
            </div>

            <Button
                type="submit"
                className="w-full"
                loading={loading}
            >
                Sign In
            </Button>

            {/* Create Account Link */}
            <div className="text-center text-sm text-gray-600 pt-4 border-t">
                Don’t have an account?{" "}
                <button
                type="button"
                onClick={() => router.push("/signup")}
                className="text-blue-600 hover:underline font-medium"
                >
                Create one
                </button>
            </div>

            </form>
        </div>
        </div>
    );
}