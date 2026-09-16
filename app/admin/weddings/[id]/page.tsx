"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Wedding = {
  id: string;
  couple_name: string;
  wedding_date: string | null;
  slug: string;
  access_code: string;
  welcome_message: string | null;
  expiry_date: string | null;
  is_active: boolean;
};

type Video = {
  id: string;
  wedding_id: string;
  title: string;
  category: string;
  description: string | null;
  google_drive_url: string;
  vimeo_embed_url: string | null;
  thumbnail_url: string | null;
  download_enabled: boolean;
  display_order: number;
};

const defaultCategories = [
  "Highlight Film",
  "Wedding Film",
  "Ceremony",
  "Reception",
  "Special Moments",
];

export default function ManageWeddingPage() {
  const router = useRouter();
  const params = useParams();

  const weddingId = params.id as string;

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);

  const [coupleName, setCoupleName] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [showAddFilm, setShowAddFilm] = useState(false);

  const [filmTitle, setFilmTitle] = useState("");
  const [filmCategory, setFilmCategory] = useState("Highlight Film");
  const [customCategory, setCustomCategory] = useState("");
  const [filmDescription, setFilmDescription] = useState("");
  const [vimeoUrl, setVimeoUrl] = useState("");
  const [googleDriveUrl, setGoogleDriveUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [downloadEnabled, setDownloadEnabled] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingFilm, setAddingFilm] = useState(false);

  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadWedding = async () => {
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
          "id, couple_name, wedding_date, slug, access_code, welcome_message, expiry_date, is_active"
        )
        .eq("id", weddingId)
        .single();

      if (error) {
        console.error("Wedding loading error:", error);
        setError("Unable to load this wedding.");
        setLoading(false);
        return;
      }

      const weddingData = data as Wedding;

      setWedding(weddingData);
      setCoupleName(weddingData.couple_name);
      setWeddingDate(weddingData.wedding_date || "");
      setWelcomeMessage(weddingData.welcome_message || "");
      setExpiryDate(weddingData.expiry_date || "");
      setIsActive(weddingData.is_active);

      await loadVideos();

      setLoading(false);
    };

    const loadVideos = async () => {
      const { data, error } = await supabase
        .from("videos")
        .select(
          "id, wedding_id, title, category, description, google_drive_url, vimeo_embed_url, thumbnail_url, download_enabled, display_order"
        )
        .eq("wedding_id", weddingId)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Video loading error:", error);
        return;
      }

      setVideos((data ?? []) as Video[]);
    };

    if (weddingId) {
      loadWedding();
    }
  }, [weddingId, router]);

  const handleSave = async () => {
    if (!wedding) return;

    setSaving(true);
    setSaved(false);
    setError("");

    const { error } = await supabase
      .from("weddings")
      .update({
        couple_name: coupleName.trim(),
        wedding_date: weddingDate || null,
        welcome_message: welcomeMessage.trim() || null,
        expiry_date: expiryDate || null,
        is_active: isActive,
      })
      .eq("id", wedding.id);

    if (error) {
      console.error("Wedding update error:", error);
      setError(error.message);
      setSaving(false);
      return;
    }

    setWedding({
      ...wedding,
      couple_name: coupleName.trim(),
      wedding_date: weddingDate || null,
      welcome_message: welcomeMessage.trim() || null,
      expiry_date: expiryDate || null,
      is_active: isActive,
    });

    setSaved(true);
    setSaving(false);

    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  const handleAddFilm = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (addingFilm) return;

    setError("");

    if (!filmTitle.trim()) {
      setError("Please enter a film title.");
      return;
    }

    if (!googleDriveUrl.trim()) {
      setError("Please enter the Google Drive download URL.");
      return;
    }

    if (filmCategory === "Custom" && !customCategory.trim()) {
      setError("Please enter a custom category.");
      return;
    }

    setAddingFilm(true);

    const finalCategory =
      filmCategory === "Custom"
        ? customCategory.trim()
        : filmCategory;

    const { data, error } = await supabase
      .from("videos")
      .insert({
        wedding_id: weddingId,
        title: filmTitle.trim(),
        category: finalCategory,
        description: filmDescription.trim() || null,
        google_drive_url: googleDriveUrl.trim(),
        vimeo_embed_url: vimeoUrl.trim() || null,
        thumbnail_url: thumbnailUrl.trim() || null,
        download_enabled: downloadEnabled,
        display_order: videos.length + 1,
      })
      .select()
      .single();

    if (error) {
      console.error("Video creation error:", error);
      setError(error.message);
      setAddingFilm(false);
      return;
    }

    setVideos((current) => [...current, data as Video]);

    // Reset form
    setFilmTitle("");
    setFilmCategory("Highlight Film");
    setCustomCategory("");
    setFilmDescription("");
    setVimeoUrl("");
    setGoogleDriveUrl("");
    setThumbnailUrl("");
    setDownloadEnabled(true);

    setShowAddFilm(false);
    setAddingFilm(false);
  };

  const handleDeleteFilm = async (videoId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this film?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("videos")
      .delete()
      .eq("id", videoId);

    if (error) {
      console.error("Video deletion error:", error);
      setError(error.message);
      return;
    }

    setVideos((current) =>
      current.filter((video) => video.id !== videoId)
    );
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Copy failed:", error);
    }
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
            LOADING WEDDING
          </p>
        </div>
      </main>
    );
  }

  if (error && !wedding) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="max-w-md text-center">
          <p className="text-[10px] tracking-[0.4em] text-red-300/60">
            ERROR
          </p>

          <h1 className="mt-4 text-3xl font-light">
            Unable to load wedding
          </h1>

          <p className="mt-4 text-sm text-white/40">
            {error}
          </p>

          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="mt-8 border border-white/20 px-6 py-3 text-[9px] tracking-[0.25em] text-white/60 transition hover:border-white hover:text-white"
          >
            ← BACK TO DASHBOARD
          </button>
        </div>
      </main>
    );
  }

  if (!wedding) {
    return null;
  }

  const clientLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/w/${wedding.slug}`
      : `/w/${wedding.slug}`;

  return (
    <main className="min-h-screen bg-black text-white">
      {/* HEADER */}
      <header className="border-b border-white/10 px-6 py-6 md:px-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
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
                Manage Wedding
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="text-[9px] tracking-[0.3em] text-white/40 transition hover:text-white"
          >
            ← DASHBOARD
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <section className="px-6 py-12 md:px-12 md:py-16">
        <div className="mx-auto max-w-6xl">

          {/* TITLE */}
          <div className="mb-12">
            <p className="text-[10px] tracking-[0.4em] text-white/30">
              WEDDING CHAPTER
            </p>

            <h1 className="mt-4 text-4xl font-light tracking-wide md:text-6xl">
              {wedding.couple_name}
            </h1>

            <p className="mt-4 text-sm text-white/40">
              Manage this client's private delivery page and films.
            </p>
          </div>

          {/* CLIENT ACCESS */}
          <section className="border border-white/10 bg-white/[0.02]">
            <div className="border-b border-white/10 px-6 py-5 md:px-8">
              <p className="text-[10px] tracking-[0.35em] text-white/30">
                CLIENT ACCESS
              </p>

              <h2 className="mt-2 text-xl font-light">
                Private delivery information
              </h2>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">

              {/* PRIVATE LINK */}
              <div className="border border-white/10 bg-black/30 p-5">
                <p className="text-[9px] tracking-[0.3em] text-white/30">
                  PRIVATE PAGE
                </p>

                <p className="mt-3 break-all font-mono text-sm text-white/70">
                  {clientLink}
                </p>

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(clientLink)
                    }
                    className="border border-white/20 px-4 py-2 text-[9px] tracking-[0.2em] text-white/50 transition hover:border-white hover:text-white"
                  >
                    COPY LINK
                  </button>

                  <a
                    href={`/w/${wedding.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-white/20 px-4 py-2 text-[9px] tracking-[0.2em] text-white/50 transition hover:border-white hover:text-white"
                  >
                    OPEN →
                  </a>
                </div>
              </div>

              {/* ACCESS CODE */}
              <div className="border border-white/10 bg-black/30 p-5">
                <p className="text-[9px] tracking-[0.3em] text-white/30">
                  CLIENT ACCESS CODE
                </p>

                <p className="mt-3 font-mono text-xl tracking-[0.2em] text-white/80">
                  {wedding.access_code}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(wedding.access_code)
                  }
                  className="mt-5 border border-white/20 px-4 py-2 text-[9px] tracking-[0.2em] text-white/50 transition hover:border-white hover:text-white"
                >
                  COPY CODE
                </button>
              </div>
            </div>
          </section>

          {/* WEDDING DETAILS */}
          <section className="mt-8 border border-white/10 bg-white/[0.02]">
            <div className="border-b border-white/10 px-6 py-5 md:px-8">
              <p className="text-[10px] tracking-[0.35em] text-white/30">
                WEDDING DETAILS
              </p>

              <h2 className="mt-2 text-xl font-light">
                Page settings
              </h2>
            </div>

            <div className="space-y-7 p-6 md:p-8">

              {/* COUPLE NAME */}
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
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-white/30"
                />

                <p className="mt-2 text-xs text-white/30">
                  Couple names do not need to be unique.
                </p>
              </div>

              {/* WEDDING DATE */}
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
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-white/30"
                />
              </div>

              {/* WELCOME MESSAGE */}
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Welcome Message
                </label>

                <textarea
                  value={welcomeMessage}
                  onChange={(e) =>
                    setWelcomeMessage(e.target.value)
                  }
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-white/30"
                />
              </div>

              {/* EXPIRY */}
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
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-white/30"
                />

                <p className="mt-2 text-xs text-white/30">
                  Leave empty if this page should not expire.
                </p>
              </div>

              {/* ACTIVE */}
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-5 py-5">
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
                  className={`relative h-6 w-11 rounded-full transition ${
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

              {/* ERROR */}
              {error && (
                <div className="border border-red-500/20 bg-red-500/5 px-5 py-4">
                  <p className="text-sm text-red-300">
                    {error}
                  </p>
                </div>
              )}

              {/* SAVE */}
              <div className="flex flex-col gap-4 border-t border-white/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {saved && (
                    <p className="text-xs tracking-[0.2em] text-white/50">
                      CHANGES SAVED ✓
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="border border-white bg-white px-8 py-4 text-[10px] tracking-[0.3em] text-black transition hover:bg-transparent hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "SAVING..."
                    : "SAVE CHANGES"}
                </button>
              </div>
            </div>
          </section>

          {/* VIDEO MANAGEMENT */}
          <section className="mt-8 border border-white/10 bg-white/[0.02]">

            {/* HEADER */}
            <div className="flex flex-col justify-between gap-5 border-b border-white/10 px-6 py-5 md:flex-row md:items-center md:px-8">
              <div>
                <p className="text-[10px] tracking-[0.35em] text-white/30">
                  FILMS
                </p>

                <h2 className="mt-2 text-xl font-light">
                  Video delivery
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddFilm(!showAddFilm);
                  setError("");
                }}
                className="w-fit border border-white bg-white px-6 py-3 text-[9px] tracking-[0.25em] text-black transition hover:bg-transparent hover:text-white"
              >
                {showAddFilm
                  ? "CLOSE"
                  : "+ ADD FILM"}
              </button>
            </div>

            {/* ADD FILM FORM */}
            {showAddFilm && (
              <div className="border-b border-white/10 p-6 md:p-8">
                <div className="mb-8">
                  <p className="text-[9px] tracking-[0.3em] text-white/30">
                    NEW FILM
                  </p>

                  <h3 className="mt-2 text-2xl font-light">
                    Add a film
                  </h3>
                </div>

                <form
                  onSubmit={handleAddFilm}
                  className="space-y-7"
                >

                  {/* TITLE */}
                  <div>
                    <label className="mb-2 block text-sm text-white/70">
                      Film Title
                    </label>

                    <input
                      type="text"
                      value={filmTitle}
                      onChange={(e) =>
                        setFilmTitle(e.target.value)
                      }
                      placeholder="Highlight Film"
                      disabled={addingFilm}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-white/30 disabled:opacity-50"
                    />
                  </div>

                  {/* CATEGORY */}
                  <div>
                    <label className="mb-2 block text-sm text-white/70">
                      Category
                    </label>

                    <select
                      value={filmCategory}
                      onChange={(e) =>
                        setFilmCategory(e.target.value)
                      }
                      disabled={addingFilm}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-white/30 disabled:opacity-50"
                    >
                      {defaultCategories.map(
                        (category) => (
                          <option
                            key={category}
                            value={category}
                            className="bg-black"
                          >
                            {category}
                          </option>
                        )
                      )}

                      <option
                        value="Custom"
                        className="bg-black"
                      >
                        Custom
                      </option>
                    </select>
                  </div>

                  {/* CUSTOM CATEGORY */}
                  {filmCategory === "Custom" && (
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
                        disabled={addingFilm}
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
                      value={filmDescription}
                      onChange={(e) =>
                        setFilmDescription(e.target.value)
                      }
                      rows={3}
                      placeholder="The moments that tell your story."
                      disabled={addingFilm}
                      className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/20 focus:border-white/30"
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
                      disabled={addingFilm}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
                    />

                    <p className="mt-2 text-xs leading-5 text-white/30">
                      Optional. Use this for films that should
                      play directly on the client page.
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
                      disabled={addingFilm}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
                    />

                    <p className="mt-2 text-xs leading-5 text-white/30">
                      Required. This is where the client will
                      download the film.
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
                      disabled={addingFilm}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
                    />

                    <p className="mt-2 text-xs text-white/30">
                      Optional. We'll use this for the film
                      thumbnail later.
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
                        setDownloadEnabled(
                          !downloadEnabled
                        )
                      }
                      disabled={addingFilm}
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

                  {/* FORM ERROR */}
                  {error && (
                    <div className="border border-red-500/20 bg-red-500/5 px-5 py-4">
                      <p className="text-sm text-red-300">
                        {error}
                      </p>
                    </div>
                  )}

                  {/* SUBMIT */}
                  <button
                    type="submit"
                    disabled={addingFilm}
                    className="w-full border border-white bg-white px-6 py-4 text-[10px] tracking-[0.3em] text-black transition hover:bg-transparent hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {addingFilm
                      ? "ADDING FILM..."
                      : "ADD FILM"}
                  </button>
                </form>
              </div>
            )}

            {/* FILM LIST */}
            <div>
              {videos.length === 0 ? (
                <div className="px-6 py-16 text-center md:px-8">
                  <p className="text-[10px] tracking-[0.3em] text-white/30">
                    NO FILMS YET
                  </p>

                  <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/40">
                    Add your first film to begin building this
                    client's delivery page.
                  </p>
                </div>
              ) : (
                <div>
                  {videos.map((video, index) => (
                    <div
                      key={video.id}
                      className="border-b border-white/10 p-6 last:border-b-0 md:p-8"
                    >
                      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">

                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[9px] tracking-[0.25em] text-white/30">
                              {String(index + 1).padStart(
                                2,
                                "0"
                              )}
                            </span>

                            <span className="text-[9px] tracking-[0.2em] text-white/40">
                              {video.category.toUpperCase()}
                            </span>
                          </div>

                          <h3 className="mt-3 text-xl font-light">
                            {video.title}
                          </h3>

                          {video.description && (
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
                              {video.description}
                            </p>
                          )}

                          <div className="mt-5 flex flex-wrap gap-3">
                            {video.vimeo_embed_url && (
                              <span className="border border-white/10 px-3 py-2 text-[8px] tracking-[0.2em] text-white/40">
                                VIMEO PLAYBACK
                              </span>
                            )}

                            {video.download_enabled && (
                              <span className="border border-white/10 px-3 py-2 text-[8px] tracking-[0.2em] text-white/40">
                                DOWNLOAD ENABLED
                              </span>
                            )}

                            {!video.download_enabled && (
                              <span className="border border-white/10 px-3 py-2 text-[8px] tracking-[0.2em] text-white/20">
                                DOWNLOAD DISABLED
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-5">
                        <button
                            type="button"
                            onClick={() =>
                            router.push(
                                `/admin/weddings/${weddingId}/edit-film/${video.id}`
                            )
                            }
                            className="text-[9px] tracking-[0.2em] text-white/50 transition hover:text-white"
                        >
                            EDIT →
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                            handleDeleteFilm(video.id)
                            }
                            className="text-[9px] tracking-[0.2em] text-white/30 transition hover:text-red-300"
                        >
                            DELETE
                        </button>
</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
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