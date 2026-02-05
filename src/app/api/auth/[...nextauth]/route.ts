import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

const handler = NextAuth(authOptions);

// Wrapper to catch and log errors
async function wrappedHandler(req: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  try {
    const params = await context.params;
    console.log("[NextAuth Route]", {
      method: req.method,
      url: req.url,
      nextauth: params.nextauth,
    });

    return handler(req, context);
  } catch (error) {
    console.error("[NextAuth Route Error]", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

export { wrappedHandler as GET, wrappedHandler as POST };
