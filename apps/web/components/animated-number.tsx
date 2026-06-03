"use client";

import { formatCounterValue, useCounterAnimation } from "@/lib/animation/use-counter-animation";

type AnimatedNumberProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
};

export function AnimatedNumber({ value, prefix, suffix, decimals, className }: AnimatedNumberProps) {
  const ref = useCounterAnimation(value, {
    prefix,
    suffix,
    decimals
  });

  return (
    <strong ref={ref} className={className}>
      {formatCounterValue(value, { prefix, suffix, decimals })}
    </strong>
  );
}
