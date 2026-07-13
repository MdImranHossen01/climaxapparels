'use client';

import { ProfileForm } from '@/components/user/ProfileForm';

export default function ProfilePage() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight">Profile Information</h1>
        <p className="text-sm text-muted-foreground">Manage your personal details</p>
      </div>
      <ProfileForm />
    </div>
  );
}

