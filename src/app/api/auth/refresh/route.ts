import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/Users";
import { signToken, verifyRefreshToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json(
        { message: "Refresh token required" },
        { status: 400 }
      );
    }

    // Verify the refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return NextResponse.json(
        { message: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    // Verify user still exists
    await connectDB();
    const user = await User.findOne({ user_id: payload.id });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Generate new access token
    const newToken = signToken({
      id: user.user_id,
      email: user.email,
    });

    const response = NextResponse.json({
      token: newToken,
      message: "Token refreshed successfully",
    });

    // Update access token cookie
    response.cookies.set("token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60, // 15 minutes
    });

    return response;
  } catch (error) {
    console.error("REFRESH TOKEN ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
