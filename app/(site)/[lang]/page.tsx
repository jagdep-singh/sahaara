import { getDict, type Lang } from "@/i18n";

type HomePageProps = {
  params: Promise<{ lang: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { lang: rawLang } = await params;
  const lang: Lang = rawLang === "en" ? "en" : "hi";
  const dict = getDict(lang);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1>{dict.home.title}</h1>
      <p className="mt-3 text-muted-foreground">{dict.home.finderHint}</p>
    </div>
  );
}
