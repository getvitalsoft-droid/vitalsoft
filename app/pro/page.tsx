import { redirect } from "next/navigation";

// Redirige a la calculadora con el plan preseleccionado
// en lugar de ir directamente a un Payment Link de Stripe
export default function Page({ searchParams }: { searchParams: { ref?: string } }) {
  const params = new URLSearchParams();
  params.set("clips", "40");
  if (searchParams.ref) params.set("ref", searchParams.ref);
  redirect(`/?${params.toString()}#calculadora`);
}
