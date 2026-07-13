import LoadingSplash from "@/components/ui/LoadingSplash";
import { getCachedSettings } from "@/lib/data-fetching";
import { headers } from "next/headers";

export default async function Loading() {
  const headersList = await headers();
  const hostname = headersList.get('host') || 'localhost';
  const settings = await getCachedSettings();

  return <LoadingSplash logoUrl={settings?.logoUrl} brandName={settings?.brandName} />;
}

