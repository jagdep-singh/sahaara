"use client";

import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { getDict, isLang } from "@/i18n";

export default function HomeError({ reset }: { reset: () => void }) {
  const pathname = usePathname();
  const segment = pathname.split("/")[1];
  const lang = isLang(segment) ? segment : "hi";
  const dict = getDict(lang);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8">
      <Notice tone="error" title={dict.common.error} />
      <Button onClick={() => reset()} className="w-fit">
        {dict.common.retry}
      </Button>
    </div>
  );
}
