/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Search, User, Heart, Menu, X, LogOut, LayoutDashboard, Settings, Truck, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store/hooks';
import { useSession, signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { CartDrawer } from '@/components/layout/CartDrawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { MobileNavbar } from '@/components/layout/MobileNavbar';

export default function NavbarV3() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [liveResults, setLiveResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartItemsCount = useAppSelector((state) => state.cart.items.reduce((total, item) => total + item.quantity, 0));
  const wishlistCount = useAppSelector((state) => state.wishlist.items.length);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data.filter((c: any) => c.isActive && !c.parentCategory)))
      .catch(err => console.error('Failed to fetch categories', err));
  }, []);

  useEffect(() => {
    if (session) {
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => setProfile(data))
        .catch(err => console.error('Failed to fetch profile', err));
    } else {
      setProfile(null);
    }
  }, [session]);

  // Live search debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = searchTerm.trim();
    if (!trimmed) { setLiveResults([]); setShowDropdown(false); return; }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(trimmed)}&limit=6`);
        if (res.ok) { const data = await res.json(); setLiveResults(data.products || []); setShowDropdown(true); }
      } catch { /* silent */ } finally { setIsSearching(false); }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchTerm]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false); setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm(''); setShowDropdown(false); setSearchOpen(false); setLiveResults([]);
    }
  };
  const handleResultClick = () => { setShowDropdown(false); setSearchTerm(''); setLiveResults([]); setSearchOpen(false); };


  const NAV_LINKS = [
    { label: 'Shop', href: '/shop' },
    { label: 'Curated', href: '/categories' },
    { label: 'Journal', href: '/blog' }
  ];

  return (
    <>
      {/* ── Mobile Top Bar (V1 Standard) — lg:hidden ──────────────── */}
      <MobileNavbar navItems={NAV_LINKS} categories={categories} />

      {/* ── Desktop Header ─────────────────────────────────────────── */}
      <header className="hidden lg:block w-full bg-white border-b border-neutral-100 sticky top-0 z-50 animate-in fade-in duration-1000">
        <div className="container mx-auto px-4 lg:px-12">
          {/* Top Minimal Bar */}
          <div className="py-2.5 text-center text-[9px] font-black tracking-[0.4em] uppercase text-neutral-400 border-b border-neutral-50/50">
            Curating the Finest Selections • Worldwide Priority Shipping
          </div>

          {/* Main Nav */}
          <div className="flex items-center justify-between py-6">

            {/* Left: Desktop Menu */}
            <nav className="hidden lg:flex items-center gap-12">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-[10px] font-black uppercase tracking-[0.2em] hover:text-primary transition-all duration-300"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Trigger */}
            <div className="lg:hidden">
              <MobileMenu navItems={NAV_LINKS} categories={categories} session={session} />
            </div>

            {/* Center: Logo */}
            <div className="absolute left-1/2 -translate-x-1/2">
              <Link href="/" className="text-4xl font-serif tracking-widest italic hover:opacity-60 transition-opacity">
                Climax Apparels
              </Link>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-8">
              {/* Expandable Search */}
              <div ref={searchContainerRef} className="relative hidden sm:flex items-center">
                {searchOpen ? (
                  <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      autoComplete="off"
                      autoFocus
                      className="w-52 border-b border-neutral-300 focus:border-primary outline-none py-1 text-sm bg-transparent transition-all"
                    />
                    <button type="button" onClick={() => { setSearchOpen(false); setSearchTerm(''); setShowDropdown(false); setLiveResults([]); }} className="hover:text-primary transition-all">
                      <X className="h-4 w-4" />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 50); }}
                    className="hover:text-primary transition-all hover:scale-110 outline-none"
                    aria-label="Open search"
                  >
                    <Search className="h-5 w-5 stroke-[1.5]" />
                  </button>
                )}
                {showDropdown && (
                  <div className="absolute top-full left-0 mt-3 w-72 bg-background border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground text-xs">
                        <div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" /> Searching...
                      </div>
                    ) : liveResults.length > 0 ? (
                      <>
                        <ul className="divide-y divide-border/50">
                          {liveResults.map((product) => {
                            const price = product.salePrice ?? product.price;
                            const image = product.images?.[0];
                            return (
                              <li key={product._id}>
                                <Link href={`/products/${product.slug}`} onClick={handleResultClick} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors group">
                                  {image ? (
                                    <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                                      <Image src={image} alt={product.name} width={40} height={40} className="h-full w-full object-cover" />
                                    </div>
                                  ) : (
                                    <div className="h-10 w-10 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center">
                                      <Search className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">{product.name}</p>
                                    <p className="text-[11px] text-primary font-bold">৳{price?.toLocaleString()}</p>
                                  </div>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                        <div className="border-t border-border/50 px-4 py-2.5">
                          <Link href={`/shop?search=${encodeURIComponent(searchTerm.trim())}`} onClick={handleResultClick} className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                            <Search className="h-3 w-3" /> See all results for &ldquo;{searchTerm}&rdquo;
                          </Link>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center py-6 text-muted-foreground text-xs gap-1">
                        <Search className="h-5 w-5 mb-1 opacity-40" /> No results found for &ldquo;{searchTerm}&rdquo;
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Link
                href="/dashboard/wishlist"
                aria-label="Wishlist"
                className="relative hidden sm:block group hover:scale-110 transition-all"
                onClick={(e) => {
                  if (status !== 'authenticated') {
                    e.preventDefault();
                    toast.error('Please login to view your wishlist');
                  }
                }}
              >
                <Heart className={`h-5 w-5 stroke-[1.5] group-hover:fill-primary group-hover:text-primary transition-all ${wishlistCount > 0 ? 'fill-primary text-primary' : ''}`} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 h-4 w-4 bg-primary text-white text-[8px] font-black rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-1 py-1 rounded-full border border-neutral-200 hover:bg-transparent transition-all cursor-pointer outline-none group hover:scale-110">
                      <div className="h-8 w-8 rounded-full overflow-hidden group-hover:scale-110 transition-transform">
                        <Image
                          src={session.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user?.name || "User")}&background=random`}
                          alt={session.user?.name || "User Profile"}
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="hidden sm:block text-xs font-bold text-neutral-700 pr-2">
                        {session.user?.name?.split(' ')[0]}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="font-serif">
                        <div className="flex flex-col text-foreground">
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
                <Link href="/login" className="hidden sm:block">
                  <User className="h-5 w-5 stroke-[1.5] hover:text-primary transition-colors" />
                </Link>
              )}

              <div className="hidden md:block">
                <CartDrawer>
                  <div className="flex items-center gap-3 group cursor-pointer hover:scale-110 transition-all">
                    <div className="relative">
                      <ShoppingBag className="h-5 w-5 stroke-[1.5] group-hover:text-primary transition-all" />
                      {cartItemsCount > 0 && (
                        <span className="absolute -top-2 -right-2 h-4 w-4 bg-black text-white text-[8px] font-black rounded-full flex items-center justify-center">
                          {cartItemsCount}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden md:block border-b-2 border-transparent group-hover:border-primary transition-all">Atelier</span>
                  </div>
                </CartDrawer>
              </div>
            </div>

          </div>
        </div>

      </header>
    </>
  );
}

