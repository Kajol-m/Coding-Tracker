import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/lib/models/Users";
import { signToken, signRefreshToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Get user and include password (if exists)
    const user = await User.findOne({ email }).select("+password +provider");

    if (!user) {
      return NextResponse.json(
        { message: "User does not exist" },
        { status: 404 }
      );
    }

    // 🚨 If Google account → block password login
    if (user.provider === "google") {
      return NextResponse.json(
        { message: "This account uses Google Sign-In. Please continue with Google." },
        { status: 401 }
      );
    }

    // Password should exist only for local users
    const isValid = await bcrypt.compare(password, user.password || "");

    if (!isValid) {
      return NextResponse.json(
        { message: "Incorrect password" },
        { status: 401 }
      );
    }

    const tokenPayload = {
      id: user.user_id,
      email: user.email,
    };

    const token = signToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const response = NextResponse.json({
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        user_name: user.user_name,
        provider: user.provider,
      },
    });

    // Set cookies
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 // 15 minutes
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
