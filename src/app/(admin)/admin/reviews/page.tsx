'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  MessageSquare,
  Star,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import Swal from 'sweetalert2';

export default function ReviewsModerationPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/admin/reviews');
      if (!res.ok) throw new Error('Failed to load reviews');
      const data = await res.json();
      setReviews(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast.success(`Review ${status}`);
        fetchReviews();
      } else {
        toast.error('Failed to update review status');
      }
    } catch (error) {
      toast.error('Error updating review status');
    }
  };

  const deleteReview = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This review will be permanently deleted!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00D1B2',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      customClass: {
        popup: 'rounded-xl',
        confirmButton: 'rounded-lg px-4 py-2 font-bold',
        cancelButton: 'rounded-lg px-4 py-2 font-bold'
      }
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/admin/reviews/${id}`, {
          method: 'DELETE',
        });

        if (res.ok) {
          toast.success('Review deleted');
          fetchReviews();
        } else {
          toast.error('Failed to delete review');
        }
      } catch (error) {
        toast.error('Error deleting review');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-none">Pending</Badge>;
      case 'approved': return <Badge variant="secondary" className="bg-green-100 text-green-800 border-none">Approved</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pt-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Review Moderation</h1>
        <Badge variant="outline" className="px-3 py-1">
          {reviews.filter(r => r.status === 'pending').length} Pending Reviews
        </Badge>
      </div>
      
      <div className="rounded-md border bg-background overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[200px]">Product</TableHead>
              <TableHead className="w-[150px]">Customer</TableHead>
              <TableHead className="w-[100px]">Rating</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="text-right w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No reviews found for moderation.
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((review) => (
                <TableRow key={review._id} className={review.status === 'pending' ? 'bg-yellow-50/30' : ''}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-sm truncate max-w-[180px]">{review.product?.name}</span>
                      {review.product?.slug && (
                        <Link 
                          href={`/product/${review.product?.slug}`} 
                          target="_blank"
                          className="text-[10px] text-primary flex items-center gap-1 hover:underline"
                        >
                          View Product <ExternalLink className="h-2 w-2" />
                        </Link>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span className="font-semibold">{review.user?.name || review.name}</span>
                      <span className="text-muted-foreground truncate max-w-[140px]">{review.user?.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="font-bold text-sm">{review.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs text-muted-foreground line-clamp-2 max-w-[300px]" title={review.comment}>
                      {review.comment}
                    </p>
                    <span className="text-[10px] text-muted-foreground italic block mt-1">
                      {review.createdAt && !isNaN(new Date(review.createdAt).getTime()) 
                        ? format(new Date(review.createdAt), 'MMM dd, yyyy')
                        : 'Date N/A'}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(review.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {review.status !== 'approved' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-green-600 hover:text-green-700 hover:bg-green-50" 
                          onClick={() => updateStatus(review._id, 'approved')}
                          title="Approve"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {review.status !== 'rejected' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10" 
                          onClick={() => updateStatus(review._id, 'rejected')}
                          title="Reject"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/5" 
                        onClick={() => deleteReview(review._id)}
                        title="Delete Forever"
                      >
                        <Trash2 className="h-4 w-4" />
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

