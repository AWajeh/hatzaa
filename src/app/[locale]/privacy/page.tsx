import { getTranslations } from "next-intl/server";
import { LegalDocument } from "@/components/legal/legal-document";

export default async function PrivacyPage() {
  const t = await getTranslations("legal");
  const sections = t.raw("privacy.sections") as Array<{ title: string; body: string }>;

  return (
    <LegalDocument
      title={t("privacy.title")}
      updated={t("privacy.updated")}
      intro={t("privacy.intro")}
      sections={sections}
      backHomeLabel={t("backHome")}
    />
  );
}
