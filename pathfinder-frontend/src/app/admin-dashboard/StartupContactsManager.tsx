'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Badge } from '@/app/components/globalComponents';
import { Plus, Pencil, Trash2, Building } from 'lucide-react';
import fastAxiosInstance from '@/axiosConfig/axiosfig';

interface StartupContact {
    id: string;
    contact_name: string;
    email: string;
    company_name: string;
    website: string | null;
    industry: string | null;
    created_at: string | null;
    updated_at: string | null;
}

interface ContactForm {
    contact_name: string;
    email: string;
    company_name: string;
    website: string;
    industry: string;
}

const emptyForm: ContactForm = {
    contact_name: '',
    email: '',
    company_name: '',
    website: '',
    industry: '',
};

export default function StartupContactsManager() {
    const [contacts, setContacts] = useState<StartupContact[]>([]);
    const [form, setForm] = useState<ContactForm>(emptyForm);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const response = await fastAxiosInstance.get('/api/admin/startup-contacts');
            setContacts(response.data);
        } catch (error) {
            console.error('Error fetching startup contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingId) {
                await fastAxiosInstance.put(`/api/admin/startup-contacts/${editingId}`, form);
            } else {
                await fastAxiosInstance.post('/api/admin/startup-contacts', form);
            }
            setForm(emptyForm);
            setEditingId(null);
            await fetchContacts();
        } catch (error) {
            console.error('Error saving startup contact:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (contact: StartupContact) => {
        setEditingId(contact.id);
        setForm({
            contact_name: contact.contact_name,
            email: contact.email,
            company_name: contact.company_name,
            website: contact.website || '',
            industry: contact.industry || '',
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setForm(emptyForm);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this contact?')) return;
        try {
            await fastAxiosInstance.delete(`/api/admin/startup-contacts/${id}`);
            await fetchContacts();
        } catch (error) {
            console.error('Error deleting startup contact:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Add / Edit Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        {editingId ? 'Edit Startup Contact' : 'Add Startup Contact'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="contact_name">Contact Name</Label>
                                <Input
                                    id="contact_name"
                                    placeholder="e.g., Jane Doe"
                                    value={form.contact_name}
                                    onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                                    className="mt-2"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="e.g., jane@startup.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="mt-2"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="company_name">Company Name</Label>
                                <Input
                                    id="company_name"
                                    placeholder="e.g., Acme Inc."
                                    value={form.company_name}
                                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                                    className="mt-2"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    type="url"
                                    placeholder="e.g., https://acme.com"
                                    value={form.website}
                                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <Label htmlFor="industry">Industry</Label>
                                <Input
                                    id="industry"
                                    placeholder="e.g., Technology"
                                    value={form.industry}
                                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                                    className="mt-2"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" disabled={submitting} className="flex items-center gap-2">
                                {editingId ? (
                                    <>
                                        <Pencil className="w-4 h-4" />
                                        {submitting ? 'Updating...' : 'Update'}
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                        {submitting ? 'Adding...' : 'Add'}
                                    </>
                                )}
                            </Button>
                            {editingId && (
                                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Contacts List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Startup Contacts</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-gray-500 text-sm">Loading contacts...</p>
                    ) : contacts.length === 0 ? (
                        <p className="text-gray-500 text-sm">No startup contacts found. Add one above.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-left py-3 px-4 font-medium text-gray-600">Company</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-600">Contact</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-600">Industry</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-600">Website</th>
                                        <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contacts.map((contact) => (
                                        <tr key={contact.id} className="border-b border-slate-100 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-4 font-medium">{contact.company_name}</td>
                                            <td className="py-3 px-4">{contact.contact_name}</td>
                                            <td className="py-3 px-4 text-gray-600">{contact.email}</td>
                                            <td className="py-3 px-4">
                                                {contact.industry ? (
                                                    <Badge className="bg-blue-100 text-blue-800">{contact.industry}</Badge>
                                                ) : (
                                                    <span className="text-gray-400">--</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                {contact.website ? (
                                                    <a
                                                        href={contact.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {contact.website}
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">--</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEdit(contact)}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDelete(contact.id)}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
