export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,115,68,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.88),transparent_34%)]" />
      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-12 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <section className="space-y-8">
          <div className="inline-flex rounded-full border border-[var(--border)] bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-strong)] backdrop-blur">
            Amanah Project Hub
          </div>
          <div className="space-y-6">
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-[var(--foreground)] md:text-6xl">
              Kendalikan project agency dari brief sampai deadline.
            </h1>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Project", "Kelola semua client dan timeline project aktif."],
              ["Board", "Gerakkan task antar status tanpa keluar dari detail project."],
              ["Calendar", "Pantau tanggal mulai dan due date semua task per project."],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-[20px] border border-[var(--border)] bg-white/70 p-5 shadow-sm backdrop-blur">
                <h2 className="mb-2 text-base font-semibold text-[var(--foreground)]">{title}</h2>
                <p className="text-sm leading-6 text-[var(--muted)]">{copy}</p>
              </div>
            ))}
          </div>
        </section>
        <section>{children}</section>
      </div>
    </div>
  );
}
