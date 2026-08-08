"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { apiLogin } from "@/lib/jagdmap";

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
  onLogin: (token: string) => void;
}

export function LoginDialog({ open, onClose, onLogin }: LoginDialogProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const token = await apiLogin(password);
      onLogin(token);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Admin-Modus" subtitle="Passwort eingeben, um die Jagdkarte zu bearbeiten">
      <form onSubmit={submit} className="space-y-3 pb-2">
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passwort"
          className="w-full rounded-[14px] border border-line bg-bg-soft px-3.5 py-3 text-[16px] font-[650] text-ink focus:border-green focus:outline-none"
          autoFocus
        />
        {error && <p className="text-[13px] text-red font-[680] m-0">{error}</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="w-full rounded-[14px] bg-green text-white px-3.5 py-3 text-[15px] font-[760] disabled:opacity-50"
        >
          {busy ? "Anmelden…" : "Anmelden"}
        </button>
      </form>
    </Sheet>
  );
}
