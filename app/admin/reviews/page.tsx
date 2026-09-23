"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Review = {
  id: string;
  client_name: string;
  location: string | null;
  review_text: string;
  client_image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
};

export default function ReviewsAdminPage() {
  const router = useRouter();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  const [clientName, setClientName] = useState("");
  const [location, setLocation] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [clientImageUrl, setClientImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);

  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    const loadReviews = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/admin/login");
        return;
      }

      await fetchReviews();
      setLoading(false);
    };

    loadReviews();

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

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select(
        "id, client_name, location, review_text, client_image_url, is_active, display_order, created_at"
      )
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Reviews loading error:", error);
      setError(error.message);
      return;
    }

    setReviews((data ?? []) as Review[]);
  };

  const resetForm = () => {
    setEditingId(null);
    setClientName("");
    setLocation("");
    setReviewText("");
    setClientImageUrl("");
    setIsActive(true);
    setDisplayOrder(reviews.length);
    setImageFile(null);
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setImageFile(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Please choose an image smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setImageFile(file);
  };

  const uploadReviewImage = async () => {
    if (!imageFile) {
      return clientImageUrl || null;
    }

    setUploading(true);

    const fileExtension =
      imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileName = `${crypto.randomUUID()}.${fileExtension}`;

    const filePath = `reviews/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("review-images")
      .upload(filePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
      });

    setUploading(false);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("review-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!clientName.trim()) {
      setError("Please enter the client name.");
      return;
    }

    if (!reviewText.trim()) {
      setError("Please enter the review.");
      return;
    }

    try {
      setSaving(true);

      const imageUrl = await uploadReviewImage();

      const reviewData = {
        client_name: clientName.trim(),
        location: location.trim() || null,
        review_text: reviewText.trim(),
        client_image_url: imageUrl,
        is_active: isActive,
        display_order: Number(displayOrder) || 0,
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from("reviews")
          .update(reviewData)
          .eq("id", editingId);

        if (updateError) {
          throw updateError;
        }

        setSuccess("Review updated successfully.");
      } else {
        const { error: insertError } = await supabase
          .from("reviews")
          .insert(reviewData);

        if (insertError) {
          throw insertError;
        }

        setSuccess("Review added successfully.");
      }

      await fetchReviews();
      resetForm();
    } catch (err) {
      console.error("Review save error:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to save the review.");
      }
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleEdit = (review: Review) => {
    setEditingId(review.id);
    setClientName(review.client_name);
    setLocation(review.location || "");
    setReviewText(review.review_text);
    setClientImageUrl(review.client_image_url || "");
    setIsActive(review.is_active);
    setDisplayOrder(review.display_order);
    setImageFile(null);

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (reviewId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this review?"
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (deleteError) {
      console.error("Review delete error:", deleteError);
      setError(deleteError.message);
      return;
    }

    setSuccess("Review deleted successfully.");

    if (editingId === reviewId) {
      resetForm();
    }

    await fetchReviews();
  };

  const handleToggleActive = async (review: Review) => {
    setError("");
    setSuccess("");

    const { error: updateError } = await supabase
      .from("reviews")
      .update({
        is_active: !review.is_active,
      })
      .eq("id", review.id);

    if (updateError) {
      console.error("Review status error:", updateError);
      setError(updateError.message);
      return;
    }

    await fetchReviews();
  };

  const moveReview = async (
    reviewId: string,
    direction: "up" | "down"
  ) => {
    const currentIndex = reviews.findIndex(
      (review) => review.id === reviewId
    );

    if (currentIndex === -1) {
      return;
    }

    const targetIndex =
      direction === "up"
        ? currentIndex - 1
        : currentIndex + 1;

    if (
      targetIndex < 0 ||
      targetIndex >= reviews.length
    ) {
      return;
    }

    const currentReview = reviews[currentIndex];
    const targetReview = reviews[targetIndex];

    const { error: firstError } = await supabase
      .from("reviews")
      .update({
        display_order: targetReview.display_order,
      })
      .eq("id", currentReview.id);

    if (firstError) {
      setError(firstError.message);
      return;
    }

    const { error: secondError } = await supabase
      .from("reviews")
      .update({
        display_order: currentReview.display_order,
      })
      .eq("id", targetReview.id);

    if (secondError) {
      setError(secondError.message);
      return;
    }

    const reordered = [...reviews];

    reordered[currentIndex] = targetReview;
    reordered[targetIndex] = currentReview;

    setReviews(reordered);
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
            LOADING REVIEWS
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
                Reviews
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="text-[9px] tracking-[0.3em] text-white/40 transition hover:text-white"
            >
              DASHBOARD
            </button>

            <a
              href="/"
              className="hidden text-[9px] tracking-[0.3em] text-white/40 transition hover:text-white md:block"
            >
              VIEW WEBSITE →
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
        <div className="mx-auto max-w-7xl">
          {/* INTRO */}
          <div>
            <p className="text-[10px] tracking-[0.4em] text-white/30">
              ETERNAL CHAPTER
            </p>

            <h1 className="mt-4 text-4xl font-light tracking-wide md:text-6xl">
              Reviews
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/40">
              Manage the testimonials displayed on your
              homepage.
            </p>
          </div>

          {/* MESSAGES */}
          {error && (
            <div className="mt-10 border border-red-500/20 bg-red-500/5 p-5">
              <p className="text-sm text-red-300">
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="mt-10 border border-white/10 bg-white/[0.02] p-5">
              <p className="text-sm text-white/60">
                {success}
              </p>
            </div>
          )}

          {/* REVIEW FORM */}
          <div className="mt-16 border border-white/10 p-6 md:p-10">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-[9px] tracking-[0.35em] text-white/30">
                  {editingId ? "EDIT REVIEW" : "NEW REVIEW"}
                </p>

                <h2 className="mt-3 text-2xl font-light">
                  {editingId
                    ? "Update testimonial"
                    : "Add a client testimonial"}
                </h2>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-[9px] tracking-[0.25em] text-white/40 transition hover:text-white"
                >
                  CANCEL EDIT
                </button>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-10"
            >
              <div className="grid gap-8 md:grid-cols-2">
                {/* CLIENT NAME */}
                <div>
                  <label className="text-[9px] tracking-[0.25em] text-white/30">
                    CLIENT NAME
                  </label>

                  <input
                    type="text"
                    value={clientName}
                    onChange={(event) =>
                      setClientName(event.target.value)
                    }
                    placeholder="Ashan & Senuri"
                    className="mt-3 w-full border border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30"
                  />
                </div>

                {/* LOCATION */}
                <div>
                  <label className="text-[9px] tracking-[0.25em] text-white/30">
                    LOCATION
                  </label>

                  <input
                    type="text"
                    value={location}
                    onChange={(event) =>
                      setLocation(event.target.value)
                    }
                    placeholder="Colombo, Sri Lanka"
                    className="mt-3 w-full border border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30"
                  />
                </div>
              </div>

              {/* REVIEW */}
              <div className="mt-8">
                <label className="text-[9px] tracking-[0.25em] text-white/30">
                  REVIEW
                </label>

                <textarea
                  value={reviewText}
                  onChange={(event) =>
                    setReviewText(event.target.value)
                  }
                  placeholder="Write the client's testimonial here..."
                  rows={7}
                  className="mt-3 w-full resize-none border border-white/10 bg-white/[0.02] px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-white/20 focus:border-white/30"
                />
              </div>

              {/* IMAGE */}
              <div className="mt-8">
                <label className="text-[9px] tracking-[0.25em] text-white/30">
                  CLIENT PHOTO
                </label>

                <div className="mt-3 border border-dashed border-white/10 p-6">
                  {clientImageUrl && (
                    <div className="mb-6 flex items-center gap-5">
                      <img
                        src={clientImageUrl}
                        alt={clientName || "Client"}
                        className="h-20 w-20 rounded-full object-cover"
                      />

                      <div>
                        <p className="text-xs text-white/50">
                          Current client photo
                        </p>

                        <p className="mt-2 text-[9px] tracking-[0.15em] text-white/20">
                          SELECT A NEW IMAGE TO REPLACE IT
                        </p>
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-xs text-white/40 file:mr-5 file:border file:border-white/20 file:bg-transparent file:px-5 file:py-3 file:text-[9px] file:tracking-[0.2em] file:text-white/60 file:transition hover:file:border-white/40"
                  />

                  <p className="mt-3 text-[9px] text-white/20">
                    JPG, PNG or WEBP · MAX 5 MB
                  </p>

                  {imageFile && (
                    <p className="mt-3 text-xs text-white/50">
                      Selected: {imageFile.name}
                    </p>
                  )}
                </div>
              </div>

              {/* OPTIONS */}
              <div className="mt-8 grid gap-8 md:grid-cols-2">
                <div>
                  <label className="text-[9px] tracking-[0.25em] text-white/30">
                    DISPLAY ORDER
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={displayOrder}
                    onChange={(event) =>
                      setDisplayOrder(
                        Number(event.target.value)
                      )
                    }
                    className="mt-3 w-full border border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-white outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="text-[9px] tracking-[0.25em] text-white/30">
                    STATUS
                  </label>

                  <label className="mt-3 flex cursor-pointer items-center gap-4 border border-white/10 bg-white/[0.02] px-4 py-4">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(event) =>
                        setIsActive(event.target.checked)
                      }
                      className="h-4 w-4"
                    />

                    <span className="text-xs text-white/60">
                      Show this review on the website
                    </span>
                  </label>
                </div>
              </div>

              {/* SUBMIT */}
              <div className="mt-10 flex flex-wrap gap-4">
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="border border-white bg-white px-7 py-4 text-[10px] tracking-[0.3em] text-black transition hover:bg-transparent hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {uploading
                    ? "UPLOADING PHOTO..."
                    : saving
                      ? "SAVING..."
                      : editingId
                        ? "UPDATE REVIEW"
                        : "ADD REVIEW"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="border border-white/20 px-7 py-4 text-[10px] tracking-[0.3em] text-white/50 transition hover:border-white hover:text-white"
                  >
                    CANCEL
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* REVIEW LIST */}
          <div className="mt-16">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] tracking-[0.35em] text-white/30">
                  TESTIMONIALS
                </p>

                <h2 className="mt-3 text-3xl font-light">
                  Existing Reviews
                </h2>
              </div>

              <p className="text-[10px] tracking-[0.2em] text-white/20">
                {reviews.length.toString().padStart(2, "0")} REVIEWS
              </p>
            </div>

            {reviews.length === 0 ? (
              <div className="mt-10 border border-white/10 px-6 py-20 text-center">
                <p className="text-[10px] tracking-[0.35em] text-white/30">
                  NO REVIEWS YET
                </p>

                <p className="mt-4 text-sm text-white/30">
                  Add your first client testimonial above.
                </p>
              </div>
            ) : (
              <div className="mt-10 space-y-4">
                {reviews.map((review, index) => (
                  <div
                    key={review.id}
                    className="border border-white/10 p-6 md:p-8"
                  >
                    <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
                      {/* REVIEW INFO */}
                      <div className="flex gap-5">
                        {review.client_image_url ? (
                          <img
                            src={review.client_image_url}
                            alt={review.client_name}
                            className="h-16 w-16 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/10 text-[9px] text-white/20">
                            NO PHOTO
                          </div>
                        )}

                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-light">
                              {review.client_name}
                            </h3>

                            {review.is_active ? (
                              <span className="text-[8px] tracking-[0.2em] text-white/50">
                                ACTIVE
                              </span>
                            ) : (
                              <span className="text-[8px] tracking-[0.2em] text-white/20">
                                HIDDEN
                              </span>
                            )}
                          </div>

                          {review.location && (
                            <p className="mt-2 text-[10px] tracking-[0.15em] text-white/25">
                              {review.location}
                            </p>
                          )}

                          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/45">
                            “{review.review_text}”
                          </p>
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex shrink-0 flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            moveReview(review.id, "up")
                          }
                          disabled={index === 0}
                          className="border border-white/10 px-3 py-2 text-[10px] text-white/40 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            moveReview(review.id, "down")
                          }
                          disabled={
                            index === reviews.length - 1
                          }
                          className="border border-white/10 px-3 py-2 text-[10px] text-white/40 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                        >
                          ↓
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleToggleActive(review)
                          }
                          className="text-[9px] tracking-[0.2em] text-white/40 transition hover:text-white"
                        >
                          {review.is_active
                            ? "HIDE"
                            : "SHOW"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(review)
                          }
                          className="text-[9px] tracking-[0.2em] text-white/50 transition hover:text-white"
                        >
                          EDIT →
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(review.id)
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
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-8 text-center">
        <p className="text-[9px] tracking-[0.25em] text-white/20">
          ETERNAL CHAPTER · REVIEWS
        </p>
      </footer>
    </main>
  );
}