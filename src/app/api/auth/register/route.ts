import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/lib/models/Users";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { signToken, signRefreshToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 3 attempts per hour per IP
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const rateLimitCheck = checkRateLimit(ip, RATE_LIMITS.REGISTER);
    
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { message: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    await connectDB();

    const { user_name, email, password } = await req.json();

    if (!user_name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const userExists = await User.findOne({ email });

    // If user exists and was created by Google OAuth
    if (userExists && userExists.provider === "google") {
      return NextResponse.json(
        { message: "Email already used for Google login. Please use Google Sign-In." },
        { status: 409 }
      );
    }

    if (userExists) {
      return NextResponse.json(
        { message: "Email already registered." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      user_name,
      email,
      password: hashedPassword,
      provider: "local",
    });

    // Auto-login after registration by generating tokens
    const tokenPayload = {
      id: user.user_id,
      email: user.email,
    };

    const token = signToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const response = NextResponse.json(
      {
        message: "User registered successfully",
        token,
        refreshToken,
        user: {
          user_id: user.user_id,
          user_name: user.user_name,
          email: user.email,
          provider: user.provider,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );

    // Set httpOnly cookies
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
    console.error("REGISTER ERROR:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

