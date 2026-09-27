export function SplashScreen({ mensaje }: { mensaje?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-bg">
      <img
        src="/assets/logo-bendita.jpeg"
        alt="Bendita Burbuja"
        className="splash-logo w-24 h-24 object-cover rounded"
      />
      <div className="flex gap-1.5">
        <span className="splash-dot w-2.5 h-2.5 bg-ink rounded-sm" />
        <span className="splash-dot w-2.5 h-2.5 bg-ink rounded-sm" />
        <span className="splash-dot w-2.5 h-2.5 bg-ink rounded-sm" />
      </div>
      {mensaje && <span className="text-sm text-muted">{mensaje}</span>}
    </div>
  )
}
