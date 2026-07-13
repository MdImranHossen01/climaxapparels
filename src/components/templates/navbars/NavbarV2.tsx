/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Heart,
  LogOut,
  LayoutDashboard,
  Settings,
  Truck,
  Mic,
  MicOff,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store/hooks';
import { useSession, signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { ModeToggle } from '@/components/mode-toggle';
import { AIChatbot } from '@/components/layout/AIChatbot';
import { useSettings } from '@/components/SettingsProvider';
import { MobileNavbar } from '@/components/layout/MobileNavbar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import Swal from 'sweetalert2';

import { CategoryNav } from '@/components/layout/CategoryNav';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MobileMenu } from '@/components/layout/MobileMenu';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/blog', label: 'Blogs' },
  { href: '/contact', label: 'Contact' },
];

export default function NavbarV2() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const settings = useSettings();

  const [isScrolled, setIsScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [liveResults, setLiveResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);

  const cartCount = useAppSelector((state) => state.cart.totalQuantity);
  const totalAmount = useAppSelector((state) => state.cart.totalAmount);
  const wishlistCount = useAppSelector((state) => state.wishlist.items.length);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch Categories for Mobile
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data.filter((c: any) => c.isActive && !c.parentCategory)))
      .catch(err => console.error('Failed to fetch categories', err));
  }, []);

  // Fetch Profile for Wallet Balance
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => setProfile(data))
        .catch(err => console.error('Failed to fetch profile', err));
    }
  }, [status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
      setShowDropdown(false);
      setLiveResults([]);
    }
  };

  const handleResultClick = () => { setShowDropdown(false); setSearchTerm(''); setLiveResults([]); };

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
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      Swal.fire({
        title: 'Voice Search Unsupported',
        text: 'Please use Chrome for voice search.',
        icon: 'info'
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      router.push(`/shop?search=${encodeURIComponent(transcript.trim())}`);
    };
    recognition.start();
  };

  const isHomePage = pathname === '/';

  return (
    <>
      {/* ── Mobile Top Bar (V1 Standard) — lg:hidden ──────────────── */}
      <MobileNavbar navItems={navItems} categories={categories} />

      {/* ── Desktop Navbar ─────────────────────────────────────────── */}
      <nav className={`
        hidden lg:block
        sticky top-0 left-0 right-0 z-50 w-full transition-all duration-500 font-jost
        bg-background border-b shadow-sm py-2
        ${isHomePage ? 'lg:fixed' : ''}
        ${isHomePage && !isScrolled ? 'lg:bg-transparent lg:border-none lg:shadow-none lg:py-4' : ''}
        ${isHomePage && isScrolled ? 'lg:bg-background/80 lg:backdrop-blur-md lg:shadow-md lg:py-2' : ''}
      `}>
        <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">

          {/* Left: Logo & Mobile Menu */}
          <div className="flex items-center gap-2">
            <MobileMenu
              navItems={navItems}
              categories={categories}
              session={session}
              triggerClassName={!isHomePage || isScrolled ? 'text-foreground hover:text-primary' : 'text-white hover:text-white/70'}
            />

            <Link href="/" className={`text-2xl md:text-3xl font-black tracking-tighter hover:scale-105 transition-all flex items-center gap-2 group ${!isHomePage || isScrolled ? 'text-foreground' : 'text-white'}`}>
              <Image src="/logo.webp" width={40} height={40} alt="Climax Apparels Logo" className="object-contain" />
              {settings?.brandName || 'Climax Apparels'}
            </Link>
          </div>

          {/* Center: Search Bar (Desktop) */}
          <div ref={searchContainerRef} className="hidden lg:flex flex-1 max-w-md mx-8 relative">
            <form className="relative w-full group" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder={isListening ? 'Listening...' : 'Search products...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => { if (liveResults.length > 0) setShowDropdown(true); }}
                autoComplete="off"
                className={`w-full border border-transparent focus:border-primary/50 px-10 py-2.5 rounded-full text-sm transition-all outline-none ${!isHomePage || isScrolled ? 'bg-muted/50 focus:bg-background text-foreground' : 'bg-white/10 focus:bg-white/20 text-white placeholder:text-white/60'}`}
              />
              <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${!isHomePage || isScrolled ? 'text-muted-foreground group-focus-within:text-primary' : 'text-white/70 group-focus-within:text-white'}`} />
              <button
                type="button"
                onClick={handleVoiceSearch}
                title={isListening ? 'Stop listening' : 'Search by voice'}
                aria-label={isListening ? 'Stop listening' : 'Search by voice'}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors ${isListening ? 'text-red-500 animate-pulse' : ((!isHomePage || isScrolled) ? 'text-muted-foreground hover:text-primary' : 'text-white/70 hover:text-white')}`}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            </form>
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
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

          {/* Right: Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            <ul className="hidden lg:flex items-center gap-6 mr-4">
              {navItems.map((item, index) => (
                <React.Fragment key={item.label}>
                  <li>
                    <Link
                      href={item.href}
                      className={`text-xs font-bold uppercase tracking-widest relative group transition-colors ${(!isHomePage || isScrolled)
                        ? (pathname === item.href ? 'text-foreground' : 'text-foreground/70 hover:text-primary')
                        : (pathname === item.href ? 'text-white' : 'text-white/80 hover:text-white')
                        }`}
                    >
                      {item.label}
                      <span className={`absolute -bottom-1 left-0 h-[2px] transition-all duration-300 ${(!isHomePage || isScrolled) ? 'bg-foreground' : 'bg-white'
                        } ${pathname === item.href ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                    </Link>
                  </li>
                  {index === 0 && (
                    <li>
                      <CategoryNav isScrolled={!isHomePage || isScrolled} />
                    </li>
                  )}
                </React.Fragment>
              ))}
            </ul>

            <div className="flex items-center gap-1 md:gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <ModeToggle />
              </div>

              <Link href="/dashboard/wishlist" aria-label="Wishlist">
                <Button variant="ghost" size="icon" aria-label="Wishlist" className={`rounded-full relative group ${!isHomePage || isScrolled ? 'text-foreground hover:bg-muted' : 'text-white hover:bg-white/10'}`}>
                  <Heart className={`h-5 w-5 transition-all ${wishlistCount > 0 ? 'fill-primary text-primary' : ((!isHomePage || isScrolled) ? 'group-hover:text-primary' : 'group-hover:text-white')}`} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-[9px] font-black text-white rounded-full flex items-center justify-center animate-in zoom-in">
                      {wishlistCount}
                    </span>
                  )}
                </Button>
              </Link>

              <div className="hidden md:block">
                <CartDrawer>
                  <div className="relative group cursor-pointer">
                    <Button variant="ghost" size="icon" className={`rounded-full relative pointer-events-none ${!isHomePage || isScrolled ? 'text-foreground hover:bg-muted' : 'text-white hover:bg-white/10'}`}>
                      <ShoppingCart className={`h-5 w-5 transition-all ${(!isHomePage || isScrolled) ? 'group-hover:text-primary' : 'group-hover:text-white'}`} />
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-[9px] font-black text-white rounded-full flex items-center justify-center animate-in zoom-in">
                          {cartCount}
                        </span>
                      )}
                    </Button>
                    <div className="hidden xl:block absolute -bottom-8 right-0 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">৳{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </CartDrawer>
              </div>

              <div className="hidden md:flex items-center">
                <div className="hidden md:block h-6 w-[1px] bg-muted mx-1 mr-2" />

                {status === 'authenticated' && session?.user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 group cursor-pointer outline-none">
                        <div className="h-9 w-9 rounded-full border-2 border-primary/50 overflow-hidden group-hover:scale-110 transition-transform">
                          <Image
                            src={session.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user?.name || '')}`}
                            alt={session.user?.name || 'User'}
                            width={36}
                            height={36}
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
                              <div className="mt-1.5 flex items-center gap-1.5 bg-primary/10 px-2.5 py-0.5 rounded-full w-fit border border-primary/20">
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
                  <Link href="/login">
                    <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-black text-[10px] uppercase tracking-widest px-6 h-10 shadow-lg shadow-primary/20">
                      Login
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

      </nav>
    </>
  );
}
