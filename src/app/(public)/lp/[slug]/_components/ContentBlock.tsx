'use client'; 
import DOMPurify from 'isomorphic-dompurify';

export default function ContentBlock({ content }: { content: any }) {
  // Sanitize HTML to prevent XSS attacks
  const sanitizedHTML = DOMPurify.sanitize(content.content || '');

  return (
    <div className="container mx-auto px-4 max-w-4xl prose prose-lg">
      <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
    </div>
  );
}
