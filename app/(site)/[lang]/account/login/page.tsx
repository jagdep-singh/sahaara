import { getDict, type Lang } from '@/i18n';
import { donorLoginAction } from './actions';

export default async function DonorLoginPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params; const lang: Lang = rawLang === 'en' ? 'en' : 'hi'; const dict = getDict(lang);
  return <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-8"><h1>{dict.account.login}</h1><form action={donorLoginAction} className="flex flex-col gap-4"><input type="hidden" name="lang" value={lang} />{[['email', dict.account.email, 'email'], ['code', dict.account.code, 'text']].map(([name, label, type]) => <label className="flex flex-col gap-1" key={name}><span className="font-bold">{label}</span><input className="min-h-12 rounded-lg border bg-card px-3" name={name} type={type} required /></label>)}<p className="text-muted-foreground">{dict.account.hint}</p><button className="min-h-12 rounded-lg bg-primary px-5 font-bold text-primary-foreground" type="submit">{dict.account.submit}</button></form></div>;
}
