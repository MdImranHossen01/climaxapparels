export interface ShippingOrderData {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
  store_id?: string;
  city_id?: string;
  zone_id?: string;
  area_id?: string;
  item_quantity?: number;
  item_weight?: number;
  delivery_type?: number;
  item_type?: number;
}

export interface ShippingOrderResponse {
  success: boolean;
  tracking_code?: string;
  consignment_id?: string;
  status?: string;
  message?: string;
  tracking_url?: string;
  url?: string;
}

export interface OrderTrackingResponse {
  status: string;
  tracking_url?: string;
  url?: string;
  estimated_delivery?: string;
  last_location?: string;
  events?: Array<{
    time: string;
    status: string;
    location?: string;
    message?: string;
  }>;
  error?: string;
}

export interface ShippingProvider {
  createOrder(data: ShippingOrderData): Promise<ShippingOrderResponse>;
  trackOrder(trackingId: string): Promise<OrderTrackingResponse>;
}

