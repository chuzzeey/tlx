"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

export default function Login() {
  const [mode, setMode] = useState<"sign-in" | "create-account">("sign-in");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginErrorVisible, setLoginErrorVisible] = useState(false);
  const loginErrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCreatingAccount = mode === "create-account";

  useEffect(() => () => {
    if (loginErrorTimer.current) clearTimeout(loginErrorTimer.current);
  }, []);

  const signIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isCreatingAccount) {
      toast.info("Account creation will be available when authentication is connected.");
      return;
    }

    if (loginErrorTimer.current) clearTimeout(loginErrorTimer.current);
    setLoginErrorVisible(true);
    loginErrorTimer.current = setTimeout(() => {
      setLoginErrorVisible(false);
      loginErrorTimer.current = null;
    }, 2600);
  };

  return (
    <>
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-[520px] flex-col px-5 pb-12 pt-5 sm:px-6 sm:pt-8">
        <Link
          href="/"
          aria-label="Back to home"
          className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-foreground dark:hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <section className="mx-auto my-auto w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="brand-type text-3xl font-black tracking-tight sm:text-4xl">
            TLX Originals
          </span>
          <span className="mt-1 font-mono2 text-[10px] tracking-[0.16em] text-muted-foreground">
            No Hype. Just Motion!
          </span>
        </div>

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
                <div className="mb-5 flex h-[54px] items-center border-b border-border focus-within:border-foreground">
                  <input
                    id="login-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    required
                    className="h-full min-w-0 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </>
            )}

            <label htmlFor="login-identifier" className="mb-2 block text-sm font-medium">
              Email or Phone Number
            </label>
            <input
              id="login-identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="Enter your email or phone number"
              required
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
            />

            <label htmlFor="login-password" className="mb-2 mt-5 block text-sm font-medium">
              Password
            </label>
            <div className="flex h-12 items-center gap-2 rounded-2xl border border-border bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
              <div className="relative min-w-0 flex-1">
                <div aria-hidden="true" className="grid grid-cols-6 gap-1.5">
                  {Array.from({ length: 6 }, (_, index) => (
                    <span
                      key={index}
                      className="flex aspect-square min-w-0 items-center justify-center rounded-lg border border-border text-sm font-medium"
                    >
                      {password[index] &&
                        (showPassword ? (
                          password[index]
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        ))}
                    </span>
                  ))}
                </div>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isCreatingAccount ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  maxLength={6}
                  placeholder={isCreatingAccount ? "Create a password" : "Enter your password"}
                  required
                  aria-label="Password"
                  className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {!isCreatingAccount && (
              <div className="mt-4 flex justify-end">
                <a
                  href="https://wa.me/2348029041081"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium"
                >
                  Forgot Password?
                </a>
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
      <AnimatePresence>
        {loginErrorVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/10 px-4 pt-4 backdrop-blur-md"
          >
            <motion.div
              role="alert"
              aria-live="assertive"
              initial={{ opacity: 0, y: -14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="w-full max-w-[520px] rounded-2xl border border-destructive/30 bg-background px-5 py-4 text-foreground shadow-2xl"
            >
              <p className="font-semibold text-destructive">Email or password is incorrect</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign-in will be available when account authentication is connected.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
