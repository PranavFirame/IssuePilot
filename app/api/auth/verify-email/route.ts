import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const verifySchema = z.object({
  token: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Missing or invalid token" }, { status: 400 });
    }

    const { token } = validation.data;
    const record = await prisma.verificationToken.findFirst({
      where: {
        token,
        type: "email_verification",
      },
    });

    if (!record || record.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Invalid or expired verification token." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { email: record.identifier },
      data: { isVerified: true },
    });

    await prisma.verificationToken.delete({ where: { id: record.id } }).catch(() => {});

    return NextResponse.json(
      { success: true, message: "Email successfully verified!" },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: `Verification error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
