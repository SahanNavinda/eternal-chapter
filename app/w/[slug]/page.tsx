import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

type WeddingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type Video = {
  id: string;
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

function getYouTubeVideoId(url: string) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtu.be")) {
      return parsedUrl.pathname.replace("/", "").split("/")[0];
    }

    if (parsedUrl.hostname.includes("youtube.com")) {
      if (parsedUrl.pathname === "/watch") {
        return parsedUrl.searchParams.get("v");
      }

      if (parsedUrl.pathname.startsWith("/embed/")) {
        return (
          parsedUrl.pathname.split("/embed/")[1]?.split("/")[0] || null
        );
      }

      if (parsedUrl.pathname.startsWith("/shorts/")) {
        return (
          parsedUrl.pathname.split("/shorts/")[1]?.split("/")[0] || null
        );
      }
    }

    return null;
  } catch {
    return null;
  }
}

function getYouTubeEmbedUrl(url: string) {
  const videoId = getYouTubeVideoId(url);

  if (!videoId) {
    return url;
  }

  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&playsinline=1&rel=0&modestbranding=1`;
}

function getYouTubeBackgroundUrl(url: string) {
  const videoId = getYouTubeVideoId(url);

  if (!videoId) {
    return url;
  }

  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&playsinline=1&rel=0&modestbranding=1`;
}

function getVimeoBackgroundUrl(url: string) {
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

    const separator = embedUrl.includes("?") ? "&" : "?";

    return `${embedUrl}${separator}autoplay=1&muted=1&loop=1&autopause=0&controls=0&title=0&byline=0&portrait=0&playsinline=1`;
  } catch {
    return url;
  }
}

function isDirectVideo(url: string) {
  const lowerUrl = url.toLowerCase();

  return (
    lowerUrl.includes(".mp4") ||
    lowerUrl.includes(".webm") ||
    lowerUrl.includes(".ogg") ||
    lowerUrl.includes(".mov") ||
    lowerUrl.includes(".m4v")
  );
}

function isVimeoUrl(url: string) {
  return (
    url.includes("vimeo.com/") ||
    url.includes("player.vimeo.com/")
  );
}

function isYouTubeUrl(url: string) {
  return (
    url.includes("youtube.com/") ||
    url.includes("youtu.be/")
  );
}

export default async function WeddingPage({
  params,
}: WeddingPageProps) {
  const { slug } = await params;

  // Get wedding information
  const { data, error } = await supabase.rpc(
    "get_wedding_by_slug",
    {
      input_slug: slug,
    }
  );

  const wedding = data?.[0];

  if (error) {
    console.error("Wedding lookup error:", error);
    notFound();
  }

  if (!wedding) {
    notFound();
  }

  // Get videos
  const { data: videosData, error: videosError } =
    await supabase.rpc(
      "get_videos_by_wedding_id",
      {
        input_wedding_id: wedding.id,
      }
    );

  if (videosError) {
    console.error("Video lookup error:", videosError);
  }

  const videos = (videosData ?? []) as Video[];

  // Find Highlight Film
  const highlightFilm = videos.find(
    (video) =>
      video.category.toLowerCase().includes("highlight") ||
      video.title.toLowerCase().includes("highlight")
  );

  // Everything except Highlight Film
  const otherFilms = videos.filter(
    (video) => video.id !== highlightFilm?.id
  );

  // Format wedding date
  const formattedDate = wedding.wedding_date
    ? new Date(wedding.wedding_date)
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
        .toUpperCase()
    : "";

  const backgroundMedia = wedding.cover_image?.trim() || "";

  return (
    <main className="min-h-screen bg-black text-white">

      {/* HEADER */}
      <header className="absolute left-0 right-0 top-0 z-20 px-6 py-6 md:px-12 md:py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">

          <a
            href="/"
            className="transition-opacity duration-300 hover:opacity-70"
          >
            <img
              src="/logo.png"
              alt="Eternal Chapter"
              className="h-12 w-auto object-contain md:h-30"
            />
          </a>

          <p className="hidden text-[9px] tracking-[0.3em] text-white/40 md:block">
            YOUR WEDDING CHAPTER
          </p>

        </div>
      </header>


      {/* HERO */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">

        {/* BACKGROUND MEDIA */}
        <div className="absolute inset-0 bg-black">

          {!backgroundMedia ? (
            <img
              src="/hero.jpg"
              alt=""
              className="h-full w-full object-contain md:object-cover"
            />
          ) : isVimeoUrl(backgroundMedia) ? (
            <iframe
              src={getVimeoBackgroundUrl(backgroundMedia)}
              title="Wedding background video"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-[100vh] w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              aria-hidden="true"
            />
          ) : isYouTubeUrl(backgroundMedia) ? (
            <iframe
              src={getYouTubeBackgroundUrl(backgroundMedia)}
              title="Wedding background video"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-[100vh] w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              aria-hidden="true"
            />
          ) : isDirectVideo(backgroundMedia) ? (
            <video
              src={backgroundMedia}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="h-full w-full object-contain md:object-cover"
            />
          ) : (
  <div className="absolute inset-0 overflow-hidden bg-black">

    {/* Blurred background fills the screen */}
    <img
      src={backgroundMedia}
      alt=""
      className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-60"
    />

    {/* Main photograph remains fully visible */}
    <img
      src={backgroundMedia}
      alt="Wedding background"
      className="absolute inset-0 h-full w-full object-contain"
    />

  </div>
)}

          {/* DARK CINEMATIC OVERLAY */}
          <div className="absolute inset-0 bg-black/45" />

          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />

        </div>


        {/* HERO CONTENT */}
        <div className="cinematic-fade relative z-10 px-6 text-center">

          <p className="text-[10px] tracking-[0.5em] text-white/50">
            YOUR WEDDING CHAPTER
          </p>

          <h1
  className="mt-8 text-5xl font-light tracking-wide md:text-7xl"
  style={{
    fontFamily: "Georgia, 'Times New Roman', serif",
  }}
>
            {wedding.couple_name}
          </h1>

          {formattedDate && (
            <p className="mt-6 text-[10px] tracking-[0.35em] text-white/40">
              {formattedDate}
            </p>
          )}

          <div className="mx-auto mt-10 h-px w-12 bg-white/30" />

          <p className="mt-8 text-sm text-white/50">
            {wedding.welcome_message ||
              "Your memories are ready to be discovered."}
          </p>

          <a
            href="#highlight"
            className="mt-10 inline-flex items-center gap-4 border border-white/40 px-8 py-4 text-[10px] tracking-[0.3em] transition-all duration-500 hover:bg-white hover:text-black"
          >
            WATCH YOUR FILM
            <span className="text-sm">↓</span>
          </a>

        </div>

      </section>


      {/* HIGHLIGHT FILM */}
      {highlightFilm && (
        <section
          id="highlight"
          className="px-6 py-24 md:px-16 md:py-32"
        >

          <div className="mx-auto max-w-6xl">

            <div className="text-center">

              <p className="text-[10px] tracking-[0.5em] text-white/40">
                YOUR STORY
              </p>

              <h2
  className="mt-5 text-4xl font-light tracking-wide md:text-6xl"
  style={{
    fontFamily: "Georgia, 'Times New Roman', serif",
  }}
>
  Highlight Film
</h2>

              <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/40">
                {highlightFilm.description ||
                  "The moments that tell your story."}
              </p>

            </div>


            {/* VIDEO PLAYER */}

            {highlightFilm.vimeo_embed_url ? (
              <div className="relative mx-auto mt-16 aspect-video max-w-6xl overflow-hidden bg-neutral-900 shadow-2xl">

                <iframe
                  src={highlightFilm.vimeo_embed_url}
                  title={highlightFilm.title}
                  className="absolute inset-0 h-full w-full"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />

              </div>
            ) : highlightFilm.youtube_embed_url ? (
              <div className="relative mx-auto mt-16 aspect-video max-w-6xl overflow-hidden bg-neutral-900 shadow-2xl">

                <iframe
                  src={getYouTubeEmbedUrl(
                    highlightFilm.youtube_embed_url
                  )}
                  title={highlightFilm.title}
                  className="absolute inset-0 h-full w-full"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />

              </div>
            ) : highlightFilm.thumbnail_url ? (
              <div className="relative mx-auto mt-16 aspect-video max-w-6xl overflow-hidden bg-neutral-950 shadow-2xl">

                <img
                  src={highlightFilm.thumbnail_url}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-black/50" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm text-white/60">
                    Your highlight film will appear here soon.
                  </p>
                </div>

              </div>
            ) : (
              <div className="mx-auto mt-16 flex aspect-video max-w-6xl items-center justify-center border border-white/10 bg-neutral-950">

                <p className="text-sm text-white/30">
                  Your highlight film will appear here soon.
                </p>

              </div>
            )}


            {/* HIGHLIGHT BUTTONS */}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6">

              {highlightFilm.download_enabled &&
                highlightFilm.google_drive_url && (
                  <a
                    href={highlightFilm.google_drive_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-white/20 px-6 py-3 text-[10px] tracking-[0.3em] text-white/60 transition-all duration-500 hover:border-white hover:bg-white hover:text-black"
                  >
                    DOWNLOAD FILM →
                  </a>
                )}

            </div>

          </div>

        </section>
      )}


      {/* OTHER FILMS */}
      {otherFilms.length > 0 && (
        <section
          id="films"
          className="border-t border-white/10 px-6 py-24 md:px-16 md:py-32"
        >

          <div className="mx-auto max-w-6xl">

            <p className="text-[10px] tracking-[0.4em] text-white/40">
              MORE MEMORIES
            </p>

            <h2
  className="mt-5 text-4xl font-light tracking-wide md:text-6xl"
  style={{
    fontFamily: "Georgia, 'Times New Roman', serif",
  }}
>
  Your Films
</h2>


            <div className="mt-16 space-y-10">

              {otherFilms.map((video) => (

                <article
                  key={video.id}
                  className="border-t border-white/10 py-8"
                >

                  <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">

                    {/* FILM INFO */}

                    <div>

                      <p className="text-[10px] tracking-[0.35em] text-white/40">
                        {video.category}
                      </p>

                      <h3 className="mt-3 text-2xl font-light md:text-3xl">
                        {video.title}
                      </h3>

                      {video.description && (
                        <p className="mt-3 max-w-xl text-sm leading-7 text-white/40">
                          {video.description}
                        </p>
                      )}

                    </div>


                    {/* DOWNLOAD */}

                    {video.download_enabled &&
                      video.google_drive_url && (
                        <a
                          href={video.google_drive_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-fit items-center gap-4 border border-white/20 px-7 py-4 text-[10px] tracking-[0.3em] text-white/60 transition-all duration-500 hover:border-white hover:bg-white hover:text-black"
                        >
                          DOWNLOAD FILM
                          <span>↓</span>
                        </a>
                      )}

                  </div>

                </article>

              ))}

            </div>

          </div>

        </section>
      )}


      {/* CREDITS */}
      <section className="border-t border-white/10 px-6 py-24 text-center">

        <img
          src="/logo.png"
          alt="Eternal Chapter"
          className="mx-auto h-30 w-auto object-contain opacity-80"
        />

        <p className="mt-8 text-[10px] tracking-[0.4em] text-white/30">
          ETERNAL CHAPTER WEDDING FILMS
        </p>

        <p className="mt-3 text-sm text-white/40">

        </p>

      </section>


      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-10 text-center">

        <p className="text-[9px] tracking-[0.25em] text-white/20">
          THIS CHAPTER WAS CREATED TO BE REMEMBERED.
        </p>

      </footer>

    </main>
  );
}
