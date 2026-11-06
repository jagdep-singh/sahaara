import Link from 'next/link';
import { getDict, type Lang } from '@/i18n';

export default function NotFound() { const lang: Lang = 'hi'; const dict = getDict(lang); return <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-8"><h1>{dict.common.notFound}</h1><Link className="text-primary underline" href={`/${lang}`}>{dict.common.home}</Link></div>; }
