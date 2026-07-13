'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  Copy,
  Eye,
  BarChart2,
  Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

export default function LandingPagesPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/admin/landing-pages');
      const data = await res.json();
      setPages(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load landing pages');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/admin/landing-pages/${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('Page deleted successfully');
          fetchPages();
        } else {
          throw new Error('Failed to delete');
        }
      } catch (error) {
        toast.error('Could not delete page');
      }
    }
  };

  const handleCreate = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Create New Landing Page',
      html:
        '<input id="swal-title" class="swal2-input" placeholder="Page Title">' +
        '<input id="swal-slug" class="swal2-input" placeholder="Slug (e.g. skin-care-deal)">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Create Page',
      preConfirm: () => {
        return {
          title: (document.getElementById('swal-title') as HTMLInputElement).value,
          slug: (document.getElementById('swal-slug') as HTMLInputElement).value
        }
      }
    });

    if (formValues) {
      if (!formValues.title || !formValues.slug) {
        toast.error('Title and Slug are required');
        return;
      }

      try {
        const res = await fetch('/api/admin/landing-pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formValues)
        });

        if (res.ok) {
          const newPage = await res.json();
          toast.success('Landing Page Created!');
          fetchPages();
        } else {
          const err = await res.json();
          toast.error(err.message || 'Failed to create');
        }
      } catch (error) {
        toast.error('Error creating page');
      }
    }
  };

  const filteredPages = pages.filter(p => {
    const searchTerm = (search || '').toLowerCase();
    const title = (p.title || '').toLowerCase();
    const slug = (p.slug || '').toLowerCase();
    return title.includes(searchTerm) || slug.includes(searchTerm);
  });

  return (
    <div className="px-0 py-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Monitor className="h-6 w-6 text-primary" />
            Landing Pages
          </h1>
          <p className="text-muted-foreground text-sm">Create high-converting landing pages for your products.</p>
        </div>
        <Button onClick={handleCreate} className="gap-2 rounded-full px-6 font-bold">
          <Plus className="h-4 w-4" /> Create New Page
        </Button>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search pages..." 
            className="pl-9 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-2xl bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Title & URL</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold text-center">Sections</TableHead>
              <TableHead className="font-bold text-center">Orders</TableHead>
              <TableHead className="font-bold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">Loading pages...</TableCell>
              </TableRow>
            ) : filteredPages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No landing pages found. Create your first one!</TableCell>
              </TableRow>
            ) : filteredPages.map((page) => (
              <TableRow key={page._id} className="hover:bg-muted/20 transition-colors">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{page.title}</span>
                    <Link 
                      href={`/lp/${page.slug}`} 
                      target="_blank" 
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      /lp/{page.slug} <ExternalLink className="h-2 w-2" />
                    </Link>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={page.isActive ? "default" : "secondary"} className="rounded-full px-3">
                    {page.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="rounded-md font-mono">
                    {page.sections?.length || 0}
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-bold text-emerald-600">
                  {page.orderCount || 0}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl w-48 shadow-xl">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href={`/admin/landing-pages/${page._id}/builder`} className="flex items-center gap-2">
                          <Edit3 className="h-4 w-4 text-blue-500" /> Open Builder
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => window.open(`/lp/${page.slug}`, '_blank')}>
                        <Eye className="h-4 w-4 text-emerald-500" /> View Live
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer gap-2">
                        <BarChart2 className="h-4 w-4 text-purple-500" /> Analytics
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="cursor-pointer gap-2 text-red-500 focus:text-red-500"
                        onClick={() => handleDelete(page._id)}
                      >
                        <Trash2 className="h-4 w-4" /> Delete Page
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
