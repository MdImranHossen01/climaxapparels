import { ShippingOrderData, ShippingOrderResponse, ShippingProvider } from '../index';

export class RedXProvider implements ShippingProvider {
  private apiKey: string;
  private baseUrl = 'https://api.redx.com.bd/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createOrder(data: ShippingOrderData): Promise<ShippingOrderResponse> {
    try {
        const areaId = parseInt(String(data.area_id), 10);
        const safeAreaId = isNaN(areaId) ? 0 : areaId;

        const response = await fetch(`${this.baseUrl}/parcels`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customer_name: data.recipient_name,
            customer_phone: data.recipient_phone,
            customer_address: data.recipient_address,
            cash_to_collect: data.cod_amount,
            area_id: safeAreaId,
            merchant_order_id: data.invoice,
            parcel_weight: data.item_weight || 0.5,
            instruction: data.note || '',
          }),
        });

      const result = await response.json();

      if (response.ok) {
        if (!result.tracking_id) {
          throw new Error('RedX response missing tracking_id despite successful status');
        }
        return {
          success: true,
          tracking_code: result.tracking_id,
          consignment_id: result.tracking_id,
          status: 'booked',
          tracking_url: `https://redx.com.bd/track-parcel/?trackingId=${result.tracking_id}`,
          url: `https://redx.com.bd/track-parcel/?trackingId=${result.tracking_id}`,
        };
      }

      return {
        success: false,
        message: result.message || 'RedX order creation failed',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'RedX Integration Error',
      };
    }
  }

  async trackOrder(trackingId: string): Promise<any> {
    const trackingUrl = `https://redx.com.bd/track-parcel/?trackingId=${trackingId}`;
    return { 
        status: 'check_portal', 
        tracking_url: trackingUrl,
        url: trackingUrl,
    };
  }
}

