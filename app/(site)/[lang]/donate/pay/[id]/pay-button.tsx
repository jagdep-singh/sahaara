'use client';

import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';

type PayButtonProps = {
  label: string;
  variant?: 'default' | 'outline' | 'secondary';
};

export function PayButton({ label, variant = 'outline' }: PayButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      variant={variant}
      loading={pending}
      className="w-full"
    >
      {label}
    </Button>
  );
}
