'use client'

import type { User as SupabaseUser } from '@supabase/supabase-js';
import { AuthError } from '@supabase/supabase-js';
import { User, UserType, UserData, UserDataMap, UserMap } from '@/types'
import { createContext, useContext, useEffect, useState } from 'react';
import { LoadingScreen } from '@/app/components/loadingScreen';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

export function convertUser(supaUser: SupabaseUser): User | null {
    const userData: UserData | null = supaUser.user_metadata?.userData as UserData;
    if (!userData?.userType) {
        console.log('Invalid supabase user object received', supaUser)
        return null;
    }
    return {
        id: supaUser.id,
        email: supaUser.email || '',
        userData: supaUser.user_metadata?.userData as UserData || {} as UserData,
    };
}

type UserMethodReturn = Promise<{
    user: User | null,
    error: AuthError | null
}>

export interface UserContextType<T extends UserType | undefined = undefined> {
    user: T extends UserType ? UserMap[T] | null : User | null;
    loading: boolean;
    signUp: (email: string, password: string, userData: UserData) => UserMethodReturn;
    signIn: (email: string, password: string) => UserMethodReturn;
    signOut: () => UserMethodReturn;
    updateUser: (newUser: Partial<User> & { userData?: Partial<UserData> }) => UserMethodReturn;
    deleteUser: () => UserMethodReturn;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps<T extends UserType | undefined = undefined> {
    children: React.ReactNode;
    userType?: T;
}

export function UserProvider<T extends UserType | undefined = undefined>({children, userType}: UserProviderProps<T>) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const signUpContext = async (email: string, password: string, userData: UserData): UserMethodReturn => {
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
            const newUser = convertUser(supaUser);
            if (newUser) {
                setUser(newUser);
                return {user: newUser, error: error};
            }
        };
        return {user: null, error: error};
    };

    const signInContext = async (email: string, password: string): UserMethodReturn => {
        const { data: { user: supaUser }, error } = await supabase.auth.signInWithPassword({ email, password });

        if (!error && supaUser) {
            const newUser = convertUser(supaUser);
            if (newUser) {
                setUser(newUser);
                return {user: newUser, error: error};
            }
        };
        return {user: null, error: error};
    };

    const signOutContext = async (): UserMethodReturn => {
        const { error } = await supabase.auth.signOut();
        if (!error) setUser(null);
        return {user: null, error: error};
    };

    const updateUserContext = async (newUser: Partial<User> & { userData?: Partial<UserData> }): UserMethodReturn => {
        if (!user) return {user: null, error: new AuthError('No user logged in')};

        const payload: { email?: string; data?: { userData?: Partial<UserData> } } = {};
        if (newUser.email) payload.email = newUser.email;
        if (newUser.userData) payload.data = { userData: newUser.userData };

        const { data: { user: supaUser }, error } = await supabase.auth.updateUser(payload);
        if (!error && supaUser) {
            const newUser = convertUser(supaUser);
            if (newUser) {
                setUser(newUser);
                return {user: newUser, error: error};
            }
        };
        return {user: null, error: error};
    };

    const deleteUserContext = async (): UserMethodReturn => {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return { user: null, error: new AuthError('No user logged in') };
        }


        const response = await fetch('/api/deleteUser', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            return { user: null, error: new AuthError(result.error || 'Delete failed') };
        }

        await supabase.auth.signOut();
        setUser(null);

        return { user: null, error: null };
    };

    useEffect(() => {

        const init = async () => {
            setLoading(true);

            const { data: { user }, error } = await supabase.auth.getUser();

            if (!error && user) {
                const currentUser = convertUser(user);
                
                if (currentUser && (!userType || currentUser.userData.userType === userType)) {
                    setUser(currentUser);
                }
            }


            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                async (_event, session) => {
                    if (session && session.user) {
                        setUser(convertUser(session.user));
                    } else {
                        setUser(null);
                    }
                }
            );

            setLoading(false);
            return () => subscription.unsubscribe();
        };

        init()
    }, [userType]);

    return (
        <UserContext.Provider value={{
            user: userType ? (user as T extends UserType ? UserMap[T] | null : User | null) : user,
            loading,
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
            const currentPath = window.location.pathname;
            if (requireUser == true) {
                if (!user && currentPath != '/') {
                    router.replace('/');
                }
            } else if (requireUser == false) {
                if (user) {
                    let targetPath = '/';
                    switch (user.userData.userType) {
                        case 'employer':
                            targetPath = '/employer-dashboard';
                            break;
                        case 'admin':
                            targetPath = '/admin-dashboard';
                            break;
                        case 'super-admin':
                            targetPath = '/admin-dashboard';
                        case 'student':
                            targetPath = '/student-dashboard';
                            break;
                    }
                    if (targetPath != currentPath) {
                        router.push(targetPath);
                    }
                }
            }
        }

    }, [loading, user, router]);

    if (loading) return <div><LoadingScreen></LoadingScreen></div>;
    if (requireUser === true && !user) return null;
    if (requireUser === false && user) return null;

    return <>{children}</>;
}
