// app/api/tracker/star/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Star from "@/lib/models/star";
import { getAuthenticatedUser } from "@/lib/authMiddleware";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    }

    await connectDB();
    const user_id = authUser.user_id;
    const body = await req.json();
    const { date, questions = [], languages = [], inJar = true } = body;
    if (!date) return NextResponse.json({ message: "Missing date" }, { status: 400 });

    const star = await Star.findOneAndUpdate(
      { user_id, date },
      { $set: { questions, languages, inJar } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ star }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
