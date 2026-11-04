import { LangToggle } from "@/components/lang-toggle"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Chip } from "@/components/ui/chip"
import { ChoiceCard } from "@/components/ui/choice-card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { LinkButton } from "@/components/ui/link-button"
import { Notice } from "@/components/ui/notice"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

export default async function KitPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: rawLang } = await params
  const lang = rawLang === "en" ? "en" : "hi"

  return (
    <main
      lang={lang}
      className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 pt-6 pb-8"
    >
      <div className="flex justify-end">
        <LangToggle lang={lang} path="/kit" />
      </div>

      <header className="flex flex-col gap-2">
        <h1>UI किट</h1>
        <p className="text-muted-foreground">
          सहारा के आधारभूत घटक। यह पृष्ठ अस्थायी है और T34 में हटा दिया जाएगा।
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2>बटन</h2>
        <div className="flex flex-wrap gap-3">
          <Button>दान करें</Button>
          <Button variant="secondary">योजना देखें</Button>
          <Button variant="outline">वापस जाएँ</Button>
          <Button variant="ghost">रद्द करें</Button>
          <Button variant="destructive">हटाएँ</Button>
          <Button variant="link">और पढ़ें</Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button disabled>अक्षम</Button>
          <Button loading>भेजा जा रहा है…</Button>
          <LinkButton href="/hi/kit" variant="outline">
            लिंक बटन
          </LinkButton>
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h2>फ़ॉर्म</h2>
        <Card>
          <CardHeader>
            <CardTitle>आवेदक की जानकारी</CardTitle>
            <CardDescription>
              सभी जानकारी सुरक्षित रहती है और केवल पात्रता जाँचने के लिए उपयोग होती है।
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="kit-name">पूरा नाम</FieldLabel>
                <Input id="kit-name" placeholder="जैसे: सुनीता देवी" />
                <FieldDescription>आधार कार्ड के अनुसार नाम लिखें।</FieldDescription>
              </Field>
              <Field data-invalid="true">
                <FieldLabel htmlFor="kit-phone">मोबाइल नंबर</FieldLabel>
                <Input
                  id="kit-phone"
                  type="tel"
                  inputMode="numeric"
                  defaultValue="98765"
                  aria-invalid="true"
                  aria-describedby="kit-phone-error"
                />
                <FieldError id="kit-phone-error">
                  10 अंकों का मोबाइल नंबर दर्ज करें।
                </FieldError>
              </Field>
              <FieldSeparator>या</FieldSeparator>
              <Field>
                <FieldLabel htmlFor="kit-email">ईमेल (वैकल्पिक)</FieldLabel>
                <Input id="kit-email" type="email" placeholder="name@example.com" />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <h2>विकल्प</h2>
        <FieldSet>
          <FieldLegend>क्या आपके पास राशन कार्ड है?</FieldLegend>
          <div className="grid gap-3">
            <ChoiceCard
              id="kit-ration-yes"
              name="kit-ration"
              value="yes"
              label="हाँ"
              description="राशन कार्ड की संख्या अगले चरण में माँगी जाएगी।"
              defaultChecked
            />
            <ChoiceCard
              id="kit-ration-no"
              name="kit-ration"
              value="no"
              label="नहीं"
              description="कोई बात नहीं, आप अन्य योजनाओं के लिए पात्र हो सकते हैं।"
            />
          </div>
          <FieldDescription>
            एक विकल्प चुनें। यह जानकारी केवल आपके सत्र में रहेगी।
          </FieldDescription>
        </FieldSet>
      </section>

      <section className="flex flex-col gap-4">
        <h2>चिप्स</h2>
        <div className="flex flex-wrap gap-2">
          <Chip tone="primary">पात्र</Chip>
          <Chip>जाँच बाकी</Chip>
          <Chip tone="accent">जल्द आ रहा है</Chip>
          <Chip tone="danger">पात्र नहीं</Chip>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2>सूचनाएँ</h2>
        <Notice tone="info" title="जानकारी">
          आवेदन से पहले दस्तावेज़ों की जाँच कर लें।
        </Notice>
        <Notice tone="success" title="सफल">
          आपका फ़ॉर्म सुरक्षित रूप से सहेजा गया है।
        </Notice>
        <Notice tone="warning" title="ध्यान दें">
          अंतिम तिथि 31 मार्च है। देरी न करें।
        </Notice>
        <Notice tone="error" title="त्रुटि">
          मोबाइल नंबर सही नहीं है। कृपया फिर से प्रयास करें।
        </Notice>
      </section>

      <section className="flex flex-col gap-4">
        <h2>लोडिंग</h2>
        <div className="flex flex-col gap-2" aria-busy="true">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Spinner />
          <span>योजनाएँ लोड हो रही हैं…</span>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2>कार्ड</h2>
        <Card>
          <CardHeader>
            <CardTitle>वृद्धावस्था पेंशन योजना</CardTitle>
            <CardDescription>
              60 वर्ष से अधिक आयु के पात्र लाभार्थियों के लिए मासिक सहायता।
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Chip tone="primary">पात्र</Chip>
            <Chip tone="accent">राज्य योजना</Chip>
          </CardContent>
          <CardFooter>
            <LinkButton href="/hi/kit" variant="outline">
              विवरण देखें
            </LinkButton>
          </CardFooter>
        </Card>
      </section>
    </main>
  )
}
