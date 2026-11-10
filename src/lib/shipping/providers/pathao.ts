import { ShippingOrderData, ShippingOrderResponse, ShippingProvider } from '../index';

export interface PathaoConfig {
  clientId: string;
  clientSecret: string;
  storeId?: string;
  username?: string;
  password?: string;
  isSandbox?: boolean;
}

export class PathaoProvider implements ShippingProvider {
  private clientId: string;
  private clientSecret: string;
  private storeId: string;
  private username?: string;
  private password?: string;
  private baseUrl: string;
  private accessToken: string | null = null;
  private accessTokenExpiry: number | null = null;

  constructor(
    clientIdOrConfig: string | PathaoConfig,
    clientSecret?: string,
    storeId?: string,
    username?: string,
    password?: string,
    isSandbox?: boolean
  ) {
    if (typeof clientIdOrConfig === 'object') {
      this.clientId = clientIdOrConfig.clientId;
      this.clientSecret = clientIdOrConfig.clientSecret;
      this.storeId = clientIdOrConfig.storeId || '';
      this.username = clientIdOrConfig.username;
      this.password = clientIdOrConfig.password;
      this.baseUrl = clientIdOrConfig.isSandbox
        ? 'https://courier-api-sandbox.pathao.com'
        : 'https://api-hermes.pathao.com';
    } else {
      this.clientId = clientIdOrConfig;
      this.clientSecret = clientSecret || '';
      this.storeId = storeId || '';
      this.username = username;
      this.password = password;
      this.baseUrl = isSandbox
        ? 'https://courier-api-sandbox.pathao.com'
        : 'https://api-hermes.pathao.com';
    }
  }

  public async getAccessToken(): Promise<string> {
    if (this.accessToken && this.accessTokenExpiry && this.accessTokenExpiry > Date.now()) {
      return this.accessToken;
    }

    const payload: Record<string, any> = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
    };

    if (this.username && this.password) {
      payload.username = this.username;
      payload.password = this.password;
      payload.grant_type = 'password';
    } else {
      payload.grant_type = 'client_credentials';
    }

    const response = await fetch(`${this.baseUrl}/aladdin/api/v1/issue-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `Pathao token issuance failed (${response.status})`;
      try {
        const parsed = JSON.parse(errorText);
        errorMsg = parsed.message || parsed.error_description || parsed.error || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    const result = await response.json();
    if (result.access_token) {
      this.accessToken = result.access_token;
      const expiresIn = result.expires_in || 3600;
      this.accessTokenExpiry = Date.now() + (expiresIn * 1000) - 60000;
      return result.access_token;
    }

    throw new Error(result.message || result.error || 'Failed to obtain Pathao access token');
  }

  async getStores(): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      const res = await fetch(`${this.baseUrl}/aladdin/api/v1/stores`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.data?.data || data.data || [];
    } catch (e) {
      console.error('Error fetching Pathao stores:', e);
      return [];
    }
  }

  async getCities(): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      const res = await fetch(`${this.baseUrl}/aladdin/api/v1/countries/1/city-list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.data?.data || data.data || [];
    } catch (e) {
      console.error('Error fetching Pathao cities:', e);
      return [];
    }
  }

  async getZones(cityId: number | string): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      const res = await fetch(`${this.baseUrl}/aladdin/api/v1/cities/${cityId}/zone-list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.data?.data || data.data || [];
    } catch (e) {
      console.error('Error fetching Pathao zones:', e);
      return [];
    }
  }

  async getAreas(zoneId: number | string): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      const res = await fetch(`${this.baseUrl}/aladdin/api/v1/zones/${zoneId}/area-list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.data?.data || data.data || [];
    } catch (e) {
      console.error('Error fetching Pathao areas:', e);
      return [];
    }
  }

  async createStore(storeData: {
    name: string;
    contact_name: string;
    contact_number: string;
    address: string;
    city_id: number;
    zone_id: number;
    area_id: number;
    secondary_contact?: string;
  }): Promise<{ success: boolean; message?: string; storeId?: number; raw?: any }> {
    try {
      const token = await this.getAccessToken();
      const res = await fetch(`${this.baseUrl}/aladdin/api/v1/stores`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: storeData.name,
          contact_name: storeData.contact_name,
          contact_number: storeData.contact_number,
          address: storeData.address,
          city_id: Number(storeData.city_id),
          zone_id: Number(storeData.zone_id),
          area_id: Number(storeData.area_id),
          secondary_contact: storeData.secondary_contact || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && (data.code === 200 || data.type === 'success')) {
        const storeId = data.data?.store_id || data.data?.id;
        return {
          success: true,
          message: data.message || 'Store created successfully',
          storeId: storeId ? Number(storeId) : undefined,
          raw: data,
        };
      }

      let errorMsg = data.message || 'Failed to create Pathao store';
      if (data.errors && typeof data.errors === 'object') {
        const details = Object.entries(data.errors)
          .map(([k, v]: [string, any]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
        if (details) {
          errorMsg = `${data.message ? data.message + ' - ' : ''}${details}`;
        }
      }

      return {
        success: false,
        message: errorMsg,
        raw: data,
      };
    } catch (e: any) {
      console.error('Error creating Pathao store:', e);
      return { success: false, message: e.message || 'Error creating Pathao store' };
    }
  }

  async findOrCreateStoreForReseller(pickup: {
    hubName?: string;
    storeName?: string;
    contactPerson?: string;
    phone?: string;
    address?: string;
    division?: string;
    district?: string;
    thana?: string;
  }): Promise<{ success: boolean; storeId?: number; storeName?: string; message?: string }> {
    try {
      const stores = await this.getStores();
      const targetName = (pickup.hubName || `${pickup.storeName || 'Reseller'} Hub`).trim().toLowerCase();
      
      // Check if existing store matches hub name or phone/address
      const existing = stores.find((s: any) => {
        const sName = (s.store_name || s.name || '').trim().toLowerCase();
        const sAddr = (s.store_address || s.address || '').toLowerCase();
        return sName === targetName || (pickup.address && sAddr.includes(pickup.address.toLowerCase().slice(0, 20)));
      });

      if (existing) {
        const foundId = Number(existing.store_id || existing.id);
        return { success: true, storeId: foundId, storeName: existing.store_name || existing.name };
      }

      // If no address info, cannot create store
      if (!pickup.address || !pickup.phone) {
        return { success: false, message: 'Pickup address and contact phone are required to create a Pathao store.' };
      }

      // Resolve City from Pathao
      const cities = await this.getCities();
      const targetDist = (pickup.district || '').toLowerCase().trim();
      let matchedCity = cities.find((c: any) => 
        targetDist && c.city_name && (c.city_name.toLowerCase().includes(targetDist) || targetDist.includes(c.city_name.toLowerCase().trim()))
      );
      if (!matchedCity && cities.length > 0) {
        matchedCity = cities.find((c: any) => c.city_id === 1) || cities[0];
      }
      const cityId = matchedCity ? Number(matchedCity.city_id) : 1;

      // Resolve Zone from Pathao
      const zones = await this.getZones(cityId);
      const targetThana = (pickup.thana || '').toLowerCase().trim();
      let matchedZone = zones.find((z: any) => 
        targetThana && z.zone_name && (z.zone_name.toLowerCase().includes(targetThana) || targetThana.includes(z.zone_name.toLowerCase().trim()))
      );
      if (!matchedZone && zones.length > 0) {
        matchedZone = zones[0];
      }
      const zoneId = matchedZone ? Number(matchedZone.zone_id) : 1;

      // Resolve Area from Pathao
      const areas = await this.getAreas(zoneId);
      const areaId = areas.length > 0 ? Number(areas[0].area_id) : 1;

      const cleanPhone = (pickup.phone || '').replace(/\D/g, '').slice(-11);

      const created = await this.createStore({
        name: pickup.hubName || `${pickup.storeName || 'Reseller'} Hub`,
        contact_name: pickup.contactPerson || pickup.storeName || 'Store Manager',
        contact_number: cleanPhone,
        address: pickup.address,
        city_id: cityId,
        zone_id: zoneId,
        area_id: areaId,
      });

      if (created.success) {
        if (created.storeId) {
          return { success: true, storeId: created.storeId, storeName: pickup.hubName || pickup.storeName, message: created.message };
        }
        // Re-fetch stores to check if id appeared
        const reStores = await this.getStores();
        const found = reStores.find((s: any) => (s.store_name || s.name || '').trim().toLowerCase() === targetName);
        if (found) {
          return { success: true, storeId: Number(found.store_id || found.id), storeName: found.store_name, message: created.message };
        }
        return { success: true, message: created.message || 'Store created in Pathao, awaiting approval.' };
      }

      return { success: false, message: created.message };
    } catch (err: any) {
      console.error('findOrCreateStoreForReseller error:', err);
      return { success: false, message: err.message };
    }
  }

  async createOrder(data: ShippingOrderData): Promise<ShippingOrderResponse> {
    try {
      const token = await this.getAccessToken();

      let storeId = Number(data.store_id || this.storeId || 0);
      if (!storeId || isNaN(storeId)) {
        try {
          const stores = await this.getStores();
          if (stores && stores.length > 0) {
            storeId = Number(stores[0].store_id || stores[0].id);
          }
        } catch (e) {
          console.warn('Could not auto-fetch Pathao stores:', e);
        }
      }

      const phone = data.recipient_phone ? data.recipient_phone.replace(/\D/g, '').slice(-11) : '';

      const payload: Record<string, any> = {
        store_id: storeId,
        merchant_order_id: data.invoice,
        recipient_name: data.recipient_name,
        recipient_phone: phone,
        recipient_address: data.recipient_address,
        recipient_city: Number(data.city_id) || 1, // Default to Dhaka (1)
        recipient_zone: Number(data.zone_id) || 1, // Default to Zone (1)
        delivery_type: Number(data.delivery_type) || 48, // 48: Normal Delivery
        item_type: Number(data.item_type) || 2, // 2: Parcel
        special_instruction: data.note || '',
        item_quantity: Number(data.item_quantity) || 1,
        item_weight: Number(data.item_weight) || 0.5,
        amount_to_collect: Math.round(Number(data.cod_amount) || 0),
        item_description: (data as any).item_description || data.note || 'Product Order',
      };

      if (data.area_id && Number(data.area_id) > 0) {
        payload.recipient_area = Number(data.area_id);
      }

      const response = await fetch(`${this.baseUrl}/aladdin/api/v1/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let result: any;
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(`Pathao response error (${response.status}): ${responseText.slice(0, 150)}`);
      }

      if (response.ok && (result.type === 'success' || result.data?.consignment_id)) {
        const consignmentId = result.data?.consignment_id || result.consignment_id;
        return {
          success: true,
          tracking_code: consignmentId,
          consignment_id: consignmentId,
          status: result.data?.order_status || result.data?.status || 'Pending',
          tracking_url: `https://merchant.pathao.com/tracking?consignment_id=${consignmentId}`,
          url: `https://merchant.pathao.com/tracking?consignment_id=${consignmentId}`,
        };
      }

      let errorMsg = result.message || 'Pathao order creation failed';
      if (result.errors && typeof result.errors === 'object') {
        const errorDetails = Object.entries(result.errors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('; ');
        if (errorDetails) {
          errorMsg = `${errorMsg} (${errorDetails})`;
        }
      }

      return {
        success: false,
        message: errorMsg,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Pathao Integration Error',
      };
    }
  }

  /**
   * Fetches the real-time order status and details of a Pathao consignment.
   */
  async getOrderStatus(consignmentId: string): Promise<any> {
    try {
      const token = await this.getAccessToken();
      const response = await fetch(`${this.baseUrl}/aladdin/api/v1/orders/${encodeURIComponent(consignmentId)}/info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `Pathao status request failed (${response.status})`;
        try {
          const parsed = JSON.parse(errorText);
          errorMsg = parsed.message || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error: any) {
      console.error(`Pathao getOrderStatus failed for consignment ${consignmentId}:`, error.message);
      throw error;
    }
  }

  async trackOrder(trackingId: string): Promise<any> {
    const trackingUrl = `https://merchant.pathao.com/tracking?consignment_id=${trackingId}`;
    try {
      const info = await this.getOrderStatus(trackingId);
      const courierStatus = info?.order_status || info?.order_status_slug || info?.status || 'In Transit';
      return {
        success: true,
        status: courierStatus,
        consignment_id: trackingId,
        tracking_code: trackingId,
        tracking_url: trackingUrl,
        url: trackingUrl,
        raw: info,
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

