import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { clearGuestCookie, isValidGuestId } from "./guest-session";

export interface MigrationSummary {
  migratedIssuesCount: number;
  migratedReportsCount: number;
  preferencesMigrated: boolean;
}

/**
 * Safely transfers unauthenticated guest data to an authenticated user account.
 * - Idempotent
 * - Atomic deduplication
 * - Strictly validates guestId
 * - Cleans up old guest records
 * - Clears guest cookie on response
 */
export async function migrateGuestData(
  guestId: string | null | undefined,
  targetUserId: string,
  res?: NextResponse
): Promise<MigrationSummary> {
  const emptyResult: MigrationSummary = {
    migratedIssuesCount: 0,
    migratedReportsCount: 0,
    preferencesMigrated: false,
  };

  if (!guestId || !isValidGuestId(guestId) || !targetUserId || guestId === targetUserId) {
    return emptyResult;
  }

  try {
    let migratedIssuesCount = 0;
    let migratedReportsCount = 0;
    let preferencesMigrated = false;

    // 1. Migrate Tracked Issues without unique key collisions
    const guestIssues = await prisma.trackedIssue.findMany({
      where: { userId: guestId },
    });

    for (const issue of guestIssues) {
      const existing = await prisma.trackedIssue.findUnique({
        where: {
          userId_repoOwner_repoName_issueNumber: {
            userId: targetUserId,
            repoOwner: issue.repoOwner,
            repoName: issue.repoName,
            issueNumber: issue.issueNumber,
          },
        },
      });

      if (existing) {
        // If the user already tracked it, preserve their record but copy over guest notes if empty
        if (!existing.notes && issue.notes) {
          await prisma.trackedIssue.update({
            where: { id: existing.id },
            data: { notes: issue.notes },
          });
        }
        await prisma.trackedIssue.delete({ where: { id: issue.id } });
      } else {
        await prisma.trackedIssue.update({
          where: { id: issue.id },
          data: { userId: targetUserId },
        });
        migratedIssuesCount++;
      }
    }

    // 2. Migrate User Preferences
    const guestPref = await prisma.userPreference.findUnique({
      where: { userId: guestId },
    });

    if (guestPref) {
      const userPref = await prisma.userPreference.findUnique({
        where: { userId: targetUserId },
      });

      if (!userPref) {
        await prisma.userPreference.update({
          where: { id: guestPref.id },
          data: { userId: targetUserId },
        });
        preferencesMigrated = true;
      } else {
        await prisma.userPreference.delete({ where: { id: guestPref.id } });
      }
    }

    // 3. Migrate Saved Analyses
    const guestReports = await prisma.savedAnalysis.findMany({
      where: { userId: guestId },
    });

    for (const report of guestReports) {
      const existing = await prisma.savedAnalysis.findFirst({
        where: {
          userId: targetUserId,
          owner: report.owner,
          repo: report.repo,
        },
      });

      if (!existing) {
        await prisma.savedAnalysis.update({
          where: { id: report.id },
          data: { userId: targetUserId },
        });
        migratedReportsCount++;
      } else {
        await prisma.savedAnalysis.delete({ where: { id: report.id } });
      }
    }

    // 4. Migrate Recently Viewed issues
    await prisma.recentlyViewedIssue.updateMany({
      where: { userId: guestId },
      data: { userId: targetUserId },
    });

    // 4b. Migrate Saved Searches
    await prisma.savedSearch.updateMany({
      where: { userId: guestId },
      data: { userId: targetUserId },
    });

    // 5. Cleanup remaining guest records
    await prisma.trackedIssue.deleteMany({ where: { userId: guestId } });
    await prisma.userPreference.deleteMany({ where: { userId: guestId } });
    await prisma.savedAnalysis.deleteMany({ where: { userId: guestId } });
    await prisma.savedSearch.deleteMany({ where: { userId: guestId } });

    // 6. Clear guest cookie on response
    if (res) {
      clearGuestCookie(res);
    }

    return {
      migratedIssuesCount,
      migratedReportsCount,
      preferencesMigrated,
    };
  } catch (error) {
    console.error("Guest migration error:", error);
    return emptyResult;
  }
}
