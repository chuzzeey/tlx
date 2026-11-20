"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Facebook, KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const signIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast.error("Email or password is incorrect", {
      description: "Sign-in will be available when account authentication is connected.",
    });
  };

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col px-6 pb-12 pt-6 sm:pt-8">
      <Link
        href="/"
        aria-label="Back to home"
        className="mb-8 inline-flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Login Account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please login with registered account</p>
      </div>

      <form onSubmit={signIn} className="mt-10">
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
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
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

        <div className="mt-4 flex justify-end">
          <Link href="/support/contact" className="text-sm font-medium">
            Forgot Password?
          </Link>
        </div>

        <button type="submit" className="mt-14 h-[54px] w-full rounded-full bg-neutral-900 text-sm font-medium text-white">
          Sign In
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">Or using other method</p>
        <button
          type="button"
          onClick={() => toast.info("Google sign-in isn't configured in this demo.")}
          className="mt-5 flex h-[54px] w-full items-center justify-center gap-3 rounded-full border border-neutral-200 text-sm font-medium"
        >
          <span aria-hidden="true" className="font-bold text-lg text-blue-600">G</span>
          Sign up with Google
        </button>
        <button
          type="button"
          onClick={() => toast.info("Facebook sign-in isn't configured in this demo.")}
          className="mt-3 flex h-[54px] w-full items-center justify-center gap-3 rounded-full border border-neutral-200 text-sm font-medium"
        >
          <Facebook className="h-5 w-5 fill-blue-500 text-blue-500" />
          Sign up with Facebook
        </button>
      </div>

      <p className="mt-auto pt-10 text-center text-xs leading-relaxed text-muted-foreground">
        Sign-in is not connected yet.
      </p>
    </main>
  );
}
