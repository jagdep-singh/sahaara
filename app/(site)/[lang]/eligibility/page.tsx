import { FinderClient } from "@/app/(site)/[lang]/eligibility/finder-client";
import { getDict, type Lang } from "@/i18n";

type EligibilityPageProps = {
  params: Promise<{ lang: string }>;
};

export default async function EligibilityPage({
  params,
}: EligibilityPageProps) {
  const { lang: rawLang } = await params;
  const lang: Lang = rawLang === "en" ? "en" : "hi";
  const dict = getDict(lang);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
      <h1>{dict.finder.title}</h1>
      <FinderClient lang={lang} dict={dict} />
    </div>
  );
}
