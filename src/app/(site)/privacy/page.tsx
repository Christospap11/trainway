import type { Metadata } from "next";
import { LegalShell, LegalSection } from "@/components/site/legal";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      updated="June 14, 2026"
      intro={`How ${siteConfig.name} collects, uses, and protects your personal data. We are committed to GDPR compliance.`}
    >
      <LegalSection title="1. Data we collect">
        <p>
          Account details (name, email), profile information (languages, skills,
          country), payment details you provide for payouts, and activity data
          such as tasks completed, time spent, and quality scores.
        </p>
      </LegalSection>
      <LegalSection title="2. How we use it">
        <p>
          To operate the platform: matching you to projects, reviewing quality,
          processing payouts, providing support, and meeting legal and accounting
          obligations. We do not sell your personal data.
        </p>
      </LegalSection>
      <LegalSection title="3. Client project data">
        <p>
          Project content you work on belongs to our clients and is processed
          under data-processing agreements. You may only access it to complete
          tasks and must not copy or share it.
        </p>
      </LegalSection>
      <LegalSection title="4. Storage & security">
        <p>
          Data is stored securely, and sensitive fields such as payment details
          are encrypted. We retain data only as long as necessary for the purposes
          above or as required by law.
        </p>
      </LegalSection>
      <LegalSection title="5. Your rights">
        <p>
          Under GDPR you may request access to, correction of, or deletion of your
          personal data, and you may object to certain processing. Contact us to
          exercise these rights.
        </p>
      </LegalSection>
      <LegalSection title="Contact">
        <p>
          For privacy requests, email{" "}
          <a href="mailto:privacy@trainway.ai" className="text-primary hover:underline">
            privacy@trainway.ai
          </a>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}
