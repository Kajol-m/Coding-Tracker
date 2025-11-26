import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      user_id?: string
      user_name?: string
      provider?: string
    } & DefaultSession["user"]
  }

  interface JWT {
    user_id?: string
    user_name?: string
    provider?: string
  }
}