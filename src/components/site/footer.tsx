import Link from "next/link";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="relative mt-12 border-t border-ink/10">
      <Container className="py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5 font-semibold">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-brand-indigo via-brand-violet to-brand-fuchsia text-sm text-white shadow-[0_0_20px_-2px_rgba(139,92,246,0.7)]">
                ◆
              </span>
              <span className="text-lg tracking-tight">{siteConfig.name}</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted">{siteConfig.description}</p>
          </div>

          {Object.entries(siteConfig.footer).map(([group, links]) => (
            <div key={group}>
              <h3 className="text-sm font-semibold">{group}</h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-ink/10 pt-8 text-sm text-muted sm:flex-row">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p>Built for the next generation of AI training.</p>
        </div>
      </Container>
    </footer>
  );
}
