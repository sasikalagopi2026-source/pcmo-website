import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import PcmoLogo from "@/components/PcmoLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginMode = "login" | "register" | "reset";

const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<LoginMode>(() =>
    new URLSearchParams(location.search).get("mode") === "register" ? "register" : "login",
  );
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailExists, setEmailExists] = useState(false);
  const [loginRejected, setLoginRejected] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetFormState = (nextMode: LoginMode) => {
    setMode(nextMode);
    setError("");
    setEmailExists(false);
    setLoginRejected(false);
    setMessage("");
    setPassword("");
    setConfirmPassword("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setEmailExists(false);
    setLoginRejected(false);
    setMessage("");

    if (mode === "reset" && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "reset") {
        await api("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ email, password }) });
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        setMessage("Password reset. You can sign in with your new password.");
        return;
      }

      const user = mode === "login"
        ? await login(email, password)
        : await register(displayName, email, password);
      const requested = (location.state as { from?: string } | null)?.from;
      const isAdmin = user.role === "admin" || user.role === "super_admin";
      const safeRequested = requested && (isAdmin ? requested.startsWith("/admin") : !requested.startsWith("/admin")) ? requested : null;
      navigate(safeRequested ?? (isAdmin ? "/admin" : "/dashboard"), { replace: true });
    } catch (err) {
      const nextError = err instanceof Error ? err.message : "Unable to continue";
      setError(nextError);
      setEmailExists(mode === "register" && /already registered|already exists/i.test(nextError));
      setLoginRejected(mode === "login" && /invalid email or password/i.test(nextError));
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === "login"
    ? "Sign in to your live dashboard"
    : mode === "register"
      ? "Create your student account"
      : "Reset your student password";
  const submitLabel = mode === "login" ? "Sign in" : mode === "register" ? "Register" : "Reset password";
  const PasswordIcon = showPassword ? EyeOff : Eye;

  return (
    <main className="grid min-h-screen place-items-center bg-secondary/30 p-6">
      <form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-xl border border-border bg-card p-7 shadow-sm">
        <div className="text-center">
          <PcmoLogo className="mx-auto h-20 w-72 max-w-full" />
          <h1 className="mt-3 font-heading text-2xl font-bold">Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">{title}</p>
        </div>

        {mode === "register" && (
          <label className="block space-y-2">
            <Label>Full name</Label>
            <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
          </label>
        )}

        <label className="block space-y-2">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>

        <label className="block space-y-2">
          <Label>{mode === "reset" ? "New password" : "Password"}</Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pr-11"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <PasswordIcon className="h-4 w-4" />
            </button>
          </div>
        </label>

        {mode === "reset" && (
          <label className="block space-y-2">
            <Label>Confirm new password</Label>
            <Input
              type={showPassword ? "text" : "password"}
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </label>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <p>{error}</p>
            {emailExists && (
              <button
                type="button"
                className="mt-2 font-medium text-primary hover:underline"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setEmailExists(false);
                  setPassword("");
                }}
              >
                Sign in with this email
              </button>
            )}
            {loginRejected && (
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="font-semibold text-primary hover:underline"
                  onClick={() => resetFormState("reset")}
                >
                  Reset password
                </button>
                <button
                  type="button"
                  className="font-semibold text-primary hover:underline"
                  onClick={() => resetFormState("register")}
                >
                  Create account
                </button>
              </div>
            )}
          </div>
        )}
        {message && <p className="rounded-md bg-success/10 p-3 text-sm text-success">{message}</p>}

        <Button className="w-full" disabled={submitting}>{submitting ? "Please wait..." : submitLabel}</Button>

        <div className="space-y-3 text-center">
          {mode === "login" && (
            <button type="button" onClick={() => resetFormState("reset")} className="w-full text-sm text-primary hover:underline">
              Forgot password?
            </button>
          )}
          <button type="button" onClick={() => resetFormState(mode === "register" ? "login" : "register")} className="w-full text-sm text-primary hover:underline">
            {mode === "register" ? "Already have an account? Sign in" : "Create a student account"}
          </button>
          {mode === "reset" && (
            <button type="button" onClick={() => resetFormState("login")} className="w-full text-sm text-muted-foreground hover:text-primary hover:underline">
              Back to sign in
            </button>
          )}
        </div>
      </form>
    </main>
  );
};

export default Login;
