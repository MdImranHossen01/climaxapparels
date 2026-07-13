'use client';

import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
    ShoppingBag, 
    User as UserIcon, 
    Settings, 
    LogOut,
    Loader2,
    Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { signOut } from 'next-auth/react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user) {
      const role = (session.user as any)?.role;
      if (role === 'admin' || role === 'super_admin') {
        router.push('/admin/dashboard');
      }
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Prevent rendering protected layout content if pushed back to login
  if (status === 'unauthenticated') {
     return null;
  }

  return (
    <div className="container px-4 md:px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-lg mb-4 overflow-hidden relative">
                  {session?.user?.image ? (
                     <Image 
                       src={session.user.image} 
                       alt={session?.user?.name || "Profile"} 
                       width={80}
                       height={80}
                       className="h-full w-full object-cover" 
                       referrerPolicy="no-referrer"
                     />
                  ) : (
                     <UserIcon className="h-10 w-10 text-primary" />
                  )}
              </div>
              <CardTitle className="text-xl font-bold">{session?.user?.name}</CardTitle>
              <CardDescription>{session?.user?.email}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="flex flex-col">
                <Link 
                  href="/dashboard" 
                  className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    "justify-start px-6 h-12 rounded-none border-l-4 w-full",
                    pathname === '/dashboard' ? 'border-primary bg-muted/50' : 'border-transparent'
                  )}
                >
                  <ShoppingBag className="mr-3 h-4 w-4" /> My Orders
                </Link>
                <Link 
                  href="/dashboard/wishlist" 
                  className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    "justify-start px-6 h-12 rounded-none border-l-4 w-full",
                    pathname === '/dashboard/wishlist' ? 'border-primary bg-muted/50' : 'border-transparent'
                  )}
                >
                  <Heart className="mr-3 h-4 w-4" /> Wishlist
                </Link>
                <Link 
                  href="/dashboard/profile" 
                  className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    "justify-start px-6 h-12 rounded-none border-l-4 w-full",
                    pathname === '/dashboard/profile' ? 'border-primary bg-muted/50' : 'border-transparent'
                  )}
                >
                  <UserIcon className="mr-3 h-4 w-4" /> Profile Info
                </Link>
                <Link 
                  href="/dashboard/settings" 
                  className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    "justify-start px-6 h-12 rounded-none border-l-4 w-full",
                    pathname === '/dashboard/settings' ? 'border-primary bg-muted/50' : 'border-transparent'
                  )}
                >
                  <Settings className="mr-3 h-4 w-4" /> Account Settings
                </Link>
                <Separator />
                <Button 
                    variant="ghost" 
                    className="justify-start px-6 h-12 rounded-none border-l-4 border-transparent text-destructive hover:bg-destructive/10"
                    onClick={() => signOut({ callbackUrl: window.location.origin })}
                >
                  <LogOut className="mr-3 h-4 w-4" /> Sign Out
                </Button>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
           {children}
        </div>
      </div>
    </div>
  );
}

