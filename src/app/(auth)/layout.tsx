export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,115,68,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.88),transparent_34%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-6 py-12 lg:px-10">
        <section className="w-full max-w-xl">{children}</section>
      </div>
    </div>
  );
}
