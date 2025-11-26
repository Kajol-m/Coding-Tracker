// app/api/tracker/sticker/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Sticker from "@/lib/models/sticker";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });

    const user_id = session.user.user_id || session.user.email;
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
