// // lib/storage.ts
// // This version removes all localStorage usage and turns
// // this file into synchronous Zustand wrappers + async store actions.

// import { useTrackerStore } from "@/lib/store/userTrackerStore";

// // ---------------------------------------------------------
// // SYNC GETTERS (used inside components like PixelCalendar, StarJar)
// // These functions read from Zustand's current state snapshot
// // ---------------------------------------------------------

// export const loadDailyData = () => {
//   return useTrackerStore.getState().dailyEntries || {};
// };

// export const loadStars = () => {
//   return useTrackerStore.getState().stars || {};
// };

// export const loadStickers = () => {
//   return useTrackerStore.getState().stickers || [];
// };

// export const loadMaxStreak = () => {
//   return useTrackerStore.getState().maxStreak || 0;
// };

// // StarJar expects this EXACT function to exist
// export const getStarsInJar = () => {
//   const stars = useTrackerStore.getState().stars || {};
//   return Object.values(stars).filter((star: any) => star.inJar !== false);
// };

// // ---------------------------------------------------------
// // ASYNC ACTION WRAPPERS
// // These call Zustand store methods which call API → MongoDB
// // ---------------------------------------------------------

// // loadAll = fetch all user tracking data from API and update Zustand.
// export const loadAll = async () => {
//   return await useTrackerStore.getState().loadAll();
// };

// // Save one day's entry
// export const saveDailyData = async (date: string, entry: any) => {
//   return await useTrackerStore.getState().saveEntry(date, entry);
// };

// // Delete one day's entry
// export const deleteDailyData = async (date: string) => {
//   return await useTrackerStore.getState().deleteEntry(date);
// };

// // Add sticker
// export const saveStickers = async (stickerPayload: any) => {
//   return await useTrackerStore.getState().addSticker(stickerPayload);
// };

// // Save max streak (optional — usually server updates it automatically)
// export const saveMaxStreak = async (streak: number) => {
//   return await useTrackerStore.getState().updateMaxStreak(streak);
// };

// // This only exists for compatibility with your older code
// export const saveStars = async (stars: any) => {
//   // Not needed anymore, but we keep it to avoid breaking existing imports
//   console.warn("saveStars() called → ignored; stars are managed by saveEntry/deleteEntry automatically");
// };
// lib/storage.ts
// Sync Zustand readers + async DB-backed actions.

import { useTrackerStore } from "@/lib/store/userTrackerStore";
import type { DailyMap, StarMap, Sticker, Question } from "@/lib/store/userTrackerStore";

// --------------------
// Sync readers
// --------------------

export const loadDailyData = (): DailyMap => {
  return useTrackerStore.getState().dailyEntries;
};

export const loadStars = (): StarMap => {
  return useTrackerStore.getState().stars;
};

export const loadStickers = (): Sticker[] => {
  return useTrackerStore.getState().stickers;
};

export const loadMaxStreak = (): number => {
  return useTrackerStore.getState().maxStreak;
};

// Required for StarJar
export const getStarsInJar = () => {
  const stars = useTrackerStore.getState().stars;
  return Object.values(stars).filter((star) => star.inJar !== false);
};

// --------------------
// Async actions
// --------------------

export const loadAll = async () => {
  return useTrackerStore.getState().loadAll();
};

export const saveDailyData = async (
  date: string,
  entry: { status: "done" | "planned" | "not-done"; questions: Question[] }
) => {
  return useTrackerStore.getState().saveEntry(date, entry);
};

export const deleteDailyData = async (date: string) => {
  return useTrackerStore.getState().deleteEntry(date);
};

export const saveStickers = async (payload: { stickerId: number; name: string; image: string }) => {
  return useTrackerStore.getState().addSticker(payload);
};

export const saveMaxStreak = async (streak: number) => {
  if (!useTrackerStore.getState().updateMaxStreak) {
    console.warn("updateMaxStreak() missing in Zustand store");
    return;
  }
  return useTrackerStore.getState().updateMaxStreak(streak);
};

// Legacy compatibility
export const saveStars = async () => {
  console.warn("saveStars() ignored — stars are managed by saveEntry()");
};
