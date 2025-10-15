export function StaticSparkles() {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full bg-background">
      <div
        className="absolute bottom-0 left-0 right-0 top-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, hsl(var(--border) / 0.1) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.1) 1px, transparent 1px)',
          backgroundSize: '4rem 4rem',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, hsl(45 100% 80% / 0.1), transparent 20%),
            radial-gradient(circle at 75% 75%, hsl(45 100% 80% / 0.1), transparent 20%),
            radial-gradient(circle at 10% 80%, hsl(45 100% 80% / 0.05), transparent 15%),
            radial-gradient(circle at 90% 15%, hsl(45 100% 80% / 0.05), transparent 15%)
          `,
          backgroundSize: '100% 100%',
        }}
      ></div>
    </div>
  );
}
