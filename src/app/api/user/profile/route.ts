import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/authMiddleware";
import connectDB from "@/lib/db";
import User from "@/lib/models/Users";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: authUser.email });
    
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user_id: user.user_id,
      user_name: user.user_name,
      email: user.email,
      provider: user.provider,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}