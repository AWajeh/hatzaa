import { getTranslations } from "next-intl/server";
import { LegalDocument } from "@/components/legal/legal-document";

export default async function TermsPage() {
  const t = await getTranslations("legal");
  const sections = t.raw("terms.sections") as Array<{ title: string; body: string }>;

  return (
    <LegalDocument
      title={t("terms.title")}
      updated={t("terms.updated")}
      intro={t("terms.intro")}
      sections={sections}
      backHomeLabel={t("backHome")}
    />
  );
}
