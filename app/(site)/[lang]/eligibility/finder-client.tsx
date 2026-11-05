"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";

import {
  runFinder,
  type FinderMatch,
} from "@/app/(site)/[lang]/eligibility/actions";
import { CallbackForm } from "@/app/(site)/[lang]/eligibility/callback-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { ChoiceCard } from "@/components/ui/choice-card";
import { Input } from "@/components/ui/input";
import { LinkButton } from "@/components/ui/link-button";
import { Notice } from "@/components/ui/notice";
import { DISTRICTS } from "@/lib/constants";
import type { Answers } from "@/lib/eligibility";
import { fmt, type Dictionary, type Lang } from "@/i18n";

const STEPS = [
  "age",
  "maritalStatus",
  "hasBplCard",
  "isShgMember",
  "pregnancy",
  "district",
] as const;

type StepKey = (typeof STEPS)[number];

const LAST_STEP = STEPS.length - 1;

const MARITAL_OPTIONS = ["married", "widow", "single", "other"] as const;
const YES_NO_UNSURE_OPTIONS = ["yes", "no", "unsure"] as const;
const PREGNANCY_OPTIONS = ["no", "first", "not_first"] as const;

function isStepValid(step: StepKey, answers: Partial<Answers>) {
  switch (step) {
    case "age":
      return (
        typeof answers.age === "number" &&
        Number.isInteger(answers.age) &&
        answers.age >= 10 &&
        answers.age <= 100
      );
    case "maritalStatus":
      return answers.maritalStatus !== undefined;
    case "hasBplCard":
      return answers.hasBplCard !== undefined;
    case "isShgMember":
      return answers.isShgMember !== undefined;
    case "pregnancy":
      return answers.pregnancy !== undefined;
    case "district":
      return answers.district !== undefined;
  }
}

type FinderClientProps = {
  lang: Lang;
  dict: Dictionary;
};

export function FinderClient({ lang, dict }: FinderClientProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [matches, setMatches] = useState<FinderMatch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const questionRef = useRef<HTMLHeadingElement>(null);
  const resultsRef = useRef<HTMLHeadingElement>(null);

  const currentStep = STEPS[step];
  const valid = isStepValid(currentStep, answers);
  const ageInvalid =
    currentStep === "age" && answers.age !== undefined && !valid;

  useEffect(() => {
    if (matches) {
      resultsRef.current?.focus();
    } else {
      questionRef.current?.focus();
    }
  }, [matches, step]);

  function setAnswer<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!valid) return;

    if (step < LAST_STEP) {
      setStep(step + 1);
      return;
    }

    startTransition(async () => {
      try {
        const response = await runFinder(lang, answers as Answers);

        if (response.ok) {
          setMatches(response.matches);
        } else {
          setError(response.error);
        }
      } catch {
        setError(dict.common.error);
      }
    });
  }

  function reset() {
    setAnswers({});
    setStep(0);
    setMatches(null);
    setError(null);
  }

  function radioGroup<K extends keyof Answers>(
    field: K,
    question: string,
    options: ReadonlyArray<{
      value: NonNullable<Answers[K]>;
      label: string;
    }>
  ) {
    return (
      <div className="flex flex-col gap-3">
        <h2 ref={questionRef} tabIndex={-1}>
          {question}
        </h2>
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">{question}</legend>
          {options.map((option) => (
            <ChoiceCard
              key={String(option.value)}
              id={`finder-${field}-${String(option.value)}`}
              name={field}
              value={String(option.value)}
              label={option.label}
              checked={answers[field] === option.value}
              onChange={() => setAnswer(field, option.value)}
              required
              disabled={pending}
            />
          ))}
        </fieldset>
      </div>
    );
  }

  function renderQuestion() {
    switch (currentStep) {
      case "age":
        return (
          <div className="flex flex-col gap-3">
            <h2 ref={questionRef} tabIndex={-1}>
              {dict.finder.q.age}
            </h2>
            <label htmlFor="finder-age" className="sr-only">
              {dict.finder.q.age}
            </label>
            <div className="flex items-center gap-3">
              <Input
                id="finder-age"
                name="age"
                type="number"
                inputMode="numeric"
                min={10}
                max={100}
                step={1}
                required
                autoComplete="off"
                value={answers.age ?? ""}
                onChange={(event) => {
                  const raw = event.currentTarget.value;
                  setAnswer(
                    "age",
                    raw === "" ? undefined : Number(raw)
                  );
                }}
                aria-invalid={ageInvalid || undefined}
                aria-describedby={
                  ageInvalid ? "finder-age-error" : undefined
                }
                disabled={pending}
                className="max-w-40"
              />
              <span className="text-base text-muted-foreground">
                {dict.finder.ageUnit}
              </span>
            </div>
            {ageInvalid ? (
              <p
                id="finder-age-error"
                className="text-base font-bold text-destructive"
              >
                {dict.common.required}
              </p>
            ) : null}
          </div>
        );
      case "maritalStatus":
        return radioGroup(
          "maritalStatus",
          dict.finder.q.marital,
          MARITAL_OPTIONS.map((value) => ({
            value,
            label: dict.finder.marital[value],
          }))
        );
      case "hasBplCard":
        return radioGroup(
          "hasBplCard",
          dict.finder.q.bpl,
          YES_NO_UNSURE_OPTIONS.map((value) => ({
            value,
            label: dict.finder[value],
          }))
        );
      case "isShgMember":
        return radioGroup(
          "isShgMember",
          dict.finder.q.shg,
          YES_NO_UNSURE_OPTIONS.map((value) => ({
            value,
            label: dict.finder[value],
          }))
        );
      case "pregnancy":
        return radioGroup(
          "pregnancy",
          dict.finder.q.pregnancy,
          PREGNANCY_OPTIONS.map((value) => ({
            value,
            label: dict.finder.pregnancy[value],
          }))
        );
      case "district":
        return radioGroup(
          "district",
          dict.finder.q.district,
          DISTRICTS.map((value) => ({
            value,
            label: value,
          }))
        );
    }
  }

  if (matches) {
    return (
      <div className="flex flex-col gap-6">
        <h2 ref={resultsRef} tabIndex={-1}>
          {dict.finder.resultsTitle}
        </h2>

        {matches.length > 0 ? (
          <div className="flex flex-col gap-4">
            {matches.map((match) => (
              <Card key={match.code}>
                <CardHeader className="gap-3">
                  <Badge
                    variant={
                      match.status === "match" ? "default" : "secondary"
                    }
                    className="w-fit"
                  >
                    {match.status === "match"
                      ? dict.finder.badge.match
                      : dict.finder.badge.check}
                  </Badge>
                  <h3 className="text-lg leading-snug font-bold">
                    {match.title}
                  </h3>
                  <p className="text-base text-muted-foreground">
                    {match.benefit}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <h4 className="font-bold">{dict.finder.rulesUsed}</h4>
                    <ul className="flex flex-col gap-1">
                      {match.results.map(({ rule, result }, index) => {
                        const met = result === "met";
                        const label = lang === "hi"
                          ? rule.labelHi
                          : rule.labelEn;

                        return (
                          <li
                            key={`${rule.fact}-${index}`}
                            className="flex gap-2"
                          >
                            <span aria-hidden="true" className="font-bold">
                              {met ? "✓" : "?"}
                            </span>
                            <span>
                              {met
                                ? dict.finder.rule.met
                                : dict.finder.rule.unknown}
                              : {label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <LinkButton
                    href={`/${lang}/schemes/${match.slug}`}
                    variant="outline"
                    size="sm"
                    className="w-fit"
                  >
                    {dict.home.view}
                  </LinkButton>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Notice tone="info">{dict.finder.noMatch}</Notice>
        )}

        <Notice tone="info">{dict.finder.disclaimer}</Notice>

        <section
          id="callback"
          className="scroll-mt-6 border-t border-border pt-6"
        >
          <h2 className="mb-4">{dict.callback.title}</h2>
          <CallbackForm
            lang={lang}
            dict={dict}
            schemeCodes={matches.map((match) => match.code)}
            defaultDistrict={answers.district}
          />
        </section>

        <Button
          type="button"
          variant="outline"
          onClick={reset}
          className="w-full sm:w-fit"
        >
          {dict.finder.again}
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={pending || undefined}
      className="flex flex-col gap-6"
    >
      <p
        aria-live="polite"
        className="text-base font-bold text-muted-foreground"
      >
        {fmt(dict.finder.progress, {
          n: step + 1,
          total: STEPS.length,
        })}
      </p>

      {error ? <Notice tone="error">{error}</Notice> : null}

      {renderQuestion()}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {step > 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={pending}
            className="w-full sm:w-auto"
          >
            {dict.common.back}
          </Button>
        ) : null}

        <Button
          type="submit"
          size="lg"
          loading={pending}
          disabled={!valid}
          className="w-full sm:ml-auto sm:w-auto"
        >
          {step === LAST_STEP
            ? dict.finder.seeResults
            : dict.common.next}
        </Button>
      </div>
    </form>
  );
}
