'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, LogOut, LayoutDashboard, Truck, Settings, Package } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { Logo } from '@/components/ui/logo';
import { useSettings } from '@/components/SettingsProvider';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MobileNavbarProps {
  navItems: { href: string; label: string }[];
  categories: any[];
}

/**
 * MobileNavbar — Reusable mobile top bar (V1 standard).
 * MUST be used by ALL navbar versions for mobile (lg:hidden).
 * Always sticky top-0 with solid bg-background. No transparent/floating on mobile.
 */
export function MobileNavbar({ navItems, categories }: MobileNavbarProps) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => setProfile(data))
        .catch(err => console.error('Failed to fetch profile', err));
    } else {
      setProfile(null);
    }
  }, [status]);

  return (
    <header className="lg:hidden sticky top-0 z-50 w-full bg-background border-b shadow-sm">
      <div className="relative flex h-14 items-center justify-between px-3">

        {/* Left: Mobile Menu Drawer Trigger */}
        <div className="flex items-center">
          <MobileMenu
            navItems={navItems}
            categories={categories}
            session={session}
          />
        </div>

        {/* Center: Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
          <Logo textClassName="text-base sm:text-lg whitespace-nowrap" />
        </div>

        {/* Right: Icons */}
        <div className="flex items-center gap-1">



          {/* User Account */}
          {status === 'authenticated' && session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center cursor-pointer outline-none" aria-label="Account menu">
                  <div className="h-8 w-8 rounded-full border-2 border-primary/20 overflow-hidden hover:border-primary transition-all">
                    <Image
                      src={session.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user?.name || 'U')}`}
                      alt={session.user?.name || 'User'}
                      width={32}
                      height={32}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-serif">
                    <div className="flex flex-col">
                      <span>{session.user?.name}</span>
                      <span className="text-xs font-normal text-muted-foreground truncate">{session.user?.email}</span>
                      {profile && (
                        <div className="mt-1.5 flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded-full w-fit border border-primary/20">
                          <Package className="h-3 w-3 text-primary" />
                          <span className="text-[10px] font-bold text-primary">৳{profile.walletBalance || 0} Tokens</span>
                        </div>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Role Based Navigation */}
                  {(session.user as any)?.role === 'super_admin' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard" className="cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" /> Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/system-design" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" /> Infrastructure & Marketing
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {(session.user as any)?.role === 'admin' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard" className="cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" /> Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/orders" className="cursor-pointer">
                          <Truck className="mr-2 h-4 w-4" /> Manage Orders
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {(session.user as any)?.role === 'user' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/track-order" className="cursor-pointer">
                          <Truck className="mr-2 h-4 w-4" /> Track Order
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: window.location.origin })} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className="h-10 w-10 flex items-center justify-center rounded-xl transition-all hover:text-primary"
              aria-label="Log in"
            >
              <User className="h-5 w-5" />
            </Link>
          )}

        </div>
      </div>
    </header>
  );
}
