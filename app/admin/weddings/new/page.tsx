"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function createPreviewSlug(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "your-wedding"
  );
}

export default function NewWeddingPage() {
  const router = useRouter();

  const [coupleName, setCoupleName] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Your memories are ready to be discovered."
  );
  const [expiryDate, setExpiryDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [generatedSlug, setGeneratedSlug] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateWedding = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    // Prevent double-click / repeated submission
    if (loading || success) {
      return;
    }

    setError("");
    setLoading(true);

    if (!coupleName.trim()) {
      setError("Please enter the couple's name.");
      setLoading(false);
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/admin/login");
        return;
      }

      const { data, error: rpcError } = await supabase.rpc(
        "create_wedding",
        {
          input_couple_name: coupleName.trim(),
          input_wedding_date: weddingDate || null,
          input_welcome_message:
            welcomeMessage.trim() || null,
          input_expiry_date: expiryDate || null,
          input_is_active: isActive,
        }
      );

      if (rpcError) {
        console.error("Create wedding RPC error:", rpcError);
        throw rpcError;
      }

      if (!data || data.length === 0) {
        throw new Error(
          "The wedding could not be created."
        );
      }

      const wedding = data[0];

      setGeneratedSlug(wedding.slug);
      setGeneratedCode(wedding.access_code);

      // IMPORTANT:
      // Lock the form permanently after successful creation.
      setSuccess(true);
      setLoading(false);

      // Return to dashboard after 5 seconds.
      setTimeout(() => {
        router.push("/admin");
      }, 5000);
    } catch (err: any) {
      console.error("Create wedding error:", err);

      setError(
        err?.message ||
          "Something went wrong while creating the wedding."
      );

      setLoading(false);
    }
  };

  const previewSlug = createPreviewSlug(coupleName);

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-5 md:px-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">
              Eternal Chapter
            </p>

            <h1 className="mt-2 text-2xl font-light tracking-wide">
              Create Wedding
            </h1>
          </div>

          <button
            type="button"
            onClick={() => router.push("/admin")}
            disabled={loading}
            className="text-sm text-white/50 transition hover:text-white disabled:opacity-30"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      {/* Main */}
      <section className="mx-auto max-w-3xl px-6 py-10 md:px-10">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-10">

          {/* Intro */}
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              Client Delivery
            </p>

            <h2 className="mt-3 text-3xl font-light">
              Create a new wedding chapter
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/50">
              Create a private delivery page for your
              clients. Eternal Chapter will automatically
              generate a unique private URL and access code.
            </p>
          </div>

          {/* SUCCESS STATE */}
          {success ? (
            <div className="space-y-6">

              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                  Wedding Created
                </p>

                <h3 className="mt-3 text-2xl font-light">
                  {coupleName}
                </h3>

                <p className="mt-2 text-sm text-white/40">
                  Your wedding chapter has been created
                  successfully.
                </p>
              </div>

              {/* Private URL */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-white/30">
                  Private Page
                </p>

                <p className="mt-3 font-mono text-sm text-white/80">
                  /w/{generatedSlug}
                </p>
              </div>

              {/* Access Code */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-white/30">
                  Client Access Code
                </p>

                <p className="mt-3 font-mono text-2xl tracking-[0.2em]">
                  {generatedCode}
                </p>

                <p className="mt-3 text-xs text-white/40">
                  Give this code to the couple so they can
                  access their wedding from the Eternal
                  Chapter homepage.
                </p>
              </div>

              <p className="text-center text-xs text-white/30">
                Returning to dashboard...
              </p>

            </div>
          ) : (
            /* FORM */
            <form
              onSubmit={handleCreateWedding}
              className="space-y-7"
            >

              {/* Couple Name */}
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Couple Name
                </label>

                <input
                  type="text"
                  value={coupleName}
                  onChange={(e) =>
                    setCoupleName(e.target.value)
                  }
                  placeholder="Ashan & Senuri"
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-white/30 disabled:opacity-50"
                />

                <p className="mt-2 text-xs text-white/30">
                  Couple names do not need to be unique.
                </p>
              </div>

              {/* Wedding Date */}
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Wedding Date
                </label>

                <input
                  type="date"
                  value={weddingDate}
                  onChange={(e) =>
                    setWeddingDate(e.target.value)
                  }
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-white/30 disabled:opacity-50"
                />
              </div>

              {/* Private URL Preview */}
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Private Page URL
                </label>

                <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                    Automatically generated
                  </p>

                  <p className="mt-2 font-mono text-sm text-white/80">
                    /w/{previewSlug}
                  </p>
                </div>

                <p className="mt-2 text-xs text-white/30">
                  If this URL already exists, a number will
                  automatically be added.
                </p>
              </div>

              {/* Access Code Preview */}
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Client Access Code
                </label>

                <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                    Automatically generated
                  </p>

                  <p className="mt-2 font-mono text-lg tracking-[0.2em] text-white/80">
                    EC-XXXXXXXX
                  </p>
                </div>

                <p className="mt-2 text-xs text-white/30">
                  A unique code will be generated when the
                  wedding is created.
                </p>
              </div>

              {/* Welcome Message */}
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Welcome Message
                </label>

                <textarea
                  value={welcomeMessage}
                  onChange={(e) =>
                    setWelcomeMessage(e.target.value)
                  }
                  rows={3}
                  disabled={loading}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-white/30 disabled:opacity-50"
                />
              </div>

              {/* Expiry */}
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Expiry Date
                </label>

                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) =>
                    setExpiryDate(e.target.value)
                  }
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-white/30 disabled:opacity-50"
                />

                <p className="mt-2 text-xs text-white/30">
                  Leave empty if the wedding page should
                  never expire.
                </p>
              </div>

              {/* Active */}
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-4">
                <div>
                  <p className="text-sm text-white/70">
                    Wedding Page Active
                  </p>

                  <p className="mt-1 text-xs text-white/30">
                    Clients can access the page while enabled.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setIsActive(!isActive)
                  }
                  disabled={loading}
                  className={`relative h-6 w-11 rounded-full transition disabled:opacity-50 ${
                    isActive
                      ? "bg-white"
                      : "bg-white/20"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full transition ${
                      isActive
                        ? "left-6 bg-black"
                        : "left-1 bg-white/60"
                    }`}
                  />
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {/* Create Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-white px-6 py-4 text-sm font-medium tracking-[0.15em] text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "CREATING WEDDING..."
                  : "CREATE WEDDING"}
              </button>

            </form>
          )}
        </div>
      </section>
    </main>
  );
}