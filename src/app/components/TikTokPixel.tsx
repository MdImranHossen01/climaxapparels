"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

export default function TikTokPixel({
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

  const trackPageView = useCallback(
    () => {
      if (!pixelId) return;
      import("@/lib/tiktok").then(({ ttEvent }) => {
        ttEvent("PageView");
      });
    },
    [pixelId]
  );

  useEffect(() => {
    if (!mounted || !pixelId || !scriptLoaded) return;
    trackPageView();
  }, [pathname, searchParams, trackPageView, pixelId, mounted, scriptLoaded]);

  // Sanitize pixelId: alphanumeric for TikTok Pixel
  const sanitizedPixelId = pixelId && /^[a-zA-Z0-9]+$/.test(pixelId.trim()) ? pixelId.trim() : null;

  if (!sanitizedPixelId) {
    return null;
  }

  return (
    <>
      <Script
        id="tiktok-pixel"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        dangerouslySetInnerHTML={{
          __html: `
            !function (w, d, t) {
              w.TiktokSdkObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var e=0;e<ttq.methods.length;e++)ttq.setAndDefer(ttq,ttq.methods[e]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var a=d.createElement("script");a.type="text/javascript",a.async=!0,a.src=r+"?sdkid="+e+"&lib="+t;var i=d.getElementsByTagName("script")[0];i.parentNode.insertBefore(a,i)};
              ttq.load('${sanitizedPixelId}');
              ttq.page();
            }(window, document, 'ttq');
          `,
        }}
      />
    </>
  );
}
