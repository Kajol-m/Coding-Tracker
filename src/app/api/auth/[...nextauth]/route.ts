import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/lib/db";
import User from "@/lib/models/Users";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET!,
    }),
  ],

  secret: process.env.AUTH_SECRET,

  callbacks: {
    async signIn({ user, account }) {
      await connectDB();

      if (account?.provider === "google") {
        await User.findOneAndUpdate(
          { email: user.email },
          {
            $setOnInsert: {
              user_name: user.name,
              email: user.email,
              provider: "google",
            },
          },
          { upsert: true, new: true }
        );
      }

      return true;
    },

    async jwt({ token }) {
      await connectDB();

      const dbUser = await User.findOne({ email: token.email }).select(
        "user_id user_name email provider"
      );

      if (dbUser) {
        token.user_id = dbUser.user_id;
        token.user_name = dbUser.user_name;
        token.provider = dbUser.provider;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.user_id = token.user_id as string;
        session.user.user_name = token.user_name as string;
        session.user.provider = token.provider as string;
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
