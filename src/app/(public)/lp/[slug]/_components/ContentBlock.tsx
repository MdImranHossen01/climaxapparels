'use client'; 
import DOMPurify from 'isomorphic-dompurify';
import { generateHtml } from '@/lib/server-html';

export default function ContentBlock({ content }: { content: any }) {
  // Convert JSON-structured or plain HTML to clean HTML
  const rawHTML = generateHtml(content.content);
  // Sanitize HTML to prevent XSS attacks
  const sanitizedHTML = DOMPurify.sanitize(rawHTML || '');

  return (
    <div className="container mx-auto px-4 max-w-4xl prose prose-lg">
      <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
    </div>
  );
}
