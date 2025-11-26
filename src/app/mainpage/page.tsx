// 'use client'
// import { useState, useEffect } from "react";
// import { format } from "date-fns";
// import { PixelCalendar } from "@/components/PixelCalendar";
// import { StarJar } from "@/components/StarJar";
// import { AddEntryModal } from "@/components/AddEntryModal";
// import { DateDetailModal } from "@/components/DateDetailModal";
// import { StarDetailModal } from "@/components/StarDetailModal";
// import { loadDailyData, saveDailyData, loadStars, saveStars, loadStickers, saveStickers, loadMaxStreak, saveMaxStreak } from "@/lib/storage";
// import type { DailyDataMap, Star, Sticker, StarMap, QuestionData } from "@/types/tracker";
// import { toast } from "sonner";
// import { useRouter } from "next/navigation";
// import UserProfile from "@/components/UserProfile";

// const STICKER_IMAGES = [
//   { id: 1, name: "Hot Air Balloon", image: "/assets/sticker-1.png" },
//   { id: 2, name: "Keep Shining", image: "/assets/sticker-2.png" },
//   { id: 3, name: "You've Got This", image: "/assets/sticker-3.png" },
//   { id: 4, name: "Dream Big", image: "/assets/sticker-4.png" },
//   { id: 5, name: "Stay Positive", image: "/assets/sticker-5.png" },
//   { id: 6, name: "Great Work", image: "/assets/sticker-6.png" },
//   { id: 7, name: "Grow at Your Own Pace", image: "/assets/sticker-7.png" },
// ];

// const Mainpage = () => {
//   const [selectedDate, setSelectedDate] = useState<Date | null>(null);
//   const [dailyData, setDailyData] = useState<DailyDataMap>({});
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//   const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
//   const [isStarDetailModalOpen, setIsStarDetailModalOpen] = useState(false);
//   const [selectedStar, setSelectedStar] = useState<Star | null>(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [collectedStickers, setCollectedStickers] = useState<Sticker[]>([]);
//   const [maxStreak, setMaxStreak] = useState(0);
//   const [starsCount, setStarsCount] = useState(0);

//   const router = useRouter();

//   useEffect(() => {
//     setDailyData(loadDailyData());
//     setCollectedStickers(loadStickers());
//     setMaxStreak(loadMaxStreak());
    
//     // Clean up duplicate stars - ensure only 1 star per day
//     const cleanupDuplicateStars = () => {
//       const stars = loadStars();
//       const starsByDate: { [date: string]: Star[] } = {};
      
//       // Group stars by date
//       Object.values(stars).forEach(star => {
//         if (!starsByDate[star.date]) {
//           starsByDate[star.date] = [];
//         }
//         starsByDate[star.date].push(star);
//       });
      
//       // Keep only one star per date
//       const cleanedStars: StarMap = {};
//       Object.entries(starsByDate).forEach(([date, dateStars]) => {
//         if (dateStars.length > 1) {
//           // Merge all questions and languages from duplicate stars
//           const allQuestions = Array.from(new Set(dateStars.flatMap(s => s.questions || [s.question])));
//           const allLanguages = Array.from(new Set(dateStars.flatMap(s => s.languages)));
          
//           // Create single consolidated star
//           const starId = `star-${date}`;
//           cleanedStars[starId] = {
//             id: starId,
//             date: date,
//             question: allQuestions[0],
//             questions: allQuestions,
//             languages: allLanguages,
//             inJar: true,
//           };
//         } else {
//           // Keep the single star as is
//           const star = dateStars[0];
//           cleanedStars[star.id] = star;
//         }
//       });
      
//       // Save cleaned stars
//       saveStars(cleanedStars);
//       return cleanedStars;
//     };
    
//     const cleanedStars = cleanupDuplicateStars();
//     setStarsCount(Object.values(cleanedStars).filter(s => s.inJar).length);
    
//     // Listen for star updates
//     const updateStarsCount = () => {
//       setStarsCount(Object.values(loadStars()).filter(s => s.inJar).length);
//     };
    
//     window.addEventListener("stars-updated", updateStarsCount);
    
//     return () => {
//       window.removeEventListener("stars-updated", updateStarsCount);
//     };
//   }, []);

//   const calculateCurrentStreak = (data: DailyDataMap): number => {
//     const dates = Object.keys(data).sort().reverse();
//     let streak = 0;
//     let previousDate: Date | null = null;

//     for (const dateStr of dates) {
//       const currentDate = new Date(dateStr);
//       if (data[dateStr].status !== 'done') continue;

//       if (previousDate === null) {
//         streak = 1;
//         previousDate = currentDate;
//       } else {
//         const dayDiff = Math.floor((previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
//         if (dayDiff === 1) {
//           streak++;
//           previousDate = currentDate;
//         } else {
//           break;
//         }
//       }
//     }

//     return streak;
//   };

//   const checkAndAwardSticker = (newDailyData: DailyDataMap) => {
//     const currentStreak = calculateCurrentStreak(newDailyData);
    
//     // Update max streak if current is higher
//     if (currentStreak > maxStreak) {
//       setMaxStreak(currentStreak);
//       saveMaxStreak(currentStreak);
//     }

//     // Check if user has hit a 10-day streak milestone
//     if (currentStreak > 0 && currentStreak % 10 === 0) {
//       const stickersEarned = Math.floor(currentStreak / 10);
//       const currentStickers = loadStickers();
      
//       // Check if sticker for this milestone already awarded
//       const alreadyHasSticker = currentStickers.length >= stickersEarned;
      
//       if (!alreadyHasSticker) {
//         // Get available stickers that haven't been collected yet
//         const availableStickers = STICKER_IMAGES.filter(
//           s => !currentStickers.some(cs => cs.id === s.id)
//         );
        
//         if (availableStickers.length > 0) {
//           // Pick a random sticker from available ones
//           const randomSticker = availableStickers[Math.floor(Math.random() * availableStickers.length)];
//           const newSticker: Sticker = {
//             ...randomSticker,
//             earnedDate: new Date().toISOString(),
//           };
          
//           const updatedStickers = [...currentStickers, newSticker];
//           setCollectedStickers(updatedStickers);
//           saveStickers(updatedStickers);
          
//           toast.success(`${currentStreak}-day streak! You earned a sticker: ${newSticker.name}!`, {
//             duration: 5000,
//           });
//         }
//       }
//     }
//   };

//   const handleDateSelect = (date: Date) => {
//     setSelectedDate(date);
//     setIsDetailModalOpen(true);
//   };

//   const handleStarFloorClick = () => {
//     const today = new Date();
//     setSelectedDate(today);
//     setIsEditing(false);
//     setIsAddModalOpen(true);
//   };

//   const handleStarJarClick = (star: Star) => {
//     const today = format(new Date(), "yyyy-MM-dd");
//     const starDate = star.date;
    
//     // If the star is from today, open the date detail modal for editing
//     if (starDate === today) {
//       setSelectedDate(new Date(starDate));
//       setIsDetailModalOpen(true);
//     } else {
//       // For past dates, show star details
//       setSelectedStar(star);
//       setIsStarDetailModalOpen(true);
//     }
//   };

//   const handleSaveEntry = (data: { questions: QuestionData[]; status: string }) => {
//     if (!selectedDate) return;

//     const dateStr = format(selectedDate, "yyyy-MM-dd");
//     const newDailyData = { ...dailyData };
    
//     // Get existing data to check if we're updating
//     const existingData = newDailyData[dateStr];
    
//     // If editing existing entry, append new questions
//     if (isEditing && existingData) {
//       const existingQuestions = existingData.questions || [];
      
//       // Append new questions that don't already exist
//       const combinedQuestions = [...existingQuestions];
//       data.questions.forEach(q => {
//         if (!existingQuestions.some(eq => eq.text === q.text)) {
//           combinedQuestions.push(q);
//         }
//       });
      
//       newDailyData[dateStr] = {
//         questions: combinedQuestions,
//         status: data.status as "done" | "planned" | "not-done",
//       };
//     } else {
//       // New entry
//       newDailyData[dateStr] = {
//         questions: data.questions,
//         status: data.status as "done" | "planned" | "not-done",
//       };
//     }

//     setDailyData(newDailyData);
//     saveDailyData(newDailyData);

//     // Check for sticker awards based on streak
//     checkAndAwardSticker(newDailyData);

//     // If status is "done", create/update ONE star per day
//     if (data.status === "done") {
//       const stars = loadStars();
//       const starId = `star-${dateStr}`;
      
//       // Get the final questions
//       const finalQuestions = newDailyData[dateStr].questions;
      
//       // Collect all languages from all questions
//       const allLanguages = Array.from(new Set(finalQuestions.flatMap(q => q.languages)));
      
//       // Check if star already exists for this date
//       const existingStar = stars[starId];
      
//       if (!existingStar) {
//         // Create new star for this day
//         stars[starId] = {
//           id: starId,
//           date: dateStr,
//           question: finalQuestions[0].text, // Keep first question for backward compatibility
//           questions: finalQuestions.map(q => q.text),
//           languages: allLanguages,
//           inJar: true,
//         };
        
//         saveStars(stars);
//         setStarsCount(Object.values(stars).filter(s => s.inJar).length);
//         window.dispatchEvent(new Event("stars-updated"));
//         toast.success("Star added to jar!", {
//           duration: 3000,
//         });
//       } else {
//         // Update existing star with new questions
//         stars[starId] = {
//           ...existingStar,
//           questions: finalQuestions.map(q => q.text),
//           languages: allLanguages,
//         };
        
//         saveStars(stars);
//         window.dispatchEvent(new Event("stars-updated"));
//         toast.success("Entry updated!", {
//           duration: 2000,
//         });
//       }
//     }

//     setIsAddModalOpen(false);
//     setIsEditing(false);
//     toast.success("Entry saved successfully!", {
//       duration: 2000,
//     });
//   };

//   const handleEditClick = () => {
//     setIsDetailModalOpen(false);
//     setIsEditing(true);
//     setIsAddModalOpen(true);
//   };

//   const handleDeleteEntry = () => {
//     if (!selectedDate) return;
    
//     const dateStr = format(selectedDate, "yyyy-MM-dd");
    
//     // Remove daily data
//     const newDailyData = { ...dailyData };
//     delete newDailyData[dateStr];
//     setDailyData(newDailyData);
//     saveDailyData(newDailyData);
    
//     // Remove stars for this date
//     const stars = loadStars();
//     const starId = `star-${dateStr}`;
//     if (stars[starId]) {
//       delete stars[starId];
//       saveStars(stars);
//       setStarsCount(Object.values(stars).filter(s => s.inJar).length);
//       window.dispatchEvent(new Event("stars-updated"));
//     }
    
//     // Close modal
//     setIsDetailModalOpen(false);
//     toast.success("Entry deleted successfully!", {
//       duration: 2000,
//     });
//   };

//   const getCurrentDateData = () => {
//     if (!selectedDate) return null;
//     const dateStr = format(selectedDate, "yyyy-MM-dd");
//     return dailyData[dateStr] || null;
//   };

//   return (
//     <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
//       <div className="absolute top-10 left-10 text-4xl animate-sparkle"><img src="/sparkle-1.png" className="max-w-[100px]"/></div>
//       <div className="absolute top-20 right-20 text-3xl animate-sparkle" style={{ animationDelay: "0.5s" }}><img src="/sparkle-1.png" className="max-w-[100px]"/></div>
//       <div className="absolute bottom-20 left-1/4 text-2xl animate-sparkle" style={{ animationDelay: "1s" }}><img src="/sparkle-2.png" className="max-w-[100px]"/></div>
//       <div className="absolute top-50 left-20 text-3xl animate-sparkle" style={{ animationDelay: "0.5s" }}><img src="/sparkle-1.png" className="max-w-[100px]"/></div>
//       <div className="absolute bottom-50 right-40 text-2xl animate-sparkle" style={{ animationDelay: "1s" }}><img src="/sparkle-2.png" className="max-w-[100px]"/></div>


//       {/* Main Content */}
//       <div className="relative z-10 container mx-auto px-4 py-6 md:py-8 flex-1 flex flex-col justify-center">
//         {/* User Profile - Top Right */}
//         <div className="flex justify-end mb-4">
//           <UserProfile />
//         </div>
        
//         {/* Header */}
//         <header className="text-center mb-8 md:mb-12">
//           <h1 className="text-xl md:text-3xl lg:text-4xl xl:text-5xl font-pixel mb-2 md:mb-3 text-primary pixel-title">
//             Pixel Coding Tracker
//           </h1>
//           <p className="text-xs md:text-sm text-muted-foreground">
//             Track your competitive coding journey, one pixel star at a time!
//           </p>
//         </header>

//         {/* Two Column Layout: Calendar & Jar */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12 max-w-7xl mx-auto">
//           {/* Left: Calendar */}
//           <div className="flex justify-center items-start">
//             <PixelCalendar
//               selectedDate={selectedDate}
//               onDateSelect={handleDateSelect}
//               dailyData={dailyData}
//             />
//           </div>

//           {/* Right: Jar */}
//           <div className="flex justify-center items-start">
//             <StarJar onStarClick={handleStarJarClick} />
//           </div>
//         </div>

//         {/* Stats - Centered Below */}
//         <div className="flex justify-center gap-4 md:gap-6 flex-wrap max-w-5xl mx-auto">
//           <div 
//             onClick={() => (router as any).push('/statistics')}
//             className="bg-primary text-primary-foreground px-4 py-4 md:px-8 md:py-6 pixel-border text-center w-[140px] md:w-[180px] lg:w-[320px] h-[120px] md:h-[140px] lg:h-[150px] flex flex-col justify-center hover:brightness-110 transition-all cursor-pointer transform hover:scale-105"
//           >
//             <div className="text-2xl md:text-4xl font-bold mb-1">{starsCount}</div>
//             <div className="text-xs md:text-sm">Stars Collected</div>
//             <div className="text-[8px] md:text-[10px] text-primary-foreground/80 hover:text-primary-foreground underline mt-1">
//               View Statistics
//             </div>
//           </div>
//           <div 
//             onClick={() => (router as any).push('/stickers')}
//             className="bg-secondary text-secondary-foreground px-4 py-4 md:px-8 md:py-6 pixel-border text-center w-[140px] md:w-[180px] lg:w-[320px] h-[120px] md:h-[140px] lg:h-[150px] flex flex-col justify-center hover:brightness-110 transition-all cursor-pointer transform hover:scale-105"
//           >
//             <div className="text-2xl md:text-4xl font-bold mb-1">{collectedStickers.length}</div>
//             <div className="text-xs md:text-sm">Stickers Collected</div>
//             <div className="text-[8px] md:text-[10px] text-secondary-foreground/80 hover:text-secondary-foreground underline mt-1">
//               View Collection
//             </div>
//           </div>
//           <div className="bg-[#fff0b3] text-accent-foreground px-4 py-4 md:px-8 md:py-6 pixel-border text-center w-[140px] md:w-[180px] lg:w-[320px] h-[120px] md:h-[140px] lg:h-[150px] flex flex-col justify-center hover:brightness-110 transition-all cursor-pointer transform hover:scale-105">
//             <div className="text-2xl md:text-4xl font-bold mb-1">{maxStreak}</div>
//             <div className="text-xs md:text-sm">Maximum Streak Days</div>
//           </div>
//         </div>
//       </div>


//       {/* Modals */}
//       <AddEntryModal
//         isOpen={isAddModalOpen}
//         onClose={() => {
//           setIsAddModalOpen(false);
//           setIsEditing(false);
//         }}
//         date={selectedDate || new Date()}
//         onSave={handleSaveEntry}
//         initialData={isEditing ? getCurrentDateData() || undefined : undefined}
//       />

//       <DateDetailModal
//         isOpen={isDetailModalOpen}
//         onClose={() => setIsDetailModalOpen(false)}
//         date={selectedDate || new Date()}
//         data={getCurrentDateData()}
//         onEdit={handleEditClick}
//         onDelete={handleDeleteEntry}
//       />

//       <StarDetailModal
//         isOpen={isStarDetailModalOpen}
//         onClose={() => setIsStarDetailModalOpen(false)}
//         star={selectedStar}
//       />
//     </div>
//   );
// };

// export default Mainpage;
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

// storage wrappers (these should be the wrappers over your Zustand store)
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

  // Local UI state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isStarDetailModalOpen, setIsStarDetailModalOpen] = useState(false);
  const [selectedStar, setSelectedStar] = useState<Star | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Derived values from store (kept as values rather than copying entire objects)
  const [starsCount, setStarsCount] = useState(0);
  const [collectedStickersCount, setCollectedStickersCount] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  // === Load all data on first mount ===
  useEffect(() => {
    // Only load data if user is authenticated
    if (session?.data?.user || localStorage.getItem("user")) {
      loadAll().then(() => {
        // dispatch a legacy event for components that still listen to it
        window.dispatchEvent(new Event("stars-updated"));
      }).catch((err) => {
        console.error("Failed to load tracker data", err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // === Keep counts in sync with store ===
  useEffect(() => {
    // starsMap is a map keyed by date -> star object; compute in-jar count
    const sc = Object.values(starsMap || {}).filter((s) => s.inJar !== false).length;
    setStarsCount(sc);
    setCollectedStickersCount((stickers || []).length);
    setMaxStreak(maxStreakFromStore || 0);
  }, [starsMap, stickers, maxStreakFromStore]);

  // === Helpers ===
  const calculateCurrentStreak = (data: DailyDataMap): number => {
    // Keep same streak logic but use dates sorted descending
    const dates = Object.keys(data).sort().reverse();
    let streak = 0;
    let previousDate: Date | null = null;

    for (const dateStr of dates) {
      const entry = data[dateStr];
      if (!entry || entry.status !== "done") continue;

      // Use safe parsing (replace - with / to ensure local parsing)
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
      await loadAll();

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
