"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [mode, setMode] = useState<"sign-in" | "create-account">("sign-in");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const isCreatingAccount = mode === "create-account";

  const signIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isCreatingAccount) {
      toast.info("Account creation will be available when authentication is connected.");
      return;
    }

    toast.error("Email or password is incorrect", {
      description: "Sign-in will be available when account authentication is connected.",
    });
  };

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-[520px] flex-col px-5 pb-12 pt-5 sm:px-6 sm:pt-8">
      <Link
        href="/"
        aria-label="Back to home"
        className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-foreground dark:hover:bg-muted"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      <section className="mx-auto my-auto w-full max-w-[420px]">
        <Link
          href="/"
          aria-label="TLX Originals home"
          className="mb-8 flex flex-col items-center text-center"
        >
          <span className="brand-type font-display text-3xl font-bold tracking-tight sm:text-4xl">
            TLX Originals
          </span>
          <span className="mt-1 font-mono2 text-[10px] tracking-[0.16em] text-muted-foreground">
            No Hype. Just Motion!
          </span>
        </Link>

        <div className="rounded-3xl border border-border bg-card/60 p-5 shadow-sm sm:p-8">
          <div className="text-center">
            <p className="label-mono">{isCreatingAccount ? "Join TLX Originals" : "Welcome back"}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              {isCreatingAccount ? "Create account" : "Login Account"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {isCreatingAccount
                ? "Create an account to keep your orders and details together."
                : "Sign in to your TLX Originals account."}
            </p>
          </div>

          <form onSubmit={signIn} className="mt-8">
            {isCreatingAccount && (
              <>
                <label htmlFor="login-name" className="mb-2 block text-sm font-medium">
                  Name
                </label>
                <div className="mb-5 flex h-[54px] items-center gap-3 rounded-2xl bg-neutral-50 px-4 dark:bg-muted">
                  <input
                    id="login-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    required
                    className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </>
            )}

            <label htmlFor="login-identifier" className="mb-2 block text-sm font-medium">
              Email or Phone Number
            </label>
            <div className="flex h-[54px] items-center gap-3 rounded-2xl bg-neutral-50 px-4 dark:bg-muted">
              <Mail className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                id="login-identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="Enter your email or phone number"
                required
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            <label htmlFor="login-password" className="mb-2 mt-5 block text-sm font-medium">
              Password
            </label>
            <div className="flex h-[54px] items-center gap-3 rounded-2xl bg-neutral-50 px-4 dark:bg-muted">
              <KeyRound className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete={isCreatingAccount ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isCreatingAccount ? "Create a password" : "Enter your password"}
                required
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="flex h-9 w-9 items-center justify-center text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {!isCreatingAccount && (
              <div className="mt-4 flex justify-end">
                <Link href="/support/contact" className="text-sm font-medium">
                  Forgot Password?
                </Link>
              </div>
            )}

            <button
              type="submit"
              className="mt-8 h-[54px] w-full rounded-full bg-neutral-900 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
            >
              {isCreatingAccount ? "Create account" : "Sign In"}
            </button>

            <p className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">
                {isCreatingAccount ? "Already have an account? " : "Don't have an account? "}
              </span>
              <button
                type="button"
                onClick={() => setMode(isCreatingAccount ? "sign-in" : "create-account")}
                className="font-semibold underline underline-offset-4"
              >
                {isCreatingAccount ? "Sign in" : "Create account"}
              </button>
            </p>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">Or continue with</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => toast.info("Google sign-in isn't configured in this demo.")}
                className="flex h-12 items-center justify-center gap-2 rounded-full border border-border text-sm font-medium transition-colors hover:bg-neutral-100 dark:hover:bg-muted"
              >
                <svg aria-hidden="true" focusable="false" viewBox="0 0 48 48" className="h-5 w-5">
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.72 7.18l7.63 5.91c4.45-4.11 7.13-10.17 7.13-17.56Z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.15 15.9-5.89l-7.63-5.91c-2.15 1.45-4.89 2.3-8.27 2.3-6.35 0-11.73-4.28-13.65-10.03l-7.9 6.1C6.42 42.12 14.56 48 24 48Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.35 28.47a14.4 14.4 0 0 1 0-8.94l-7.9-6.1a24 24 0 0 0 0 21.14l7.9-6.1Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.56 0 6.42 5.88 2.45 13.43l7.9 6.1C12.27 13.78 17.65 9.5 24 9.5Z"
                  />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => toast.info("Facebook sign-in isn't configured in this demo.")}
                className="flex h-12 items-center justify-center gap-2 rounded-full border border-border text-sm font-medium transition-colors hover:bg-neutral-100 dark:hover:bg-muted"
              >
                <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className="h-5 w-5">
                  <circle cx="12" cy="12" r="12" fill="#1877F2" />
                  <path
                    fill="#FFFFFF"
                    d="M13.55 20v-7.3H16l.37-2.85h-2.82V8.03c0-.82.23-1.38 1.41-1.38h1.51V4.1c-.26-.03-1.15-.11-2.2-.11-2.18 0-3.68 1.33-3.68 3.78v2.08H8.12v2.85h2.47V20h2.96Z"
                  />
                </svg>
                Facebook
              </button>
            </div>
          </div>

          <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
            {isCreatingAccount ? "Account creation isn't connected yet." : "Sign-in isn't connected yet."}
          </p>
        </div>
      </section>
    </main>
  );
}
