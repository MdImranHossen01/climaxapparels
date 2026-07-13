"use client";

/**
 * Facebook Pixel & Conversions API Tracking Utility
 * Provides a unified way to track events on both client and server with deduplication.
 */

declare global {
  interface Window {
    fbq?: {
      (action: "track" | "trackCustom", eventName: string, data?: Record<string, unknown>, options?: { eventID: string }): void;
      (action: "init", pixelId: string, userData?: Record<string, unknown>): void;
      (action: "set", key: string, value: unknown): void;
      callMethod?: (...args: any[]) => void;
      queue?: any[];
      loaded?: boolean;
      version?: string;
      push?: any;
    };
    _fbq?: any;
  }
}

/**
 * Generates a unique event ID with fallback for insecure or older browsers.
 */
const generateEventId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // Fallback for non-secure contexts or older browsers
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    return (([1e7] as any) + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: any) =>
      (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
  }

  // Last resort
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const fbEvent = (
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

  const finalEventName = eventName;
  
  // 1. Browser Pixel Tracking
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    const standardEvents = [
      "AddPaymentInfo", "CompleteRegistration",
      "Contact", "CustomizeProduct", "Donate", "FindLocation",
      "Lead", "Schedule",
      "Search", "StartTrial", "SubmitApplication", "Subscribe", "ViewContent", "PageView",
      "Purchase", "AddToCart", "InitiateCheckout", "AddToWishlist"
    ];

    // If user data is provided, use Advanced Matching
    if (userData && (userData.em || userData.ph)) {
      // We call 'set' to update user data before tracking the event
      // This improves matching between Browser and Server events
      (window as any).fbq('set', 'user_data', {
        ...(userData.em && { em: userData.em.trim().toLowerCase() }),
        ...(userData.ph && { ph: userData.ph.replace(/\D/g, '') }),
        ...(userData.fn && { fn: userData.fn.trim().toLowerCase() }),
        ...(userData.ln && { ln: userData.ln.trim().toLowerCase() }),
        ...(userData.ct && { ct: userData.ct.trim().toLowerCase() }),
        ...(userData.st && { st: userData.st.trim().toLowerCase() }),
        ...(userData.zp && { zp: userData.zp.trim().toLowerCase() }),
        ...(userData.country && { country: userData.country.trim().toLowerCase() }),
      });
    }

    // If it's not a standard event, track as Custom
    if (!standardEvents.includes(finalEventName)) {
      window.fbq("trackCustom", finalEventName, customData, { eventID: eventId });
    } else {
      window.fbq("track", finalEventName, customData, { eventID: eventId });
    }
  }

  // 2. Server-side (CAPI) Tracking
  // Only send CAPI if we are in the browser
  if (typeof window !== "undefined") {
    fetch("/api/facebook/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include', // Crucial for sending _fbp and _fbc cookies
      body: JSON.stringify({
        eventName: finalEventName,
        eventUrl: window.location.href,
        userAgent: navigator.userAgent,
        eventId,
        userData, // Hashing is handled server-side for maximum privacy & accuracy
        customData: {
          ...customData,
          // Standardize contents array if present for both Pixel and CAPI compatibility
          ...(customData.contents && Array.isArray(customData.contents) ? {
            contents: (customData.contents as any[]).map((item: any) => ({
              ...item,
              // Ensure both 'price' and 'item_price' are present for legacy/new compatibility
              price: item.price || item.item_price,
              item_price: item.item_price || item.price
            }))
          } : {})
        },
      }),
    })
      .then(res => {
        if (!res.ok && process.env.NODE_ENV === 'development') {
          res.json().then(err => console.error('[FB CAPI] Server Error:', err?.error || err?.message || JSON.stringify(err)));
        } else if (process.env.NODE_ENV === 'development') {
          console.log(`[FB CAPI] Event Sent: ${finalEventName}`);
        }
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[FB CAPI] Fetch Failed:', err);
        }
      });
  }

  return eventId;
};
