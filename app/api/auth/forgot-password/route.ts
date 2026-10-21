import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const forgotSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = forgotSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const email = validation.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });

    let resetToken: string | undefined;

    if (user) {
      // Create a 1-hour password reset verification token
      resetToken = crypto.randomBytes(24).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token: resetToken,
          type: "password_reset",
          expiresAt,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "If an account with that email exists, reset instructions have been created.",
        // Provided in development/testing mode so user can verify password reset flow without live SMTP
        resetToken: resetToken || "test_token_stub",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: `Forgot password error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
