// // app/api/tracker/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import DailyEntry from "@/lib/models/DailyEntry";
// import Star from "@/lib/models/star";
// import Sticker from "@/lib/models/sticker";
// import Streak from "@/lib/models/streak";
// import { getAuthenticatedUser } from "@/lib/authMiddleware";

// export async function GET(req: NextRequest) {
//   try {
//     const authUser = await getAuthenticatedUser(req);
//     if (!authUser) {
//       return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
//     }

//     const user_id = authUser.user_id; // prefer user_id if present
//     // Fetch all relevant data
//     const [entries, stars, stickers, streak] = await Promise.all([
//       DailyEntry.find({ user_id }).lean(),
//       Star.find({ user_id }).lean(),
//       Sticker.find({ user_id }).lean(),
//       Streak.findOne({ user_id }).lean(),
//     ]);

//     // Transform entries to map keyed by date (matching your client)
//     const dailyEntries: Record<string, any> = {};
//     entries.forEach(e => {
//       dailyEntries[e.date] = {
//         status: e.status,
//         questions: e.questions,
//         languages: e.languages,
//       };
//     });

//     const starMap: Record<string, any> = {};
//     stars.forEach(s => starMap[s.date] = s);

//     return NextResponse.json({
//       dailyEntries,
//       stars: starMap,
//       stickers,
//       maxStreak: streak?.maxStreak ?? 0,
//     });
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json({ message: "Server error" }, { status: 500 });
//   }
// }
// app/api/tracker/route.ts
import { NextRequest, NextResponse } from "next/server";
import DailyEntry from "@/lib/models/DailyEntry";
import Star from "@/lib/models/star";
import Sticker from "@/lib/models/sticker";
import Streak from "@/lib/models/streak";
import { getAuthenticatedUser } from "@/lib/authMiddleware";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const user_id = authUser.user_id;

    // Fetch user tracking data in parallel
    const [entries, stars, stickers, streak] = await Promise.all([
      DailyEntry.find({ user_id }).lean(),
      Star.find({ user_id }).lean(),
      Sticker.find({ user_id }).lean(),
      Streak.findOne({ user_id }).lean(),
    ]);

    // ---- Map entries by date ----
    const dailyEntries: Record<string, { status: string; questions: unknown[]; languages: string[] }> = {};

    entries.forEach((e: { date: string; status: string; questions: unknown[]; languages: string[] }) => {
      dailyEntries[e.date] = {
        status: e.status,
        questions: e.questions,
        languages: e.languages,
      };
    });

    // ---- Map stars by date ----
    const starsMap: Record<string, { date: string; [key: string]: unknown }> = {};
    stars.forEach((s: { date: string; [key: string]: unknown }) => {
      starsMap[s.date] = s;
    });

    return NextResponse.json(
      {
        dailyEntries,
        stars: starsMap,
        stickers,
        maxStreak: (streak as { maxStreak?: number })?.maxStreak ?? 0,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/tracker error:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
