"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Review = {
  id: string;
  client_name: string;
  location: string | null;
  review_text: string;
  client_image_url: string | null;
  display_order: number;
};

export default function TestimonialsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(
          "id, client_name, location, review_text, client_image_url, display_order"
        )
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Could not load reviews:", error);
        setLoading(false);
        return;
      }

      setReviews((data || []) as Review[]);
      setLoading(false);
    };

    loadReviews();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* HEADER */}
      <nav className="border-b border-white/10 px-6 py-6 md:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <a href="/">
            <img
              src="/logo.png"
              alt="Eternal Chapter"
              className="h-12 w-auto object-contain"
            />
          </a>

          <a
            href="/"
            className="text-[9px] tracking-[0.3em] text-white/40 transition hover:text-white"
          >
            ← BACK TO HOME
          </a>
        </div>
      </nav>

      {/* INTRO */}
      <section className="px-6 py-24 text-center md:px-16 md:py-32">
        <p className="text-[10px] tracking-[0.4em] text-white/40">
          TESTIMONIALS AND REVIEWS
        </p>

        <h1
          className="mt-6 text-5xl font-light tracking-wide md:text-7xl"
          style={{
            fontFamily:
              "Georgia, 'Times New Roman', serif",
          }}
        >
          Hear it from the People
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-sm leading-8 text-white/40 md:text-base">
          The stories behind the stories. Hear from couples
          who trusted Eternal Chapter to preserve their
          memories.
        </p>
      </section>

      {/* REVIEWS */}
      <section className="border-t border-white/10 px-6 py-20 md:px-16 md:py-28">
        <div className="mx-auto max-w-5xl">
          {loading ? (
            <div className="py-20 text-center">
              <p className="text-[10px] tracking-[0.35em] text-white/30">
                LOADING REVIEWS
              </p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="border border-white/10 px-6 py-20 text-center">
              <p className="text-[10px] tracking-[0.35em] text-white/30">
                NO REVIEWS YET
              </p>
            </div>
          ) : (
            <div className="space-y-20">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="border-b border-white/10 pb-20 text-center last:border-b-0"
                >
                  {review.client_image_url ? (
                    <img
                      src={review.client_image_url}
                      alt={review.client_name}
                      className="mx-auto h-28 w-28 rounded-full object-cover md:h-32 md:w-32"
                    />
                  ) : (
                    <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-white/10 text-[9px] tracking-[0.2em] text-white/20 md:h-32 md:w-32">
                      CLIENT
                    </div>
                  )}

                  <h2 className="mt-8 text-2xl font-light tracking-wide md:text-3xl">
                    {review.client_name}
                  </h2>

                  {review.location && (
                    <p className="mt-3 text-[9px] tracking-[0.3em] text-white/30">
                      {review.location.toUpperCase()}
                    </p>
                  )}

                  <p className="mx-auto mt-10 max-w-3xl text-sm leading-8 text-white/50 md:text-base md:leading-9">
                    “{review.review_text}”
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="border-t border-white/10 px-6 py-24 text-center md:py-32">
        <p className="text-[10px] tracking-[0.4em] text-white/30">
          YOUR STORY AWAITS
        </p>

        <h2
          className="mt-6 text-4xl font-light md:text-6xl"
          style={{
            fontFamily:
              "Georgia, 'Times New Roman', serif",
          }}
        >
          Let's create
          <br />
          your chapter.
        </h2>

        <a
          href="/appointment"
          className="mt-10 inline-flex border border-white/30 px-8 py-4 text-[10px] tracking-[0.3em] transition hover:bg-white hover:text-black"
        >
          BOOK AN APPOINTMENT →
        </a>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <img
            src="/logo.png"
            alt="Eternal Chapter"
            className="h-12 w-auto object-contain opacity-80"
          />

          <p className="text-[9px] tracking-[0.25em] text-white/30">
            SINCE 2018 · ETERNAL CHAPTER WEDDING FILMS
          </p>

          <p className="text-[9px] tracking-[0.25em] text-white/30">
            YOUR STORY, BEAUTIFULLY TOLD
          </p>
        </div>
      </footer>
    </main>
  );
}