"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

// Global fbq declaration is handled in @/lib/fpixel

// PIXEL_ID is now passed as a prop from layout

export default function FacebookPixel({
  pixelId,
}: {
  pixelId?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Shared eventId across browser pixel and CAPI for deduplication
  // Initialize with a dummy or empty string during SSR
  const currentEventId = useRef<string>("");

  const trackPageView = useCallback(
    () => {
      if (!pixelId) return;
      import("@/lib/fpixel").then(({ fbEvent }) => {
        fbEvent("PageView");
      });
    },
    [pixelId]
  );

  useEffect(() => {
    if (!mounted || !pixelId || !scriptLoaded) return;
    trackPageView();
  }, [pathname, searchParams, trackPageView, pixelId, mounted, scriptLoaded]);

  // Sanitize pixelId to prevent XSS
  const sanitizedPixelId = pixelId && /^\d+$/.test(pixelId.trim()) ? pixelId.trim() : null;

  if (!sanitizedPixelId) {
    return null;
  }

  return (
    <>
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod ?
              n.callMethod.apply(n, arguments) : n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('dataProcessingOptions', []);
            fbq('init', '${sanitizedPixelId}');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${sanitizedPixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}

