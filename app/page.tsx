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
  youtube_embed_url: string | null;
  thumbnail_url: string | null;
  display_order: number;
};

export default function Home() {
  const router = useRouter();

  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [heroVideoUrl, setHeroVideoUrl] = useState<string | null>(null);
  const [heroPosterUrl, setHeroPosterUrl] = useState("/hero.jpg");
  const [heroLoading, setHeroLoading] = useState(true);

  

  const [featuredFilms, setFeaturedFilms] = useState<FeaturedFilm[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  /* =========================
      LOAD HOMEPAGE SETTINGS
  ========================== */

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

  /* =========================
      LOAD FEATURED FILMS
  ========================== */

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

  /* =========================
      CLIENT ACCESS
  ========================== */

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

  /* =========================
      YOUTUBE VIDEO ID
  ========================== */

  const getYouTubeVideoId = (url: string) => {
    try {
      const value = url.trim();

      const patterns = [
        /youtube\.com\/watch\?v=([^&]+)/,
        /youtube\.com\/embed\/([^?&]+)/,
        /youtube\.com\/shorts\/([^?&]+)/,
        /youtu\.be\/([^?&]+)/,
      ];

      for (const pattern of patterns) {
        const match = value.match(pattern);

        if (match?.[1]) {
          return match[1];
        }
      }

      return null;
    } catch {
      return null;
    }
  };

  /* =========================
      YOUTUBE HERO URL
  ========================== */

  const getYouTubeHeroUrl = (
    url: string,
    muted: boolean
  ) => {
    const videoId = getYouTubeVideoId(url);

    if (!videoId) {
      return url;
    }

    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${
      muted ? "1" : "0"
    }&loop=1&playlist=${videoId}&controls=0&playsinline=1&rel=0&modestbranding=1`;
  };

  /* =========================
      YOUTUBE FEATURED URL
  ========================== */

  const getYouTubeFeaturedUrl = (url: string) => {
    const videoId = getYouTubeVideoId(url);

    if (!videoId) {
      return url;
    }

    return `https://www.youtube.com/embed/${videoId}?autoplay=0&mute=0&controls=1&playsinline=1&rel=0&modestbranding=1`;
  };

  /* =========================
      VIMEO HERO URL
  ========================== */

  const getVimeoHeroUrl = (
    url: string,
    muted: boolean
  ) => {
    try {
      let embedUrl = url.trim();

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

      const separator = embedUrl.includes("?")
        ? "&"
        : "?";

      return `${embedUrl}${separator}autoplay=1&muted=${
        muted ? "1" : "0"
      }&loop=1&autopause=0&controls=0&unmute_button=0&badge=0&title=0&byline=0&portrait=0&vimeo_logo=0`;
    } catch {
      return url;
    }
  };

  /* =========================
      VIMEO FEATURED URL
  ========================== */

  const getVimeoFeaturedUrl = (url: string) => {
    try {
      let embedUrl = url.trim();

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

      const separator = embedUrl.includes("?")
        ? "&"
        : "?";

      return `${embedUrl}${separator}autoplay=0&controls=1&title=0&byline=0&portrait=0`;
    } catch {
      return url;
    }
  };

  /* =========================
      HERO VIDEO TYPE
  ========================== */

  const isVimeoVideo =
    heroVideoUrl?.includes("vimeo.com") ||
    heroVideoUrl?.includes("player.vimeo.com");

  const isYouTubeVideo =
    heroVideoUrl?.includes("youtube.com") ||
    heroVideoUrl?.includes("youtu.be");

  /* =========================
      TOGGLE HERO SOUND
  ========================== */


  return (
    <main className="min-h-screen bg-black text-white">

      {/* =========================
          NAVIGATION
      ========================== */}

      <nav className="absolute left-0 right-0 top-0 z-50 px-6 py-6 md:px-12 md:py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">

          {/* Logo */}
          <a
            href="/"
            className="relative z-50 transition-opacity duration-300 hover:opacity-70"
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
            aria-label={
              mobileMenuOpen
                ? "Close menu"
                : "Open menu"
            }
            aria-expanded={mobileMenuOpen}
            onClick={() =>
              setMobileMenuOpen(!mobileMenuOpen)
            }
            className="relative z-50 flex h-10 w-10 flex-col items-end justify-center gap-1.5 md:hidden"
          >
            <span
              className={`block h-px w-6 bg-white transition-all duration-300 ${
                mobileMenuOpen
                  ? "translate-y-[4px] rotate-45"
                  : ""
              }`}
            />

            <span
              className={`block h-px w-4 bg-white transition-all duration-300 ${
                mobileMenuOpen
                  ? "-translate-y-[4px] -rotate-45"
                  : ""
              }`}
            />
          </button>

        </div>
      </nav>


      {/* =========================
          MOBILE MENU
      ========================== */}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-md md:hidden">
          <div className="flex min-h-screen flex-col items-center justify-center px-6">

            <div className="flex flex-col items-center gap-10 text-center">

              <a
                href="#films"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="text-xs tracking-[0.4em] text-white/80 transition-colors duration-300 hover:text-white"
              >
                FILMS
              </a>

              <a
                href="#about"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="text-xs tracking-[0.4em] text-white/80 transition-colors duration-300 hover:text-white"
              >
                ABOUT
              </a>

              <a
                href="#contact"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="text-xs tracking-[0.4em] text-white/80 transition-colors duration-300 hover:text-white"
              >
                CONTACT
              </a>

              <a
                href="/appointment"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="border border-white/40 px-7 py-4 text-[10px] tracking-[0.3em] text-white transition-all duration-500 hover:bg-white hover:text-black"
              >
                BOOK AN APPOINTMENT
              </a>

            </div>

          </div>
        </div>
      )}


      {/* =========================
          HERO SECTION
      ========================== */}

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">

        {/* Background */}
        <div className="absolute inset-0 bg-black">

          {/* Poster / fallback image */}
          {!heroVideoUrl && (
            <img
              src={heroPosterUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {/* Vimeo Hero Video */}
          {!heroLoading &&
            heroVideoUrl &&
            isVimeoVideo && (
              <div className="absolute inset-0 overflow-hidden">

                <iframe
                  key="vimeo"
                  src={getVimeoHeroUrl(
                    heroVideoUrl,
                    true
                  )}
                  title="Eternal Chapter"
                  className="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />

              </div>
            )}

          {/* YouTube Hero Video */}
          {!heroLoading &&
            heroVideoUrl &&
            isYouTubeVideo && (
              <div className="absolute inset-0 overflow-hidden">

                <iframe
                  key="youtube"
                  src={getYouTubeHeroUrl(
                    heroVideoUrl,
                    true
                  )}
                  title="Eternal Chapter"
                  className="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2"
                  frameBorder="0"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />

              </div>
            )}

          {/* Direct Video File */}
          {!heroLoading &&
            heroVideoUrl &&
            !isVimeoVideo &&
            !isYouTubeVideo && (
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
        <div className="cinematic-fade relative z-10 flex max-w-6xl flex-col items-center px-6 pt-10 text-center">

          {/* Small Label */}
          <p className="mb-8 text-[10px] tracking-[0.5em] text-white/60 md:text-xs">
            YOUR STORY, BEAUTIFULLY TOLD
          </p>

          {/* Main Heading */}
          <h1
            className="max-w-5xl text-3xl font-extralight leading-[1.2] tracking-wide md:text-5xl lg:text-6xl"
            style={{
              fontFamily:
                "Georgia, 'Times New Roman', serif",
              fontWeight: 300,
            }}
          >
            LET YOUR ETERNAL CHAPTER
            <br />
            SHINE ON SCREEN
          </h1>

          {/* Description */}
          <p className="mt-8 max-w-xl text-sm leading-7 text-white/60 md:text-base">
            Your memories become stories,
            <br className="hidden md:block" />
            your stories become chapters, forever.
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
          FEATURED WEDDING FILMS
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
              className="text-4xl font-light tracking-wide md:text-4xl"
              style={{
                fontFamily:
                  "Georgia, 'Times New Roman', serif",
              }}
            >
              FEATURED WEDDING FILMS
            </h2>

            <p className="mx-auto mt-10 max-w-2xl text-sm leading-8 text-white/40 md:text-base">
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

                <div
                  key={film.id}
                  className="group block"
                >

                  {/* Film Video / Preview */}
                  <div className="relative aspect-video overflow-hidden bg-neutral-900">

                    {/* Vimeo */}
                    {film.vimeo_embed_url ? (

                      <iframe
                        src={getVimeoFeaturedUrl(
                          film.vimeo_embed_url
                        )}
                        title={film.title}
                        className="absolute inset-0 h-full w-full"
                        frameBorder="0"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      />

                    ) : film.youtube_embed_url ? (

                      /* YouTube */
                      <iframe
                        src={getYouTubeFeaturedUrl(
                          film.youtube_embed_url
                        )}
                        title={film.title}
                        className="absolute inset-0 h-full w-full"
                        frameBorder="0"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />

                    ) : film.thumbnail_url ? (

                      /* Thumbnail */
                      <img
                        src={film.thumbnail_url}
                        alt={film.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />

                    ) : (

                      /* Empty Preview */
                      <div className="flex h-full items-center justify-center">

                        <div className="text-center">

                          <span className="text-[10px] tracking-[0.35em] text-white/30 transition-all duration-500 group-hover:text-white">
                            {film.category.toUpperCase()}
                          </span>

                        </div>

                      </div>

                    )}

                  </div>

                  {/* Film Information */}
                  <div className="mt-5">

                    <h3 className="text-lg font-light tracking-wide">
                      {film.couple_name}
                    </h3>

                    <p className="mt-2 text-[10px] tracking-[0.25em] text-white/40">
                      {film.title.toUpperCase()}
                    </p>

                  </div>

                </div>

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
              fontFamily:
                "Georgia, 'Times New Roman', serif",
            }}
          >
            Every love story deserves
            <br />
            its own chapter.
          </h2>

          <p className="mx-auto mt-10 max-w-2xl text-sm leading-8 text-white/40 md:text-base">
            Your wedding day becomes a collection of moments —
the laughter, the tears, the embraces and the people
who made it unforgettable. We preserve them as your story.
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
            fontFamily:
              "Georgia, 'Times New Roman', serif",
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
              fontFamily:
                "Georgia, 'Times New Roman', serif",
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

          {/* Since */}
          <p className="text-[9px] tracking-[0.25em] text-white/30">
            SINCE 2018 · ETERNAL CHAPTER WEDDING FILMS
          </p>

          {/* Description */}
          <p className="text-[9px] tracking-[0.25em] text-white/30">
            YOUR STORY, BEAUTIFULLY TOLD
          </p>

        </div>

      </footer>

    </main>
  );
}