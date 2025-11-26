// app/api/tracker/sticker/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Sticker from "@/lib/models/sticker";
import { getAuthenticatedUser } from "@/lib/authMiddleware";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    }

    await connectDB();
    const user_id = authUser.user_id;
    const { stickerId, name, image } = await req.json();
    if (!stickerId) return NextResponse.json({ message: "Missing stickerId" }, { status: 400 });

    const sticker = await Sticker.findOneAndUpdate(
      { user_id, stickerId },
      { $setOnInsert: { user_id, stickerId, name, image, earnedDate: new Date() } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ sticker }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
