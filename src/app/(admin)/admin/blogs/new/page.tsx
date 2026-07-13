'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, 
    Save, 
    Loader2, 
    Newspaper,
    Type,
    FileSearch,
    ImageIcon,
    Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageUpload } from '@/components/ui/image-upload';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import NovelEditor from '@/components/editor/NovelEditor';
import { slugify } from '@/lib/slugify';

const hasMeaningfulContent = (rawContent: string) => {
  if (!rawContent) return false;

  try {
    const parsed = JSON.parse(rawContent);
    const nodes = Array.isArray(parsed?.content) ? parsed.content : [];
    return nodes.some((node: { type?: string; text?: string; content?: { text?: string }[] }) => {
      if (!node) return false;
      if (node.type === 'image' || node.type === 'youtube') return true;
      if (!Array.isArray(node.content)) return false;
      return node.content.some((child) => (child?.text ?? '').trim().length > 0);
    });
  } catch {
    return rawContent.trim().length > 0;
  }
};

export default function CreateBlogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    metaTitle: '',
    metaDescription: '',
    content: '',
    thumbnail: '',
    isPublished: true,
  });
  const [imageLoadError, setImageLoadError] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    // Character limits checking with auto-truncation
    if (name === 'slug' || name === 'metaTitle' || name === 'title') {
        if (value.length > 100) processedValue = value.slice(0, 100);
    }
    if (name === 'metaDescription') {
        if (value.length > 200) processedValue = value.slice(0, 200);
    }

    if (name === 'thumbnail') {
      setImageLoadError(false);
    }

    setFormData(prev => {
      let finalValue = processedValue;
      if (name === 'slug') {
        finalValue = slugify(processedValue);
      }

      const newData = { ...prev, [name]: finalValue };
      
      // Auto-generate slug and meta title if the title is being changed
      if (name === 'title') {
        newData.slug = slugify(processedValue);
        newData.metaTitle = processedValue;
      }
      
      return newData;
    });
  };

  const handleImageError = () => {
    setImageLoadError(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasMeaningfulContent(formData.content)) {
      toast.error(formData.isPublished 
        ? 'Please write blog content before publishing.' 
        : 'Please write blog content before saving your draft.'
      );
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/admin/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Blog post created successfully!');
        router.push('/admin/blogs');
      } else {
        toast.error(data.message || 'Failed to create blog post');
      }
    } catch {
      toast.error('An error occurred while creating the blog');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/blogs">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Blogs
          </Button>
        </Link>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Newspaper className="h-6 w-6 text-primary" />
          Create New Blog
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Type className="h-4 w-4" /> Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">Blog Title *</label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter short, catchy title"
                  required
                  className="h-12 text-lg font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Slug / URL path *</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">alternativehsbd.com/blog/</span>
                  <Input
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="url-friendly-slug"
                    required
                    className="font-mono text-xs"
                  />
                </div>
                <div className="flex justify-end">
                  <span className={`text-[10px] ${formData.slug.length > 90 ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {formData.slug.length}/100
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Content *</label>
                 <NovelEditor 
                  onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                 />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" /> Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">Thumbnail Image</label>
                <ImageUpload 
                  value={formData.thumbnail}
                  onUpload={(url) => {
                    setFormData(prev => ({ ...prev, thumbnail: url }));
                    setImageLoadError(false);
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                  <FileSearch className="h-4 w-4" /> SEO Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">Meta Title *</label>
                <Input
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleChange}
                  placeholder="SEO friendly title"
                  required
                />
                <div className="flex justify-end">
                  <span className={`text-[10px] ${formData.metaTitle.length > 90 ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {formData.metaTitle.length}/100
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Meta Description *</label>
                <Textarea
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleChange}
                  placeholder="Short description for Google search results..."
                  required
                  className="h-24 resize-none"
                />
                <div className="flex justify-end">
                  <span className={`text-[10px] ${formData.metaDescription.length > 180 ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {formData.metaDescription.length}/200
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Publishing</CardTitle>
            </CardHeader>
            <CardContent>
              <label className="flex items-center gap-3 text-sm font-medium">
                <Checkbox
                  checked={formData.isPublished}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isPublished: Boolean(checked) }))
                  }
                />
                Publish immediately (uncheck to save as draft)
              </label>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full h-12 font-black text-lg gap-2 shadow-lg shadow-primary/20" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                {formData.isPublished ? 'Publish Post' : 'Save Draft'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

