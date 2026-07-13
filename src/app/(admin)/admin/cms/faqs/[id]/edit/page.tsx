'use client';

import { useState, useEffect, use } from 'react';
import { FAQForm } from '@/components/admin/FAQForm';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditFAQPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [faq, setFaq] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFaq() {
      try {
        const response = await fetch('/api/admin/faqs');
        if (response.ok) {
          const faqs = await response.json();
          const found = faqs.find((f: any) => f._id === id);
          if (found) {
            setFaq(found);
          } else {
            toast.error('FAQ not found');
          }
        }
      } catch (error) {
        toast.error('Failed to load FAQ');
      } finally {
        setLoading(false);
      }
    }
    fetchFaq();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!faq) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-muted-foreground">FAQ not found or could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6">
      <FAQForm initialData={faq} />
    </div>
  );
}

