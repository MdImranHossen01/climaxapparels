import { ShippingOrderData, ShippingOrderResponse, ShippingProvider } from '../index';

export class SteadfastProvider implements ShippingProvider {
  private apiKey: string;
  private secretKey: string;
  private baseUrl = 'https://portal.packzy.com/api/v1';

  constructor(apiKey: string, secretKey: string) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
  }

  async createOrder(data: ShippingOrderData): Promise<ShippingOrderResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/create_order`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey,
          'Secret-Key': this.secretKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice: data.invoice,
          recipient_name: data.recipient_name,
          recipient_phone: data.recipient_phone,
          recipient_address: data.recipient_address,
          cod_amount: data.cod_amount,
          note: data.note || '',
        }),
      });

      const result = await response.json();

      if (result.status === 200) {
        // Defensive check for consignment object
        if (!result.consignment || typeof result.consignment !== 'object') {
          return {
            success: false,
            message: 'Steadfast response missing consignment data',
          };
        }

        const { tracking_code, consignment_id, status } = result.consignment;

        if (!tracking_code) {
          return {
            success: false,
            message: 'Steadfast response missing tracking code',
          };
        }

        return {
          success: true,
          tracking_code,
          consignment_id,
          status,
          tracking_url: `https://steadfast.com.bd/t/${tracking_code}`,
          url: `https://steadfast.com.bd/t/${tracking_code}`,
        };
      }

      return {
        success: false,
        message: result.errors ? Object.values(result.errors).flat().join(', ') : 'Failed to create order',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Network error while connecting to Steadfast',
      };
    }
  }

  async trackOrder(trackingId: string): Promise<any> {
    const trackingUrl = `https://steadfast.com.bd/t/${trackingId}`;
    return { 
        status: 'check_portal', 
        tracking_url: trackingUrl,
        url: trackingUrl,
    };
  }
}

