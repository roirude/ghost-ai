import type { ReactNode } from "react";

const FEATURES = [
  "AI-generated architecture from a plain English prompt",
  "Real-time collaboration with live cursors and presence",
  "Instant Markdown spec generation from the canvas graph",
];

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-full flex-1">
      <div className="hidden w-1/2 flex-col justify-center bg-accent-dim px-16 lg:flex">
        <span className="text-sm font-semibold tracking-tight text-copy-primary">
          Ghost AI
        </span>

        <h1 className="mt-8 max-w-md text-3xl font-semibold tracking-tight text-copy-primary">
          Design systems at the speed of thought.
        </h1>
        <p className="mt-4 max-w-sm text-sm text-copy-secondary">
          Describe your architecture in plain English. Ghost AI maps it to a
          shared canvas your whole team can refine in real time.
        </p>

        <ul className="mt-10 flex flex-col gap-3">
          {FEATURES.map((feature) => (
            <li key={feature} className="text-sm text-copy-secondary">
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-1 items-center justify-center bg-bg-base px-6 py-12">
        {children}
      </div>
    </div>
  );
}
