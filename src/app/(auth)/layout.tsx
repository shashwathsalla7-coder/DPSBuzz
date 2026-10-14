export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="min-h-dvh flex flex-col items-center justify-center p-4"
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "var(--font-satoshi), 'Satoshi', sans-serif",
      }}
    >
      <div className="w-full max-w-[375px] mx-auto py-6">
        {children}
      </div>
    </main>
  );
}
