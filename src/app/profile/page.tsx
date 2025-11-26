"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, LogOut } from "lucide-react";
import { useTrackerStore } from "@/lib/store/userTrackerStore";
import { signOut, useSession } from "next-auth/react";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function Profile() {
  // Type for star entries in the tracker store
  type Star = { inJar?: boolean };
  const router = useRouter();
  const { data: session } = useSession();
  const isAuthorized = useAuthGuard(); // Use auth guard hook
  const stars = useTrackerStore((s) => s.stars);
  const stickers = useTrackerStore((s) => s.stickers);
  const loadAll = useTrackerStore((s) => s.loadAll);
  const loadUser = useTrackerStore((s) => s.loadUser);
  const setUser = useTrackerStore((s) => s.setUser);
  const userData = useTrackerStore((s) => s.user);
  
  const starsCount = (Object.values(stars || {}) as Star[]).filter((s) => s.inJar !== false).length;
  const stickersCount = (stickers || []).length;
 
  // Load user and tracker data if authenticated
  useEffect(() => {
    if (isAuthorized) {
      // If we have session user data, use it immediately as fallback
      if (session?.user?.name || session?.user?.email) {
        console.log("Setting user from session:", { name: session.user.name, email: session.user.email });
        setUser({
          name: session.user.name || "PixelCoder",
          email: session.user.email || "guest@example.com",
          joinDate: "January 2025",
        });
      }
      // Then try to load full user data from API
      loadUser();
      loadAll();
    }
  }, [loadAll, loadUser, setUser, session, isAuthorized]);

  // Don't render until authorized
  if (isAuthorized === null) {
    return null;
  }


  const handleLogout = async () => {
    try {
      // Clear localStorage data
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      // Sign out and redirect to auth page
      await signOut({ redirect: false });
      router.push("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="relative z-10 container mx-auto px-4 py-6 md:py-8 flex-1">
        {/* Profile Content */}
        <div className="max-w-4xl mx-auto">
          {/* Header aligned with container */}
          <div className="flex items-center gap-4 mb-6 md:mb-8">
            <button
              onClick={() => router.push("/")}
              className="bg-secondary hover:bg-primary transition-colors p-2 md:p-3 pixel-border-sm group"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-secondary-foreground group-hover:text-primary-foreground" />
            </button>
            <h1 className="text-xl md:text-3xl lg:text-4xl font-pixel text-primary pixel-title">
              Profile
            </h1>
          </div>

          {/* Profile Card */}
          <div className="bg-card pixel-border-lg p-6 md:p-8 mb-6 md:mb-8">
            {/* Avatar Section */}
            <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
              <div className="bg-primary/20 p-6 md:p-8 pixel-border rounded-full">
                <User className="w-12 h-12 md:w-16 md:h-16 text-primary" />
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-pixel text-primary mb-2">
                  {userData.name}
                </h2>
                <div className="flex items-center gap-2 text-muted-foreground mb-2 justify-center md:justify-start">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{userData.email}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Member since {userData.joinDate}
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
              <div className="bg-primary/10 p-4 md:p-6 pixel-border text-center">
                <img
                  src={"/assets/yellow_star.png"}
                  alt="Star"
                  className="w-8 h-8 md:w-16 md:h-16 lg:w-20 lg:h-20 mx-auto mb-2"
                />
                <div className="text-2xl md:text-3xl font-pixel text-primary mb-1">
                  {starsCount}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  Stars Collected
                </div>
              </div>

              <div className="bg-secondary/20 p-4 md:p-6 pixel-border text-center">
                <img
                  src={"/assets/trophy.png"}
                  alt="Star"
                  className="w-8 h-8 md:w-16 md:h-16 lg:w-20 lg:h-20 mx-auto mb-2"
                />
                <div className="text-2xl md:text-3xl font-pixel text-primary mb-1">
                  {stickersCount}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  Stickers Earned
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push("/statistics")}
                className="bg-primary hover:bg-primary/80 text-primary-foreground px-6 py-3 pixel-border font-pixel text-sm transition-colors"
              >
                View Statistics
              </button>

              <button
                onClick={() => router.push("/stickers")}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-6 py-3 pixel-border font-pixel text-sm transition-colors"
              >
                View Stickers
              </button>
            </div>
          </div>

          {/* Logout Section */}
          <div className="bg-card pixel-border-lg p-6 md:p-8">
            <h3 className="text-lg md:text-xl font-pixel text-primary mb-4">
              Account Actions
            </h3>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-destructive hover:bg-destructive/80 text-destructive-foreground px-6 py-3 pixel-border font-pixel text-sm transition-colors w-full sm:w-auto justify-center"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
