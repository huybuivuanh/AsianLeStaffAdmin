"use client";

import { useState, useEffect, type SubmitEvent } from "react";
import { addUser, updateUser } from "@/lib/users";

interface UserModalProps {
  isOpen: boolean;
  mode: "add" | "edit";
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function UserModal({
  isOpen,
  mode,
  user,
  onClose,
  onSuccess,
}: UserModalProps) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [server, setServer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && user) {
        setName(user.name);
        setPin(user.pin);
        setServer(user.server);
      } else {
        setName("");
        setPin("");
        setServer(false);
      }
      setError("");
    }
  }, [isOpen, mode, user]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const nameVal = name.trim();
      const pinVal = pin.trim();
      if (pinVal.length !== 4) {
        setError("PIN must be exactly 4 digits");
        setSaving(false);
        return;
      }

      if (mode === "add") {
        await addUser(nameVal, pinVal, server);
      } else if (user) {
        await updateUser(user.id, nameVal, pinVal, server);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save user");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-zinc-900">
          {mode === "add" ? "Add user" : "Edit user"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          <div>
            <label
              htmlFor="user-name"
              className="block text-sm font-medium text-zinc-700"
            >
              Name
            </label>
            <input
              id="user-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>
          <div>
            <label
              htmlFor="user-pin"
              className="block text-sm font-medium text-zinc-700"
            >
              PIN
            </label>
            <input
              id="user-pin"
              type="text"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              required
              maxLength={4}
              placeholder="4 digits"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 font-mono text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>
          <div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={server}
                onChange={(e) => setServer(e.target.checked)}
                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
              />
              <span className="text-sm font-medium text-zinc-700">Server</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : mode === "add" ? "Add" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
