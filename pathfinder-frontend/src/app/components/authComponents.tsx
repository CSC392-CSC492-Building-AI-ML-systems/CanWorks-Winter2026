'use client'

import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { UserType } from '@/types'
import { redirect } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or anon key in .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface SignUpProps {
    email: string;
    password: string;
    type: UserType;
    typeData: any;
}

export async function signUp({email, password, type, typeData}: SignUpProps) {
    const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                type: type,
                typeData: typeData,
            },
        },
    });

    console.log('signup:', error);

    if (error) return null;
    return user;
}

export async function signIn(email: string, password: string) {
    const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return null;
    return user;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
}

export async function getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) return null;
    return user;
}

export async function isSessionValidForUserType(reqUserType: UserType): Promise<boolean> {
    const {data: session, error} = await supabase.auth.getSession();
    if (error || !session) return false;
    const user = await getUser();
    if (!user || !user.user_metadata || user.user_metadata.type != reqUserType) return false;
    return true;
}

export async function getUserOfType(reqUserType: UserType) {
    const user = await getUser();
    if (!user || !user.user_metadata || user.user_metadata.type != reqUserType) return null;
    return user;
}

export async function updateUser(reqUserType: UserType, typeData: any) {
    try {
        const user = await getUserOfType(reqUserType);

        if (!user) return null;

        // Update the user metadata
        const { data, error } = await supabase.auth.updateUser({
            data: {
                type: reqUserType,
                typeData: typeData,
            },
        });

        if (error) return null;

        console.log("User metadata updated successfully:", data);
        return user;
    } catch (err) {
        console.error("Unexpected error:", err);
        return null;
    }
};
