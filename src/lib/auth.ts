import type { NextAuthOptions } from "next-auth";
import type { Provider } from "next-auth/providers/index";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      locale: string;
      businessId: string | null;
      role: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    locale?: string;
    businessId?: string | null;
    role?: string | null;
  }
}

const providers: Provider[] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const attemptKey = `login:${credentials.email.toLowerCase().trim()}`;
      const { allowed } = rateLimit(attemptKey, 8, 5 * 60_000);
      if (!allowed) return null;

      const user = await prisma.user.findUnique({
        where: { email: credentials.email.toLowerCase().trim() },
      });
      if (!user || !user.passwordHash) return null;

      const valid = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!valid) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image ?? undefined,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        // Upsert a local User row for Google sign-ins so the rest of the
        // app only ever deals with our own User model.
        await prisma.user.upsert({
          where: { email: user.email.toLowerCase() },
          update: { name: user.name ?? undefined, image: user.image ?? undefined },
          create: {
            email: user.email.toLowerCase(),
            name: user.name ?? user.email,
            image: user.image ?? undefined,
          },
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      const email = user?.email ?? token.email;
      if (email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { memberships: { take: 1, orderBy: { createdAt: "asc" } } },
        });
        if (dbUser) {
          token.uid = dbUser.id;
          token.locale = dbUser.locale;
          token.businessId = dbUser.memberships[0]?.businessId ?? null;
          token.role = dbUser.memberships[0]?.role ?? null;
          token.name = dbUser.name;
          token.email = dbUser.email;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid) {
        session.user.id = token.uid;
        session.user.locale = token.locale ?? "he";
        session.user.businessId = token.businessId ?? null;
        session.user.role = token.role ?? null;
      }
      return session;
    },
  },
};
