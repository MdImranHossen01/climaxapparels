"use client";

/**
 * TikTok Pixel & Events API Tracking Utility
 * Provides a unified way to track events on both client and server with deduplication.
 */

declare global {
  interface Window {
    ttq?: any;
  }
}

/**
 * Generates a unique event ID for deduplication.
 */
const generateEventId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Map Meta/Facebook events to TikTok equivalents
const EVENT_MAP: Record<string, string> = {
  'PageView': 'PageView',
  'AddToCart': 'AddToCart',
  'AddToWishlist': 'AddToWishlist',
  'InitiateCheckout': 'InitiateCheckout',
  'Purchase': 'CompletePayment', // TikTok uses CompletePayment for purchases
  'Contact': 'Contact',
  'Search': 'Search',
};

export const ttEvent = (
  eventName: string,
  customData: Record<string, unknown> = {},
  userData: { 
    em?: string; 
    ph?: string; 
    fn?: string; 
    ln?: string;
    ct?: string;
    st?: string;
    zp?: string;
    country?: string;
  } = {},
  providedEventId?: string
) => {
  const eventId = providedEventId || generateEventId();
  const mappedEvent = EVENT_MAP[eventName] || eventName;

  // 1. Browser Pixel Tracking
  if (typeof window !== "undefined" && window.ttq && typeof window.ttq.track === "function") {
    window.ttq.track(mappedEvent, customData, { event_id: eventId });
  }

  // 2. Server-side Events API Tracking
  if (typeof window !== "undefined") {
    fetch("/api/tiktok/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName: mappedEvent,
        eventUrl: window.location.href,
        userAgent: navigator.userAgent,
        eventId,
        userData, // Hashing is handled server-side
        customData,
      }),
    }).catch(() => {
       /* Fail silently to not disrupt UX */
    });
  }

  return eventId;
};
