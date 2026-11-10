import { ShippingOrderData, ShippingOrderResponse, ShippingProvider } from '../index';

export interface RedXConfig {
  apiKey?: string;
  isSandbox?: boolean;
}

export class RedXProvider implements ShippingProvider {
  private apiKey: string;
  private isSandbox: boolean;
  private baseUrl: string;

  constructor(config: string | RedXConfig) {
    if (typeof config === 'string') {
      this.apiKey = config;
      this.isSandbox = false;
    } else {
      this.apiKey = config.apiKey || '';
      this.isSandbox = Boolean(config.isSandbox);
    }

    this.baseUrl = this.isSandbox
      ? 'https://sandbox.redx.com.bd/v1.0.0-beta'
      : 'https://openapi.redx.com.bd/v1.0.0-beta';
  }

  private getHeaders(): Record<string, string> {
    const token = this.apiKey.replace(/^Bearer\s+/i, '').trim();
    return {
      'API-ACCESS-TOKEN': `Bearer ${token}`,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getAreas(postCode?: string, district?: string): Promise<any[]> {
    try {
      const url = new URL(`${this.baseUrl}/areas`);
      if (postCode) url.searchParams.set('post_code', postCode);
      if (district) url.searchParams.set('district_name', district);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        // Try fallback to api.redx.com.bd/v1
        const fallbackUrl = new URL(`https://api.redx.com.bd/v1/areas`);
        if (postCode) fallbackUrl.searchParams.set('post_code', postCode);
        const fallbackRes = await fetch(fallbackUrl.toString(), {
          headers: this.getHeaders(),
        });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          return fallbackData.areas || fallbackData.data || (Array.isArray(fallbackData) ? fallbackData : []);
        }
        return [];
      }

      const result = await response.json();
      return result.areas || result.data || (Array.isArray(result) ? result : []);
    } catch (error: any) {
      console.error('[RedX getAreas Error]:', error.message);
      return [];
    }
  }

  async getPickupStores(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/pickup/stores`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!response.ok) {
        return [];
      }
      const data = await response.json();
      return data.pickup_stores || data.data || (Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[RedX getPickupStores Error]:', err.message);
      return [];
    }
  }

  async createPickupStore(storeData: {
    name: string;
    phone: string;
    address: string;
    area_id: number;
  }): Promise<{ success: boolean; store?: any; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/pickup/store`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(storeData),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && (data.id || data.pickup_store?.id || data.data?.id)) {
        const store = data.pickup_store || data.data || data;
        return {
          success: true,
          store,
          message: 'Pickup store created successfully',
        };
      }

      return {
        success: false,
        message: data.message || data.error || 'Failed to create RedX pickup store',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network error creating RedX pickup store',
      };
    }
  }

  async findOrCreateStoreForReseller(resellerInfo: {
    hubName?: string;
    storeName?: string;
    contactPerson?: string;
    phone: string;
    address: string;
    division?: string;
    district?: string;
    thana?: string;
    postCode?: string;
  }): Promise<{ success: boolean; storeId?: number; storeName?: string; message?: string }> {
    try {
      const rawPhone = (resellerInfo.phone || '').replace(/\D/g, '');
      const cleanPhone = rawPhone.length >= 11 ? rawPhone.slice(-11) : rawPhone;
      const storeName = (resellerInfo.hubName || resellerInfo.storeName || 'Reseller Hub').trim();
      const address = (resellerInfo.address || '').trim();

      // 1. Check existing pickup stores
      const existingStores = await this.getPickupStores();
      if (Array.isArray(existingStores) && existingStores.length > 0) {
        const found = existingStores.find((s: any) => {
          const sPhone = String(s.phone || '').replace(/\D/g, '').slice(-11);
          const sName = String(s.name || '').trim().toLowerCase();
          const sAddr = String(s.address || '').trim().toLowerCase();
          return (
            (cleanPhone && sPhone === cleanPhone) ||
            (sName === storeName.toLowerCase() && sAddr === address.toLowerCase())
          );
        });

        if (found && found.id) {
          return {
            success: true,
            storeId: found.id,
            storeName: found.name,
            message: `Found and linked existing RedX pickup store: ${found.name} (ID: ${found.id})`,
          };
        }
      }

      // 2. Resolve Area ID
      let resolvedAreaId: number | null = null;
      const postCode = resellerInfo.postCode ? resellerInfo.postCode.replace(/\D/g, '') : undefined;
      const district = resellerInfo.district?.trim();
      const thana = resellerInfo.thana?.trim();

      let areas: any[] = [];
      if (postCode) {
        areas = await this.getAreas(postCode);
      }
      if ((!areas || areas.length === 0) && district) {
        areas = await this.getAreas(undefined, district);
      }
      if (!areas || areas.length === 0) {
        areas = await this.getAreas();
      }

      if (Array.isArray(areas) && areas.length > 0) {
        if (thana) {
          const matched = areas.find((a: any) =>
            String(a.name || '').toLowerCase().includes(thana.toLowerCase()) ||
            String(a.area_name || '').toLowerCase().includes(thana.toLowerCase())
          );
          if (matched && matched.id) resolvedAreaId = Number(matched.id);
        }

        if (!resolvedAreaId && district) {
          const matched = areas.find((a: any) =>
            String(a.district_name || a.name || '').toLowerCase().includes(district.toLowerCase())
          );
          if (matched && matched.id) resolvedAreaId = Number(matched.id);
        }

        if (!resolvedAreaId && areas[0]?.id) {
          resolvedAreaId = Number(areas[0].id);
        }
      }

      if (!resolvedAreaId) {
        return {
          success: false,
          message: `Could not resolve RedX delivery area for ${thana || district || 'the given location'}. Please verify reseller pickup address.`,
        };
      }

      // 3. Create store
      const createRes = await this.createPickupStore({
        name: storeName,
        phone: cleanPhone,
        address,
        area_id: resolvedAreaId,
      });

      if (createRes.success && createRes.store?.id) {
        return {
          success: true,
          storeId: createRes.store.id,
          storeName: createRes.store.name || storeName,
          message: `RedX pickup store created successfully! (Store ID: ${createRes.store.id})`,
        };
      }

      return {
        success: false,
        message: createRes.message || 'Failed to create pickup store in RedX',
      };
    } catch (err: any) {
      console.error('[RedX findOrCreateStoreForReseller Error]:', err);
      return {
        success: false,
        message: err.message || 'Failed to initialize store in RedX',
      };
    }
  }

  async createOrder(data: ShippingOrderData): Promise<ShippingOrderResponse> {
    try {
      const areaId = parseInt(String(data.area_id), 10);
      const safeAreaId = isNaN(areaId) ? 0 : areaId;
      const weightNum = Number(data.item_weight) || 0.5;
      const storeId = data.store_id || (data as any).pickup_store_id;

      const payload: any = {
        customer_name: data.recipient_name,
        customer_phone: data.recipient_phone,
        customer_address: data.recipient_address,
        delivery_area: (data as any).delivery_area || '',
        delivery_area_id: safeAreaId,
        area_id: safeAreaId,
        merchant_invoice_id: data.invoice,
        merchant_order_id: data.invoice,
        cash_collection_amount: String(data.cod_amount || 0),
        cash_to_collect: data.cod_amount || 0,
        parcel_weight: weightNum,
        instruction: data.note || '',
        value: data.cod_amount || 0,
        is_closed_box: 'no',
      };

      if (storeId) {
        payload.pickup_store_id = Number(storeId) || storeId;
      }

      // Try OpenAPI standard endpoint /parcel first
      let response = await fetch(`${this.baseUrl}/parcel`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      // If /parcel returns 404, fallback to /parcels
      if (response.status === 404) {
        response = await fetch(`${this.baseUrl}/parcels`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(payload),
        });
      }

      // Legacy fallback
      if (response.status === 404 && !this.isSandbox) {
        response = await fetch(`https://api.redx.com.bd/v1/parcels`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        const trackingId = result.tracking_id || result.trackingId || result.data?.tracking_id || result.parcel?.tracking_id;
        if (!trackingId) {
          throw new Error(result.message || 'RedX response missing tracking_id despite successful status');
        }
        return {
          success: true,
          tracking_code: String(trackingId),
          consignment_id: String(trackingId),
          status: 'booked',
          tracking_url: `https://redx.com.bd/track-parcel/?trackingId=${trackingId}`,
          url: `https://redx.com.bd/track-parcel/?trackingId=${trackingId}`,
        };
      }

      return {
        success: false,
        message: result.message || result.error || 'RedX order creation failed',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'RedX Integration Error',
      };
    }
  }

  /**
   * Fetches the real-time tracking status of a RedX parcel.
   */
  async getOrderStatus(trackingId: string): Promise<any> {
    try {
      const cleanId = encodeURIComponent(trackingId.trim());
      // Try primary tracking endpoint: /parcel/track/:parcel_id
      let response = await fetch(`${this.baseUrl}/parcel/track/${cleanId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      // Fallback endpoint: /parcels/:parcel_id
      if (!response.ok) {
        response = await fetch(`${this.baseUrl}/parcels/${cleanId}`, {
          method: 'GET',
          headers: this.getHeaders(),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`RedX status fetch failed (${response.status}): ${errorText.slice(0, 100)}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`[RedX getOrderStatus error for ${trackingId}]:`, error.message);
      throw error;
    }
  }

  async trackOrder(trackingId: string): Promise<any> {
    const trackingUrl = `https://redx.com.bd/track-parcel/?trackingId=${trackingId}`;
    try {
      const data = await this.getOrderStatus(trackingId);
      const trackingList = data?.tracking || [];
      const latestMsg = trackingList.length > 0 ? trackingList[trackingList.length - 1]?.message_en : '';
      const status = data?.status || latestMsg || 'in_transit';

      return {
        success: true,
        status,
        tracking_code: trackingId,
        consignment_id: trackingId,
        tracking_url: trackingUrl,
        url: trackingUrl,
        details: data,
      };
    } catch {
      return { 
        status: 'check_portal', 
        tracking_url: trackingUrl,
        url: trackingUrl,
      };
    }
  }
}
