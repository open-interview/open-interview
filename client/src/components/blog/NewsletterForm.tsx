import { useState, useRef } from "react";
import { Mail, CheckCircle, AlertCircle, Loader2, Send } from "lucide-react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      setStatus("error");
      inputRef.current?.focus();
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    await new Promise((r) => setTimeout(r, 800));
    setStatus("success");
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) return "Email is required.";
    if (!value.includes("@")) return "Please enter a valid email address.";
    return "";
  };

  const handleBlur = () => {
    setTouched(true);
    const error = validateEmail(email);
    if (error) {
      setErrorMsg(error);
      setStatus("error");
    } else {
      setErrorMsg("");
      setStatus("idle");
    }
  };

  if (status === "success") {
    return (
      <div className="flex items-center gap-3 text-[var(--color-success)] p-4 rounded-xl bg-[var(--color-success)]/10 border border-[var(--color-success)]/20">
        <CheckCircle size={20} strokeWidth={1.5} aria-hidden />
        <span className="font-medium">You're subscribed!</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Mail size={16} strokeWidth={1.5} className="text-[var(--color-ink-muted)]" aria-hidden />
          </div>
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
           <input
             ref={inputRef}
             id="newsletter-email"
             type="email"
             value={email}
             onChange={(e) => { setEmail(e.target.value); setStatus("idle"); setErrorMsg(""); }}
             onBlur={handleBlur}
             placeholder="you@example.com"
             required
             aria-invalid={status === "error"}
             aria-describedby={status === "error" ? "newsletter-error" : "newsletter-help"}
             className="w-full h-[46px] rounded-full bg-[#F1F3F4] dark:bg-[#303134] pl-12 pr-4 text-base text-[var(--color-ink)] placeholder:text-[#9AA0A6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/30 transition-all"
           />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-12 px-6 rounded-xl bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-60 transition-all flex items-center gap-2 shadow-sm hover:shadow"
        >
          {status === "loading" ? (
            <Loader2 size={16} strokeWidth={1.5} className="animate-spin" aria-hidden />
          ) : (
            <Send size={16} strokeWidth={1.5} />
          )}
          Subscribe
        </button>
      </div>
      <p id="newsletter-help" className="mt-2 text-xs text-[var(--color-ink-muted)]">
        Enter your email to subscribe to our newsletter.
      </p>
      {status === "error" && errorMsg && (
        <p id="newsletter-error" role="alert" aria-live="polite" className="mt-2 flex items-center gap-1.5 text-sm text-[var(--color-error)]">
          <AlertCircle size={14} strokeWidth={1.5} aria-hidden />
          {errorMsg}
        </p>
      )}
    </form>
  );
}
