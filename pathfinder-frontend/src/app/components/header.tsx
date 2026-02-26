'use client'

import React from 'react'
import { useUser } from '@/app/components/authComponents'
import { Button } from '@/app/components/globalComponents'

interface HeaderProps {
    title: string
    description?: string
}

export function Header({title, description}: HeaderProps) {
    const { user, signOut } = useUser<'student'>() // adjust type as needed

    const handleSignOut = async () => {
        await signOut();
    }

    return (
        <div className="mb-8">
            <h1 className="text-3xl mb-2 font-bold tracking-tight">{title}</h1>
            {description && (
                <p className="text-gray-600">{description}</p>
            )}
            <div className="absolute right-10 top-10">
                {user && (
                    <Button variant="outline" onClick={handleSignOut}>
                        Sign Out
                    </Button>
                )}
            </div>
        </div>
    )
}