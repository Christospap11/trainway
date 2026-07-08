import type { Metadata } from "next";
import { LegalShell, LegalSection } from "@/components/site/legal";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      updated="June 14, 2026"
      intro={`These terms govern your use of the ${siteConfig.name} platform. By creating an account, you agree to them.`}
    >
      <LegalSection title="1. Eligibility & accounts">
        <p>
          You must be at least 18 years old and provide accurate information when
          you register. You are responsible for keeping your account credentials
          secure and for all activity under your account.
        </p>
      </LegalSection>
      <LegalSection title="2. Using the platform">
        <p>
          {siteConfig.name} connects vetted contributors with paid AI training and
          evaluation projects. You agree to follow each project&apos;s guidelines,
          to submit only your own original work, and not to use automated tools or
          AI to generate work that should be produced by a human.
        </p>
      </LegalSection>
      <LegalSection title="3. Quality & removal">
        <p>
          Work is subject to quality review. We may reject submissions that do not
          meet guidelines, and we may suspend or remove accounts that repeatedly
          fail quality checks, attempt to game the system, or violate these terms.
        </p>
      </LegalSection>
      <LegalSection title="4. Payment">
        <p>
          You are paid per task or per hour as stated on each project. Cleared
          earnings can be withdrawn via the supported payout methods. Provider
          receiving and currency-conversion fees are deducted from your payout.
        </p>
      </LegalSection>
      <LegalSection title="5. Confidentiality & ownership">
        <p>
          Project materials are confidential. All work product you create through
          the platform is assigned to and owned by the company. See the{" "}
          <a href="/contractor-agreement" className="text-primary hover:underline">
            Independent Contractor Agreement
          </a>{" "}
          for details.
        </p>
      </LegalSection>
      <LegalSection title="6. Changes">
        <p>
          We may update these terms from time to time. Continued use of the
          platform after changes take effect constitutes acceptance.
        </p>
      </LegalSection>
      <LegalSection title="Contact">
        <p>
          Questions about these terms? Email{" "}
          <a href="mailto:legal@trainway.ai" className="text-primary hover:underline">
            legal@trainway.ai
          </a>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}
