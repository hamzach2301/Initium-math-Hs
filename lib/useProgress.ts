import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase/client";

const LEGACY_KEY = "initium_completed_pdfs";

function readLegacyProgress() {
  try {
    const value = JSON.parse(window.localStorage.getItem(LEGACY_KEY) ?? "[]");
    return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : [];
  } catch {
    window.localStorage.removeItem(LEGACY_KEY);
    return [];
  }
}

/** Per-material completion state. Signed-in users are persisted in Supabase. */
export function useProgress() {
  const [user, setUser] = useState<User | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setCompletedIds(readLegacyProgress());
      setIsLoaded(true);
      return;
    }
    let active = true;
    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      if (authError) setError(authError.message);
      setUser(data.user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoaded(false);
      setError(null);
      if (!user || !supabase) {
        if (active) { setCompletedIds(readLegacyProgress()); setIsLoaded(true); }
        return;
      }
      const legacyIds = readLegacyProgress();
      if (legacyIds.length) {
        const { error: migrationError } = await supabase.from("student_material_progress").upsert(
          legacyIds.map((material_id) => ({ user_id: user.id, material_id, completed: true })),
          { onConflict: "user_id,material_id" },
        );
        if (migrationError && active) setError(migrationError.message);
        if (!migrationError) window.localStorage.removeItem(LEGACY_KEY);
      }
      const { data, error: loadError } = await supabase.from("student_material_progress").select("material_id").eq("completed", true);
      if (!active) return;
      if (loadError) {
        setError(loadError.message);
        setCompletedIds(legacyIds);
      } else {
        setCompletedIds((data ?? []).map((row) => row.material_id));
      }
      setIsLoaded(true);
    };
    void load();
    return () => { active = false; };
  }, [user]);

  const toggleComplete = (materialId: string) => {
    const wasCompleted = completedIds.includes(materialId);
    const next = wasCompleted ? completedIds.filter((id) => id !== materialId) : [...completedIds, materialId];
    setCompletedIds(next);
    setError(null);

    if (!user || !supabase) {
      window.localStorage.setItem(LEGACY_KEY, JSON.stringify(next));
      return;
    }

    void (async () => {
      const { error: writeError } = wasCompleted
        ? await supabase.from("student_material_progress").delete().eq("material_id", materialId)
        : await supabase.from("student_material_progress").upsert({ user_id: user.id, material_id: materialId, completed: true }, { onConflict: "user_id,material_id" });
      if (writeError) {
        setCompletedIds((current) => current.includes(materialId) === wasCompleted ? current : wasCompleted ? [...current, materialId] : current.filter((id) => id !== materialId));
        setError(writeError.message);
      }
    })();
  };

  return { completedIds, toggleComplete, isLoaded, error };
}
