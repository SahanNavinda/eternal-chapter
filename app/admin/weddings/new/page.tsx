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

const defaultCategories = [
  "Highlight Film",
  "Wedding Film",
  "Ceremony",
  "Reception",
  "Special Moments",
  "Downloads",
  "Credits",
];

export default function NewWeddingPage() {
  const router = useRouter();

  /* =========================
      WEDDING DETAILS
  ========================== */

  const [coupleName, setCoupleName] = useState("");
  const [weddingDate, setWeddingDate] = useState("");

  const [welcomeMessage, setWelcomeMessage] = useState(
    "Your memories are ready to be discovered."
  );

  const [expiryDate, setExpiryDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  /* =========================
      FILMS
  ========================== */

  type FilmDraft = {
    id: string;
    title: string;
    category: string;
    customCategory: string;
    description: string;
    vimeoUrl: string;
    youtubeUrl: string;
    googleDriveUrl: string;
    thumbnailUrl: string;
    downloadEnabled: boolean;
    isFeatured: boolean;
  };

  const createEmptyFilm = (): FilmDraft => ({
    id: crypto.randomUUID(),
    title: "",
    category: "Highlight Film",
    customCategory: "",
    description: "",
    vimeoUrl: "",
    youtubeUrl: "",
    googleDriveUrl: "",
    thumbnailUrl: "",
    downloadEnabled: true,
    isFeatured: false,
  });

  const [films, setFilms] = useState<FilmDraft[]>([]);

  const addFilm = () => {
    setFilms((current) => [...current, createEmptyFilm()]);
  };

  const removeFilm = (id: string) => {
    setFilms((current) => current.filter((film) => film.id !== id));
  };

  const updateFilm = (
    id: string,
    field: keyof FilmDraft,
    value: string | boolean
  ) => {
    setFilms((current) =>
      current.map((film) =>
        film.id === id ? { ...film, [field]: value } : film
      )
    );
  };

  /* =========================
      CREATED WEDDING
  ========================== */

  const [generatedSlug, setGeneratedSlug] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");

  /* =========================
      STATE
  ========================== */

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  /* =========================
      CREATE WEDDING
  ========================== */

  const handleCreateWedding = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading || success) {
      return;
    }

    setError("");
    setLoading(true);

    /* Couple name is the only required wedding field */

    if (!coupleName.trim()) {
      setError("Please enter the couple's name.");
      setLoading(false);
      return;
    }

    /* Validate any film cards that have been started */

    const filmsToCreate = films.filter(
      (film) =>
        film.title.trim() ||
        film.description.trim() ||
        film.vimeoUrl.trim() ||
        film.youtubeUrl.trim() ||
        film.googleDriveUrl.trim() ||
        film.thumbnailUrl.trim() ||
        film.customCategory.trim()
    );

    for (const film of filmsToCreate) {
      if (!film.title.trim()) {
        setError(
          "Please enter a film title for every film you started filling in."
        );
        setLoading(false);
        return;
      }

      if (
        film.category === "Custom" &&
        !film.customCategory.trim()
      ) {
        setError(
          `Please enter a custom film category for "${film.title.trim()}".`
        );
        setLoading(false);
        return;
      }
    }

    try {
      /* =========================
          CHECK AUTHENTICATION
      ========================== */

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/admin/login");
        return;
      }

      /* =========================
          CREATE WEDDING
      ========================== */

      const { data, error: rpcError } =
        await supabase.rpc("create_wedding", {
          input_couple_name: coupleName.trim(),
          input_wedding_date: weddingDate || null,
          input_welcome_message:
            welcomeMessage.trim() || null,
          input_expiry_date: expiryDate || null,
          input_is_active: isActive,
        });

      if (rpcError) {
        console.error(
          "Create wedding RPC error:",
          rpcError
        );

        throw rpcError;
      }

      if (!data || data.length === 0) {
        throw new Error(
          "The wedding could not be created."
        );
      }

      const wedding = data[0];

      /* =========================
          CREATE FILMS
          ONLY FOR FILMS WITH A TITLE
      ========================== */

      if (filmsToCreate.length > 0) {
        const filmRows = filmsToCreate.map((film, index) => ({
          wedding_id: wedding.id,
          title: film.title.trim(),
          category:
            film.category === "Custom"
              ? film.customCategory.trim()
              : film.category,
          description: film.description.trim() || null,
          google_drive_url:
            film.googleDriveUrl.trim() || null,
          vimeo_embed_url:
            film.vimeoUrl.trim() || null,
          youtube_embed_url:
            film.youtubeUrl.trim() || null,
          thumbnail_url:
            film.thumbnailUrl.trim() || null,
          download_enabled: film.downloadEnabled,
          is_featured: film.isFeatured,
          display_order: index + 1,
        }));

        const { error: filmsError } = await supabase
          .from("videos")
          .insert(filmRows);

        if (filmsError) {
          console.error("Film creation error:", filmsError);

          setError(
            `Wedding created, but the films could not be added: ${filmsError.message}`
          );

          setGeneratedSlug(wedding.slug);
          setGeneratedCode(wedding.access_code);
          setLoading(false);

          return;
        }
      }

      /* =========================
          SUCCESS
      ========================== */

      setGeneratedSlug(wedding.slug);
      setGeneratedCode(wedding.access_code);

      setSuccess(true);
      setLoading(false);

      setTimeout(() => {
        router.push("/admin");
      }, 5000);
    } catch (err: any) {
      console.error(
        "Create wedding error:",
        err
      );

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

      {/* =========================
          HEADER
      ========================== */}

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

      {/* =========================
          MAIN
      ========================== */}

      <section className="mx-auto max-w-3xl px-6 py-10 md:px-10">

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-10">

          {/* =========================
              INTRO
          ========================== */}

          <div className="mb-10">

            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              Client Delivery
            </p>

            <h2 className="mt-3 text-3xl font-light">
              Create a new wedding chapter
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/50">
              Create a private delivery page and optionally
              add multiple films at the same time.
            </p>

          </div>

          {/* =========================
              SUCCESS STATE
          ========================== */}

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
                  Give this code to the couple so they
                  can access their wedding from the
                  Eternal Chapter homepage.
                </p>

              </div>

              <p className="text-center text-xs text-white/30">
                Returning to dashboard...
              </p>

            </div>

          ) : (

            /* =========================
                FORM
            ========================== */

            <form
              onSubmit={handleCreateWedding}
              className="space-y-10"
            >

              {/* =========================
                  WEDDING DETAILS
              ========================== */}

              <div>

                <div className="mb-6">

                  <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                    01
                  </p>

                  <h3 className="mt-2 text-xl font-light">
                    Wedding Details
                  </h3>

                  <p className="mt-2 text-sm text-white/30">
                    Only the couple name is required.
                    Everything else can be added later.
                  </p>

                </div>

                <div className="space-y-7">

                  {/* Couple Name */}

                  <div>

                    <label className="mb-2 block text-sm text-white/70">
                      Couple Name *
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
                      If this URL already exists, a number
                      will automatically be added.
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
                      A unique code will be generated when
                      the wedding is created.
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

                </div>

              </div>

              {/* =========================
                  FILMS
              ========================== */}

              <div className="border-t border-white/10 pt-10">

                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                      02
                    </p>

                    <h3 className="mt-2 text-xl font-light">
                      Films
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-white/30">
                      Optional. Add as many films as you need. You can also
                      leave this section empty and add films later.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addFilm}
                    disabled={loading}
                    className="rounded-xl border border-white/10 bg-black/30 px-5 py-3 text-sm text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-50"
                  >
                    + Add Film
                  </button>

                </div>

                {films.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-5 py-8 text-center">
                    <p className="text-sm text-white/30">
                      No films added yet.
                    </p>

                    <button
                      type="button"
                      onClick={addFilm}
                      disabled={loading}
                      className="mt-4 text-sm text-white/60 underline underline-offset-4 transition hover:text-white disabled:opacity-50"
                    >
                      Add your first film
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">

                    {films.map((film, index) => (
                      <div
                        key={film.id}
                        className="rounded-xl border border-white/10 bg-black/30 p-5 md:p-6"
                      >

                        <div className="mb-6 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-white/30">
                              Film {String(index + 1).padStart(2, "0")}
                            </p>

                            <p className="mt-2 text-sm text-white/60">
                              {film.title.trim() || "Untitled Film"}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFilm(film.id)}
                            disabled={loading}
                            className="text-xs text-white/30 transition hover:text-white disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="space-y-7">

                          {/* Film Title */}

                          <div>
                            <label className="mb-2 block text-sm text-white/70">
                              Film Title
                            </label>

                            <input
                              type="text"
                              value={film.title}
                              onChange={(e) =>
                                updateFilm(
                                  film.id,
                                  "title",
                                  e.target.value
                                )
                              }
                              placeholder="Highlight Film"
                              disabled={loading}
                              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-white/30 disabled:opacity-50"
                            />

                            <p className="mt-2 text-xs text-white/30">
                              Leave the entire film empty if you want to add it later.
                            </p>
                          </div>

                          {/* Category */}

                          <div>
                            <label className="mb-2 block text-sm text-white/70">
                              Film Category
                            </label>

                            <select
                              value={film.category}
                              onChange={(e) =>
                                updateFilm(
                                  film.id,
                                  "category",
                                  e.target.value
                                )
                              }
                              disabled={loading}
                              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-white/30 disabled:opacity-50"
                            >
                              {defaultCategories.map((category) => (
                                <option
                                  key={category}
                                  value={category}
                                  className="bg-[#111]"
                                >
                                  {category}
                                </option>
                              ))}

                              <option
                                value="Custom"
                                className="bg-[#111]"
                              >
                                Custom
                              </option>
                            </select>
                          </div>

                          {/* Custom Category */}

                          {film.category === "Custom" && (
                            <div>
                              <label className="mb-2 block text-sm text-white/70">
                                Custom Category
                              </label>

                              <input
                                type="text"
                                value={film.customCategory}
                                onChange={(e) =>
                                  updateFilm(
                                    film.id,
                                    "customCategory",
                                    e.target.value
                                  )
                                }
                                placeholder="Special Moments"
                                disabled={loading}
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-white/30 disabled:opacity-50"
                              />
                            </div>
                          )}

                          {/* Description */}

                          <div>
                            <label className="mb-2 block text-sm text-white/70">
                              Film Description
                            </label>

                            <textarea
                              value={film.description}
                              onChange={(e) =>
                                updateFilm(
                                  film.id,
                                  "description",
                                  e.target.value
                                )
                              }
                              rows={3}
                              placeholder="A cinematic look back at your wedding day."
                              disabled={loading}
                              className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-white/30 disabled:opacity-50"
                            />
                          </div>

                          {/* Vimeo */}

                          <div>
                            <label className="mb-2 block text-sm text-white/70">
                              Vimeo Video URL
                            </label>

                            <input
                              type="url"
                              value={film.vimeoUrl}
                              onChange={(e) =>
                                updateFilm(
                                  film.id,
                                  "vimeoUrl",
                                  e.target.value
                                )
                              }
                              placeholder="https://vimeo.com/..."
                              disabled={loading}
                              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-white/30 disabled:opacity-50"
                            />

                            <p className="mt-2 text-xs text-white/30">
                              Used for online video playback.
                            </p>
                          </div>

                          {/* YouTube */}

                          <div>
                            <label className="mb-2 block text-sm text-white/70">
                              YouTube Video URL
                            </label>

                            <input
                              type="url"
                              value={film.youtubeUrl}
                              onChange={(e) =>
                                updateFilm(
                                  film.id,
                                  "youtubeUrl",
                                  e.target.value
                                )
                              }
                              placeholder="https://www.youtube.com/watch?v=..."
                              disabled={loading}
                              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-white/30 disabled:opacity-50"
                            />

                            <p className="mt-2 text-xs text-white/30">
                              Optional alternative playback source.
                            </p>
                          </div>

                          {/* Google Drive */}

                          <div>
                            <label className="mb-2 block text-sm text-white/70">
                              Google Drive Download URL
                            </label>

                            <input
                              type="url"
                              value={film.googleDriveUrl}
                              onChange={(e) =>
                                updateFilm(
                                  film.id,
                                  "googleDriveUrl",
                                  e.target.value
                                )
                              }
                              placeholder="https://drive.google.com/..."
                              disabled={loading}
                              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-white/30 disabled:opacity-50"
                            />

                            <p className="mt-2 text-xs text-white/30">
                              Optional. You can add the download link later.
                            </p>
                          </div>

                          {/* Thumbnail */}

                          <div>
                            <label className="mb-2 block text-sm text-white/70">
                              Thumbnail URL
                            </label>

                            <input
                              type="url"
                              value={film.thumbnailUrl}
                              onChange={(e) =>
                                updateFilm(
                                  film.id,
                                  "thumbnailUrl",
                                  e.target.value
                                )
                              }
                              placeholder="https://..."
                              disabled={loading}
                              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-white/30 disabled:opacity-50"
                            />
                          </div>

                          {/* Download Enabled */}

                          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-4">

                            <div>
                              <p className="text-sm text-white/70">
                                Download Enabled
                              </p>

                              <p className="mt-1 text-xs text-white/30">
                                Allow clients to download this film.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                updateFilm(
                                  film.id,
                                  "downloadEnabled",
                                  !film.downloadEnabled
                                )
                              }
                              disabled={loading}
                              className={`relative h-6 w-11 rounded-full transition disabled:opacity-50 ${
                                film.downloadEnabled
                                  ? "bg-white"
                                  : "bg-white/20"
                              }`}
                            >
                              <span
                                className={`absolute top-1 h-4 w-4 rounded-full transition ${
                                  film.downloadEnabled
                                    ? "left-6 bg-black"
                                    : "left-1 bg-white/60"
                                }`}
                              />
                            </button>

                          </div>

                          {/* Homepage Featured */}

                          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-4">

                            <div>
                              <p className="text-sm text-white/70">
                                Homepage Featured
                              </p>

                              <p className="mt-1 text-xs text-white/30">
                                Show this film in the public Featured Films section.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                updateFilm(
                                  film.id,
                                  "isFeatured",
                                  !film.isFeatured
                                )
                              }
                              disabled={loading}
                              className={`relative h-6 w-11 rounded-full transition disabled:opacity-50 ${
                                film.isFeatured
                                  ? "bg-white"
                                  : "bg-white/20"
                              }`}
                            >
                              <span
                                className={`absolute top-1 h-4 w-4 rounded-full transition ${
                                  film.isFeatured
                                    ? "left-6 bg-black"
                                    : "left-1 bg-white/60"
                                }`}
                              />
                            </button>

                          </div>

                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addFilm}
                      disabled={loading}
                      className="w-full rounded-xl border border-dashed border-white/10 py-4 text-sm text-white/40 transition hover:border-white/30 hover:text-white/70 disabled:opacity-50"
                    >
                      + Add Another Film
                    </button>

                  </div>
                )}

              </div>

              {/* =========================
                  ERROR
              ========================== */}

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {/* =========================
                  CREATE BUTTON
              ========================== */}

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