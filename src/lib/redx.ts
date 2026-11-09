import { RedXConfig, RedXProvider } from './shipping/providers/redx';

export type { RedXConfig };
export { RedXProvider };

/**
 * Checks the real-time status of a RedX courier delivery
 */
export async function getRedXStatus(trackingId: string, config: RedXConfig | string) {
  const provider = new RedXProvider(config);
  return await provider.getOrderStatus(trackingId);
}

