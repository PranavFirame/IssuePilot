import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { resolveSessionOrGuest } from "@/lib/auth/guest-session";

const MAX_SAVED_SEARCHES = 20;

/**
 * GET /api/saved-searches
 * Returns the current user's saved searches.
 */
export async function GET(req: NextRequest) {
  const session = await resolveSessionOrGuest(req);
  const userId = session.userId;

  const searches = await prisma.savedSearch.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: MAX_SAVED_SEARCHES,
  });

  return session.attachCookie(NextResponse.json({ searches }));
}

/**
 * POST /api/saved-searches
 * Saves a new search filter set.
 */
export async function POST(req: NextRequest) {
  const session = await resolveSessionOrGuest(req);
  const userId = session.userId;

  let body: { name?: string; query?: string; language?: string; difficulty?: string; sort?: string };
  try {
    body = await req.json();
  } catch {
    return session.attachCookie(
      NextResponse.json({ error: "Invalid request body." }, { status: 400 })
    );
  }

  const name = (body.name || "").trim().slice(0, 80);
  if (!name) {
    return session.attachCookie(
      NextResponse.json({ error: "Search name is required." }, { status: 400 })
    );
  }

  // Enforce per-user cap
  const count = await prisma.savedSearch.count({ where: { userId } });
  if (count >= MAX_SAVED_SEARCHES) {
    return session.attachCookie(
      NextResponse.json(
        { error: `You can save at most ${MAX_SAVED_SEARCHES} searches. Delete one to save a new one.` },
        { status: 429 }
      )
    );
  }

  const search = await prisma.savedSearch.create({
    data: {
      userId,
      name,
      query: (body.query || "").slice(0, 200),
      language: body.language || "all",
      difficulty: body.difficulty || "all",
      sort: body.sort || "updated",
    },
  });

  return session.attachCookie(NextResponse.json({ search }, { status: 201 }));
}

/**
 * DELETE /api/saved-searches?id=<id>
 * Deletes a saved search, enforcing ownership.
 */
export async function DELETE(req: NextRequest) {
  const session = await resolveSessionOrGuest(req);
  const userId = session.userId;
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return session.attachCookie(
      NextResponse.json({ error: "Missing id parameter." }, { status: 400 })
    );
  }

  const existing = await prisma.savedSearch.findUnique({ where: { id } });
  if (!existing) {
    return session.attachCookie(
      NextResponse.json({ error: "Search not found." }, { status: 404 })
    );
  }
  if (existing.userId !== userId) {
    return session.attachCookie(
      NextResponse.json({ error: "Forbidden." }, { status: 403 })
    );
  }

  await prisma.savedSearch.delete({ where: { id } });
  return session.attachCookie(NextResponse.json({ ok: true }));
}
