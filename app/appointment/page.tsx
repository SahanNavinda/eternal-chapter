"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AppointmentPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [story, setStory] = useState("");
  const [consultationDate, setConsultationDate] = useState("");
  const [consultationTime, setConsultationTime] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (sending) return;

    setError("");

    if (
      !fullName.trim() ||
      !partnerName.trim() ||
      !weddingDate ||
      !email.trim() ||
      !phone.trim() ||
      !story.trim() ||
      !consultationDate ||
      !consultationTime
    ) {
      setError("Please complete all fields before submitting.");
      return;
    }

    setSending(true);

    try {
      const accessKey =
        process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;

      if (!accessKey) {
        throw new Error(
          "Web3Forms access key is not configured."
        );
      }

      const formData = {
        access_key: accessKey,
        subject: "New Eternal Chapter Appointment Request",
        from_name: "Eternal Chapter Website",

        full_name: fullName.trim(),
        partner_name: partnerName.trim(),
        wedding_date: weddingDate,
        email: email.trim(),
        phone_whatsapp: phone.trim(),
        story: story.trim(),
        preferred_consultation_date: consultationDate,
        preferred_consultation_time: consultationTime,
      };

      const response = await fetch(
        "https://api.web3forms.com/submit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error("Web3Forms error:", result);

        throw new Error(
          result.message ||
            "Unable to send your appointment request."
        );
      }

      setSubmitted(true);
    } catch (submitError) {
      console.error(
        "Appointment submission error:",
        submitError
      );

      setError(
        "We couldn't send your request right now. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="w-full max-w-2xl text-center">
          <img
            src="/logo.png"
            alt="Eternal Chapter"
            className="mx-auto h-14 w-auto object-contain opacity-90"
          />

          <p className="mt-16 text-[10px] tracking-[0.5em] text-white/40">
            THANK YOU
          </p>

          <h1
            className="mt-6 text-4xl font-light tracking-wide md:text-6xl"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}
          >
            Your chapter begins here.
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-sm leading-8 text-white/40">
            Thank you for reaching out to Eternal Chapter.
            We have received your appointment request and
            will be in touch with you soon.
          </p>

         <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:justify-center">
  <a
    href="https://wa.me/94711260525?text=Hi%20Eternal%20Chapter%2C%20I%20just%20submitted%20an%20appointment%20request%20through%20your%20website.%20I%27d%20love%20to%20discuss%20my%20wedding%20film."
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center justify-center gap-4 border border-white bg-white px-8 py-4 text-[10px] tracking-[0.3em] text-black transition-all duration-500 hover:bg-transparent hover:text-white"
  >
    CONTACT US ON WHATSAPP

    <span className="text-sm">
      →
    </span>
  </a>

  <button
    type="button"
    onClick={() => router.push("/")}
    className="inline-flex items-center justify-center gap-4 border border-white/30 px-8 py-4 text-[10px] tracking-[0.3em] text-white/60 transition-all duration-500 hover:border-white hover:text-white"
  >
    BACK TO HOME

    <span className="text-sm">
      →
    </span>
  </button>
</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* HEADER */}
      <header className="border-b border-white/10 px-6 py-6 md:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="transition-opacity duration-300 hover:opacity-70"
          >
            <img
              src="/logo.png"
              alt="Eternal Chapter"
              className="h-12 w-auto object-contain md:h-14"
            />
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-[9px] tracking-[0.3em] text-white/40 transition hover:text-white"
          >
            ← BACK
          </button>
        </div>
      </header>

      {/* INTRO */}
      <section className="px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[10px] tracking-[0.5em] text-white/40">
            LET'S TALK ABOUT YOUR CHAPTER
          </p>

          <h1
            className="mt-8 text-4xl font-light leading-tight tracking-wide md:text-6xl"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}
          >
            Let's create
            <br />
            something unforgettable.
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-sm leading-8 text-white/40 md:text-base">
            Tell us a little about your wedding and the
            story you want us to capture. We would love to
            hear from you.
          </p>
        </div>
      </section>

      {/* FORM */}
      <section className="px-6 pb-24 md:px-12 md:pb-32">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={handleSubmit}
            className="border border-white/10 bg-white/[0.02] p-6 md:p-10"
          >
            <div className="space-y-8">
              {/* FULL NAME */}
              <div>
                <label className="mb-2 block text-[10px] tracking-[0.25em] text-white/50">
                  FULL NAME
                </label>

                <input
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  placeholder="Your full name"
                  disabled={sending}
                  className="w-full border border-white/10 bg-black/40 px-4 py-4 text-sm text-white outline-none transition focus:border-white/40 placeholder:text-white/20 disabled:opacity-50"
                />
              </div>

              {/* PARTNER NAME */}
              <div>
                <label className="mb-2 block text-[10px] tracking-[0.25em] text-white/50">
                  PARTNER'S NAME
                </label>

                <input
                  type="text"
                  value={partnerName}
                  onChange={(event) =>
                    setPartnerName(event.target.value)
                  }
                  placeholder="Your partner's name"
                  disabled={sending}
                  className="w-full border border-white/10 bg-black/40 px-4 py-4 text-sm text-white outline-none transition focus:border-white/40 placeholder:text-white/20 disabled:opacity-50"
                />
              </div>

              {/* WEDDING DATE */}
              <div>
                <label className="mb-2 block text-[10px] tracking-[0.25em] text-white/50">
                  WEDDING DATE
                </label>

                <input
                  type="date"
                  value={weddingDate}
                  onChange={(event) =>
                    setWeddingDate(event.target.value)
                  }
                  disabled={sending}
                  className="w-full border border-white/10 bg-black/40 px-4 py-4 text-sm text-white outline-none transition focus:border-white/40 disabled:opacity-50"
                />
              </div>

              {/* EMAIL */}
              <div>
                <label className="mb-2 block text-[10px] tracking-[0.25em] text-white/50">
                  EMAIL
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="your@email.com"
                  disabled={sending}
                  className="w-full border border-white/10 bg-black/40 px-4 py-4 text-sm text-white outline-none transition focus:border-white/40 placeholder:text-white/20 disabled:opacity-50"
                />
              </div>

              {/* PHONE / WHATSAPP */}
              <div>
                <label className="mb-2 block text-[10px] tracking-[0.25em] text-white/50">
                  PHONE / WHATSAPP
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="+94 77 123 4567"
                  disabled={sending}
                  className="w-full border border-white/10 bg-black/40 px-4 py-4 text-sm text-white outline-none transition focus:border-white/40 placeholder:text-white/20 disabled:opacity-50"
                />
              </div>

              {/* STORY */}
              <div>
                <label className="mb-2 block text-[10px] tracking-[0.25em] text-white/50">
                  TELL US ABOUT YOUR STORY
                </label>

                <textarea
                  value={story}
                  onChange={(event) =>
                    setStory(event.target.value)
                  }
                  rows={6}
                  placeholder="Tell us about your wedding, your vision, or anything you would like us to know..."
                  disabled={sending}
                  className="w-full resize-none border border-white/10 bg-black/40 px-4 py-4 text-sm leading-7 text-white outline-none transition focus:border-white/40 placeholder:text-white/20 disabled:opacity-50"
                />
              </div>

              {/* CONSULTATION DATE */}
              <div>
                <label className="mb-2 block text-[10px] tracking-[0.25em] text-white/50">
                  PREFERRED CONSULTATION DATE
                </label>

                <input
                  type="date"
                  value={consultationDate}
                  onChange={(event) =>
                    setConsultationDate(event.target.value)
                  }
                  disabled={sending}
                  className="w-full border border-white/10 bg-black/40 px-4 py-4 text-sm text-white outline-none transition focus:border-white/40 disabled:opacity-50"
                />
              </div>

              {/* CONSULTATION TIME */}
              <div>
                <label className="mb-2 block text-[10px] tracking-[0.25em] text-white/50">
                  PREFERRED CONSULTATION TIME
                </label>

                <input
                  type="time"
                  value={consultationTime}
                  onChange={(event) =>
                    setConsultationTime(event.target.value)
                  }
                  disabled={sending}
                  className="w-full border border-white/10 bg-black/40 px-4 py-4 text-sm text-white outline-none transition focus:border-white/40 disabled:opacity-50"
                />
              </div>

              {/* ERROR */}
              {error && (
                <div className="border border-red-500/20 bg-red-500/5 px-5 py-4">
                  <p className="text-sm text-red-300">
                    {error}
                  </p>
                </div>
              )}

              {/* SUBMIT */}
              <div className="border-t border-white/10 pt-8">
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex w-full items-center justify-center gap-4 border border-white bg-white px-8 py-5 text-[10px] tracking-[0.3em] text-black transition-all duration-500 hover:bg-transparent hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending
                    ? "SENDING REQUEST..."
                    : "SEND APPOINTMENT REQUEST"}

                  <span className="text-sm">
                    →
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 md:flex-row">
          <img
            src="/logo.png"
            alt="Eternal Chapter"
            className="h-12 w-auto object-contain opacity-70"
          />

          <p className="text-[9px] tracking-[0.25em] text-white/30">
            © {new Date().getFullYear()} ETERNAL CHAPTER
          </p>

          <p className="text-[9px] tracking-[0.25em] text-white/30">
            WEDDING CINEMATOGRAPHY
          </p>
        </div>
      </footer>
    </main>
  );
}