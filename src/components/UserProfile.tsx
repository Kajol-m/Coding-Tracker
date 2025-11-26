'use client'
import { useEffect } from "react";
import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTrackerStore } from "@/lib/store/userTrackerStore";

export default function UserProfile() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = useTrackerStore((s) => s.user);
  const loadUser = useTrackerStore((s) => s.loadUser);
  
  // Initialize user data from API on first render
  if (user.name === "Guest" && typeof window !== "undefined") {
    if (session?.user?.name || localStorage.getItem("user")) {
      loadUser();
    }
  }
  
  const userName = user.name.split(/\s+/)[0];
  
  useEffect(() => {
    // Load user data when session changes
    if (session?.user || localStorage.getItem("user")) {
      loadUser();
    }
  }, [session, loadUser]);

  return (
    <button
      onClick={() => router.push('/profile')}
      className="flex items-center gap-2 bg-secondary hover:bg-primary transition-colors px-3 py-2 pixel-border-sm group"
    >
      <User className="w-4 h-4 md:w-5 md:h-5 text-secondary-foreground group-hover:text-primary-foreground" />
      <span className="text-xs md:text-sm font-pixel text-secondary-foreground group-hover:text-primary-foreground">
        {userName}
      </span>
    </button>
  );
}