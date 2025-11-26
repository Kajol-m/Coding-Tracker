"use client";
import { useState, useEffect } from "react";
import { loadStickers } from "@/lib/storage";
import type { Sticker } from "@/types/tracker";
import { PixelButton } from "@/components/ui/pixel-button";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import UserProfile from "@/components/UserProfile";

const ALL_STICKERS = [
  { id: 1, name: "Hot Air Balloon", image: "/assets/sticker-1.png" },
  { id: 2, name: "Keep Shining", image: "/assets/sticker-2.png" },
  { id: 3, name: "You've Got This", image: "/assets/sticker-3.png" },
  { id: 4, name: "Dream Big", image: "/assets/sticker-4.png" },
  { id: 5, name: "Stay Positive", image: "/assets/sticker-5.png" },
  { id: 6, name: "Great Work", image: "/assets/sticker-6.png" },
  { id: 7, name: "Grow at Your Own Pace", image: "/assets/sticker-7.png" },
];

const StickersCollection = () => {
  const navigate = useRouter();
  const { data: session, status } = useSession();

  const isAuthenticated = session?.user || localStorage.getItem("token");
  const [collectedStickers] = useState<Sticker[]>(() => 
    isAuthenticated ? loadStickers() : []
  );

  useEffect(() => {
    if (status === "loading") return;
    
    if (!isAuthenticated) {
      navigate.push("/auth");
    }
  }, [status, navigate, isAuthenticated]);

  if (status === "loading" || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary font-pixel">Loading...</div>
      </div>
    );
  }

  const getStickerCount = (stickerId: number) => {
    return collectedStickers.filter((s) => s.id === stickerId).length;
  };

  const isStickerCollected = (stickerId: number) => {
    return collectedStickers.some((s) => s.id === stickerId);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-10 left-10 text-4xl animate-sparkle">
        <img src="/sparkle-1.png" className="max-w-[100px]" />
      </div>
      <div
        className="absolute top-20 right-20 text-3xl animate-sparkle"
        style={{ animationDelay: "0.5s" }}
      >
        <img src="/sparkle-1.png" className="max-w-[100px]" />
      </div>
      <div
        className="absolute bottom-20 left-1/4 text-2xl animate-sparkle"
        style={{ animationDelay: "1s" }}
      >
        <img src="/sparkle-2.png" className="max-w-[100px]" />
      </div>
      <div
        className="absolute top-50 left-20 text-3xl animate-sparkle"
        style={{ animationDelay: "0.5s" }}
      >
        <img src="/sparkle-1.png" className="max-w-[100px]" />
      </div>
      <div
        className="absolute bottom-50 right-40 text-2xl animate-sparkle"
        style={{ animationDelay: "1s" }}
      >
        <img src="/sparkle-2.png" className="max-w-[100px]" />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-end mb-4">
          <UserProfile />
        </div>
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-pixel mb-3 text-primary">
            Sticker Collection
          </h1>
          <p className="text-xs text-muted-foreground mb-6">
            Collect all stickers by maintaining coding streaks!
          </p>
          <PixelButton variant="secondary" onClick={() => navigate.push("/")}>
            ← Back to Tracker
          </PixelButton>
        </header>

        {/* Stats */}
        <div className="text-center mb-8">
          <div className="bg-primary text-primary-foreground px-6 py-4 pixel-border inline-block">
            <div className="text-2xl font-bold">
              {collectedStickers.length} / {ALL_STICKERS.length}
            </div>
            <div className="text-xs">Stickers Collected</div>
          </div>
        </div>

        {/* Stickers Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {ALL_STICKERS.map((sticker) => {
            const collected = isStickerCollected(sticker.id);
            const count = getStickerCount(sticker.id);

            return (
              <div
                key={sticker.id}
                className="bg-card pixel-border p-4 flex flex-col items-center justify-center transition-transform hover:scale-105"
              >
                <div className="relative w-full aspect-square mb-3">
                  <img
                    src={sticker.image}
                    alt={collected ? sticker.name : "Locked sticker"}
                    className={`w-full h-full object-contain ${
                      !collected ? "grayscale opacity-40" : ""
                    }`}
                  />
                  {!collected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img
                        src={"/assets/lock.png"}
                        alt="Locked"
                        className="w-1/3 h-1/3 object-contain"
                      />
                    </div>
                  )}
                </div>
                <div className="text-xs text-center">
                  {collected ? (
                    <span className="text-primary font-bold">
                      Collected: {count}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Not Collected</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-12 text-center max-w-2xl mx-auto">
          <div className="bg-secondary/20 pixel-border p-6">
            <p className="text-sm text-muted-foreground">
              Earn stickers by maintaining consecutive daily coding streaks!
              Every 10-day streak unlocks a random sticker.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickersCollection;
