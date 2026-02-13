import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import KakaoProvider from "next-auth/providers/kakao";
import { prisma } from "@/lib/prisma";

// Validate required environment variables
const requiredEnvVars = {
  KAKAO_CLIENT_ID: process.env.KAKAO_CLIENT_ID,
  KAKAO_CLIENT_SECRET: process.env.KAKAO_CLIENT_SECRET,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
};

const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  console.error(
    `[NextAuth] Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
}

// NEXTAUTH_URL 자동 감지 (Vercel 배포 시 VERCEL_URL 사용)
if (!process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
  console.log(`[NextAuth] NEXTAUTH_URL auto-detected: ${process.env.NEXTAUTH_URL}`);
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID ?? "",
      clientSecret: process.env.KAKAO_CLIENT_SECRET ?? "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log("[NextAuth] signIn callback:", {
        userId: user?.id,
        provider: account?.provider,
      });
      return true;
    },
    async redirect({ url, baseUrl }) {
      // 콜백 URL 안전 처리 - 같은 도메인이면 허용, 아니면 홈으로
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async session({ session, user }) {
      // 세션에 사용자 ID 추가
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      console.log("[NextAuth] signIn event:", { userId: user?.id, provider: account?.provider });
    },
    async createUser({ user }) {
      console.log("[NextAuth] createUser event:", { userId: user?.id, email: user?.email });
    },
    async linkAccount({ user, account }) {
      console.log("[NextAuth] linkAccount event:", { userId: user?.id, provider: account?.provider });
    },
  },
  logger: {
    error(code, metadata) {
      console.error("[NextAuth Error]", code, metadata);
    },
    warn(code) {
      console.warn("[NextAuth Warning]", code);
    },
    debug(code, metadata) {
      console.log("[NextAuth Debug]", code, metadata);
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
};
