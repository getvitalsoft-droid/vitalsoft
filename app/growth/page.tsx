import { redirect } from "next/navigation";
export default function Page({ searchParams }: { searchParams: { ref?: string } }) {
  const base = process.env.NEXT_PUBLIC_STRIPE_GROWTH_LINK ?? "/";
  const ref = searchParams.ref ? `?client_reference_id=ref_${searchParams.ref}` : "";
  redirect(`${base}${ref}`);
}
