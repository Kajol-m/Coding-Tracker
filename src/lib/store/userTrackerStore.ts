import { create } from "zustand";
import axios from "axios";

// Configure axios defaults
axios.defaults.withCredentials = true;

// Track if we're already trying to refresh to avoid infinite loops
let isRefreshing = false;
let failedQueue: Array<(token: string) => void> = [];

const processQueue = (token: string) => {
  failedQueue.forEach(prom => prom(token));
  failedQueue = [];
};

// Configure axios to include auth token
// IMPORTANT: Only use Authorization header if JWT is in localStorage (for local auth)
// Otherwise rely on httpOnly cookies which are sent automatically
axios.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    // Only add Authorization header if we have a token in localStorage
    // This is for local email/password auth fallback
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // If no localStorage token, the browser will automatically send httpOnly cookies
  }
  return config;
});

// Response interceptor to handle token refresh on 401
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the original request to retry after refresh completes
        return new Promise((resolve) => {
          failedQueue.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axios(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Try to refresh the token
      if (typeof window !== "undefined") {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          return axios
            .post("/api/auth/refresh", { refreshToken })
            .then((res) => {
              const newToken = res.data.token;
              localStorage.setItem("token", newToken);
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              processQueue(newToken);
              return axios(originalRequest);
            })
            .catch(() => {
              // Refresh failed, clear tokens and redirect to auth
              localStorage.removeItem("token");
              localStorage.removeItem("refreshToken");
              localStorage.removeItem("user");
              window.location.href = "/auth";
              return Promise.reject(error);
            })
            .finally(() => {
              isRefreshing = false;
            });
        } else {
          // No refresh token in localStorage, but we got 401
          // This means auth failed entirely (maybe cookies expired)
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          isRefreshing = false;
          window.location.href = "/auth";
          return Promise.reject(error);
        }
      }
    }

    return Promise.reject(error);
  }
);

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

// Helper: Load user from localStorage on init
const initializeUserFromStorage = (): UserData => {
  if (typeof window === "undefined") {
    return {
      name: "Guest",
      email: "guest@example.com",
      joinDate: "January 2025",
    };
  }
  
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      
      // Try to use joinDate if available, otherwise calculate from createdAt
      let joinDate = parsed.joinDate || "January 2025";
      if (!parsed.joinDate && parsed.createdAt) {
        joinDate = new Date(parsed.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
      
      return {
        name: parsed.user_name || parsed.name || "Guest",
        email: parsed.email || "guest@example.com",
        joinDate,
      };
    }
  } catch (err) {
    console.warn("Failed to parse stored user data:", err);
  }
  
  return {
    name: "Guest",
    email: "guest@example.com",
    joinDate: "January 2025",
  };
};

export const useTrackerStore = create<TrackerState>((set, get) => ({
  dailyEntries: {},
  stars: {},
  stickers: [],
  maxStreak: 0,
  loading: false,
  lastFetch: 0,
  user: initializeUserFromStorage(),

  // ---------------------------------------------------------
  // Helper: compute max streak from dailyEntries map
  // ---------------------------------------------------------
  // Note: counts consecutive 'done' days in chronological order
  // Expects keys as YYYY-MM-DD strings (or comparable sortable strings).
  // Returns the longest run of consecutive 'done' statuses.
  // This keeps the UI responsive by deriving maxStreak locally on optimistic updates.
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
    const starId = `star-${date}`;
    
    // Save original state for rollback
    const originalDailyEntries = dailyEntries;
    const originalStars = stars;
    const originalMaxStreak = get().maxStreak;
    
    // Optimistic update - remove immediately from UI
    const newDailyEntries = { ...dailyEntries };
    delete newDailyEntries[date];
    
    const newStars = { ...stars };
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

    // Apply optimistic update
    set({ 
      dailyEntries: newDailyEntries,
      stars: newStars,
      maxStreak: newMax,
    });
    
    try {
      // Make the DELETE request with explicit error handling
      const response = await axios.delete(`/api/tracker/entry?date=${encodeURIComponent(date)}`);
      console.log(`Successfully deleted entry for ${date}`);
      
      // Reload to sync with server state and recalculate streaks
      await get().loadAll();
    } catch (err) {
      // Revert optimistic update on error
      console.error(`deleteEntry error for ${date}:`, err);
      set({ 
        dailyEntries: originalDailyEntries,
        stars: originalStars,
        maxStreak: originalMaxStreak,
      });
      
      // Log detailed error info
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const message = err.response?.data?.message || err.message;
        console.error(`API error (${status}): ${message}`);
        
        // Throw a user-friendly error
        if (status === 401) {
          throw new Error("Unauthorized: Please log in again");
        } else if (status === 400) {
          throw new Error(`Invalid request: ${message}`);
        } else {
          throw new Error(`Failed to delete entry: ${message}`);
        }
      }
      
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
      
      if (!data) {
        console.warn("No user data returned from API");
        return;
      }
      
      const joinDate = data.createdAt ? 
        new Date(data.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) :
        "January 2025";
      
      const userData = {
        name: data.user_name || "PixelCoder",
        email: data.email || "guest@example.com",
        joinDate,
        provider: data.provider || "local",
        createdAt: data.createdAt
      };
      
      set({ user: userData });
      
      // Also save to localStorage for offline access
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify({ 
          user_name: userData.name, 
          email: userData.email, 
          joinDate: userData.joinDate,
          provider: userData.provider,
          createdAt: userData.createdAt
        }));
      }
    } catch (err) {
      const axiosErr = err as Error & { response?: { status: number; data: unknown } };
      console.error("Failed to load user data from API:", {
        message: axiosErr?.message,
        status: axiosErr?.response?.status,
        data: axiosErr?.response?.data,
      });
      // Error is silently caught, user will show from localStorage (see init)
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
