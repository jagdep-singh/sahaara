"use client";

import {
  useState,
  useTransition,
  type FormEvent,
} from "react";

import {
  submitCallback,
  type CallbackState,
} from "@/app/(site)/[lang]/eligibility/actions";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { DISTRICTS } from "@/lib/constants";
import type { Dictionary, Lang } from "@/i18n";

const initialState: CallbackState = {};

const selectClassName =
  "h-12 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

type CallbackFormProps = {
  lang: Lang;
  dict: Dictionary;
  schemeCodes: string[];
  defaultDistrict?: string;
};

export function CallbackForm({
  lang,
  dict,
  schemeCodes,
  defaultDistrict,
}: CallbackFormProps) {
  const initialDistrict =
    DISTRICTS.find((value) => value === defaultDistrict) ?? "";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState(initialDistrict);
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<CallbackState>(initialState);
  const [pending, startTransition] = useTransition();
  const errors = state.fieldErrors ?? {};

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setState({});

    startTransition(async () => {
      try {
        setState(await submitCallback(state, formData));
      } catch {
        setState({ error: dict.common.error });
      }
    });
  }

  if (state.success) {
    return <Notice tone="success">{dict.callback.thanks}</Notice>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={pending || undefined}
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="lang" value={lang} />
      {schemeCodes.map((code, index) => (
        <input
          key={`${code}-${index}`}
          type="hidden"
          name="schemeCodes"
          value={code}
        />
      ))}

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}

      <Field data-invalid={errors.name ? "true" : undefined}>
        <FieldLabel htmlFor="callback-name">
          {dict.callback.name}
        </FieldLabel>
        <Input
          id="callback-name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={80}
          required
          disabled={pending}
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={
            errors.name ? "callback-name-error" : undefined
          }
        />
        {errors.name ? (
          <FieldError id="callback-name-error">{errors.name}</FieldError>
        ) : null}
      </Field>

      <Field data-invalid={errors.phone ? "true" : undefined}>
        <FieldLabel htmlFor="callback-phone">
          {dict.callback.phone}
        </FieldLabel>
        <Input
          id="callback-phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          maxLength={10}
          required
          disabled={pending}
          value={phone}
          onChange={(event) => setPhone(event.currentTarget.value)}
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={
            errors.phone ? "callback-phone-error" : undefined
          }
        />
        {errors.phone ? (
          <FieldError id="callback-phone-error">{errors.phone}</FieldError>
        ) : null}
      </Field>

      <Field data-invalid={errors.district ? "true" : undefined}>
        <FieldLabel htmlFor="callback-district">
          {dict.home.districtLabel}
        </FieldLabel>
        <select
          id="callback-district"
          name="district"
          value={district}
          onChange={(event) =>
            setDistrict(event.currentTarget.value)
          }
          required
          disabled={pending}
          aria-invalid={errors.district ? true : undefined}
          aria-describedby={
            errors.district ? "callback-district-error" : undefined
          }
          className={selectClassName}
        >
          <option value="" disabled>
            {dict.home.districtLabel}
          </option>
          {DISTRICTS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        {errors.district ? (
          <FieldError id="callback-district-error">
            {errors.district}
          </FieldError>
        ) : null}
      </Field>

      <Field data-invalid={errors.consent ? "true" : undefined}>
        <label className="flex items-start gap-3 text-base">
          <input
            id="callback-consent"
            name="consent"
            type="checkbox"
            required
            disabled={pending}
            checked={consent}
            onChange={(event) =>
              setConsent(event.currentTarget.checked)
            }
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={
              errors.consent ? "callback-consent-error" : undefined
            }
            className="mt-1 size-5 shrink-0 accent-primary"
          />
          <span>{dict.callback.consent}</span>
        </label>
        {errors.consent ? (
          <FieldError id="callback-consent-error">
            {errors.consent}
          </FieldError>
        ) : null}
      </Field>

      <Button
        type="submit"
        size="lg"
        loading={pending}
        className="w-full sm:w-fit"
      >
        {dict.callback.submit}
      </Button>
    </form>
  );
}
