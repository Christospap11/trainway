import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Blog" };

export default function BlogPage() {
  return (
    <Container className="flex min-h-[60vh] max-w-2xl flex-col items-center justify-center py-24 text-center">
      <span className="rounded-full border border-ink/10 bg-ink/5 px-4 py-1.5 text-sm text-muted backdrop-blur-sm">
        Coming soon
      </span>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
        Our blog is on the way
      </h1>
      <p className="mt-5 text-lg text-muted">
        We&apos;re putting together stories on AI training, language data, and
        tips for trainers. Check back soon.
      </p>
      <Button href="/" variant="outline" className="mt-8">
        Back to home
      </Button>
    </Container>
  );
}
