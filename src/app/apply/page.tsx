import { ApplicationWizard } from "@/components/apply/application-wizard";
import { getAssessment } from "@/lib/assessment";

export default function ApplyPage() {
  // questions are fetched server-side; the answer key never reaches the client
  return <ApplicationWizard assessment={getAssessment()} />;
}
