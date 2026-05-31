import PagarClient from "./PagarClient";

export default function PagarPage({
  searchParams,
}: {
  searchParams: { ref?: string; clips?: string };
}) {
  return (
    <PagarClient
      agentRef={searchParams.ref || ""}
      clips={Number(searchParams.clips) || 10}
    />
  );
}
