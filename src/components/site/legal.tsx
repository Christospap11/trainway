import { Container } from "@/components/ui/container";

export function LegalShell({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated?: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <Container className="max-w-3xl py-20 sm:py-28">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        {title}
      </h1>
      {updated && (
        <p className="mt-4 text-sm text-muted">Last updated: {updated}</p>
      )}
      {intro && <p className="mt-6 text-lg text-muted">{intro}</p>}
      <div className="mt-12 space-y-10">{children}</div>
    </Container>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-muted">{children}</div>
    </section>
  );
}
