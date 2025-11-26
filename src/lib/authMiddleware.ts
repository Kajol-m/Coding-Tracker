// import { NextRequest } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";
// import { verifyToken } from "@/lib/auth";
// import connectDB from "@/lib/db";
// import User from "@/lib/models/Users";

// export async function getAuthenticatedUser(req: NextRequest) {
//   await connectDB();
  
//   // Try NextAuth session first (Google login)
//   try {
//     const session = await getServerSession(authOptions);
//     if (session?.user?.email) {
//       return {
//         user_id: session.user.user_id || session.user.email,
//         email: session.user.email,
//         provider: "google"
//       };
//     }
//   } catch (err) {
//     console.log("NextAuth session check failed:", err);
//   }

//   // Try JWT token from cookies (email/password login)
//   const token = req.cookies.get('token')?.value;
//   if (token) {
//     try {
//       const decoded = verifyToken(token) as any;
//       const user = await User.findOne({ email: decoded.email });
//       if (user) {
//         return {
//           user_id: user.user_id || user.email,
//           email: user.email,
//           provider: "local"
//         };
//       }
//     } catch (err) {
//       // Token invalid, continue to check headers
//     }
//   }

//   // Try Authorization header as fallback
//   const authHeader = req.headers.get('authorization');
//   if (authHeader?.startsWith('Bearer ')) {
//     const headerToken = authHeader.substring(7);
//     try {
//       const decoded = verifyToken(headerToken) as any;
//       const user = await User.findOne({ email: decoded.email });
//       if (user) {
//         return {
//           user_id: user.user_id || user.email,
//           email: user.email,
//           provider: "local"
//         };
//       }
//     } catch (err) {
//       // Token invalid
//     }
//   }

//   return null;
// }
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { verifyToken } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/lib/models/Users";

export interface AuthenticatedUser {
  user_id: string;
  email: string;
  provider: "google" | "local";
}

export async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  await connectDB();

  /** 1️⃣ Try NextAuth session (Google OAuth) */
  try {
    const session = await getServerSession(authOptions);

    if (session?.user?.email) {
      const user = await User.findOne({ email: session.user.email });

      if (user) {
        return {
          user_id: user.user_id || user._id.toString(),
          email: user.email,
          provider: "google",
        };
      }
    }
  } catch (err) {
    console.log("NextAuth session failed:", err);
  }

  /** 2️⃣ Try JWT token stored in cookies (local login) */
  const token = req.cookies.get("token")?.value;

  if (token) {
    try {
      const decoded = verifyToken(token) as { email: string };

      const user = await User.findOne({ email: decoded.email });

      if (user) {
        return {
          user_id: user.user_id || user._id.toString(),
          email: user.email,
          provider: "local",
        };
      }
    } catch {
      // Token invalid, continue to header auth
    }
  }

  /** 3️⃣ Try Authorization header (mobile clients etc.) */
  const authHeader = req.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    try {
      const decoded = verifyToken(token) as { email: string };

      const user = await User.findOne({ email: decoded.email });

      if (user) {
        return {
          user_id: user.user_id || user._id.toString(),
          email: user.email,
          provider: "local",
        };
      }
    } catch {
      // Token invalid
    }
  }

  return null;
}
