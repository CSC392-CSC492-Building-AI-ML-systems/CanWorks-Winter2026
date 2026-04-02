'use client'

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Input } from '@/app/components/globalComponents';
import { Search, ChevronLeft, ChevronRight, Mail, Phone, Globe, MapPin, Calendar, Star } from 'lucide-react';
import fastAxiosInstance from '@/axiosConfig/axiosfig';

interface Employer {
    id: string;
    email: string;
    company_name: string;
    phone: string | null;
    website: string | null;
    address: string | null;
    available_for_events: boolean;
    sponsor: boolean;
    special_notes: string | null;
    created_at: string | null;
}

export default function EmployerManagement() {
    const [employers, setEmployers] = useState<Employer[]>([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        fastAxiosInstance.get('/api/admin/employers')
            .then(res => setEmployers(res.data || []))
            .catch(err => console.error('Failed to fetch employers', err))
            .finally(() => setLoading(false));
    }, []);

    const filtered = employers.filter(emp => {
        if (!keyword) return true;
        const kw = keyword.toLowerCase();
        return emp.company_name.toLowerCase().includes(kw) || emp.email.toLowerCase().includes(kw);
    });

    const totalEmployers = filtered.length;
    const totalPages = Math.ceil(totalEmployers / pageSize);
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    useEffect(() => { setPage(1); }, [keyword]);

    if (loading) {
        return <p className="text-center text-gray-500 py-8">Loading employers...</p>;
    }

    return (
        <div className="space-y-6">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <Input
                    placeholder="Search by company name or email..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="!pl-10"
                />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                    {totalEmployers} Employer{totalEmployers !== 1 ? 's' : ''} on Platform
                </h3>
                {totalPages > 1 && (
                    <p className="text-sm text-gray-500">
                        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalEmployers)} of {totalEmployers}
                    </p>
                )}
            </div>

            {/* Employer List */}
            {totalEmployers === 0 ? (
                <Card className="p-12 text-center">
                    <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg mb-2">No employers found</h3>
                    <p className="text-gray-600">Try adjusting your search</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {paginated.map(emp => (
                        <Card key={emp.id} className="p-5 hover:shadow-md transition-shadow">
                            <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-medium">{emp.company_name}</h3>
                                            {emp.sponsor && (
                                                <Badge className="bg-yellow-100 text-yellow-700">
                                                    <Star className="w-3 h-3 mr-1" />Sponsor
                                                </Badge>
                                            )}
                                            {emp.available_for_events && (
                                                <Badge className="bg-green-100 text-green-700">
                                                    <Calendar className="w-3 h-3 mr-1" />Events
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    {emp.created_at && (
                                        <span className="text-xs text-gray-400">
                                            Joined {new Date(emp.created_at).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <Mail className="w-4 h-4" />
                                        {emp.email}
                                    </div>
                                    {emp.phone && (
                                        <div className="flex items-center gap-1">
                                            <Phone className="w-4 h-4" />
                                            {emp.phone}
                                        </div>
                                    )}
                                    {emp.website && (
                                        <a
                                            href={emp.website.startsWith('http') ? emp.website : `https://${emp.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-blue-600 hover:underline"
                                        >
                                            <Globe className="w-4 h-4" />
                                            {emp.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                        </a>
                                    )}
                                    {emp.address && (
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {emp.address}
                                        </div>
                                    )}
                                </div>

                                {emp.special_notes && (
                                    <p className="text-sm text-gray-500 italic">"{emp.special_notes}"</p>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <Button
                            key={p}
                            variant={p === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPage(p)}
                            className="min-w-9"
                        >
                            {p}
                        </Button>
                    ))}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
