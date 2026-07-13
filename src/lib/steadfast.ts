export interface SteadfastOrderPayload {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
}

export interface SteadfastConfig {
  apiKey: string;
  secretKey: string;
}

const BASE_URL = 'https://portal.packzy.com/api/v1';

/**
 * Creates an order in Steadfast Courier system
 */
export async function createSteadfastOrder(payload: SteadfastOrderPayload, config: SteadfastConfig) {
  if (!config.apiKey || !config.secretKey) {
    throw new Error('Steadfast API Key or Secret Key is missing in settings.');
  }

  // Validate phone number (exactly 11 digits required by Steadfast)
  const cleanPhone = payload.recipient_phone.replace(/\D/g, '');
  if (cleanPhone.length !== 11) {
    throw new Error('Steadfast requires exactly 11 digits for recipient phone number.');
  }

  try {
    const response = await fetch(`${BASE_URL}/create_order`, {
      method: 'POST',
      headers: {
        'Api-Key': config.apiKey,
        'Secret-Key': config.secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        recipient_phone: cleanPhone
      }),
    });

    const data = await response.json();

    if (response.status !== 200 || data.status !== 200) {
      throw new Error(data.message || `Steadfast API Error (Status: ${data.status || response.status})`);
    }

    return {
      success: true,
      consignment_id: data.consignment?.consignment_id || data.consignment_id,
      tracking_code: data.consignment?.tracking_code || data.tracking_code,
      status: data.consignment?.status || 'Created',
      raw: data
    };
  } catch (error: any) {
    console.error('Steadfast API Execution Error:', error);
    throw new Error(error.message || 'Failed to communicate with Steadfast Courier API');
  }
}

/**
 * Checks the status of a Steadfast delivery
 */
export async function getSteadfastStatus(consignmentId: string, config: SteadfastConfig) {
    const response = await fetch(`${BASE_URL}/status_by_cid/${consignmentId}`, {
      method: 'GET',
      headers: {
        'Api-Key': config.apiKey,
        'Secret-Key': config.secretKey,
        'Content-Type': 'application/json',
      },
    });
  
    const data = await response.json();
    return data;
}
