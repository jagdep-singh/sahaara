import type { Dictionary } from "@/i18n";

type SiteFooterProps = {
  dict: Dictionary;
};

export function SiteFooter({ dict }: SiteFooterProps) {
  return (
    <footer className="border-t border-border bg-secondary">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-6 text-base leading-relaxed text-muted-foreground">
        <p className="font-bold text-foreground">{dict.footer.helpline}</p>
        {/* <p>{dict.footer.privacy}</p>
        <p>{dict.footer.deletion}</p> */}
      </div>
    </footer>
  );
}
