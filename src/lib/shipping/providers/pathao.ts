import { ShippingOrderData, ShippingOrderResponse, ShippingProvider } from '../index';

export class PathaoProvider implements ShippingProvider {
  private clientId: string;
  private clientSecret: string;
  private storeId: string;
  private baseUrl = 'https://api-hermes.pathao.com';
  private accessToken: string | null = null;
  private accessTokenExpiry: number | null = null;

  constructor(clientId: string, clientSecret: string, storeId: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.storeId = storeId;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.accessTokenExpiry && this.accessTokenExpiry > Date.now()) {
      return this.accessToken;
    }

    const response = await fetch(`${this.baseUrl}/aladdin/api/v1/issue-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pathao token issuance failed (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    if (result.access_token) {
      this.accessToken = result.access_token;
      // expires_in is in seconds
      const expiresIn = result.expires_in || 3600;
      this.accessTokenExpiry = Date.now() + (expiresIn * 1000) - 60000; // 1 minute buffer
      return result.access_token;
    }

    throw new Error(result.message || 'Failed to obtain Pathao access token');
  }

  async createOrder(data: ShippingOrderData): Promise<ShippingOrderResponse> {
    try {
      const token = await this.getAccessToken();
      
      const payload = {
          store_id: Number(data.store_id || this.storeId),
          merchant_order_id: data.invoice,
          recipient_name: data.recipient_name,
          recipient_phone: data.recipient_phone,
          recipient_address: data.recipient_address,
          recipient_city: Number(data.city_id),
          recipient_zone: Number(data.zone_id),
          recipient_area: Number(data.area_id),
          delivery_type: data.delivery_type || 48, // Normal Delivery
          item_type: data.item_type || 2,      // Parcel
          special_instruction: data.note || '',
          item_quantity: data.item_quantity || 1,
          item_weight: data.item_weight || 0.5,
          amount_to_collect: data.cod_amount,
      };

      const response = await fetch(`${this.baseUrl}/aladdin/api/v1/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pathao order creation failed (${response.status}): ${errorText}`);
      }

      const result = await response.json();

      if (result.type === 'success') {
        if (!result.data) {
          throw new Error('Pathao response missing data object despite success type');
        }
        return {
          success: true,
          tracking_code: result.data.consignment_id,
          consignment_id: result.data.consignment_id,
          status: result.data.status,
          tracking_url: `https://merchant.pathao.com/tracking?consignment_id=${result.data.consignment_id}`,
          url: `https://merchant.pathao.com/tracking?consignment_id=${result.data.consignment_id}`,
        };
      }

      return {
        success: false,
        message: result.message || 'Pathao order creation failed',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Pathao Integration Error',
      };
    }
  }

  async trackOrder(trackingId: string): Promise<any> {
    const trackingUrl = `https://merchant.pathao.com/tracking?consignment_id=${trackingId}`;
    return { 
        status: 'check_portal', 
        tracking_url: trackingUrl,
        url: trackingUrl,
    };
  }
}

