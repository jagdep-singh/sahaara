import { getDict } from '@/i18n';

export default function Loading() { const dict = getDict('hi'); return <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-8" aria-live="polite"><h1>{dict.common.loading}</h1><div className="h-24 animate-pulse rounded-xl bg-muted" /><div className="h-24 animate-pulse rounded-xl bg-muted" /></div>; }
