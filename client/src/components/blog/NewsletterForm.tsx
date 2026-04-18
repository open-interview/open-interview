import { useState } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    // Simulate subscription (replace with real API call)
    await new Promise((r) => setTimeout(r, 800));
    setStatus("success");
  };

  if (status === "success") {
    return (
      <div className="flex items-center gap-2 text-[var(--color-success)] text-sm">
        <CheckCircle size={16} strokeWidth={1.5} aria-hidden />
        <span>You're subscribed! Check your inbox.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex gap-2">
        <div className="flex-1">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setStatus("idle"); setErrorMsg(""); }}
            placeholder="you@example.com"
            required
            aria-describedby={status === "error" ? "newsletter-error" : undefined}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition"
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-60 transition-colors"
        >
          {status === "loading" ? (
            <Loader2 size={14} strokeWidth={1.5} className="animate-spin" aria-hidden />
          ) : null}
          Subscribe
        </button>
      </div>
      {status === "error" && errorMsg && (
        <p id="newsletter-error" role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-[var(--color-error)]">
          <AlertCircle size={12} strokeWidth={1.5} aria-hidden />
          {errorMsg}
        </p>
      )}
    </form>
  );
}
