import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthShell } from "@/components/landing/AuthShell";
import { GoogleButton } from "@/components/landing/GoogleButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { resolvePostAuthRoute, getCachedOnboarded } from "@/lib/onboarding";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Create account — StudySync AI" }] }),
});

function SignupPage() {
  return (
    <ThemeProvider>
      <SignupInner />
    </ThemeProvider>
  );
}

function SignupInner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const cached = getCachedOnboarded();
    if (cached !== null) navigate({ to: cached ? "/dashboard" : "/onboarding" });
    resolvePostAuthRoute(user.id).then((to) => navigate({ to }));
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (!data.session) {
      toast.success("Check your email to confirm your account.");
      return;
    }
    toast.success("Account created");
    navigate({ to: "/onboarding" });
  };

  return (
    <AuthShell
      title="Begin your calm semester."
      subtitle="Create an account to start syncing your study flow."
      footer={
        <>
          Already have one?{" "}
          <Link to="/login" className="text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <GoogleButton label="Sign up with Google" />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="bg-border h-px flex-1" />
          or
          <div className="bg-border h-px flex-1" />
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="glass mt-1 h-11 rounded-xl" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="glass mt-1 h-11 rounded-xl" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="glass mt-1 h-11 rounded-xl" />
          </div>
          <Button type="submit" disabled={loading} className="bg-gradient-brand h-11 w-full rounded-full text-primary-foreground shadow-glow hover:opacity-90">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}