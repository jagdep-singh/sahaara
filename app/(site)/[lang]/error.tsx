'use client';

import { useEffect } from 'react';
import { getDict } from '@/i18n';

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) { useEffect(() => { console.error(error); }, [error]); const dict = getDict('hi'); return <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-8"><h1>{dict.common.error}</h1><button className="min-h-12 w-fit rounded-lg bg-primary px-5 font-bold text-primary-foreground" onClick={() => reset()}>{dict.common.retry}</button></div>; }
