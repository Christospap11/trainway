import type { Metadata } from "next";
import { LegalShell, LegalSection } from "@/components/site/legal";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Independent Contractor Agreement" };

export default function ContractorAgreementPage() {
  return (
    <LegalShell
      title="Independent Contractor Agreement"
      updated="June 14, 2026"
      intro={`This agreement governs the relationship between you (the "Contractor") and ${siteConfig.name} (the "Company"). You accept it when you join the platform.`}
    >
      <LegalSection title="1. Independent contractor status">
        <p>
          You provide services as an independent contractor, not an employee.
          Nothing in this agreement creates an employment, partnership, joint
          venture, or agency relationship. You control how and when you work, and
          you may work for others.
        </p>
      </LegalSection>
      <LegalSection title="2. Taxes (sole responsibility)">
        <p>
          You are solely responsible for declaring your income and paying any tax,
          duty, VAT, or social contribution required by the laws of your country of
          tax residence. The Company makes no withholding (except where explicitly
          required by international law), and you release the Company from any claim
          by your local tax authorities.
        </p>
      </LegalSection>
      <LegalSection title="3. Confidentiality (NDA)">
        <p>
          You will keep all project data, prompts, guidelines, and materials
          strictly confidential. You will not share, reproduce, or use them outside
          the platform, and you will delete any local copies on request. This
          obligation survives termination of this agreement.
        </p>
      </LegalSection>
      <LegalSection title="4. Intellectual property">
        <p>
          All work product — including data, annotations, text, and code — that you
          create through the platform is assigned to and owned entirely by the
          Company upon creation. You waive any moral rights to the extent permitted
          by law.
        </p>
      </LegalSection>
      <LegalSection title="5. No use of AI for human-data tasks">
        <p>
          Where a project requires human-generated data, you will not use AI tools
          to produce that work. Violations may result in non-payment and removal
          from the platform.
        </p>
      </LegalSection>
      <LegalSection title="6. Payment">
        <p>
          You are paid per task or per hour as specified per project, for work that
          passes quality review. Payout-provider fees are deducted from your final
          amount as described in the Terms of Service.
        </p>
      </LegalSection>
      <LegalSection title="7. Termination">
        <p>
          Either party may end this relationship at any time. Confidentiality and
          intellectual-property terms survive termination.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
