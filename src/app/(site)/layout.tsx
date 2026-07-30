import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { LivingBackdrop } from "@/components/site/living-backdrop";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grain flex min-h-full flex-col">
      <LivingBackdrop />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
