'use client'

import { createClient } from '@supabase/supabase-js'
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { User, UserType, UserData, UserDataMap, UserMap } from '@/types'
import { createContext, useContext, useEffect, useState } from 'react';
import { LoadingScreen } from '@/app/components/loadingScreen';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

export function convertUser(supaUser: SupabaseUser): User {
    return {
        id: supaUser.id,
        email: supaUser.email || '',
        userData: supaUser.user_metadata?.userData as UserData || {} as UserData,
    };
}

export interface UserContextType<T extends UserType | undefined = undefined> {
    user: T extends UserType ? UserMap[T] | null : User | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
    signUp: (email: string, password: string, userData: UserData) => Promise<User | null>;
    signIn: (email: string, password: string) => Promise<User | null>;
    signOut: () => Promise<void>;
    updateUser: (newUser: Partial<User> & { userData?: Partial<UserData> }) => Promise<User | null>;
    deleteUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps<T extends UserType | undefined = undefined> {
    children: React.ReactNode;
    userType?: T;
}

export function UserProvider<T extends UserType | undefined = undefined>({children, userType}: UserProviderProps<T>) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        const { data: { user: supaUser }, error } = await supabase.auth.getUser();

        if (!error && supaUser) {
            const currentUser: User = convertUser(supaUser);
            if (!userType || currentUser.userData.userType == userType) {
                setUser(currentUser);
            }
        }
        setLoading(false);
    };

    const loadUser = async () => {
        setLoading(true);
        await fetchUser();
        setLoading(false);
    };

    const signUpContext = async (email: string, password: string, userData: UserData) => {
        const { data: { user: supaUser }, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    userData: userData
                }
            }
        });

        if (!error && supaUser) {
            return signInContext(email, password);
        };
        return null;
    };

    const signInContext = async (email: string, password: string) => {
        const { data: { user: supaUser }, error } = await supabase.auth.signInWithPassword({ email, password });

        if (!error && supaUser) {
            const newUser = convertUser(supaUser);
            setUser(newUser);
            return newUser;
        };
        return null;
    };

    const signOutContext = async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) setUser(null);
    };

    const updateUserContext = async (newUser: Partial<User> & { userData?: Partial<UserData> }) => {
        if (!user) return null;

        const payload: { email?: string; data?: { userData?: Partial<UserData> } } = {};
        if (newUser.email) payload.email = newUser.email;
        if (newUser.userData) payload.data = { userData: newUser.userData };

        const { data: { user: supaUser }, error } = await supabase.auth.updateUser(payload);
        if (!error && supaUser) {
            const newUser: User = convertUser(supaUser);
            setUser(newUser);
            return newUser;
        }

        return null;
    };

    const deleteUserContext = async () => {
        if (!user) return;
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        if (!error) setUser(null);
    };

    useEffect(() => {
        loadUser();
    }, [userType]);

    return (
        <UserContext.Provider value={{
            user: userType ? (user as T extends UserType ? UserMap[T] | null : User | null) : user,
            loading,
            refreshUser: loadUser,
            signUp: signUpContext,
            signIn: signInContext,
            signOut: signOutContext,
            updateUser: updateUserContext,
            deleteUser: deleteUserContext
        }}>
        {children}
        </UserContext.Provider>
    );
}

export function useUser<T extends UserType | undefined = undefined>(): UserContextType<T> {
    const context = useContext(UserContext) as UserContextType<T> | undefined;
    if (!context) throw new Error('useUser must be used inside a UserProvider');
    return context;
}

interface CheckUserProps {
    children: React.ReactNode;
    requireUser?: boolean
}

// NOTE (HALF): Show a loading page is the user has not been fetched yet and redirect to the default screen if the current one reuires there is or is not a user
export function CheckUser<T extends UserType | undefined = undefined>({children, requireUser}: CheckUserProps) {
    const router = useRouter();
    const { user, loading } = useUser<T>();

    useEffect(() => {
        if (!loading) {
            if (requireUser == true) {
                if (!user) {
                    router.replace('/');
                }
            } else if (requireUser == false) {
                if (user) {
                    switch (user.userData.userType) {
                        case 'employer':
                            router.push('/employer-dashboard');
                            break;
                        case 'admin':
                            router.push('/admin-dashboard');
                            break;
                        case 'super-admin':
                            router.push('/admin-dashboard');
                            break;
                        default:
                            router.push('/student-dashboard');
                            break;
                    }
                }
            }
        }

    }, [loading, user, router]);

    if (loading) return <div><LoadingScreen></LoadingScreen></div>;
    if (requireUser == true) {
        if (!user) return null;
    } else if (requireUser == false) {
        if (user) return null;
    }

    return <>{children}</>;
}
