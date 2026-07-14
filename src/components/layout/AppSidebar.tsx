"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronRight,
  LayoutDashboard,
  ShoppingBag,
  Tag,
  FileText,
  Users,
  Image as ImageIcon,
  Settings,
  Megaphone,
  Store,
  Mail
} from "lucide-react"
import { Logo } from "@/components/ui/logo"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Overview",
      url: "/admin/dashboard",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        {
          title: "Dashboard",
          url: "/admin/dashboard",
        }
      ],
    },
    {
      title: "Product Management",
      url: "#",
      icon: ShoppingBag,
      items: [
        {
          title: "All Products",
          url: "/admin/products",
        },
        {
          title: "Add Product",
          url: "/admin/products/new",
        },
        {
          title: "Categories",
          url: "/admin/categories",
        },
      ],
    },
    {
      title: "Sales & Orders",
      url: "#",
      icon: FileText,
      items: [
        {
          title: "All Orders",
          url: "/admin/orders",
        },
        {
          title: "Offers / Quotations",
          url: "/admin/offers",
        },
        {
          title: "Delivery Challans",
          url: "/admin/chalans",
        },
        {
          title: "Client Bills",
          url: "/admin/bills",
        },
        {
          title: "Abandoned Carts",
          url: "/admin/abandoned-carts",
        },
        {
          title: "Expenses",
          url: "/admin/expenses",
        },
        {
          title: "Accounts Ledger",
          url: "/admin/ledger",
        },
      ],
    },
    {
      title: "User Management",
      url: "#",
      icon: Users,
      items: [
        {
          title: "All Users",
          url: "/admin/users",
        },
      ],
    },
    {
      title: "CMS Manager",
      url: "#",
      icon: ImageIcon,
      items: [
        {
          title: "Banners",
          url: "/admin/cms/banners",
        },
        {
          title: "Landing Pages",
          url: "/admin/landing-pages",
        },
        {
          title: "Catalog",
          url: "/admin/catalog",
        },
        {
          title: "Testimonials",
          url: "/admin/cms/testimonials",
        },
        {
          title: "FAQs",
          url: "/admin/cms/faqs",
        },
      ],
    },
    {
      title: "Blogs",
      url: "#",
      icon: FileText,
      items: [
        {
          title: "Manage Blog",
          url: "/admin/blogs",
        },
        {
          title: "Add New Blog",
          url: "/admin/blogs/new",
        },
      ],
    },
    {
      title: "System Settings",
      url: "#",
      icon: Settings,
      items: [
        {
          title: "Coupons",
          url: "/admin/coupons",
        },
        {
          title: "General Settings",
          url: "/admin/settings",
        },
        {
          title: "Marketing Settings",
          url: "/admin/marketing",
        },
        {
          title: "Subscribers",
          url: "/admin/subscribers",
          icon: Mail,
        },
        {
          title: "Infrastructure & Marketing",
          url: "/admin/system-design",
          superOnly: true
        },
      ],
    },
  ],
}


import { useSession } from "next-auth/react"

function NavMain({ items, pathname, role }: { items: typeof data.navMain; pathname: string; role?: string }) {
  const { setOpenMobile, isMobile } = useSidebar()

  // Filter items based on role
  const filteredItems = items
    .filter(item => {
      if (role === 'manager') {
        const allowedSections = ["Overview", "Product Management", "Sales & Orders", "CMS Manager", "Blogs"];
        return allowedSections.includes(item.title);
      }
      return true;
    })
    .map(item => {
      let filteredSubItems = item.items.filter((subItem: any) => !subItem.superOnly || role === 'super_admin');
      if (role === 'manager' && item.title === "Sales & Orders") {
        filteredSubItems = filteredSubItems.filter(
          (subItem: any) => subItem.title !== "Expenses" && subItem.title !== "Accounts Ledger"
        );
      }
      return {
        ...item,
        items: filteredSubItems
      };
    })
    .filter(item => item.items.length > 0);

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarMenu>
        {filteredItems.map((item) => {
          const isParentActive =
            item.items.some(
              (subItem) =>
                pathname === subItem.url ||
                (subItem.url !== "#" &&
                  subItem.url !== "/admin" &&
                  pathname.startsWith(subItem.url + "/"))
            ) || pathname === item.url

          return (
            <Collapsible
              key={item.title}
              defaultOpen={isParentActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger render={<SidebarMenuButton tooltip={item.title} isActive={isParentActive} />}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-open/collapsible:rotate-90 group-[[data-state=open]]/collapsible:rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          render={<Link href={subItem.url} onClick={handleLinkClick} />}
                          isActive={
                            pathname === subItem.url ||
                            (subItem.url !== "#" &&
                              subItem.url !== "/admin" &&
                              pathname.startsWith(subItem.url + "/") &&
                              !item.items.some(
                                (otherItem) =>
                                  otherItem !== subItem &&
                                  otherItem.url.length > subItem.url.length &&
                                  (pathname === otherItem.url || pathname.startsWith(otherItem.url + "/"))
                              ))
                          }
                        >
                          <span>{subItem.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b h-14 lg:h-[60px] px-4 flex items-center">
        <Logo textClassName="text-sm md:text-base font-black tracking-wide whitespace-nowrap" />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <NavMain items={data.navMain} pathname={pathname} role={role} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

