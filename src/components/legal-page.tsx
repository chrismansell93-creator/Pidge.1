import Link from "next/link";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <Link href="/" className="text-xs font-black tracking-[0.2em] text-[#ffc800]">
        PIDGE
      </Link>
      <h1 className="mt-4 text-3xl font-black">{title}</h1>
      <div className="mt-6 space-y-4 text-sm leading-6 text-zinc-300">{children}</div>
      <p className="mt-10 flex flex-wrap gap-4 text-xs text-zinc-500">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/safety">Safety</Link>
        <Link href="/community">Community</Link>
        <Link href="/support">Support</Link>
      </p>
    </main>
  );
}
