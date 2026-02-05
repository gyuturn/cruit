import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? "SET (hidden)" : "NOT SET",
      DIRECT_URL: process.env.DIRECT_URL ? "SET (hidden)" : "NOT SET",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET (hidden)" : "NOT SET",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "NOT SET",
      KAKAO_CLIENT_ID: process.env.KAKAO_CLIENT_ID ? "SET (hidden)" : "NOT SET",
      KAKAO_CLIENT_SECRET: process.env.KAKAO_CLIENT_SECRET ? "SET (hidden)" : "NOT SET",
    },
  };

  // Test database connection
  try {
    await prisma.$connect();
    results.dbConnection = "SUCCESS";

    // Test User table
    const userCount = await prisma.user.count();
    results.userCount = userCount;

    // Test Account table
    const accountCount = await prisma.account.count();
    results.accountCount = accountCount;

    // Test Session table
    const sessionCount = await prisma.session.count();
    results.sessionCount = sessionCount;

    // Test creating a dummy operation (don't actually create)
    results.tablesAccessible = true;
  } catch (error) {
    results.dbConnection = "FAILED";
    results.dbError = error instanceof Error ? error.message : String(error);
    results.dbErrorStack = error instanceof Error ? error.stack : undefined;
  } finally {
    await prisma.$disconnect();
  }

  return NextResponse.json(results, { status: results.dbConnection === "SUCCESS" ? 200 : 500 });
}
