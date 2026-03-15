export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="light" data-theme="light" style={{ colorScheme: "light" }}>
      {children}
    </div>
  );
}
