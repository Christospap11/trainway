import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { Aurora } from "@/components/site/aurora";
import { NeuralField } from "@/components/site/neural-field";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grain flex min-h-full flex-col">
      <Aurora />
      <NeuralField />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
