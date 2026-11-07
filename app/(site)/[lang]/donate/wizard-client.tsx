"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  createDonation,
  type DonationFieldErrors,
  type DonationState,
} from "@/app/(site)/[lang]/donate/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { ChoiceCard } from "@/components/ui/choice-card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { fmt, type Dictionary, type Lang } from "@/i18n";
import type { ActiveCampaign } from "@/lib/campaigns";
import { formatINR, rupeesToPaise } from "@/lib/money";
import { maskPan } from "@/lib/pan";
import { cn } from "@/lib/utils";
import { donationInputSchema } from "@/lib/validators";

type DonationTypeValue = "ONE_TIME" | "MONTHLY";

const PRESET_AMOUNTS = [500, 1000, 2500, 5000] as const;
const INITIAL_STATE: DonationState = {};

const selectClassName =
  "h-12 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

type DonateWizardProps = {
  lang: Lang;
  dict: Dictionary;
  campaigns: ActiveCampaign[];
  initialCampaignSlug: string;
  idempotencyKey: string;
};

function mapFieldErrors(
  fields: Record<string, string[] | undefined>,
  dict: Dictionary
): DonationFieldErrors {
  return {
    amount: fields.amountRupees ? dict.donate.amountError : undefined,
    campaign: fields.campaignSlug ? dict.common.error : undefined,
    name: fields.name ? dict.common.required : undefined,
    email: fields.email ? dict.donate.emailError : undefined,
    phone: fields.phone ? dict.donate.phoneError : undefined,
    pan: fields.pan ? dict.donate.panError : undefined,
    consent: fields.consent ? dict.common.required : undefined,
  };
}

export function DonateWizard({
  lang,
  dict,
  campaigns,
  initialCampaignSlug,
  idempotencyKey,
}: DonateWizardProps) {
  const [step, setStep] = useState(0);
  const [type, setType] = useState<DonationTypeValue>("ONE_TIME");
  const [preset, setPreset] = useState<number | null>(500);
  const [customAmount, setCustomAmount] = useState("");
  const [amount, setAmount] = useState<number | null>(500);
  const [campaignSlug, setCampaignSlug] = useState(
    initialCampaignSlug
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pan, setPan] = useState("");
  const [consent, setConsent] = useState(false);
  const [localErrors, setLocalErrors] = useState<DonationFieldErrors>(
    {}
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [dismissedState, setDismissedState] =
    useState<DonationState | null>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const [state, formAction, pending] = useActionState(
    createDonation,
    INITIAL_STATE
  );
  const summaryRef = useRef<HTMLDivElement>(null);

  const stateErrorsVisible =
    state !== dismissedState &&
    Boolean(
      state.error ||
        Object.values(state.fieldErrors ?? {}).some(Boolean)
    );

  useEffect(() => {
    if (focusRequest > 0) summaryRef.current?.focus();
  }, [focusRequest, step]);

  useEffect(() => {
    if (stateErrorsVisible) summaryRef.current?.focus();
  }, [state, stateErrorsVisible]);

  function clearErrors() {
    setLocalErrors({});
    setLocalError(null);
    setDismissedState(state);
  }

  function choosePreset(value: number) {
    setPreset(value);
    setCustomAmount("");
    setAmount(value);
    clearErrors();
  }

  function changeCustomAmount(value: string) {
    setPreset(null);
    setCustomAmount(value);
    setAmount(value.trim() === "" ? null : Number(value));
    clearErrors();
  }

  function handleAmountNext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearErrors();

    if (
      amount === null ||
      !Number.isInteger(amount) ||
      amount < 100 ||
      amount > 1_000_000
    ) {
      setLocalErrors({ amount: dict.donate.amountError });
      setFocusRequest((current) => current + 1);
      return;
    }

    setStep(1);
  }

  function handleDetailsNext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearErrors();

    const parsed = donationInputSchema.safeParse({
      amountRupees: amount,
      type,
      campaignSlug: campaignSlug || undefined,
      name,
      email,
      phone: phone.trim() || undefined,
      pan,
      consent,
      idempotencyKey,
    });

    if (!parsed.success) {
      const errors = mapFieldErrors(
        parsed.error.flatten().fieldErrors,
        dict
      );
      setLocalErrors(errors);
      if (!Object.values(errors).some(Boolean)) {
        setLocalError(dict.common.error);
      }
      setFocusRequest((current) => current + 1);
      return;
    }

    setStep(2);
  }

  function goBack() {
    clearErrors();
    setStep((current) => Math.max(0, current - 1));
  }

  const fieldErrors = stateErrorsVisible
    ? state.fieldErrors ?? {}
    : localErrors;
  const generalError = stateErrorsVisible ? state.error : localError;
  const summaryMessages = Array.from(
    new Set(
      [generalError, ...Object.values(fieldErrors)].filter(
        (value): value is string => Boolean(value)
      )
    )
  );
  const hasErrors = summaryMessages.length > 0;
  const selectedCampaign = campaigns.find(
    (campaign) => campaign.slug === campaignSlug
  );
  const amountPaise =
    amount === null ? 0 : rupeesToPaise(amount);

  const errorSummary = hasErrors ? (
    <div
      ref={summaryRef}
      tabIndex={-1}
      role="alert"
      className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive"
    >
      <p className="font-bold">{summaryMessages[0]}</p>
      {summaryMessages.length > 1 ? (
        <ul className="mt-1 list-disc pl-5">
          {summaryMessages.slice(1).map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : null}
    </div>
  ) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p
          className="text-base font-bold text-muted-foreground"
          aria-live="polite"
        >
          {fmt(dict.donate.stepOf, { n: step + 1 })}
        </p>
        <div
          className="h-2 overflow-hidden rounded-full bg-secondary"
          role="progressbar"
          aria-label={fmt(dict.donate.stepOf, { n: step + 1 })}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={step + 1}
        >
          <div
            className="h-full bg-primary transition-[width] motion-reduce:transition-none"
            style={{ width: `${((step + 1) / 3) * 100}%` }}
          />
        </div>
      </div>

      {step === 0 ? (
        <form
          onSubmit={handleAmountNext}
          noValidate
          className="flex flex-col gap-6"
        >
          {errorSummary}

          <div className="flex flex-col gap-3">
            <h2>{dict.donate.step1}</h2>
            <fieldset className="flex flex-col gap-3">
              <legend className="sr-only">{dict.donate.step1}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <ChoiceCard
                  id="donate-type-one-time"
                  name="type"
                  value="ONE_TIME"
                  label={dict.donate.oneTime}
                  checked={type === "ONE_TIME"}
                  onChange={() => {
                    setType("ONE_TIME");
                    clearErrors();
                  }}
                  disabled={pending}
                />
                <ChoiceCard
                  id="donate-type-monthly"
                  name="type"
                  value="MONTHLY"
                  label={dict.donate.monthly}
                  checked={type === "MONTHLY"}
                  onChange={() => {
                    setType("MONTHLY");
                    clearErrors();
                  }}
                  disabled={pending}
                />
              </div>
            </fieldset>
            {type === "MONTHLY" ? (
              <Notice tone="info">{dict.donate.monthlyNote}</Notice>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            <h2>{dict.donate.amount}</h2>
            <fieldset className="flex flex-col gap-3">
              <legend className="sr-only">{dict.donate.amount}</legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PRESET_AMOUNTS.map((value) => (
                  <label
                    key={value}
                    className={cn(
                      "flex min-h-14 cursor-pointer items-center justify-center rounded-lg border-2 border-input bg-card p-3 font-bold",
                      "has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                      preset === value &&
                        "border-primary bg-primary/5"
                    )}
                  >
                    <input
                      type="radio"
                      name="amountPreset"
                      value={value}
                      checked={preset === value}
                      onChange={() => choosePreset(value)}
                      disabled={pending}
                      className="sr-only"
                    />
                    {formatINR(value * 100)}
                  </label>
                ))}
              </div>
            </fieldset>

            <Field
              data-invalid={
                fieldErrors.amount ? "true" : undefined
              }
            >
              <FieldLabel htmlFor="donate-custom-amount">
                {dict.donate.otherAmount}
              </FieldLabel>
              <Input
                id="donate-custom-amount"
                name="customAmount"
                type="number"
                inputMode="numeric"
                min={100}
                max={1_000_000}
                step={1}
                value={customAmount}
                onChange={(event) =>
                  changeCustomAmount(event.currentTarget.value)
                }
                aria-invalid={
                  fieldErrors.amount ? true : undefined
                }
                aria-describedby={
                  fieldErrors.amount
                    ? "donate-amount-error"
                    : undefined
                }
                disabled={pending}
              />
              {fieldErrors.amount ? (
                <FieldError id="donate-amount-error">
                  {fieldErrors.amount}
                </FieldError>
              ) : null}
            </Field>
          </div>

          {campaigns.length > 0 ? (
            <Field
              data-invalid={
                fieldErrors.campaign ? "true" : undefined
              }
            >
              <FieldLabel htmlFor="donate-campaign">
                {dict.donate.campaign}
              </FieldLabel>
              <select
                id="donate-campaign"
                name="campaignSlug"
                value={campaignSlug}
                onChange={(event) => {
                  setCampaignSlug(event.currentTarget.value);
                  clearErrors();
                }}
                aria-invalid={
                  fieldErrors.campaign ? true : undefined
                }
                aria-describedby={
                  fieldErrors.campaign
                    ? "donate-campaign-error"
                    : undefined
                }
                disabled={pending}
                className={selectClassName}
              >
                <option value="">{dict.donate.general}</option>
                {campaigns.map((campaign) => (
                  <option
                    key={campaign.slug}
                    value={campaign.slug}
                  >
                    {campaign.title}
                  </option>
                ))}
              </select>
              {fieldErrors.campaign ? (
                <FieldError id="donate-campaign-error">
                  {fieldErrors.campaign}
                </FieldError>
              ) : null}
            </Field>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-fit"
          >
            {dict.common.next}
          </Button>
        </form>
      ) : null}

      {step === 1 ? (
        <form
          onSubmit={handleDetailsNext}
          noValidate
          className="flex flex-col gap-6"
        >
          <h2>{dict.donate.step2}</h2>
          {errorSummary}

          <Field
            data-invalid={fieldErrors.name ? "true" : undefined}
          >
            <FieldLabel htmlFor="donate-name">
              {dict.donate.name}
            </FieldLabel>
            <Input
              id="donate-name"
              name="name"
              type="text"
              autoComplete="name"
              maxLength={80}
              value={name}
              onChange={(event) => {
                setName(event.currentTarget.value);
                clearErrors();
              }}
              aria-invalid={
                fieldErrors.name ? true : undefined
              }
              aria-describedby={
                fieldErrors.name ? "donate-name-error" : undefined
              }
              disabled={pending}
            />
            {fieldErrors.name ? (
              <FieldError id="donate-name-error">
                {fieldErrors.name}
              </FieldError>
            ) : null}
          </Field>

          <Field
            data-invalid={fieldErrors.email ? "true" : undefined}
          >
            <FieldLabel htmlFor="donate-email">
              {dict.donate.email}
            </FieldLabel>
            <Input
              id="donate-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.currentTarget.value);
                clearErrors();
              }}
              aria-invalid={
                fieldErrors.email ? true : undefined
              }
              aria-describedby={
                fieldErrors.email
                  ? "donate-email-error"
                  : undefined
              }
              disabled={pending}
            />
            {fieldErrors.email ? (
              <FieldError id="donate-email-error">
                {fieldErrors.email}
              </FieldError>
            ) : null}
          </Field>

          <Field
            data-invalid={fieldErrors.phone ? "true" : undefined}
          >
            <FieldLabel htmlFor="donate-phone">
              {dict.donate.phone}
            </FieldLabel>
            <Input
              id="donate-phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              value={phone}
              onChange={(event) => {
                setPhone(event.currentTarget.value);
                clearErrors();
              }}
              aria-invalid={
                fieldErrors.phone ? true : undefined
              }
              aria-describedby={
                fieldErrors.phone
                  ? "donate-phone-error"
                  : undefined
              }
              disabled={pending}
            />
            {fieldErrors.phone ? (
              <FieldError id="donate-phone-error">
                {fieldErrors.phone}
              </FieldError>
            ) : null}
          </Field>

          <Field
            data-invalid={fieldErrors.pan ? "true" : undefined}
          >
            <FieldLabel htmlFor="donate-pan">
              {dict.donate.pan}
            </FieldLabel>
            <Input
              id="donate-pan"
              name="pan"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={10}
              value={pan}
              onChange={(event) => {
                setPan(event.currentTarget.value.toUpperCase());
                clearErrors();
              }}
              aria-invalid={fieldErrors.pan ? true : undefined}
              aria-describedby={[
                fieldErrors.pan ? "donate-pan-error" : null,
                "donate-pan-help",
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={pending}
            />
            <FieldDescription id="donate-pan-help">
              {dict.donate.panHelp}
            </FieldDescription>
            {fieldErrors.pan ? (
              <FieldError id="donate-pan-error">
                {fieldErrors.pan}
              </FieldError>
            ) : null}
          </Field>

          <Field
            data-invalid={
              fieldErrors.consent ? "true" : undefined
            }
          >
            <label className="flex items-start gap-3 text-base">
              <input
                id="donate-consent"
                name="consent"
                type="checkbox"
                checked={consent}
                onChange={(event) => {
                  setConsent(event.currentTarget.checked);
                  clearErrors();
                }}
                aria-invalid={
                  fieldErrors.consent ? true : undefined
                }
                aria-describedby={
                  fieldErrors.consent
                    ? "donate-consent-error"
                    : undefined
                }
                disabled={pending}
                className="mt-1 size-5 shrink-0 accent-primary"
              />
              <span>{dict.donate.consent}</span>
            </label>
            {fieldErrors.consent ? (
              <FieldError id="donate-consent-error">
                {fieldErrors.consent}
              </FieldError>
            ) : null}
          </Field>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={goBack}
              disabled={pending}
              className="w-full sm:w-fit"
            >
              {dict.common.back}
            </Button>
            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-fit"
            >
              {dict.donate.review}
            </Button>
          </div>
        </form>
      ) : null}

      {step === 2 ? (
        <form
          action={formAction}
          noValidate
          aria-busy={pending || undefined}
          className="flex flex-col gap-6"
        >
          <h2>{dict.donate.step3}</h2>
          {errorSummary}

          <input type="hidden" name="lang" value={lang} />
          <input
            type="hidden"
            name="amountRupees"
            value={amount ?? ""}
          />
          <input type="hidden" name="type" value={type} />
          <input
            type="hidden"
            name="campaignSlug"
            value={campaignSlug}
          />
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="phone" value={phone} />
          <input type="hidden" name="pan" value={pan} />
          <input type="hidden" name="consent" value="on" />
          <input
            type="hidden"
            name="idempotencyKey"
            value={idempotencyKey}
          />

          <Card>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-[auto_1fr] sm:gap-x-6">
                <dt className="font-bold">{dict.donate.amount}</dt>
                <dd>{formatINR(amountPaise)}</dd>
                <dt className="font-bold">{dict.donate.frequency}</dt>
                <dd>
                  {type === "MONTHLY"
                    ? dict.donate.monthly
                    : dict.donate.oneTime}
                </dd>
                <dt className="font-bold">
                  {dict.donate.campaign}
                </dt>
                <dd>
                  {selectedCampaign?.title ?? dict.donate.general}
                </dd>
                <dt className="font-bold">{dict.donate.name}</dt>
                <dd>{name}</dd>
                <dt className="font-bold">{dict.donate.pan}</dt>
                <dd>
                  {maskPan(pan.replace(/\s+/g, "").toUpperCase())}
                </dd>
              </dl>
            </CardContent>
          </Card>

          {type === "MONTHLY" ? (
            <Notice tone="info">{dict.donate.monthlyNote}</Notice>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={goBack}
              disabled={pending}
              className="w-full sm:w-fit"
            >
              {dict.common.back}
            </Button>
            <Button
              type="submit"
              size="lg"
              loading={pending}
              disabled={!idempotencyKey}
              className="w-full sm:w-fit"
            >
              {dict.donate.pay}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
