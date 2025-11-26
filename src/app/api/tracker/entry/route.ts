// // app/api/tracker/entry/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import connectDB from "@/lib/db";
// import DailyEntry from "@/lib/models/DailyEntry";
// import Star from "@/lib/models/star";
// import Streak from "@/lib/models/streak";
// import { getAuthenticatedUser } from "@/lib/authMiddleware";

// export async function POST(req: NextRequest) {
//   try {
//     const authUser = await getAuthenticatedUser(req);
//     if (!authUser) {
//       return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
//     }

//     const user_id = authUser.user_id;
//     const body = await req.json();
//     const { date, status, questions } = body; // date "yyyy-MM-dd"

//     if (!date) return NextResponse.json({ message: "Missing date" }, { status: 400 });

//     const languages = Array.from(new Set((questions || []).flatMap((q: any) => q.languages || [])));

//     const updated = await DailyEntry.findOneAndUpdate(
//       { user_id, date },
//       { $set: { status, questions, languages } },
//       { upsert: true, new: true }
//     );

//     // If status === 'done' -> ensure a Star exists / update star
//     if (status === "done") {
//       const starQuestions = (questions || []).map((q: any) => q.text || "");
//       await Star.findOneAndUpdate(
//         { user_id, date },
//         { $set: { questions: starQuestions, languages, inJar: true } },
//         { upsert: true, new: true }
//       );
//     } else {
//       // not done -> remove star if present
//       await Star.deleteOne({ user_id, date });
//     }

//     // Recompute maxStreak in DB (simple approach)
//     // You could compute incrementally; for simplicity recalc from entries
//     const all = await DailyEntry.find({ user_id }).sort({ date: 1 }).lean();
//     // compute max streak
//     let max = 0, cur = 0, prevDate: string | null = null;
//     for (const e of all.sort((a: any, b: any) => a.date.localeCompare(b.date))) {
//       if ((e as any).status === "done") {
//         if (!prevDate) { cur = 1; }
//         else {
//           const pd = new Date(prevDate);
//           const cd = new Date((e as any).date);
//           const diff = Math.floor((cd.getTime() - pd.getTime()) / (1000*60*60*24));
//           if (diff === 1) cur++;
//           else cur = 1;
//         }
//         prevDate = (e as any).date;
//         if (cur > max) max = cur;
//       } else {
//         prevDate = null;
//         cur = 0;
//       }
//     }
//     await Streak.findOneAndUpdate({ user_id }, { $set: { maxStreak: max } }, { upsert: true });

//     return NextResponse.json({ message: "Saved", entry: updated }, { status: 200 });
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json({ message: "Server error" }, { status: 500 });
//   }
// }


// export async function DELETE(req: NextRequest) {
//   try {
//     const authUser = await getAuthenticatedUser(req);
//     if (!authUser) {
//       return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
//     }

//     const user_id = authUser.user_id;
//     const { searchParams } = new URL(req.url);
//     const date = searchParams.get("date");
//     if (!date) return NextResponse.json({ message: "Missing date" }, { status: 400 });

//     await DailyEntry.deleteOne({ user_id, date });
//     await Star.deleteOne({ user_id, date });

//     // recompute max streak similar to POST handler (omitted here for brevity) — better to call GET after delete from client

//     return NextResponse.json({ message: "Deleted" }, { status: 200 });
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json({ message: "Server error" }, { status: 500 });
//   }
// }
// app/api/tracker/entry/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import DailyEntry from "@/lib/models/DailyEntry";
import Star from "@/lib/models/star";
import Streak from "@/lib/models/streak";
import { getAuthenticatedUser } from "@/lib/authMiddleware";

// -------------------------
// TYPE DEFINITIONS
// -------------------------
interface QuestionInput {
  text: string;
  languages: string[];
}

interface RequestBody {
  date: string;
  status: "done" | "planned" | "not-done";
  questions: QuestionInput[];
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const user_id = authUser.user_id;

    const body: RequestBody = await req.json();
    const { date, status, questions } = body;

    if (!date) {
      return NextResponse.json({ message: "Missing date" }, { status: 400 });
    }

    // Extract unique languages
    const languages: string[] = Array.from(
      new Set(questions.flatMap((q) => q.languages))
    );

    // Save daily entry
    const updated = await DailyEntry.findOneAndUpdate(
      { user_id, date },
      { $set: { status, questions, languages } },
      { upsert: true, new: true }
    );

    // Manage star logic
    if (status === "done") {
      const starQuestions = questions.map((q) => q.text);

      await Star.findOneAndUpdate(
        { user_id, date },
        {
          $set: {
            questions: starQuestions,
            languages,
            inJar: true,
          },
        },
        { upsert: true, new: true }
      );
    } else {
      await Star.deleteOne({ user_id, date });
    }

    // -------------------------
    // RECOMPUTE MAX STREAK
    // -------------------------
    const allEntries = await DailyEntry.find({ user_id })
      .sort({ date: 1 })
      .lean();

    let max = 0;
    let cur = 0;
    let prevDate: string | null = null;

    for (const entry of allEntries.sort((a, b) => a.date.localeCompare(b.date))) {
      if (entry.status === "done") {
        if (!prevDate) {
          cur = 1;
        } else {
          const prev = new Date(prevDate);
          const curr = new Date(entry.date);
          const diff =
            (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

          cur = diff === 1 ? cur + 1 : 1;
        }

        if (cur > max) max = cur;
        prevDate = entry.date;
      } else {
        cur = 0;
        prevDate = null;
      }
    }

    await Streak.findOneAndUpdate(
      { user_id },
      { $set: { maxStreak: max } },
      { upsert: true }
    );

    return NextResponse.json(
      { message: "Saved", entry: updated },
      { status: 200 }
    );
  } catch (err) {
    console.error("POST /entry error:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const user_id = authUser.user_id;

    const url = new URL(req.url);
    const date = url.searchParams.get("date");

    if (!date) {
      return NextResponse.json({ message: "Missing date" }, { status: 400 });
    }

    await DailyEntry.deleteOne({ user_id, date });
    await Star.deleteOne({ user_id, date });

    return NextResponse.json({ message: "Deleted" }, { status: 200 });
  } catch (err) {
    console.error("DELETE /entry error:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
