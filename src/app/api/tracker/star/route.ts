// app/api/tracker/star/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Star from "@/lib/models/star";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    const user_id = session.user.user_id || session.user.email;
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
