import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/lib/models/Users";

export async function POST(req: Request) {
  try {
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

    return NextResponse.json(
      { message: "User registered successfully", user },
      { status: 201 }
    );

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
