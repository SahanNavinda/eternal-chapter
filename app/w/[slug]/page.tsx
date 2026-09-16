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
  google_drive_url: string;
  vimeo_embed_url: string | null;
  thumbnail_url: string | null;
  download_enabled: boolean;
  display_order: number;
};

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
              className="h-12 w-auto object-contain md:h-14"
            />
          </a>

          <p className="hidden text-[9px] tracking-[0.3em] text-white/40 md:block">
            YOUR WEDDING CHAPTER
          </p>

        </div>
      </header>


      {/* HERO */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">

        <div className="absolute inset-0">

          {wedding.cover_image ? (
            <img
              src={wedding.cover_image}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <img
              src="/hero.jpg"
              alt=""
              className="h-full w-full object-cover"
            />
          )}

          <div className="absolute inset-0 bg-black/60" />

          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />

        </div>


        <div className="relative z-10 px-6 text-center">

          <p className="text-[10px] tracking-[0.5em] text-white/50">
            YOUR WEDDING CHAPTER
          </p>

          <h1 className="mt-8 text-5xl font-light tracking-wide md:text-7xl">
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

              <h2 className="mt-5 text-4xl font-light tracking-wide md:text-6xl">
                Highlight Film
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/40">
                {highlightFilm.description ||
                  "The moments that tell your story."}
              </p>

            </div>


            {/* VIMEO PLAYER */}

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
            ) : (

              <div className="mx-auto mt-16 flex aspect-video max-w-6xl items-center justify-center border border-white/10 bg-neutral-950">

                <p className="text-sm text-white/30">
                  Your highlight film will appear here soon.
                </p>

              </div>

            )}


            {/* HIGHLIGHT BUTTONS */}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6">

        

              {highlightFilm.download_enabled && (
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

            <h2 className="mt-5 text-4xl font-light tracking-wide md:text-6xl">
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

                    {video.download_enabled && (
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
          className="mx-auto h-16 w-auto object-contain opacity-80"
        />

        <p className="mt-8 text-[10px] tracking-[0.4em] text-white/30">
          WEDDING CINEMATOGRAPHY
        </p>

        <p className="mt-3 text-sm text-white/40">
          Eternal Chapter
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