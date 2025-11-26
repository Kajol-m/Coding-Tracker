"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { PixelCalendar } from "@/components/PixelCalendar";
import { StarJar } from "@/components/StarJar";
import { AddEntryModal } from "@/components/AddEntryModal";
import { DateDetailModal } from "@/components/DateDetailModal";
import { StarDetailModal } from "@/components/StarDetailModal";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import UserProfile from "@/components/UserProfile";

import {
  loadDailyData,
  loadStars,
  loadStickers,
  loadMaxStreak,
  saveDailyData,
  deleteDailyData,
  loadAll as loadAllData,
} from "@/lib/storage";

import { useTrackerStore } from "@/lib/store/userTrackerStore"; // optional direct store usage
import type { DailyDataMap, Star, Sticker, QuestionData } from "@/types/tracker";
import { useSession } from "next-auth/react";

const Mainpage = () => {
  const router = useRouter();
  const session=useSession();
  // Reactive state from store (these are kept minimal and used for rendering)
  // We still keep some local state (modal toggles, selection)
  const dailyEntries = useTrackerStore((s) => s.dailyEntries);
  const starsMap = useTrackerStore((s) => s.stars);
  const stickers = useTrackerStore((s) => s.stickers);
  const maxStreakFromStore = useTrackerStore((s) => s.maxStreak);
  const loadAll = useTrackerStore((s) => s.loadAll);
  const saveEntry = useTrackerStore((s) => s.saveEntry);
  const deleteEntry = useTrackerStore((s) => s.deleteEntry);
  const addSticker = useTrackerStore((s) => s.addSticker);
  const refresh = useTrackerStore((s) => s.refresh);

  // Local UI state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isStarDetailModalOpen, setIsStarDetailModalOpen] = useState(false);
  const [selectedStar, setSelectedStar] = useState<Star | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  
  const [starsCount, setStarsCount] = useState(0);
  const [collectedStickersCount, setCollectedStickersCount] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  useEffect(() => {
    
    if (session?.data?.user || localStorage.getItem("user")) {
      loadAll().then(() => {
        
        window.dispatchEvent(new Event("stars-updated"));
      }).catch((err) => {
        console.error("Failed to load tracker data", err);
      });
    }
    
  }, [session]);

  
  useEffect(() => {
    
    const sc = Object.values(starsMap || {}).filter((s) => s.inJar !== false).length;
    setStarsCount(sc);
    setCollectedStickersCount((stickers || []).length);
    setMaxStreak(maxStreakFromStore || 0);
  }, [starsMap, stickers, maxStreakFromStore]);

  const calculateCurrentStreak = (data: DailyDataMap): number => {
    
    const dates = Object.keys(data).sort().reverse();
    let streak = 0;
    let previousDate: Date | null = null;

    for (const dateStr of dates) {
      const entry = data[dateStr];
      if (!entry || entry.status !== "done") continue;

      const currentDate = new Date(dateStr.replace(/-/g, "/"));

      if (previousDate === null) {
        streak = 1;
        previousDate = currentDate;
      } else {
        const dayDiff = Math.floor(
          (previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (dayDiff === 1) {
          streak++;
          previousDate = currentDate;
        } else {
          break;
        }
      }
    }

    return streak;
  };

  // === Modal handlers (these replace localStorage operations with store-backed API calls) ===

  // Called by AddEntryModal (modal passes questions,status)
  const handleSaveEntry = async (data: { questions: QuestionData[]; status: string }) => {
    if (!selectedDate) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");

    // Snapshot previous state to determine what to toast after save
    const prevStar = (starsMap || {})[`star-${dateStr}`];
    const prevMaxStreak = maxStreak;

    try {
      // Save entry via store (which calls API and reloads store)
      await saveEntry(dateStr, { status: data.status as "done" | "planned" | "not-done", questions: data.questions });

      // After save, reload full store to get server-calculated derived values
      await loadAll();

      // Notify legacy components (StarJar etc) listening for this event
      window.dispatchEvent(new Event("stars-updated"));

      // Compute toast messages
      const updatedStarsMap = loadStars(); // synchronous wrapper - reads from store
      const updatedStar = updatedStarsMap[`star-${dateStr}`];

      const updatedMaxStreak = loadMaxStreak();

      if (!prevStar && updatedStar) {
        // New star created for this day
        toast.success("Star added to jar!");
      } else if (prevStar && updatedStar) {
        // Star updated
        toast.success("Entry updated!");
      } else {
        // Generic entry saved
        toast.success("Entry saved successfully!");
      }

      // Sticker awarding: if maxStreak increased and crossed 10-multiple, show sticker toast
      if (updatedMaxStreak > prevMaxStreak) {
        // compute earned sticker count then show message
        const prevCount = Math.floor(prevMaxStreak / 10);
        const newCount = Math.floor(updatedMaxStreak / 10);
        if (newCount > prevCount) {
          // Get new sticker(s) added
          const updatedStickers = loadStickers();
          const latest = updatedStickers[updatedStickers.length - 1];
          if (latest) {
            toast.success(`${updatedMaxStreak}-day streak! You earned a sticker: ${latest.name}!`, { duration: 5000 });
          } else {
            toast.success(`New streak: ${updatedMaxStreak} days!`);
          }
        }
      }
    } catch (err: unknown) {
      console.error("saveEntry failed", err);
      const message = err instanceof Error ? err.message : undefined;
      toast.error(message || "Failed to save entry. Try again.");
    } finally {
      setIsAddModalOpen(false);
      setIsEditing(false);
    }
  };

  const handleEditClick = () => {
    setIsDetailModalOpen(false);
    setIsEditing(true);
    setIsAddModalOpen(true);
  };

  // Called by DateDetailModal -> Delete entry
  const handleDeleteEntry = async () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    try {
      await deleteEntry(dateStr);
      // Force refresh to bypass cache and sync with server immediately
      await refresh();

      // Notify legacy listeners
      window.dispatchEvent(new Event("stars-updated"));

      toast.success("Entry deleted successfully!");
    } catch (err) {
      console.error("deleteEntry failed", err);
      toast.error("Failed to delete entry.");
    } finally {
      setIsDetailModalOpen(false);
    }
  };

  // When user clicks a date on calendar
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsDetailModalOpen(true);
  };

  
  // When user clicks a star in jar
  const handleStarJarClick = (star: Star) => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const starDate = star.date;

    if (starDate === todayStr) {
      // open date detail modal for editing today's entry
      setSelectedDate(new Date(starDate.replace(/-/g, "/")));
      setIsDetailModalOpen(true);
    } else {
      setSelectedStar(star);
      setIsStarDetailModalOpen(true);
    }
  };

  const getCurrentDateData = () => {
    if (!selectedDate) return null;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return (dailyEntries || {})[dateStr] || null;
  };

  // For compatibility with components (they still import loadDailyData/loadStars/loadStickers)
  // these functions must be implemented in lib/storage to read from Zustand (synchronous getters).
  // We use them here for a few immediate lookups as well:
  const localDailyDataSnapshot: DailyDataMap = loadDailyData();
  const localStarsSnapshot = loadStars();
  const localStickersSnapshot: Sticker[] = loadStickers();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="absolute top-10 left-10 text-4xl animate-sparkle"><img src="/sparkle-1.png" className="max-w-[100px]"/></div>
      <div className="absolute top-20 right-20 text-3xl animate-sparkle" style={{ animationDelay: "0.5s" }}><img src="/sparkle-1.png" className="max-w-[100px]"/></div>
      <div className="absolute bottom-20 left-1/4 text-2xl animate-sparkle" style={{ animationDelay: "1s" }}><img src="/sparkle-2.png" className="max-w-[100px]"/></div>
      <div className="absolute top-50 left-20 text-3xl animate-sparkle" style={{ animationDelay: "0.5s" }}><img src="/sparkle-1.png" className="max-w-[100px]"/></div>
      <div className="absolute bottom-50 right-40 text-2xl animate-sparkle" style={{ animationDelay: "1s" }}><img src="/sparkle-2.png" className="max-w-[100px]"/></div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-6 md:py-8 flex-1 flex flex-col justify-center">
        {/* User Profile - Top Right */}
        <div className="flex justify-end mb-4">
          <UserProfile />
        </div>

        {/* Header */}
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-xl md:text-3xl lg:text-4xl xl:text-5xl font-pixel mb-2 md:mb-3 text-primary">
            Pixel Coding Tracker
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Track your competitive coding journey, one pixel star at a time!
          </p>
        </header>

        {/* Two Column Layout: Calendar & Jar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12 max-w-7xl mx-auto">
          {/* Left: Calendar */}
          <div className="flex justify-center items-start">
            <PixelCalendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              dailyData={dailyEntries || {}}
            />
          </div>

          {/* Right: Jar */}
          <div className="flex justify-center items-start">
            {/* StarJar previously read from localStorage; it will still work if lib/storage.getStarsInJar reads from Zustand.
                To keep backward compatibility we dispatch 'stars-updated' events after changes. */}
            <StarJar onStarClick={handleStarJarClick} />
          </div>
        </div>

        {/* Stats - Centered Below */}
        <div className="flex justify-center gap-4 md:gap-6 flex-wrap max-w-5xl mx-auto">
          <div
            onClick={() => router.push('/statistics')}
            className="bg-primary text-primary-foreground px-4 py-4 md:px-8 md:py-6 pixel-border text-center w-[140px] md:w-[180px] lg:w-[320px] h-[120px] md:h-[140px] lg:h-[150px] flex flex-col justify-center hover:brightness-110 transition-all cursor-pointer transform hover:scale-105"
          >
            <div className="text-2xl md:text-4xl font-bold mb-1">{starsCount}</div>
            <div className="text-xs md:text-sm">Stars Collected</div>
            <div className="text-[8px] md:text-[10px] text-primary-foreground/80 hover:text-primary-foreground underline mt-1">
              View Statistics
            </div>
          </div>

          <div
            onClick={() => router.push('/stickers')}
            className="bg-secondary text-secondary-foreground px-4 py-4 md:px-8 md:py-6 pixel-border text-center w-[140px] md:w-[180px] lg:w-[320px] h-[120px] md:h-[140px] lg:h-[150px] flex flex-col justify-center hover:brightness-110 transition-all cursor-pointer transform hover:scale-105"
          >
            <div className="text-2xl md:text-4xl font-bold mb-1">{collectedStickersCount}</div>
            <div className="text-xs md:text-sm">Stickers Collected</div>
            <div className="text-[8px] md:text-[10px] text-secondary-foreground/80 hover:text-secondary-foreground underline mt-1">
              View Collection
            </div>
          </div>

          <div className="bg-[#fff0b3] text-accent-foreground px-4 py-4 md:px-8 md:py-6 pixel-border text-center w-[140px] md:w-[180px] lg:w-[320px] h-[120px] md:h-[140px] lg:h-[150px] flex flex-col justify-center hover:brightness-110 transition-all cursor-pointer transform hover:scale-105">
            <div className="text-2xl md:text-4xl font-bold mb-1">{maxStreak}</div>
            <div className="text-xs md:text-sm">Maximum Streak Days</div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddEntryModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditing(false);
        }}
        date={selectedDate || new Date()}
        onSave={handleSaveEntry}
        initialData={isEditing ? getCurrentDateData() || undefined : undefined}
      />

      <DateDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        date={selectedDate || new Date()}
        data={getCurrentDateData()}
        onEdit={handleEditClick}
        onDelete={handleDeleteEntry}
      />

      <StarDetailModal
        isOpen={isStarDetailModalOpen}
        onClose={() => setIsStarDetailModalOpen(false)}
        star={selectedStar}
      />
    </div>
  );
};

export default Mainpage;
