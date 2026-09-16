"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminSettingsPage() {
  const router = useRouter();

  const [videoUrl, setVideoUrl] = useState("");
  const [posterUrl, setPosterUrl] = useState("/hero.jpg");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/admin/login");
        return;
      }

      const { data, error } = await supabase
        .from("site_settings")
        .select("hero_video_url, hero_poster_url")
        .eq("id", 1)
        .single();

      if (error) {
        console.error("Settings loading error:", error);
        setError("Unable to load homepage settings.");
        setLoading(false);
        return;
      }

      setVideoUrl(data?.hero_video_url ?? "");
      setPosterUrl(data?.hero_poster_url ?? "/hero.jpg");

      setLoading(false);
    };

    loadSettings();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError("");

    const { error } = await supabase
      .from("site_settings")
      .update({
        hero_video_url: videoUrl.trim() || null,
        hero_poster_url: posterUrl.trim() || "/hero.jpg",
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (error) {
      console.error("Settings save error:", error);
      setError("Unable to save homepage settings.");
      setSaving(false);
      return;
    }

    setMessage("Homepage video settings saved successfully.");
    setSaving(false);
  };

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
            LOADING SETTINGS
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
                Homepage Settings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">

            <a
              href="/admin"
              className="text-[9px] tracking-[0.3em] text-white/40 transition hover:text-white"
            >
              DASHBOARD →
            </a>

            <button
              type="button"
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
        <div className="mx-auto max-w-4xl">

          {/* INTRO */}
          <div>
            <p className="text-[10px] tracking-[0.4em] text-white/30">
              WEBSITE
            </p>

            <h1 className="mt-4 text-4xl font-light tracking-wide md:text-6xl">
              Homepage
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/40">
              Manage the cinematic background video displayed on the
              Eternal Chapter homepage.
            </p>
          </div>


          {/* HOMEPAGE VIDEO */}
          <div className="mt-16 border border-white/10 p-6 md:p-10">

            <div>
              <p className="text-[10px] tracking-[0.4em] text-white/30">
                HERO VIDEO
              </p>

              <h2 className="mt-4 text-2xl font-light tracking-wide md:text-3xl">
                Homepage Background Film
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/40">
                This video will play silently in the background of the
                Eternal Chapter homepage.
              </p>
            </div>


            {/* VIDEO URL */}
            <div className="mt-10">

              <label
                htmlFor="videoUrl"
                className="text-[9px] tracking-[0.3em] text-white/40"
              >
                VIMEO VIDEO / EMBED URL
              </label>

              <input
                id="videoUrl"
                type="text"
                value={videoUrl}
                onChange={(event) => {
                  setVideoUrl(event.target.value);
                  setMessage("");
                  setError("");
                }}
                placeholder="https://player.vimeo.com/video/123456789"
                className="mt-3 w-full border border-white/20 bg-transparent px-5 py-4 text-sm text-white outline-none transition-all duration-500 placeholder:text-white/20 focus:border-white/60"
              />

              <p className="mt-3 text-[10px] leading-5 text-white/25">
                Paste the Vimeo video URL or Vimeo player/embed URL.
              </p>

            </div>


            {/* POSTER IMAGE */}
            <div className="mt-8">

              <label
                htmlFor="posterUrl"
                className="text-[9px] tracking-[0.3em] text-white/40"
              >
                POSTER IMAGE URL
              </label>

              <input
                id="posterUrl"
                type="text"
                value={posterUrl}
                onChange={(event) => {
                  setPosterUrl(event.target.value);
                  setMessage("");
                  setError("");
                }}
                placeholder="/hero.jpg"
                className="mt-3 w-full border border-white/20 bg-transparent px-5 py-4 text-sm text-white outline-none transition-all duration-500 placeholder:text-white/20 focus:border-white/60"
              />

              <p className="mt-3 text-[10px] leading-5 text-white/25">
                This image can be shown while the video is loading.
                Your current image is /hero.jpg.
              </p>

            </div>


            {/* INFO */}
            <div className="mt-10 border border-white/10 bg-white/[0.02] p-5">

              <p className="text-[9px] tracking-[0.3em] text-white/30">
                PLAYBACK
              </p>

              <p className="mt-3 text-xs leading-6 text-white/40">
                The homepage video will be configured to autoplay,
                remain muted, loop continuously and behave like a
                cinematic background.
              </p>

            </div>


            {/* MESSAGE */}
            {message && (
              <div className="mt-8 border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs text-white/60">
                  {message}
                </p>
              </div>
            )}


            {/* ERROR */}
            {error && (
              <div className="mt-8 border border-red-500/20 bg-red-500/5 p-5">
                <p className="text-xs text-red-300">
                  {error}
                </p>
              </div>
            )}


            {/* SAVE */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-10 inline-flex border border-white bg-white px-8 py-4 text-[10px] tracking-[0.3em] text-black transition-all duration-500 hover:bg-transparent hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "SAVING..." : "SAVE HOMEPAGE VIDEO"}
            </button>

          </div>


          {/* BACK */}
          <div className="mt-10">

            <a
              href="/admin"
              className="text-[9px] tracking-[0.3em] text-white/30 transition hover:text-white"
            >
              ← BACK TO DASHBOARD
            </a>

          </div>

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