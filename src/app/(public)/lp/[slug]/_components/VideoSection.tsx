'use client'; 

export default function VideoSection({ content }: { content: any }) {
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && typeof match[2] === 'string' && match[2].length === 11) 
      ? `https://www.youtube.com/embed/${match[2]}` 
      : url;
  };

  return (
    <div className="container mx-auto px-4 max-w-4xl text-center">
      <h2 className="text-3xl md:text-4xl font-black mb-8 tracking-tight">{content.title}</h2>
      <div className="aspect-video rounded-[2rem] overflow-hidden shadow-2xl bg-gray-900 border-8 border-white/10">
        {content.videoUrl ? (
          <iframe 
            src={getEmbedUrl(content.videoUrl)} 
            title={content.title || 'Embedded video'}
            className="w-full h-full" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/50 italic">
            Please provide a valid YouTube URL in the builder.
          </div>
        )}
      </div>
    </div>
  );
}
