"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Wedding = {
  id: string;
  couple_name: string;
  wedding_date: string | null;
  slug: string;
  access_code: string;
  expiry_date: string | null;
  is_active: boolean;
};

export default function AdminDashboard() {
  const router = useRouter();

  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/admin/login");
        return;
      }

      const { data, error } = await supabase
        .from("weddings")
        .select(
          "id, couple_name, wedding_date, slug, access_code, expiry_date, is_active"
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Wedding loading error:", error);
        setError(error.message);
        setLoading(false);
        return;
      }

      setWeddings((data ?? []) as Wedding[]);
      setLoading(false);
    };

    loadDashboard();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/admin/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <img
            src="/logo.png"
            alt="Eternal Chapter"
            className="mx-auto h-14 w-auto object-contain opacity-80"
          />

          <p className="mt-8 text-[10px] tracking-[0.4em] text-white/30">
            LOADING ADMINISTRATION
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* HEADER */}
      <header className="border-b border-white/10 px-6 py-6 md:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <img
              src="/logo.png"
              alt="Eternal Chapter"
              className="h-12 w-auto object-contain"
            />

            <div className="hidden h-8 w-px bg-white/10 md:block" />

            <div className="hidden md:block">
              <p className="text-[9px] tracking-[0.4em] text-white/30">
                ADMINISTRATION
              </p>

              <p className="mt-1 text-sm text-white/70">
                Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="/"
              className="text-[9px] tracking-[0.3em] text-white/40 transition hover:text-white"
            >
              VIEW WEBSITE →
            </a>
              <button
                type="button"
                onClick={() => router.push("/admin/settings")}
                className="text-[9px] tracking-[0.3em] text-white/40 transition hover:text-white"
              >
                SETTINGS
              </button>


            <button
              onClick={handleLogout}
              className="text-[9px] tracking-[0.3em] text-white/40 transition hover:text-white"
            >
              SIGN OUT
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="px-6 py-16 md:px-12 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] tracking-[0.4em] text-white/30">
                ETERNAL CHAPTER
              </p>

              <h1 className="mt-4 text-4xl font-light tracking-wide md:text-6xl">
                Weddings
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-white/40">
                Manage your wedding pages, films, access codes and
                client delivery links.
              </p>
            </div>

            <a
              href="/admin/weddings/new"
              className="inline-flex w-fit border border-white bg-white px-7 py-4 text-[10px] tracking-[0.3em] text-black transition-all duration-500 hover:bg-transparent hover:text-white"
            >
              + CREATE WEDDING
            </a>
          </div>

          {error && (
            <div className="mt-12 border border-red-500/20 bg-red-500/5 p-6">
              <p className="text-sm text-red-300">
                Unable to load weddings.
              </p>

              <p className="mt-2 text-xs text-red-300/60">
                {error}
              </p>
            </div>
          )}

          {!error && weddings.length > 0 ? (
            <div className="mt-16 overflow-hidden border border-white/10">
              {/* DESKTOP HEADER */}
              <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] gap-6 border-b border-white/10 bg-white/[0.02] px-6 py-4 text-[9px] tracking-[0.3em] text-white/30 md:grid">
                <div>WEDDING</div>
                <div>DATE</div>
                <div>STATUS</div>
                <div>ACCESS CODE</div>
                <div>ACTION</div>
              </div>

              {weddings.map((wedding) => {
                const formattedDate = wedding.wedding_date
                  ? new Date(wedding.wedding_date)
                      .toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                      .toUpperCase()
                  : "—";

                const formattedExpiry = wedding.expiry_date
                  ? new Date(wedding.expiry_date)
                      .toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                      .toUpperCase()
                  : null;

                return (
                  <div
                    key={wedding.id}
                    className="border-b border-white/10 px-6 py-8 last:border-b-0"
                  >
                    {/* DESKTOP */}
                    <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-6 md:grid">
                      <div>
                        <p className="text-lg font-light">
                          {wedding.couple_name}
                        </p>

                        <p className="mt-2 text-[10px] tracking-[0.2em] text-white/30">
                          /w/{wedding.slug}
                        </p>
                      </div>

                      <div className="text-xs text-white/50">
                        {formattedDate}
                      </div>

                      <div>
                        {wedding.is_active ? (
                          <span className="text-[9px] tracking-[0.2em] text-white/60">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="text-[9px] tracking-[0.2em] text-white/20">
                            DISABLED
                          </span>
                        )}

                        {formattedExpiry && (
                          <p className="mt-2 text-[9px] text-white/20">
                            EXPIRES {formattedExpiry}
                          </p>
                        )}
                      </div>

                      <div className="font-mono text-xs text-white/50">
                        {wedding.access_code}
                      </div>

                      {/* ACTIONS */}
                      <div className="flex items-center gap-5">
                        <a
                          href={`/w/${wedding.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] tracking-[0.25em] text-white/40 transition hover:text-white"
                        >
                          VIEW →
                        </a>

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/admin/weddings/${wedding.id}`
                            )
                          }
                          className="text-[9px] tracking-[0.25em] text-white transition hover:text-white/60"
                        >
                          MANAGE →
                        </button>
                      </div>
                    </div>

                    {/* MOBILE */}
                    <div className="md:hidden">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xl font-light">
                            {wedding.couple_name}
                          </p>

                          <p className="mt-2 text-[10px] tracking-[0.2em] text-white/30">
                            /w/{wedding.slug}
                          </p>
                        </div>

                        {wedding.is_active ? (
                          <span className="text-[9px] tracking-[0.2em] text-white/60">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="text-[9px] tracking-[0.2em] text-white/20">
                            DISABLED
                          </span>
                        )}
                      </div>

                      <div className="mt-8 grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-[9px] tracking-[0.2em] text-white/25">
                            WEDDING DATE
                          </p>

                          <p className="mt-2 text-xs text-white/60">
                            {formattedDate}
                          </p>
                        </div>

                        <div>
                          <p className="text-[9px] tracking-[0.2em] text-white/25">
                            ACCESS CODE
                          </p>

                          <p className="mt-2 font-mono text-xs text-white/60">
                            {wedding.access_code}
                          </p>
                        </div>
                      </div>

                      {formattedExpiry && (
                        <div className="mt-6">
                          <p className="text-[9px] tracking-[0.2em] text-white/25">
                            EXPIRY
                          </p>

                          <p className="mt-2 text-xs text-white/50">
                            {formattedExpiry}
                          </p>
                        </div>
                      )}

                      {/* MOBILE ACTIONS */}
                      <div className="mt-8 flex flex-wrap gap-3">
                        <a
                          href={`/w/${wedding.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex border border-white/20 px-5 py-3 text-[9px] tracking-[0.25em] text-white/50 transition hover:border-white hover:text-white"
                        >
                          VIEW WEDDING →
                        </a>

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/admin/weddings/${wedding.id}`
                            )
                          }
                          className="inline-flex border border-white bg-white px-5 py-3 text-[9px] tracking-[0.25em] text-black transition hover:bg-transparent hover:text-white"
                        >
                          MANAGE →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !error ? (
            <div className="mt-16 border border-white/10 px-6 py-24 text-center">
              <p className="text-[10px] tracking-[0.4em] text-white/30">
                NO WEDDINGS YET
              </p>

              <h2 className="mt-5 text-3xl font-light">
                Create your first wedding
              </h2>

              <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/40">
                Add a couple, wedding date and delivery
                information to create a client page.
              </p>

              <a
                href="/admin/weddings/new"
                className="mt-8 inline-flex border border-white/30 px-7 py-4 text-[10px] tracking-[0.3em] transition hover:bg-white hover:text-black"
              >
                + CREATE WEDDING
              </a>
            </div>
          ) : null}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-8 text-center">
        <p className="text-[9px] tracking-[0.25em] text-white/20">
          ETERNAL CHAPTER · ADMINISTRATION
        </p>
      </footer>
    </main>
  );
}