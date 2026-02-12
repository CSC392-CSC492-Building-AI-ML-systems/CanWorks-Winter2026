import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, Switch, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/app/components/globalComponents';
import { Building2, Trash2 } from 'lucide-react';
import type { EmployerUser } from '@/types';

export function EmployerProfilePage() {
//   const { user, updateUser, deleteAccount } = useAuth();
//   const employerUser = user as EmployerUser;

  const [formData, setFormData] = useState({
    email: 'test',
    companyName: "test",
    phone: "test",
    website: "test",
    address: "test",
    availableForEvents: true,
    sponsor: true,
    specialNotes: "test",
    // email: employerUser.email,
    // companyName: employerUser.companyName,
    // phone: employerUser.contactInfo.phone,
    // website: employerUser.contactInfo.website,
    // address: employerUser.contactInfo.address,
    // availableForEvents: employerUser.availableForEvents,
    // sponsor: employerUser.sponsor,
    // specialNotes: employerUser.specialNotes,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // updateUser({
    //   email: formData.email,
    //   companyName: formData.companyName,
    //   contactInfo: {
    //     phone: formData.phone,
    //     website: formData.website,
    //     address: formData.address,
    //   },
    //   availableForEvents: formData.availableForEvents,
    //   sponsor: formData.sponsor,
    //   specialNotes: formData.specialNotes,
    // });

    alert('Profile updated successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
            <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                <h1 className="text-2xl">Employer Profile</h1>
                <p className="text-sm text-gray-600">Manage your company information and preferences</p>
                </div>
            </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Basic information about your organization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    />
                </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>How students and administrators can reach you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.example.com"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street address, city, state, ZIP"
                    rows={3}
                    />
                </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Engagement Preferences</CardTitle>
                <CardDescription>Set your participation and sponsorship preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                    <Label htmlFor="availableForEvents">Available for Events</Label>
                    <p className="text-sm text-gray-500">Participate in career fairs and networking events</p>
                    </div>
                    <Switch
                    id="availableForEvents"
                    checked={formData.availableForEvents}
                    onCheckedChange={(checked) => setFormData({ ...formData, availableForEvents: checked })}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                    <Label htmlFor="sponsor">Sponsor</Label>
                    <p className="text-sm text-gray-500">Sponsor platform events and initiatives</p>
                    </div>
                    <Switch
                    id="sponsor"
                    checked={formData.sponsor}
                    onCheckedChange={(checked) => setFormData({ ...formData, sponsor: checked })}
                    />
                </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Special Notes</CardTitle>
                <CardDescription>Additional information or special requirements</CardDescription>
                </CardHeader>
                <CardContent>
                <Textarea
                    value={formData.specialNotes}
                    onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
                    placeholder="Any special notes or requirements..."
                    rows={4}
                />
                </CardContent>
            </Card>

            <div className="flex justify-between items-center">
                <AlertDialog>
                    <AlertDialogTrigger>
                        <Button variant="destructive" type="button">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                        </Button>
                    </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove all your data from our servers.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={/*deleteAccount*/ () => {}} className="bg-red-600 hover:bg-red-700">
                        Delete Account
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>

                <Button type="submit">Save Changes</Button>
            </div>
            </form>
        </div>
    </div>
  );
}
