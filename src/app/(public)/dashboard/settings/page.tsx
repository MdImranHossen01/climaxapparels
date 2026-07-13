'use client';

import { PasswordChangeForm } from '@/components/user/PasswordChangeForm';

export default function SettingsPage() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight">Account Settings</h1>
        <p className="text-sm text-muted-foreground">Update password and security</p>
      </div>
      <PasswordChangeForm />
    </div>
  );
}

