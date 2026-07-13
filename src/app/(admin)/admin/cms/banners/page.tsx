'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Swal from 'sweetalert2';

export default function BannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/admin/banners');
      if (!response.ok) {
        toast.error(`Failed to fetch banners: ${response.status} ${response.statusText}`);
        return;
      }
      const data = await response.json();
      setBanners(data);
    } catch (error) {
      toast.error('Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete the banner "${title}". This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00D1B2', // Climax Apparels primary color roughly
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      background: '#fff',
      customClass: {
        popup: 'rounded-xl',
        confirmButton: 'rounded-lg px-4 py-2 font-bold',
        cancelButton: 'rounded-lg px-4 py-2 font-bold'
      }
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/admin/banners/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Banner deleted successfully');
          fetchBanners();
        } else {
          toast.error('Failed to delete banner');
        }
      } catch (error) {
        toast.error('Error deleting banner');
      }
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        toast.success(`Banner ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchBanners();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Promotional Banners</h1>
          <p className="text-muted-foreground text-sm">Manage banners appearing in the homepage hero slider</p>
        </div>
        <Link href="/admin/cms/banners/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Banner
          </Button>
        </Link>
      </div>

      <div className="rounded-md border bg-background overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[180px]">Preview</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Primary CTA</TableHead>
              <TableHead>Secondary CTA</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading banners...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : banners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-lg font-medium">No banners found</p>
                    <p className="text-sm text-muted-foreground">Add your first promotional banner to get started.</p>
                    <Link href="/admin/cms/banners/new" className="mt-2">
                      <Button variant="outline" size="sm">Add Banner</Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              banners.map((banner) => (
                <TableRow key={banner._id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="aspect-[21/9] w-full overflow-hidden rounded-md border bg-muted relative">
                      <Image
                        src={banner.image}
                        alt={banner.title}
                        width={180}
                        height={77}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{banner.title}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {banner.order}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => toggleStatus(banner._id, banner.isActive)}
                      className="transition-opacity hover:opacity-80"
                    >
                      <Badge variant={banner.isActive ? 'default' : 'secondary'} className="cursor-pointer">
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{banner.primaryBtnText || 'Shop Now'}</span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                        {banner.primaryBtnLink || 'No link'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{banner.secondaryBtnText || 'Contact'}</span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                        {banner.secondaryBtnLink || 'No link'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/cms/banners/${banner._id}/edit`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-primary hover:bg-primary/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(banner._id, banner.title)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

