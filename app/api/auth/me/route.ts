import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const user = await getServerAuthUser(req);

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    return NextResponse.json({ authenticated: true, user }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { authenticated: false, user: null, error: String(error) },
      { status: 200 }
    );
  }
}
