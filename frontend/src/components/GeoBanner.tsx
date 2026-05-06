import { fetchGeo } from "@/lib/geo";

export async function GeoBanner() {
  const geo = await fetchGeo();

  if (!geo.country || geo.is_allowed) return null;

  return (
    <div
      role="alert"
      className="w-full bg-amber-100 text-amber-900 text-sm px-4 py-2 text-center border-b border-amber-200"
    >
      Solo enviamos a Panamá. Detectamos que estás en{" "}
      <strong>{geo.country_name ?? geo.country}</strong>. Si crees que es un
      error, contáctanos por WhatsApp.
    </div>
  );
}
