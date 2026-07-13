'use client';

import { useState, useEffect } from 'react';
import { Star, MessageSquare, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { useSearchParams } from 'next/navigation';

interface ReviewsSectionProps {
  productId: string;
}

export default function ReviewsSection({ productId }: ReviewsSectionProps) {
  const searchParams = useSearchParams();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    if (searchParams.get('review') === 'true' && eligibility?.eligible) {
      const element = document.getElementById('review-form');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [searchParams, eligibility?.eligible]);

  const fetchData = async () => {
    try {
      const encodedProductId = encodeURIComponent(productId);
      const [reviewsRes, eligibilityRes] = await Promise.all([
        fetch(`/api/reviews?productId=${encodedProductId}`),
        fetch(`/api/reviews/check-eligibility?productId=${encodedProductId}`)
      ]);

      if (reviewsRes.ok) setReviews(await reviewsRes.json());
      if (eligibilityRes.ok) setEligibility(await eligibilityRes.json());
    } catch (error) {
      console.error('Fetch Reviews Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.comment.length < 5) {
      toast.error('Comment must be at least 5 characters long');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating: formData.rating,
          comment: formData.comment
        })
      });

      if (res.ok) {
        toast.success('Review submitted successfully!');
        setFormData({ rating: 5, comment: '' });
        setEligibility((prev: any) => ({ ...(prev ?? {}), alreadyReviewed: true, eligible: false }));
        fetchData(); // Refresh reviews list
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to submit review');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-10">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );

  const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Customer Reviews
            <Badge variant="secondary" className="rounded-full">{reviews.length}</Badge>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Real feedback from verified Climax Apparels customers.
          </p>
        </div>

        {/* Rating Summary Card if exists */}
        {reviews.length > 0 && (
          <div className="bg-muted/30 p-4 rounded-xl border flex items-center gap-6">
            <div className="text-center">
              <span className="text-4xl font-extrabold text-primary">
                {averageRating.toFixed(1)}
              </span>
              <div className="flex text-yellow-500 mt-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  const frac = Math.min(1, Math.max(0, averageRating - i));
                  return (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${frac >= 1 ? 'fill-current' : frac > 0 ? 'fill-current opacity-50' : 'text-muted'}`}
                    />
                  );
                })}
              </div>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div className="text-sm font-medium">
              Verified Purchases <br />
              <span className="text-muted-foreground font-normal">100% Satisfaction</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Review Form (Conditional) */}
        {eligibility?.eligible && (
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-2xl border bg-card shadow-sm sticky top-24">
              <h3 className="text-lg font-bold mb-4">Write a Review</h3>

              <form id="review-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Your Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: s })}
                        className={`p-2 rounded-md transition-all ${formData.rating >= s ? 'bg-yellow-100 text-yellow-600 scale-110' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                      >
                        <Star className={`h-5 w-5 ${formData.rating >= s ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">Feedback</label>
                  <Textarea
                    placeholder="Share your experience with this product..."
                    className="resize-none min-h-[120px] rounded-xl focus-visible:ring-primary"
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-full h-11 font-bold"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                  Submit Review
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Right: Reviews List */}
        <div className={eligibility?.eligible ? "lg:col-span-2 space-y-8" : "lg:col-span-3 space-y-8"}>
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 border-2 border-dashed rounded-3xl">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h4 className="font-bold text-lg mb-1">No reviews yet</h4>
              <p className="text-muted-foreground text-sm max-w-xs">
                Be the first verified customer to share your experience with this product.
              </p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review._id} className="group animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary flex-shrink-0">
                    {(review.user?.name?.[0] ?? review.name?.[0] ?? '').toUpperCase()}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="font-bold flex items-center gap-1.5">
                          {review.user?.name || review?.name}
                          <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none text-[8px] h-4 uppercase font-bold tracking-tighter">
                            <CheckCircle2 className="h-2 w-2 mr-0.5" /> Verified Purchase
                          </Badge>
                        </span>
                        <div className="flex text-yellow-400 mt-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${i < review.rating ? 'fill-current' : 'text-muted'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground italic">
                        {format(new Date(review.createdAt), 'MMMM dd, yyyy')}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap italic">
                      "{review.comment}"
                    </p>
                  </div>
                </div>
                <Separator className="mt-8 opacity-50" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

