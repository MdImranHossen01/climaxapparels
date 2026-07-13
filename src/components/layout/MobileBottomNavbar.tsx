'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  ShoppingBag,
  ShoppingCart,
  Search,
  User,
  X,
  Mic,
  MicOff,
  LayoutDashboard,
  Settings,
  Truck,
  LogOut,
  Package
} from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';

export function MobileBottomNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { totalQuantity: cartCount } = useAppSelector((state) => state.cart);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profile, setProfile] = useState<any>(null);

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/shop', label: 'shop', icon: ShoppingBag },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
      setIsSearchOpen(false);
      setSearchTerm('');
    }
  };

  useEffect(() => {
    if (session) {
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => setProfile(data))
        .catch(err => console.error('Failed to fetch profile', err));
    }
  }, [session]);

  const accountHref = session ? '/dashboard' : '/login';

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-background border-t border-muted/50 pb-[env(safe-area-inset-bottom,1.5rem)]">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={`Go to ${item.label}`}
                className={`flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all relative ${isActive ? 'text-primary scale-110' : 'text-muted-foreground'
                  }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute -bottom-0.5 w-8 h-0.5 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}

          {/* Cart Item */}
          <CartDrawer>
            <div 
              aria-label="Open cart drawer"
              role="button"
              className="flex flex-col items-center justify-center gap-1 min-w-[64px] text-muted-foreground relative cursor-pointer active:scale-95 transition-transform"
            >
              <div className="relative">
                <ShoppingCart className="h-5 w-5 stroke-[1.5]" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                    {cartCount}
                  </span>
                )}
              </div>
            </div>
          </CartDrawer>

          {/* Search Item */}
          <button
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search products"
            className="flex flex-col items-center justify-center gap-1 min-w-[64px] text-muted-foreground active:scale-95 transition-transform"
          >
            <Search className="h-5 w-5 stroke-[1.5]" />
          </button>

          {/* Account Item */}
          {session ? (
            <Sheet open={isAccountOpen} onOpenChange={setIsAccountOpen}>
              <SheetTrigger asChild>
                <button 
                  aria-label="User account menu"
                  className="flex flex-col items-center justify-center gap-1 min-w-[64px] text-muted-foreground active:scale-95 transition-transform outline-none"
                >
                  <div className="h-6 w-6 rounded-full border border-primary/50 overflow-hidden">
                    <Image
                      src={session.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user?.name || '')}`}
                      alt={session.user?.name || 'User'}
                      width={24}
                      height={24}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-[2rem] border-t-0 p-6 bg-background z-[150] max-h-[85vh] overflow-y-auto">

                <div className="flex flex-col gap-6">
                  {/* Profile Header */}
                  <div className="flex items-center gap-4 border-b border-muted/50 pb-4">
                    <div className="h-14 w-14 rounded-full border-2 border-primary/50 overflow-hidden">
                      <Image
                        src={session.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user?.name || '')}`}
                        alt={session.user?.name || 'User'}
                        width={56}
                        height={56}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-lg leading-tight truncate">{session.user?.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{session.user?.email}</span>
                      {profile && (
                        <div className="mt-1.5 flex items-center gap-1.5 bg-primary/10 px-2.5 py-0.5 rounded-full w-fit border border-primary/20">
                          <Package className="h-3.5 w-3.5 text-primary" />
                          <span className="text-[11px] font-black text-primary">৳{profile.walletBalance || 0} Tokens</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions/Links */}
                  <div className="flex flex-col gap-1.5">
                    {/* Role Based Navigation */}
                    {(session.user as any)?.role === 'super_admin' && (
                      <>
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setIsAccountOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-sm font-medium transition-colors"
                        >
                          <LayoutDashboard className="h-5 w-5 text-primary" /> Admin Dashboard
                        </Link>
                        <Link
                          href="/admin/system-design"
                          onClick={() => setIsAccountOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-sm font-medium transition-colors"
                        >
                          <Settings className="h-5 w-5 text-primary" /> Infrastructure & Marketing
                        </Link>
                      </>
                    )}

                    {(session.user as any)?.role === 'admin' && (
                      <>
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setIsAccountOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-sm font-medium transition-colors"
                        >
                          <LayoutDashboard className="h-5 w-5 text-primary" /> Admin Dashboard
                        </Link>
                        <Link
                          href="/admin/orders"
                          onClick={() => setIsAccountOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-sm font-medium transition-colors"
                        >
                          <Truck className="h-5 w-5 text-primary" /> Manage Orders
                        </Link>
                      </>
                    )}

                    {(session.user as any)?.role === 'user' && (
                      <>
                        <Link
                          href="/dashboard"
                          onClick={() => setIsAccountOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-sm font-medium transition-colors"
                        >
                          <LayoutDashboard className="h-5 w-5 text-primary" /> Dashboard
                        </Link>

                        <Link
                          href="/track-order"
                          onClick={() => setIsAccountOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-sm font-medium transition-colors"
                        >
                          <Truck className="h-5 w-5 text-primary" /> Track Order
                        </Link>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => signOut({ callbackUrl: window.location.origin })}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/10 text-sm font-medium text-destructive transition-colors border border-destructive/20 mt-2"
                  >
                    <LogOut className="h-5 w-5" /> Sign Out
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Link
              href="/login"
              aria-label="Go to login page"
              className={`flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all relative ${pathname === '/login' ? 'text-primary scale-110' : 'text-muted-foreground'
                } active:scale-95 transition-transform`}
            >
              <User className={`h-5 w-5 ${pathname === '/login' ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile Search Overlay */}
      <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <SheetContent side="bottom" className="h-[200px] rounded-t-[2rem] border-t-0 p-6 bg-background z-[150]">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-center text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Search Products
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSearch} className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              autoFocus
              type="text"
              placeholder="What are you looking for?"
              className="w-full bg-muted/50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
