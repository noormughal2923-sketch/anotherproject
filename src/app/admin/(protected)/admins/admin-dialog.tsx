"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Shield,
  Crown,
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  UserPlus,
  User,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Info,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createAdminAction } from "./actions";

export function AdminDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "SUPER_ADMIN">("ADMIN");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Password Generator
  function generateSecurePassword() {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghijkmnopqrstuvwxyz";
    const numbers = "23456789";
    const symbols = "!@#$%^&*()_+~=";
    const all = uppercase + lowercase + numbers + symbols;

    let generated = "";
    generated += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    generated += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    generated += numbers.charAt(Math.floor(Math.random() * numbers.length));
    generated += symbols.charAt(Math.floor(Math.random() * symbols.length));

    for (let i = 4; i < 16; i++) {
      generated += all.charAt(Math.floor(Math.random() * all.length));
    }

    // Shuffle
    generated = generated
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");

    setPassword(generated);
    setShowPassword(true);
    toast.success("Generated strong 16-character temporary password");
  }

  // Copy Password
  function handleCopyPassword() {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success("Password copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  // Password Strength Evaluation
  const passwordCriteria = useMemo(() => {
    return {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const passwordScore = useMemo(() => {
    let score = 0;
    if (passwordCriteria.length) score++;
    if (passwordCriteria.upper && passwordCriteria.lower) score++;
    if (passwordCriteria.number) score++;
    if (passwordCriteria.symbol) score++;
    return score;
  }, [passwordCriteria]);

  // Derived Avatar Initials
  const avatarInitials = useMemo(() => {
    if (!name.trim()) return "AD";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [name]);

  // Reset form when dialog opens/closes
  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      setName("");
      setEmail("");
      setPassword("");
      setRole("ADMIN");
      setShowPassword(false);
      setError(null);
    }
  }

  // Submit Handler
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("email", email.trim().toLowerCase());
    formData.set("password", password);
    formData.set("role", role);

    const res = await createAdminAction(formData);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      toast.success("Administrator account provisioned successfully");
      setLoading(false);
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="cgs" size="sm" className="font-semibold gap-1.5 shadow-sm">
          <UserPlus className="h-4 w-4" /> Provision Administrator
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto font-sans p-6 sm:p-7">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="cgs" className="gap-1 text-[11px] py-0.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Identity & Access Management
            </Badge>
            <Badge variant="outline" className="text-[10px] uppercase font-mono text-muted-foreground">
              Security Protocol
            </Badge>
          </div>
          <DialogTitle className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Provision Administrator Account
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Create an authenticated administrative account with role-based access control and encrypted credentials.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Identity Preview Card */}
          <div className="flex items-center gap-3.5 rounded-xl border border-border/80 bg-secondary/30 p-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary-muted font-heading text-base font-bold text-primary ring-1 ring-primary/30">
              {avatarInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-sm font-bold text-foreground">
                {name.trim() || "New Administrator"}
              </p>
              <p className="truncate text-xs text-muted-foreground font-mono">
                {email.trim() || "admin-email@organization.org"}
              </p>
            </div>
            <Badge
              variant={role === "SUPER_ADMIN" ? "cgs" : "outline"}
              className="text-[10px] font-bold uppercase shrink-0"
            >
              {role === "SUPER_ADMIN" ? "Super Admin" : "Standard Admin"}
            </Badge>
          </div>

          {/* Name & Email Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="admin-name" className="text-xs font-semibold flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" /> Full Name
              </Label>
              <Input
                id="admin-name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                className="h-10 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-xs font-semibold flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-primary" /> Official Email Address
              </Label>
              <Input
                id="admin-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.johnson@organization.org"
                className="h-10 text-xs"
                required
              />
            </div>
          </div>

          {/* Role Selection Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" /> Role & Privilege Level
              </Label>
              <span className="text-[11px] text-muted-foreground">Select granted scope</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Standard Admin Card */}
              <button
                type="button"
                onClick={() => setRole("ADMIN")}
                className={`relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                  role === "ADMIN"
                    ? "border-primary bg-primary-muted/25 shadow-sm ring-1 ring-primary"
                    : "border-border/80 bg-card/60 hover:bg-secondary/40 hover:border-border"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Shield className="h-4 w-4" />
                      </div>
                      <span className="font-heading text-xs font-bold text-foreground">Standard Admin</span>
                    </div>
                    {role === "ADMIN" && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Day-to-day operations: manage sessions, verify attendance, assign keynote speakers, and initiate Google Sheet sync.
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-1 pt-2 border-t border-border/50">
                  <span className="rounded bg-secondary/70 px-1.5 py-0.5 text-[9px] font-medium text-foreground">Sessions</span>
                  <span className="rounded bg-secondary/70 px-1.5 py-0.5 text-[9px] font-medium text-foreground">Attendance</span>
                  <span className="rounded bg-secondary/70 px-1.5 py-0.5 text-[9px] font-medium text-foreground">Speakers</span>
                  <span className="rounded bg-secondary/70 px-1.5 py-0.5 text-[9px] font-medium text-foreground">Google Sync</span>
                </div>
              </button>

              {/* Super Admin Card */}
              <button
                type="button"
                onClick={() => setRole("SUPER_ADMIN")}
                className={`relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                  role === "SUPER_ADMIN"
                    ? "border-red-500/80 bg-red-500/10 shadow-sm ring-1 ring-red-500/80"
                    : "border-border/80 bg-card/60 hover:bg-secondary/40 hover:border-border"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                        <Crown className="h-4 w-4" />
                      </div>
                      <span className="font-heading text-xs font-bold text-foreground">Super Admin</span>
                    </div>
                    {role === "SUPER_ADMIN" && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Full unrestricted administrative access: manage administrator credentials, view security audit logs, and configure system settings.
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-1 pt-2 border-t border-border/50">
                  <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-medium text-red-400">Full Access</span>
                  <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-medium text-red-400">Admin CRUD</span>
                  <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-medium text-red-400">Audit Logs</span>
                  <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-medium text-red-400">Settings</span>
                </div>
              </button>
            </div>
          </div>

          {/* Password Section with Generator & Strength Meter */}
          <div className="space-y-3 rounded-xl border border-border/80 bg-card/50 p-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="admin-password" className="text-xs font-semibold flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-primary" /> Temporary Login Password
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateSecurePassword}
                className="h-7 text-[11px] gap-1 text-primary border-primary/30 hover:bg-primary-muted/20"
              >
                <Sparkles className="h-3 w-3" /> Generate Password
              </Button>
            </div>

            <div className="relative">
              <Input
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter or generate temporary password"
                className="h-10 pr-20 text-xs font-mono tracking-wider"
                required
                minLength={8}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {password && (
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    title="Copy password"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Password Strength Visual Meter */}
            {password.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden flex gap-1">
                    {[1, 2, 3, 4].map((step) => {
                      const active = passwordScore >= step;
                      let colorClass = "bg-secondary";
                      if (active) {
                        if (passwordScore <= 1) colorClass = "bg-red-500";
                        else if (passwordScore === 2) colorClass = "bg-amber-500";
                        else if (passwordScore === 3) colorClass = "bg-blue-500";
                        else colorClass = "bg-emerald-500";
                      }
                      return (
                        <div
                          key={step}
                          className={`flex-1 h-full rounded-full transition-all duration-300 ${colorClass}`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground min-w-[50px] text-right">
                    {passwordScore <= 1 && <span className="text-red-500">Weak</span>}
                    {passwordScore === 2 && <span className="text-amber-500">Fair</span>}
                    {passwordScore === 3 && <span className="text-blue-500">Good</span>}
                    {passwordScore === 4 && <span className="text-emerald-500 font-bold">Strong</span>}
                  </span>
                </div>

                {/* Criteria Checklist */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px] text-muted-foreground pt-1">
                  <span className={`flex items-center gap-1 ${passwordCriteria.length ? "text-emerald-500 font-medium" : ""}`}>
                    {passwordCriteria.length ? <Check className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-muted-foreground/40 inline-block" />} 8+ characters
                  </span>
                  <span className={`flex items-center gap-1 ${passwordCriteria.upper && passwordCriteria.lower ? "text-emerald-500 font-medium" : ""}`}>
                    {passwordCriteria.upper && passwordCriteria.lower ? <Check className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-muted-foreground/40 inline-block" />} Upper & lower case
                  </span>
                  <span className={`flex items-center gap-1 ${passwordCriteria.number ? "text-emerald-500 font-medium" : ""}`}>
                    {passwordCriteria.number ? <Check className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-muted-foreground/40 inline-block" />} Number (0-9)
                  </span>
                  <span className={`flex items-center gap-1 ${passwordCriteria.symbol ? "text-emerald-500 font-medium" : ""}`}>
                    {passwordCriteria.symbol ? <Check className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-muted-foreground/40 inline-block" />} Symbol (!@#$)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Audit Logging Notice */}
          <div className="flex items-start gap-2.5 rounded-xl border border-border/80 bg-secondary/20 p-3 text-[11px] text-muted-foreground">
            <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <p>
              An immutable entry will be recorded in the security <strong>Audit Log</strong> with your administrator ID and timestamp upon provisioning this account.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Dialog Actions */}
          <DialogFooter className="gap-2 pt-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="cgs"
              size="sm"
              disabled={loading}
              className="font-semibold text-xs gap-1.5 shadow-sm"
            >
              {loading && <Loader2 className="animate-spin h-3.5 w-3.5" />}
              Provision Administrator Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
