import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";

const resetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = resetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { token, newPassword } = validation.data;

    const record = await prisma.verificationToken.findFirst({
      where: {
        token,
        type: "password_reset",
      },
    });

    if (!record || record.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Invalid or expired password reset token. Please request a new link." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { email: record.identifier },
      data: { passwordHash },
    });

    // Clean up used token
    await prisma.verificationToken.delete({
      where: { id: record.id },
    }).catch(() => {});

    return NextResponse.json(
      { success: true, message: "Your password has been successfully reset. You may now sign in." },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: `Reset password error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
