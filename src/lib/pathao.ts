import { PathaoConfig, PathaoProvider } from './shipping/providers/pathao';

export type { PathaoConfig };
export { PathaoProvider };

/**
 * Checks the real-time status of a Pathao courier delivery
 */
export async function getPathaoStatus(consignmentId: string, config: PathaoConfig) {
  const provider = new PathaoProvider(config);
  return await provider.getOrderStatus(consignmentId);
}

