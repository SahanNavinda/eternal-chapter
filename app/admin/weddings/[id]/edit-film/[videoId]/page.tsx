"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const defaultCategories = [
  "Highlight Film",
  "Wedding Film",
  "Ceremony",
  "Reception",
  "Special Moments",
];

type Video = {
  id: string;
  wedding_id: string;
  title: string;
  category: string;
  description: string | null;
  google_drive_url: string | null;
  vimeo_embed_url: string | null;
  youtube_embed_url: string | null;
  thumbnail_url: string | null;
  download_enabled: boolean;
  is_featured: boolean;
  display_order: number;
};

export default function EditFilmPage() {
  const router = useRouter();
  const params = useParams();

  const weddingId = params.id as string;
  const videoId = params.videoId as string;

  const [video, setVideo] = useState<Video | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Highlight Film");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");

  const [vimeoUrl, setVimeoUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const [googleDriveUrl, setGoogleDriveUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  const [downloadEnabled, setDownloadEnabled] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  /* =========================
      LOAD VIDEO
  ========================== */

  useEffect(() => {
    const loadVideo = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/admin/login");
        return;
      }

      const { data, error } = await supabase
        .from("videos")
        .select(
          "id, wedding_id, title, category, description, google_drive_url, vimeo_embed_url, youtube_embed_url, thumbnail_url, download_enabled, is_featured, display_order"
        )
        .eq("id", videoId)
        .eq("wedding_id", weddingId)
        .single();

      if (error) {
        console.error("Video loading error:", error);
        setError("Unable to load this film.");
        setLoading(false);
        return;
      }

      const videoData = data as Video;

      setVideo(videoData);
      setTitle(videoData.title);
      setDescription(videoData.description || "");

      setVimeoUrl(videoData.vimeo_embed_url || "");
      setYoutubeUrl(videoData.youtube_embed_url || "");

      setGoogleDriveUrl(videoData.google_drive_url || "");
      setThumbnailUrl(videoData.thumbnail_url || "");

      setDownloadEnabled(videoData.download_enabled);
      setIsFeatured(videoData.is_featured);

      if (defaultCategories.includes(videoData.category)) {
        setCategory(videoData.category);
      } else {
        setCategory("Custom");
        setCustomCategory(videoData.category);
      }

      setLoading(false);
    };

    if (weddingId && videoId) {
      loadVideo();
    }
  }, [weddingId, videoId, router]);

  /* =========================
      SAVE VIDEO
  ========================== */

  const handleSave = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (saving) return;

    setError("");
    setSaved(false);

    if (!title.trim()) {
      setError("Please enter a film title.");
      return;
    }

    if (category === "Custom" && !customCategory.trim()) {
      setError("Please enter a custom category.");
      return;
    }

    setSaving(true);

    const finalCategory =
      category === "Custom"
        ? customCategory.trim()
        : category;

    const { error } = await supabase
      .from("videos")
      .update({
        title: title.trim(),
        category: finalCategory,
        description: description.trim() || null,

        vimeo_embed_url: vimeoUrl.trim() || null,
        youtube_embed_url: youtubeUrl.trim() || null,

        google_drive_url: googleDriveUrl.trim() || null,
        thumbnail_url: thumbnailUrl.trim() || null,

        download_enabled: downloadEnabled,
        is_featured: isFeatured,
      })
      .eq("id", videoId)
      .eq("wedding_id", weddingId);

    if (error) {
      console.error("Video update error:", error);
      setError(error.message);
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);

    setTimeout(() => {
      router.push(`/admin/weddings/${weddingId}`);
    }, 1500);
  };

  /* =========================
      LOADING
  ========================== */

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
            LOADING FILM
          </p>
        </div>
      </main>
    );
  }

  /* =========================
      ERROR
  ========================== */

  if (!video) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="text-center">
          <p className="text-[10px] tracking-[0.3em] text-red-300/60">
            ERROR
          </p>

          <h1 className="mt-4 text-3xl font-light">
            Unable to load film
          </h1>

          <p className="mt-4 text-sm text-white/40">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(`/admin/weddings/${weddingId}`)
            }
            className="mt-8 border border-white/20 px-6 py-3 text-[9px] tracking-[0.25em] text-white/60 transition hover:border-white hover:text-white"
          >
            ← BACK TO WEDDING
          </button>
        </div>
      </main>
    );
  }

  /* =========================
      PAGE
  ========================== */

  return (
    <main className="min-h-screen bg-black text-white">
      {/* HEADER */}
      <header className="border-b border-white/10 px-6 py-6 md:px-12">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-5">
            <img
              src="/logo.png"
              alt="Eternal Chapter"
              className="h-11 w-auto object-contain"
            />

            <div className="hidden h-7 w-px bg-white/10 md:block" />

            <div className="hidden md:block">
              <p className="text-[9px] tracking-[0.4em] text-white/30">
                ADMINISTRATION
              </p>

              <p className="mt-1 text-sm text-white/70">
                Edit Film
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(`/admin/weddings/${weddingId}`)
            }
            className="text-[9px] tracking-[0.3em] text-white/40 transition hover:text-white"
          >
            ← BACK
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <section className="px-6 py-12 md:px-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          {/* TITLE */}
          <div className="mb-10">
            <p className="text-[10px] tracking-[0.4em] text-white/30">
              FILM MANAGEMENT
            </p>

            <h1 className="mt-4 text-4xl font-light tracking-wide">
              Edit Film
            </h1>

            <p className="mt-3 text-sm text-white/40">
              Update the film information and delivery settings.
            </p>
          </div>

          {/* FORM */}
          <form
            onSubmit={handleSave}
            className="space-y-7 border border-white/10 bg-white/[0.02] p-6 md:p-10"
          >
            {/* TITLE */}
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Film Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={saving}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-white/30 disabled:opacity-50"
              />
            </div>

            {/* CATEGORY */}
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Category
              </label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={saving}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-white/30 disabled:opacity-50"
              >
                {defaultCategories.map((item) => (
                  <option
                    key={item}
                    value={item}
                    className="bg-black"
                  >
                    {item}
                  </option>
                ))}

                <option
                  value="Custom"
                  className="bg-black"
                >
                  Custom
                </option>
              </select>
            </div>

            {/* CUSTOM CATEGORY */}
            {category === "Custom" && (
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Custom Category
                </label>

                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) =>
                    setCustomCategory(e.target.value)
                  }
                  placeholder="Pre-Wedding"
                  disabled={saving}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/20 focus:border-white/30"
                />
              </div>
            )}

            {/* DESCRIPTION */}
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                rows={4}
                disabled={saving}
                className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-white/30 disabled:opacity-50"
              />
            </div>

            {/* VIMEO */}
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Vimeo Embed URL
              </label>

              <input
                type="url"
                value={vimeoUrl}
                onChange={(e) =>
                  setVimeoUrl(e.target.value)
                }
                placeholder="https://player.vimeo.com/video/123456789"
                disabled={saving}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
              />

              <p className="mt-2 text-xs leading-5 text-white/30">
                Optional. Use Vimeo when you want the film
                to play directly on the website.
              </p>
            </div>

            {/* YOUTUBE */}
            <div>
              <label className="mb-2 block text-sm text-white/70">
                YouTube Video URL
              </label>

              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) =>
                  setYoutubeUrl(e.target.value)
                }
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={saving}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
              />

              <p className="mt-2 text-xs leading-5 text-white/30">
                Optional. Normal YouTube links are supported.
              </p>
            </div>

            {/* GOOGLE DRIVE */}
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Google Drive Download URL
              </label>

              <input
                type="url"
                value={googleDriveUrl}
                onChange={(e) =>
                  setGoogleDriveUrl(e.target.value)
                }
                placeholder="https://drive.google.com/..."
                disabled={saving}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
              />

              <p className="mt-2 text-xs leading-5 text-white/30">
                Optional. Add this if clients should be able
                to download the film.
              </p>
            </div>

            {/* THUMBNAIL */}
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Thumbnail URL
              </label>

              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) =>
                  setThumbnailUrl(e.target.value)
                }
                placeholder="https://..."
                disabled={saving}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
              />

              <p className="mt-2 text-xs text-white/30">
                Optional.
              </p>
            </div>

            {/* DOWNLOAD */}
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-5 py-5">
              <div>
                <p className="text-sm text-white/70">
                  Allow Downloads
                </p>

                <p className="mt-1 text-xs text-white/30">
                  Show the download option to clients.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDownloadEnabled(!downloadEnabled)
                }
                disabled={saving}
                className={`relative h-6 w-11 rounded-full transition ${
                  downloadEnabled
                    ? "bg-white"
                    : "bg-white/20"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full transition ${
                    downloadEnabled
                      ? "left-6 bg-black"
                      : "left-1 bg-white/60"
                  }`}
                />
              </button>
            </div>

            {/* SHOW ON HOMEPAGE */}
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-5 py-5">
              <div>
                <p className="text-sm text-white/70">
                  Show on Homepage
                </p>

                <p className="mt-1 text-xs leading-5 text-white/30">
                  Display this film in the selected films
                  section on the homepage.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsFeatured(!isFeatured)
                }
                disabled={saving}
                className={`relative h-6 w-11 rounded-full transition ${
                  isFeatured
                    ? "bg-white"
                    : "bg-white/20"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full transition ${
                    isFeatured
                      ? "left-6 bg-black"
                      : "left-1 bg-white/60"
                  }`}
                />
              </button>
            </div>

            {/* ERROR */}
            {error && (
              <div className="border border-red-500/20 bg-red-500/5 px-5 py-4">
                <p className="text-sm text-red-300">
                  {error}
                </p>
              </div>
            )}

            {/* SAVED */}
            {saved && (
              <div className="border border-white/10 bg-white/[0.04] px-5 py-4">
                <p className="text-xs tracking-[0.25em] text-white/60">
                  FILM UPDATED ✓
                </p>
              </div>
            )}

            {/* BUTTONS */}
            <div className="flex flex-col gap-3 border-t border-white/10 pt-7 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 border border-white bg-white px-6 py-4 text-[10px] tracking-[0.3em] text-black transition hover:bg-transparent hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "SAVING..."
                  : "SAVE FILM"}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(`/admin/weddings/${weddingId}`)
                }
                disabled={saving}
                className="flex-1 border border-white/20 px-6 py-4 text-[10px] tracking-[0.3em] text-white/50 transition hover:border-white hover:text-white disabled:opacity-30"
              >
                CANCEL
              </button>
            </div>
          </form>
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