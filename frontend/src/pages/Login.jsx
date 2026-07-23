import { useState } from "react";
import { Database, Mail, ShieldCheck, RefreshCw, ArrowRight, Sun, Moon, User } from "lucide-react";
import { sendOtp, verifyOtp } from "../services/api";
import { useTheme } from "../contexts/ThemeContext";

const TOKEN_KEY = "raft_auth_token";

export default function Login({ onLogin }) {
  const { theme, toggleTheme } = useTheme();
  const [step, setStep]         = useState("email"); // "email" | "otp"
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [otp, setOtp]           = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [hint, setHint]         = useState("");

  async function handleSendOtp(e) {
    e.preventDefault();
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    setError(""); setHint(""); setLoading(true);
    try {
      const res = await sendOtp(email);
      setHint(res.message || "OTP sent! Check your inbox or server console.");
      setStep("otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await verifyOtp(email, otp);
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem("raft_email", res.email);
      localStorage.setItem("raft_username", username.trim());
      onLogin(res.email);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-theme-base flex items-center justify-center px-4 transition-colors duration-200 relative overflow-hidden">

      {/* Ambient glow blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-600/8 blur-[100px]" />
      </div>

      {/* Theme toggle — top right */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-theme-surface border border-theme text-[10px] font-bold uppercase tracking-widest text-theme-secondary hover:text-theme-primary transition-all"
        title="Toggle theme"
      >
        {theme === "dark" ? <><Sun size={11}/> Light</> : <><Moon size={11}/> Dark</>}
      </button>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Header brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
            <Database size={26} className="text-indigo-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-theme-primary tracking-tight">Raft KV Store</h1>
          <p className="mt-1 text-xs text-theme-muted font-medium">Distributed Consensus Dashboard</p>
        </div>

        {/* Form card */}
        <div className="bg-theme-surface border border-theme rounded-2xl p-8 shadow-[0_24px_60px_rgba(0,0,0,0.15)] transition-colors duration-200">

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-6">
            <StepDot n={1} active={step === "email"} done={step === "otp"} label="Credentials" />
            <div className="flex-1 h-px bg-theme border-theme" />
            <StepDot n={2} active={step === "otp"}   done={false}         label="OTP"   />
          </div>

          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-theme-muted mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
                    <input
                      id="login-username"
                      type="text"
                      required
                      autoFocus
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-theme bg-theme-base text-theme-primary text-sm placeholder:text-theme-muted focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-theme-muted mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-theme bg-theme-base text-theme-primary text-sm placeholder:text-theme-muted focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                    />
                  </div>
                </div>
              </div>

              {error && <ErrorBanner msg={error} />}

              <button
                id="send-otp-btn"
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold tracking-wide transition-all duration-200 shadow-[0_0_20px_rgba(99,102,241,0.25)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <><ArrowRight size={14}/> Send OTP</>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
              {hint && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-500/8 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                  <ShieldCheck size={14} className="mt-0.5 shrink-0" />
                  <span>{hint}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-theme-muted mb-2">
                  6-Digit OTP Code
                </label>
                <input
                  id="login-otp"
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.5em] py-3 rounded-xl border border-theme bg-theme-base text-theme-primary text-xl font-mono placeholder:text-theme-muted focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                />
                <p className="mt-2 text-[10px] text-theme-muted text-center">
                  Sent to <span className="font-bold text-theme-secondary">{email}</span>
                  &nbsp;·&nbsp;
                  <button type="button" onClick={() => { setStep("email"); setError(""); setOtp(""); }}
                    className="text-indigo-500 hover:underline font-semibold cursor-pointer">
                    Change
                  </button>
                </p>
              </div>

              {error && <ErrorBanner msg={error} />}

              <button
                id="verify-otp-btn"
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold tracking-wide transition-all duration-200 shadow-[0_0_20px_rgba(99,102,241,0.25)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <><ShieldCheck size={14}/> Verify & Login</>}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-5 text-[10px] text-theme-muted">
          Secured with HMAC-SHA256 token · OTP valid for 5 minutes
        </p>
      </div>
    </div>
  );
}

function StepDot({ n, active, done, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold border transition-all duration-300 ${
        done  ? "bg-indigo-600 border-indigo-500 text-white" :
        active? "bg-indigo-500/15 border-indigo-500/50 text-indigo-500" :
                "bg-theme-base border-theme text-theme-muted"
      }`}>
        {done ? "✓" : n}
      </div>
      <span className={`text-[9px] font-bold uppercase tracking-wider ${active ? "text-indigo-500" : "text-theme-muted"}`}>{label}</span>
    </div>
  );
}

function ErrorBanner({ msg }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/8 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
      {msg}
    </div>
  );
}
