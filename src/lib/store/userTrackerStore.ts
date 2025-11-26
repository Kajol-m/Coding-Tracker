import { create } from "zustand";
import axios from "axios";

// Configure axios defaults
axios.defaults.withCredentials = true;

// Configure axios to include auth token
axios.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    // Try JWT token first (for local auth)
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ---------- Types ----------
export type Question = { text: string; languages: string[] };

type DailyEntry = {
  status: "done" | "planned" | "not-done";
  questions: Question[];
  languages?: string[];
};

export type DailyMap = Record<string, DailyEntry>;

type Star = {
  id: string;
  date: string;
  questions: string[];
  question?: string;
  languages: string[];
  inJar: boolean;
};

export type StarMap = Record<string, Star>;

export type Sticker = {
  id: number;
  name: string;
  image: string;
  earnedDate: string;
};

type UserData = {
  name: string;
  email: string;
  joinDate: string;
  provider?: string;
  createdAt?: string;
};

type TrackerState = {
  dailyEntries: DailyMap;
  stars: StarMap;
  stickers: Sticker[];
  maxStreak: number;
  loading: boolean;
  lastFetch: number;
  user: UserData;

  // Actions
  loadAll: () => Promise<void>;
  saveEntry: (
    date: string,
    payload: { status: "done" | "planned" | "not-done"; questions: Question[] }
  ) => Promise<void>;

  deleteEntry: (date: string) => Promise<void>;

  addSticker: (payload: {
    stickerId: number;
    name: string;
    image: string;
  }) => Promise<void>;

  updateMaxStreak: (value: number) => Promise<void>;

  setUser: (userData: UserData) => void;
  loadUser: () => Promise<void>;

  refresh: () => Promise<void>;
};

// ---------------------------------------------------------
//                    ZUSTAND STORE
// ---------------------------------------------------------

export const useTrackerStore = create<TrackerState>((set, get) => ({
  dailyEntries: {},
  stars: {},
  stickers: [],
  maxStreak: 0,
  loading: false,
  lastFetch: 0,
  user: {
    name: "Guest",
    email: "guest@example.com",
    joinDate: "January 2025",
  },

  // ---------------------------------------------------------
  // Helper: compute max streak from dailyEntries map
  // ---------------------------------------------------------
  // Note: counts consecutive 'done' days in chronological order
  // Expects keys as YYYY-MM-DD strings (or comparable sortable strings).
  // Returns the longest run of consecutive 'done' statuses.
  // This keeps the UI responsive by deriving maxStreak locally on optimistic updates.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // (We declare it here as an internal helper via get(), not part of public TrackerState)
  // We'll implement it as a local function below when needed.

  // Load everything at once (fast)
  // ---------------------------------------------------------
  loadAll: async () => {
    const now = Date.now();
    const { lastFetch } = get();
    
    // Cache for 30 seconds to speed up page switching
    if (now - lastFetch < 30000) {
      return;
    }

    set({ loading: true });
    try {
      const res = await axios.get("/api/tracker");
      const data = res.data;

      set({
        dailyEntries: data.dailyEntries || {},
        stars: data.stars || {},
        stickers: data.stickers || [],
        maxStreak: data.maxStreak || 0,
        lastFetch: now,
      });
    } catch (err) {
      const error = err as unknown;
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          // User not authenticated, clear data but don't show error
          set({
            dailyEntries: {},
            stars: {},
            stickers: [],
            maxStreak: 0,
          });
        } else {
          console.error("Failed to load tracker", err);
        }
      } else {
        console.error("Failed to load tracker", err);
      }
    } finally {
      set({ loading: false });
    }
  },

  // ---------------------------------------------------------
  // Add or update a daily entry
  // ---------------------------------------------------------
  saveEntry: async (date, payload) => {
    const { dailyEntries, stars } = get();
    
    // Optimistic update - add/update immediately in UI
    const newDailyEntries = {
      ...dailyEntries,
      [date]: {
        status: payload.status,
        questions: payload.questions,
        languages: Array.from(new Set(payload.questions.flatMap(q => q.languages)))
      }
    };
    
    const newStars = { ...stars };
    if (payload.status === "done") {
      const starId = `star-${date}`;
      newStars[starId] = {
        id: starId,
        date,
        questions: payload.questions.map(q => q.text),
        languages: Array.from(new Set(payload.questions.flatMap(q => q.languages))),
        inJar: true
      };
    }
    
    // compute optimistic max streak locally
    const computeMaxStreakFromMap = (entries: DailyMap) => {
      const dates = Object.keys(entries).sort();
      let max = 0;
      let current = 0;
      let prevDate: string | null = null;

      const isConsecutive = (a: string, b: string) => {
        const da = new Date(a);
        const db = new Date(b);
        const diff = (db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24);
        return diff === 1;
      };

      for (const d of dates) {
        const entry = entries[d];
        if (entry && entry.status === 'done') {
          if (prevDate && isConsecutive(prevDate, d)) {
            current += 1;
          } else {
            current = 1;
          }
          if (current > max) max = current;
        } else {
          current = 0;
        }
        prevDate = d;
      }
      return max;
    };

    const optimisticMax = computeMaxStreakFromMap(newDailyEntries);

    set({ 
      dailyEntries: newDailyEntries,
      stars: newStars,
      maxStreak: Math.max(get().maxStreak || 0, optimisticMax),
    });
    
    try {
      await axios.post("/api/tracker/entry", { date, ...payload });
      // Reload to sync with server state (for streak calculations, etc.)
      await get().loadAll();
    } catch (err) {
      // Revert optimistic update on error
      set({ 
        dailyEntries,
        stars
      });
      console.error("saveEntry error", err);
      throw err;
    }
  },

  // ---------------------------------------------------------
  // Delete an entry (and star)
  // ---------------------------------------------------------
  deleteEntry: async (date) => {
    const { dailyEntries, stars } = get();
    
    // Optimistic update - remove immediately from UI
    const newDailyEntries = { ...dailyEntries };
    delete newDailyEntries[date];
    
    const newStars = { ...stars };
    const starId = `star-${date}`;
    delete newStars[starId];
    
    // recompute max streak after deletion
    const computeMaxStreakFromMap = (entries: DailyMap) => {
      const dates = Object.keys(entries).sort();
      let max = 0;
      let current = 0;
      let prevDate: string | null = null;

      const isConsecutive = (a: string, b: string) => {
        const da = new Date(a);
        const db = new Date(b);
        const diff = (db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24);
        return diff === 1;
      };

      for (const d of dates) {
        const entry = entries[d];
        if (entry && entry.status === 'done') {
          if (prevDate && isConsecutive(prevDate, d)) {
            current += 1;
          } else {
            current = 1;
          }
          if (current > max) max = current;
        } else {
          current = 0;
        }
        prevDate = d;
      }
      return max;
    };

    const newMax = computeMaxStreakFromMap(newDailyEntries);

    set({ 
      dailyEntries: newDailyEntries,
      stars: newStars,
      maxStreak: newMax,
    });
    
    try {
      await axios.delete(`/api/tracker/entry?date=${encodeURIComponent(date)}`);
      // Reload to sync with server state
      await get().loadAll();
    } catch (err) {
      // Revert optimistic update on error
      set({ 
        dailyEntries,
        stars
      });
      console.error("deleteEntry error", err);
      throw err;
    }
  },

  // ---------------------------------------------------------
  // Award a sticker
  // ---------------------------------------------------------
  addSticker: async ({ stickerId, name, image }) => {
    try {
      await axios.post("/api/tracker/sticker", {
        stickerId,
        name,
        image,
      });
      await get().loadAll();
    } catch (err) {
      console.error("addSticker error", err);
      throw err;
    }
  },

  // ---------------------------------------------------------
  // NEW: Update max streak safely (needed by Mainpage)
  // ---------------------------------------------------------
  updateMaxStreak: async (value) => {
    try {
      await axios.post("/api/tracker/maxStreak", { value });
      set({ maxStreak: value }); // optimistic update
    } catch (err) {
      console.error("updateMaxStreak error", err);
      throw err;
    }
  },

  // ---------------------------------------------------------
  // Set user data
  // ---------------------------------------------------------
  setUser: (userData) => {
    set({ user: userData });
  },

  // ---------------------------------------------------------
  // Load user data from API
  // ---------------------------------------------------------
  loadUser: async () => {
    try {
      const res = await axios.get("/api/user/profile");
      const data = res.data;
      
      const joinDate = data.createdAt ? 
        new Date(data.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) :
        "January 2025";
      
      set({ 
        user: {
          name: data.user_name || "PixelCoder",
          email: data.email || "guest@example.com",
          joinDate,
          provider: data.provider || "local",
          createdAt: data.createdAt
        }
      });
    } catch (err) {
      console.error("Failed to load user data", err);
    }
  },

  // ---------------------------------------------------------
  // Refresh data (force fresh from server, bypass cache)
  // ---------------------------------------------------------
  refresh: async () => {
    // Force refresh by setting lastFetch to 0 to bypass cache
    set({ lastFetch: 0 });
    await get().loadAll();
  },
}));
