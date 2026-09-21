"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, 
  Mail, 
  Lock, 
  AlertCircle,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  HardHat
} from "lucide-react";
import { useAuth } from "./auth-context";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Logo } from "../../components/ui/logo";
import { Input } from "../../components/ui/input";
import { Footer } from "../../components/ui/footer"; 

interface DemoIdentity {
  title: string;
  email: string;
  roleScope: string;
  badgeVariant: "violet" | "info" | "success" | "neutral";
  icon: React.ReactNode;
}

const DEMO_IDENTITIES: DemoIdentity[] = [
  {
    title: "Platform Super Admin",
    roleScope: "Global Tenant Provisioning and Telemetry",
    email: "admin@sonura.ai",
    badgeVariant: "violet",
    icon: <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />,
  },
  {
    title: "Client Org Administrator",
    roleScope: "Titan HVAC Tenant Management",
    email: "john@titanhvac.com",
    badgeVariant: "violet",
    icon: <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />,
  },
  {
    title: "Field Supervisor",
    roleScope: "Audit Reviews and Sign-Offs",
    email: "sarah@titanhvac.com",
    badgeVariant: "info",
    icon: <UserCheck className="w-3.5 h-3.5 text-cyan-400" />,
  },
  {
    title: "Inspector",
    roleScope: "Hands-Free Voice HUD",
    email: "op1@titanhvac.com",
    badgeVariant: "success",
    icon: <HardHat className="w-3.5 h-3.5 text-emerald-400" />,
  },
];

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const { user, login } = useAuth();

  const [email, setEmail] = useState<string>("admin@sonura.ai");
  const [password, setPassword] = useState<string>("sonura2026");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const outcome = await login(email, password);
      if (outcome.success === false) {
        setErrorMessage(outcome.error || "Invalid credentials. Please verify your email and password.");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication error occurred.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectIdentity = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setPassword("sonura2026");
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#06080d] text-slate-100 flex flex-col relative selection:bg-violet-500 selection:text-white overflow-x-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />

      <header className="absolute top-0 left-0 right-0 px-4 py-3 sm:px-6 sm:py-5 flex items-center justify-between z-20 pointer-events-none">
        <Link 
          href="/" 
          aria-label="Back to home"
          className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/5 transition-all cursor-pointer pointer-events-auto inline-flex items-center justify-center"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-3 py-14 sm:py-20 relative z-10 w-full min-h-screen">
        <div className="w-full max-w-sm sm:max-w-md rounded-2xl p-4 sm:p-6 md:p-8 bg-slate-950/85 border border-white/10 shadow-2xl backdrop-blur-2xl space-y-4 sm:space-y-5 my-auto">
          
          <div className="text-center">
            <div className="flex justify-center mb-2 sm:mb-3">
              <Logo size="lg" animated={true} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Sign In
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 font-mono">
              Access your authorized console workspace
            </p>
          </div>

          {errorMessage ? (
            <div className="p-2.5 sm:p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <Input
              label="Work Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@organization.com"
              icon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              isPassword={true}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              icon={<Lock className="w-4 h-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full py-2.5 sm:py-3 text-xs font-semibold tracking-wide shadow-lg shadow-violet-600/30"
            >
              Sign In
            </Button>
          </form>

          <div className="pt-2.5 sm:pt-3 border-t border-slate-800 space-y-2 text-center">
            <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Pre-Provisioned Demo Profiles
            </span>

            <div className="space-y-1.5">
              {DEMO_IDENTITIES.map((identity) => {
                const isSelected = email === identity.email;
                return (
                  <button
                    key={identity.email}
                    type="button"
                    onClick={() => handleSelectIdentity(identity.email)}
                    className={`w-full p-2 rounded-xl border text-left flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? "border-violet-500 bg-violet-600/15 shadow-sm"
                        : "border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className="p-1 rounded-lg bg-slate-800 shrink-0">
                        {identity.icon}
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="text-[11px] sm:text-xs font-medium text-slate-200 truncate">
                          {identity.title}
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-mono text-slate-400 truncate">
                          {identity.email}
                        </div>
                      </div>
                    </div>

                    <Badge variant={identity.badgeVariant} className="shrink-0 text-[9px] sm:text-[10px] px-1.5 py-0.5">
                      Select
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};