import Link from 'next/link';
import { ShoppingBag, Users, LayoutDashboard, Settings, FileText, Image as ImageIcon, Tag, Monitor } from 'lucide-react';

export default function AdminSidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r bg-muted/40 md:flex">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link prefetch={false} href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-xl">Admin Panel</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          <Link prefetch={false}
            href="/admin/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link prefetch={false}
            href="/admin/categories"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <Tag className="h-4 w-4" />
            Categories
          </Link>
          <Link prefetch={false}
            href="/admin/products"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <ShoppingBag className="h-4 w-4" />
            Products
          </Link>
          <Link prefetch={false}
            href="/admin/orders"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <FileText className="h-4 w-4" />
            Orders
          </Link>
          <Link prefetch={false}
            href="/admin/users"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <Users className="h-4 w-4" />
            Users
          </Link>
          <Link prefetch={false}
            href="/admin/cms"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <ImageIcon className="h-4 w-4" />
            CMS Manager
          </Link>
          <Link prefetch={false}
            href="/admin/landing-pages"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <Monitor className="h-4 w-4" />
            Landing Pages
          </Link>
          <Link prefetch={false}
            href="/admin/marketing"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <Settings className="h-4 w-4" />
            Marketing Settings
          </Link>
          <Link prefetch={false}
            href="/admin/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </nav>
      </div>
    </aside>
  );
}

