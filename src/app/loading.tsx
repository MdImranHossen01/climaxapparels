import LoadingSplash from "@/components/ui/LoadingSplash";
import { getCachedSettings } from "@/lib/data-fetching";

export default async function Loading() {
  const settings = await getCachedSettings();

  return <LoadingSplash logoUrl={settings?.logoUrl} brandName={settings?.brandName} />;
}

