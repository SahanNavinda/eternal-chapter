"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type FeaturedFilm = {
  id: string;
  wedding_id: string;
  couple_name: string;
  slug: string;
  title: string;
  category: string;
  description: string | null;
  vimeo_embed_url: string | null;
  thumbnail_url: string | null;
  display_order: number;
};

export default function Home() {
  const router = useRouter();

  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");

  const [heroVideoUrl, setHeroVideoUrl] = useState<string | null>(null);
  const [heroPosterUrl, setHeroPosterUrl] = useState("/hero.jpg");
  const [heroLoading, setHeroLoading] = useState(true);

  const [featuredFilms, setFeaturedFilms] = useState<FeaturedFilm[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  useEffect(() => {
    const loadHeroSettings = async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("hero_video_url, hero_poster_url")
        .eq("id", 1)
        .single();

      if (error) {
        console.error(
          "Could not load homepage video settings:",
          error
        );
        setHeroLoading(false);
        return;
      }

      setHeroVideoUrl(data?.hero_video_url || null);
      setHeroPosterUrl(data?.hero_poster_url || "/hero.jpg");
      setHeroLoading(false);
    };

    loadHeroSettings();
  }, []);

  useEffect(() => {
    const loadFeaturedFilms = async () => {
      const { data, error } = await supabase.rpc(
        "get_featured_videos"
      );

      if (error) {
        console.error(
          "Could not load featured films:",
          error
        );
        setFeaturedLoading(false);
        return;
      }

      setFeaturedFilms((data || []) as FeaturedFilm[]);
      setFeaturedLoading(false);
    };

    loadFeaturedFilms();
  }, []);

  const handleAccess = async () => {
    const code = accessCode.trim().toUpperCase();

    if (!code) {
      setError("Please enter your access code.");
      return;
    }

    setError("");

    const { data, error } = await supabase.rpc(
      "get_wedding_by_access_code",
      {
        input_code: code,
      }
    );

    if (error) {
      console.error(error);
      setError("Something went wrong. Please try again.");
      return;
    }

    if (!data || data.length === 0) {
      setError(
        "We couldn't find a wedding with that access code."
      );
      return;
    }

    router.push(`/w/${data[0].slug}`);
  };

  const getVimeoEmbedUrl = (url: string) => {
    try {
      let embedUrl = url.trim();

      // Convert a normal Vimeo URL into the proper player URL
      if (
        embedUrl.includes("vimeo.com/") &&
        !embedUrl.includes("player.vimeo.com")
      ) {
        const parts = embedUrl.split("vimeo.com/")[1];

        const videoId = parts
          .split("?")[0]
          .split("#")[0]
          .split("/")[0];

        embedUrl = `https://player.vimeo.com/video/${videoId}`;
      }

      const separator = embedUrl.includes("?") ? "&" : "?";

      return `${embedUrl}${separator}autoplay=1&muted=1&loop=1&autopause=0`;
    } catch {
      return url;
    }
  };

  const isVimeoVideo =
    heroVideoUrl?.includes("vimeo.com") ||
    heroVideoUrl?.includes("player.vimeo.com");

  return (
    <main className="min-h-screen bg-black text-white">
      {/* =========================
          NAVIGATION
      ========================== */}

      <nav className="absolute left-0 right-0 top-0 z-30 px-6 py-6 md:px-12 md:py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Logo */}
          <a
            href="/"
            className="transition-opacity duration-300 hover:opacity-70"
          >
            <img
              src="/logo.png"
              alt="Eternal Chapter"
              className="h-12 w-auto object-contain md:h-14"
            />
          </a>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#films"
              className="text-[10px] tracking-[0.35em] text-white/80 transition-colors duration-300 hover:text-white"
            >
              FILMS
            </a>

            <a
              href="#about"
              className="text-[10px] tracking-[0.35em] text-white/80 transition-colors duration-300 hover:text-white"
            >
              ABOUT
            </a>

            <a
              href="/appointment"
              className="text-[10px] tracking-[0.35em] text-white/80 transition-colors duration-300 hover:text-white"
            >
              CONTACT
            </a>

            {/* Appointment Button */}
            <a
              href="/appointment"
              className="border border-white/40 px-5 py-3 text-[9px] tracking-[0.25em] text-white transition-all duration-500 hover:bg-white hover:text-black"
            >
              BOOK AN APPOINTMENT
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            aria-label="Open menu"
            className="flex h-10 w-10 flex-col items-end justify-center gap-1.5 md:hidden"
          >
            <span className="block h-px w-6 bg-white" />
            <span className="block h-px w-4 bg-white" />
          </button>
        </div>
      </nav>

      {/* =========================
          HERO SECTION
      ========================== */}

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-black">
          {/* Poster / fallback image */}
          <img
            src={heroPosterUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* Vimeo Background Video */}
          {!heroLoading &&
            heroVideoUrl &&
            isVimeoVideo && (
              <div className="absolute inset-0 overflow-hidden">
                <iframe
                  src={getVimeoEmbedUrl(heroVideoUrl)}
                  title="Eternal Chapter Wedding Film"
                  className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

          {/* Direct Video File */}
          {!heroLoading &&
            heroVideoUrl &&
            !isVimeoVideo && (
              <video
                className="absolute inset-0 h-full w-full object-cover"
                src={heroVideoUrl}
                poster={heroPosterUrl}
                autoPlay
                muted
                loop
                playsInline
              />
            )}

          {/* Dark Cinematic Overlay */}
          <div className="absolute inset-0 bg-black/55" />

          {/* Bottom Cinematic Fade */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="cinematic-fade relative z-10 flex max-w-6xl flex-col items-center px-6 pt-20 text-center">
          {/* Small Label */}
          <p className="mb-8 text-[10px] tracking-[0.5em] text-white/60 md:text-xs">
            WEDDING CINEMATOGRAPHY
          </p>

          {/* Main Heading */}
          <h1
            className="max-w-5xl text-3xl font-extralight leading-[1.2] tracking-wide md:text-5xl lg:text-6xl"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontWeight: 300,
            }}
          >
            LET YOUR ETERNAL CHAPTER
            <br />
            SHINE ON SCREEN
          </h1>

          {/* Description */}
          <p className="mt-8 max-w-xl text-sm leading-7 text-white/60 md:text-base">
            Cinematic wedding films created to preserve
            <br className="hidden md:block" />
            the moments you never want to forget.
          </p>

          {/* CTA Button */}
          <a
            href="#films"
            className="mt-12 inline-flex items-center gap-4 border border-white/40 px-8 py-4 text-[10px] tracking-[0.3em] transition-all duration-500 hover:bg-white hover:text-black"
          >
            EXPLORE OUR FILMS

            <span className="text-sm">
              →
            </span>
          </a>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
          <span className="text-[9px] tracking-[0.4em] text-white/40">
            SCROLL
          </span>

          <span className="h-10 w-px bg-white/30" />
        </div>
      </section>

      {/* =========================
          FEATURED FILMS
      ========================== */}

      <section
        id="films"
        className="min-h-screen bg-black px-6 py-24 md:px-16 md:py-32"
      >
        <div className="mx-auto max-w-7xl">
          {/* Section Label */}
          <p className="text-[10px] tracking-[0.4em] text-white/40">
            SELECTED STORIES
          </p>

          {/* Section Heading */}
          <div className="mt-5 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <h2
              className="text-4xl font-light tracking-wide md:text-6xl"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              Our Films
            </h2>

            <p className="max-w-sm text-sm leading-7 text-white/40">
              A collection of stories, emotions and moments
              captured through our lens.
            </p>
          </div>

          {/* Film Grid */}
          {featuredLoading ? (
            <div className="mt-16 flex min-h-[250px] items-center justify-center">
              <p className="text-[10px] tracking-[0.35em] text-white/30">
                LOADING FILMS
              </p>
            </div>
          ) : featuredFilms.length === 0 ? (
            <div className="mt-16 border border-white/10 px-6 py-20 text-center">
              <p className="text-[10px] tracking-[0.35em] text-white/30">
                NEW STORIES COMING SOON
              </p>
            </div>
          ) : (
            <div className="mt-16 grid gap-10 md:grid-cols-2">
              {featuredFilms.map((film) => (
                <button
                  key={film.id}
                  type="button"
                  onClick={() =>
                    router.push(`/w/${film.slug}`)
                  }
                  className="group block text-left"
                >
                  {/* Film Image / Preview */}
                  <div className="relative aspect-video overflow-hidden bg-neutral-900">
                    {film.thumbnail_url ? (
                      <img
                        src={film.thumbnail_url}
                        alt={film.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <span className="text-[10px] tracking-[0.35em] text-white/30 transition-all duration-500 group-hover:text-white">
                            {film.category.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Cinematic Overlay */}
                    <div className="absolute inset-0 bg-black/20 transition-all duration-500 group-hover:bg-black/40" />

                    {/* View Film */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                      <span className="border border-white/60 px-6 py-3 text-[9px] tracking-[0.3em]">
                        VIEW FILM
                      </span>
                    </div>
                  </div>

                  {/* Film Information */}
                  <div className="mt-5 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-light tracking-wide">
                        {film.couple_name}
                      </h3>

                      <p className="mt-2 text-[10px] tracking-[0.25em] text-white/40">
                        {film.title.toUpperCase()}
                      </p>
                    </div>

                    <span className="text-lg text-white/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white">
                      →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =========================
          PHILOSOPHY / ABOUT
      ========================== */}

      <section
        id="about"
        className="flex min-h-[80vh] items-center border-t border-white/10 px-6 py-24 md:px-16 md:py-32"
      >
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-[10px] tracking-[0.4em] text-white/40">
            OUR PHILOSOPHY
          </p>

          <h2
            className="mt-8 text-4xl font-light leading-relaxed tracking-wide md:text-6xl"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}
          >
            Every love story deserves
            <br />
            its own chapter.
          </h2>

          <p className="mx-auto mt-10 max-w-2xl text-sm leading-8 text-white/40 md:text-base">
            We create cinematic wedding films that allow you
            to return to the laughter, the tears, the people
            and the moments that made your day unforgettable.
          </p>
        </div>
      </section>

      {/* =========================
          CONTACT / APPOINTMENT
      ========================== */}

      <section
        id="contact"
        className="border-t border-white/10 px-6 py-28 text-center md:py-40"
      >
        <p className="text-[10px] tracking-[0.4em] text-white/40">
          YOUR STORY AWAITS
        </p>

        <h2
          className="mt-6 text-5xl font-light tracking-wide md:text-7xl"
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          Let's create
          <br />
          your chapter.
        </h2>

        <p className="mx-auto mt-8 max-w-xl text-sm leading-7 text-white/40">
          Tell us about your wedding, your vision and the
          moments you want to remember forever.
        </p>

        {/* Appointment Button */}
                <a
          href="/appointment"
          className="mt-12 inline-flex items-center gap-4 border border-white/40 px-8 py-4 text-[10px] tracking-[0.3em] transition-all duration-500 hover:bg-white hover:text-black"
        >
          BOOK AN APPOINTMENT

          <span className="text-sm">
            →
          </span>
        </a>
      </section>

      {/* =========================
          CLIENT ACCESS
      ========================== */}

      <section className="border-t border-white/10 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[10px] tracking-[0.4em] text-white/40">
            PRIVATE COLLECTION
          </p>

          <h2
            className="mt-6 text-4xl font-light tracking-wide md:text-5xl"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}
          >
            Your chapter awaits.
          </h2>

          <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-white/40">
            Enter the access code provided by Eternal Chapter
            to view your private wedding films.
          </p>

          {/* Access Input */}
          <div className="mt-10">
            <input
              type="text"
              value={accessCode}
              onChange={(event) => {
                setAccessCode(event.target.value);
                setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleAccess();
                }
              }}
              placeholder="ENTER ACCESS CODE"
              className="w-full border border-white/20 bg-transparent px-5 py-4 text-center text-xs tracking-[0.3em] text-white outline-none transition-all duration-500 placeholder:text-white/20 focus:border-white/60"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="mt-4 text-xs text-white/50">
              {error}
            </p>
          )}

          {/* Access Button */}
          <button
            type="button"
            onClick={handleAccess}
            className="mt-5 inline-flex items-center gap-4 border border-white/40 px-8 py-4 text-[10px] tracking-[0.3em] transition-all duration-500 hover:bg-white hover:text-black"
          >
            ENTER YOUR CHAPTER

            <span className="text-sm">
              →
            </span>
          </button>
        </div>
      </section>

      {/* =========================
          FOOTER
      ========================== */}

      <footer className="border-t border-white/10 px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo */}
          <img
            src="/logo.png"
            alt="Eternal Chapter"
            className="h-14 w-auto object-contain opacity-80"
          />

          {/* Copyright */}
          <p className="text-[9px] tracking-[0.25em] text-white/30">
            © {new Date().getFullYear()} ETERNAL CHAPTER
          </p>

          {/* Description */}
          <p className="text-[9px] tracking-[0.25em] text-white/30">
            WEDDING CINEMATOGRAPHY
          </p>
        </div>
      </footer>
    </main>
  );
}