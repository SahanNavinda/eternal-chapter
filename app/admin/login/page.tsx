"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    router.push("/admin");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">

      <div className="w-full max-w-md">

        <div className="mb-12 text-center">

          <img
            src="/logo.png"
            alt="Eternal Chapter"
            className="mx-auto h-16 w-auto object-contain"
          />

          <p className="mt-6 text-[9px] tracking-[0.5em] text-white/40">
            ADMINISTRATION
          </p>

        </div>

        <div className="border border-white/10 bg-white/[0.02] p-8 md:p-10">

          <h1 className="text-3xl font-light tracking-wide">
            Welcome Back
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/40">
            Sign in to manage your wedding films.
          </p>

          <form
            onSubmit={handleLogin}
            className="mt-10 space-y-6"
          >

            <div>

              <label
                htmlFor="email"
                className="mb-3 block text-[10px] tracking-[0.3em] text-white/50"
              >
                EMAIL
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="admin@example.com"
                required
                autoComplete="email"
                className="w-full border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white outline-none transition focus:border-white/40"
              />

            </div>

            <div>

              <label
                htmlFor="password"
                className="mb-3 block text-[10px] tracking-[0.3em] text-white/50"
              >
                PASSWORD
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white outline-none transition focus:border-white/40"
              />

            </div>

            {error && (
              <div className="border border-red-500/20 bg-red-500/5 px-4 py-3">

                <p className="text-xs text-red-300">
                  {error}
                </p>

              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full border border-white bg-white px-6 py-4 text-[10px] tracking-[0.35em] text-black transition-all duration-500 hover:bg-transparent hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "SIGNING IN..." : "SIGN IN"}
            </button>

          </form>

        </div>

        <div className="mt-8 text-center">

          <a
            href="/"
            className="text-[9px] tracking-[0.3em] text-white/30 transition hover:text-white"
          >
            ← BACK TO ETERNAL CHAPTER
          </a>

        </div>

      </div>

    </main>
  );
}