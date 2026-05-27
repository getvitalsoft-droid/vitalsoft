import { redirect } from "next/navigation";
export default function Page({ searchParams }: { searchParams: { ref?: string } }) {
  const base = process.env.NEXT_PUBLIC_STRIPE_STARTER_LINK ?? "/";
  const url = searchParams.ref ? `${base}?client_reference_id=ref_${searchParams.ref}` : base;
  redirect(url);
}
