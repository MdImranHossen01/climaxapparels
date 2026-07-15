"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ShoppingCart,
  Heart,
  User,
  Search,
  Menu,
  Mic,
  MicOff,
  LayoutDashboard,
  LogOut,
  Settings,
  Package,
  Truck,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ModeToggle } from '@/components/mode-toggle';
import { useAppSelector } from '@/store/hooks';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { CategoryNav } from '@/components/layout/CategoryNav';
import { AIChatbot } from '@/components/layout/AIChatbot';
import { Logo } from '@/components/ui/logo';
import { useSettings } from '@/components/SettingsProvider';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Swal from 'sweetalert2';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/factory-profile', label: 'Factory Profile' },
  { href: '/catalog', label: 'Catalog' },
  { href: '/blog', label: 'Blogs' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [liveResults, setLiveResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<any>(null);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { totalQuantity: cartCount, totalAmount } = useAppSelector((state) => state.cart);
  const { items: wishlistItems } = useAppSelector((state) => state.wishlist);
  const settings = useSettings();

  const [categories, setCategories] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);


  useEffect(() => {
    const controller = new AbortController();
    async function fetchCats() {
      try {
        const res = await fetch('/api/categories', { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setCategories(data.filter((c: any) => c.isActive));
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error('Failed to fetch categories');
        }
      }
    }
    fetchCats();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    if (status === 'authenticated') {
      fetch('/api/user/profile', { signal: controller.signal })
        .then(res => {
          if (!res.ok) return null;
          return res.json();
        })
        .then(data => {
          if (isMounted && data) setProfile(data);
        })
        .catch(err => {
          if (err.name !== 'AbortError') {
            console.warn('Could not load user profile data');
          }
        });
    } else {
      setProfile(null);
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [status]);

  // Voice Search Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore if already stopped
        }
        recognitionRef.current.onstart = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current = null;
      }
      setIsListening(false);
    };
  }, []);

  const mainCategories = categories.filter(c => !c.parentCategory);

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

  const handleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      Swal.fire({
        title: 'Voice Search Unsupported',
        text: 'Voice search is not supported in your browser. Please use Google Chrome for the best experience.',
        icon: 'info',
        confirmButtonColor: '#00D1B2'
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
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      setIsListening(false);
      console.error('Speech recognition error', event.error);
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please enable it in browser settings.');
      } else if (event.error === 'network') {
        toast.error('Network error. Please check your connection.');
      } else if (event.error === 'no-speech') {
        toast.info('No speech detected. Please try again.');
      }
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      router.push(`/shop?search=${encodeURIComponent(transcript.trim())}`);
    };

    recognition.start();
  };

  return (
    <>
      {/* ── Main Header Bar ────────────────────────────────────────────── */}
      {/* Sticky on mobile, static on desktop — scrolls away on desktop so the  */}
      {/* bottom nav can then stick to the top of the viewport.                 */}
      <header className="sticky top-0 z-50 md:relative w-full bg-background border-b md:border-b-0">
        <div className="container mx-auto px-2 md:px-4">
          {/* Middle Main Row: Search | Logo | Icons */}
          <div className="relative flex h-14 md:h-20 items-center justify-between px-1 md:px-6 border-b border-muted/30">

            {/* Desktop Search (Left) */}
            <div ref={searchContainerRef} className="hidden md:flex flex-1 items-center max-w-[280px] relative">
              <form onSubmit={handleSearch} className="relative w-full group">
                <label htmlFor="navbar-search" className="sr-only">Search products</label>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  id="navbar-search"
                  type="text"
                  placeholder={isListening ? 'Listening...' : 'Search products...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => { if (liveResults.length > 0) setShowDropdown(true); }}
                  aria-label="Search products"
                  autoComplete="off"
                  className="w-full bg-muted/40 border-none rounded-full py-2.5 pl-10 pr-10 text-xs focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  title={isListening ? 'Stop listening' : 'Search by voice'}
                  aria-label={isListening ? 'Stop listening' : 'Search by voice'}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-muted-foreground hover:text-primary'}`}
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
                                  <p className="text-[11px] text-primary font-bold">${price?.toLocaleString()}</p>
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

            {/* Mobile Menu Trigger */}
            <div className="flex md:hidden items-center">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle mobile menu</span>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px]">
                  <nav className="flex flex-col gap-6 mt-12 px-2">
                    <Logo onClick={() => setOpen(false)} />
                    <div className="space-y-4 pt-6 border-t font-medium tracking-tight">
                      {navItems.map((item, index) => {
                        const isActive = pathname === item.href;
                        return (
                          <React.Fragment key={item.href}>
                            <Link
                              href={item.href}
                              className={`block px-4 py-2 rounded-xl transition-all ${isActive
                                ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20'
                                : 'hover:text-primary font-medium'
                                }`}
                              onClick={() => setOpen(false)}
                            >
                              {item.label}
                            </Link>
                            {/* Insert Categories Accordion after Home (index 0) */}
                            {index === 0 && (
                              <Accordion type="single" collapsible>
                                <AccordionItem value="cats" className="border-none">
                                  <AccordionTrigger className="py-2 hover:no-underline uppercase text-[12px] font-bold tracking-[0.2em] text-left">Categories</AccordionTrigger>
                                  <AccordionContent className="pt-2 pl-4 flex flex-col gap-3">
                                    {mainCategories.map(cat => (
                                      <Link
                                        key={cat._id}
                                        href={`/shop?category=${cat.slug}`}
                                        onClick={() => setOpen(false)}
                                        className="hover:text-primary text-[11px] font-bold uppercase tracking-[0.1em]"
                                      >
                                        {cat.name}
                                      </Link>
                                    ))}
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>

            {/* Logo (Centered in desktop, Left-ish in mobile) */}
            <div className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 flex items-center justify-center">
              <Logo 
                imageClassName="md:size-16" 
                textClassName="text-lg md:text-3xl whitespace-nowrap" 
                sizes="(max-width: 768px) 24px, 64px"
              />
            </div>

            {/* Icons/Action Row (Right) */}
            <div className="flex items-center justify-end gap-1 flex-1 max-w-[320px]">

              {/* Theme Toggle (Left of group) */}
              <div className="hidden sm:block">
                <ModeToggle />
              </div>



              {/* Wishlist */}
              <Link
                href="/dashboard/wishlist"
                className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl transition-all cursor-pointer hover:text-primary hover:scale-110"
                aria-label="Wishlist"
                onClick={(e) => {
                  if (status !== 'authenticated') {
                    e.preventDefault();
                    toast.error('Please login to view your wishlist');
                  }
                }}
              >
                <div className="relative">
                  <Heart className="h-5 w-5" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 bg-primary text-[8px] font-bold text-white flex items-center justify-center rounded-full shadow-sm animate-in fade-in zoom-in duration-300">
                      {wishlistItems.length}
                    </span>
                  )}
                </div>
              </Link>

              {/* Cart */}
              <div className="hidden md:block">
                <CartDrawer>
                  <div
                    className="flex items-center gap-2 group cursor-pointer hover:text-primary px-2 py-1.5 rounded-full transition-all hover:scale-110 active:scale-95"
                    aria-label="Shopping Cart"
                    role="button"
                  >
                    <div className="relative">
                      <ShoppingCart className="h-5 w-5 stroke-[1.5]" />
                      {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 h-4 w-4 bg-primary text-white text-[8px] font-black rounded-full flex items-center justify-center animate-in zoom-in">
                          {cartCount}
                        </span>
                      )}
                    </div>
                    <div className="hidden lg:flex flex-col text-left">
                      <span className="text-[10px] font-bold leading-none tracking-tighter">${totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </CartDrawer>
              </div>

              {/* User Account (Right end) */}
              <div className="hidden md:flex items-center">
                {status === 'authenticated' && session?.user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all cursor-pointer outline-none group hover:scale-110"
                        aria-label="Account menu"
                      >
                        <div className="h-8 w-8 rounded-full border-2 border-primary/20 overflow-hidden group-hover:border-primary transition-all">
                          <Image
                            src={session.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user?.name || 'U')}`}
                            alt={session.user?.name || 'User'}
                            width={32}
                            height={32}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className="hidden sm:block text-xs font-bold text-gray-700 group-hover:text-primary transition-colors">
                          {session.user?.name?.split(' ')[0]}
                        </span>
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
                                <span className="text-[10px] font-bold text-primary">${profile.walletBalance || 0} Tokens</span>
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
                    className="h-10 w-10 flex items-center justify-center rounded-xl transition-all cursor-pointer hover:text-primary"
                    aria-label="Log in"
                  >
                    <User className="h-5 w-5" />
                  </Link>
                )}
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* ΓöÇΓöÇ Bottom Navigation Row ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      {/* Siblings with <header> so sticky works relative to the viewport,      */}
      {/* not the parent's bounding box. Only visible on desktop (md+).         */}
      <nav className="hidden md:flex sticky top-0 z-40 w-full h-12 items-center justify-center border-b bg-background/95 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 flex justify-center">
          <ul className="flex items-center gap-10">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href;

              return (
                <React.Fragment key={item.href}>
                  <li className="flex items-center">
                    <Link
                      href={item.href}
                      className={`text-[12px] font-bold uppercase tracking-[0.25em] transition-all px-4 py-1.5 rounded-full ${isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'text-foreground/70 hover:text-primary'
                        }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                  {/* Insert CategoryNav after Home (index 0) */}
                  {index === 0 && (
                    <li className="flex items-center h-full">
                      <CategoryNav />
                    </li>
                  )}
                </React.Fragment>
              );
            })}
          </ul>
        </div>
      </nav>
    </>
  );
}
