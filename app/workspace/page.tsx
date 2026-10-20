"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  GitPullRequest,
  Sparkles,
  Target,
} from "lucide-react";
import {
  ClientTrackedIssue,
  fetchTrackedIssues,
  fetchUserPreferences,
  removeTrackedIssue,
  updateTrackedIssueStatus,
} from "@/lib/workspace/storage";
import { UserPreferencesData } from "@/lib/recommendations/matcher";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ContributionStats } from "@/components/workspace/contribution-stats";
import { TrackedIssueCard } from "@/components/workspace/tracked-issue-card";
import { NotesModal } from "@/components/workspace/notes-modal";
import { LinkPrModal } from "@/components/workspace/link-pr-modal";
import { SavedReportsModal } from "@/components/reports/saved-reports-modal";
import { Button } from "@/components/ui/button";

export default function WorkspacePage() {
  const router = useRouter();

  const [trackedIssues, setTrackedIssues] = React.useState<ClientTrackedIssue[]>([]);
  const [preferences, setPreferences] = React.useState<UserPreferencesData>({
    languages: ["TypeScript", "JavaScript", "Python"],
    experienceLevel: "beginner",
    topics: ["web", "react", "tools"],
    monthlyGoal: 3,
  });
  const [activeTab, setActiveTab] = React.useState<
    "all" | "saved" | "interested" | "in_progress" | "completed"
  >("all");
  const [isLoading, setIsLoading] = React.useState(true);

  const [editingNotesItem, setEditingNotesItem] = React.useState<ClientTrackedIssue | null>(null);
  const [linkingPrItem, setLinkingPrItem] = React.useState<ClientTrackedIssue | null>(null);
  const [isSavedReportsOpen, setIsSavedReportsOpen] = React.useState(false);

  React.useEffect(() => {
    Promise.all([fetchTrackedIssues(), fetchUserPreferences()])
      .then(([issues, prefs]) => {
        setTrackedIssues(issues);
        setPreferences(prefs);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleStatusChange = async (
    id: string,
    status: "saved" | "interested" | "in_progress" | "completed"
  ) => {
    await updateTrackedIssueStatus(id, status);
    setTrackedIssues((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status, updatedAt: new Date().toISOString() } : i))
    );
  };

  const handleSaveNotes = async (notes: string) => {
    if (!editingNotesItem) return;
    await updateTrackedIssueStatus(editingNotesItem.id, editingNotesItem.status, notes);
    setTrackedIssues((prev) =>
      prev.map((i) => (i.id === editingNotesItem.id ? { ...i, notes } : i))
    );
  };

  const handleLinkPr = async (prUrl: string) => {
    if (!linkingPrItem) return;
    await updateTrackedIssueStatus(
      linkingPrItem.id,
      linkingPrItem.status,
      linkingPrItem.notes || undefined,
      prUrl
    );
    const isPrConfirmed = Boolean(prUrl && /github\.com\/[^/]+\/[^/]+\/pull\/\d+/i.test(prUrl));
    setTrackedIssues((prev) =>
      prev.map((i) => (i.id === linkingPrItem.id ? { ...i, prUrl, isPrConfirmed } : i))
    );
  };

  const handleRemove = async (id: string) => {
    await removeTrackedIssue(id);
    setTrackedIssues((prev) => prev.filter((i) => i.id !== id));
  };

  const filteredIssues = React.useMemo(() => {
    if (activeTab === "all") return trackedIssues;
    return trackedIssues.filter((i) => i.status === activeTab);
  }, [trackedIssues, activeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Navbar onOpenSavedReports={() => setIsSavedReportsOpen(true)} />

      <main className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Workspace Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              <Bookmark className="h-3.5 w-3.5" />
              <span>Personal Contributor Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              My Open-Source Workspace
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Organize bookmarked beginner issues, manage issues you are actively solving, record
              notes, and attach verified pull requests.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => router.push("/explore")}
            className="text-xs h-9 gap-1.5 self-start md:self-auto font-semibold"
          >
            <Compass className="h-4 w-4" />
            <span>Discover More Issues</span>
          </Button>
        </div>

        {/* Contribution & Goal Stats */}
        <ContributionStats issues={trackedIssues} monthlyGoal={preferences.monthlyGoal || 3} />

        {/* Status Filter Tabs */}
        <div className="flex border-b border-border/80 gap-6 overflow-x-auto">
          {(
            [
              { key: "all", label: "All Issues", count: trackedIssues.length },
              {
                key: "saved",
                label: "Saved / Bookmarked",
                count: trackedIssues.filter((i) => i.status === "saved").length,
              },
              {
                key: "interested",
                label: "Interested",
                count: trackedIssues.filter((i) => i.status === "interested").length,
              },
              {
                key: "in_progress",
                label: "In Progress",
                count: trackedIssues.filter((i) => i.status === "in_progress").length,
              },
              {
                key: "completed",
                label: "Completed",
                count: trackedIssues.filter((i) => i.status === "completed").length,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-muted text-[11px] font-mono text-muted-foreground">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Issues List */}
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-32 rounded-xl bg-card/60 border border-border" />
            ))}
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center bg-card/40 space-y-3">
            <Bookmark className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <h3 className="text-base font-semibold text-foreground">
              No issues in "{activeTab.replace("_", " ")}"
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Find beginner-friendly issues on the Explore page and click <strong>Track Issue</strong> to
              add them to your workspace.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/explore")}
              className="text-xs"
            >
              Browse Beginner Issues
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIssues.map((item) => (
              <TrackedIssueCard
                key={item.id}
                item={item}
                onStatusChange={handleStatusChange}
                onEditNotes={(it) => setEditingNotesItem(it)}
                onLinkPr={(it) => setLinkingPrItem(it)}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Edit Notes Modal */}
      <NotesModal
        isOpen={Boolean(editingNotesItem)}
        issueTitle={editingNotesItem?.title || ""}
        issueNumber={editingNotesItem?.issueNumber || 0}
        initialNotes={editingNotesItem?.notes}
        onClose={() => setEditingNotesItem(null)}
        onSave={handleSaveNotes}
      />

      {/* Link PR Modal */}
      <LinkPrModal
        isOpen={Boolean(linkingPrItem)}
        issueTitle={linkingPrItem?.title || ""}
        issueNumber={linkingPrItem?.issueNumber || 0}
        initialPrUrl={linkingPrItem?.prUrl}
        onClose={() => setLinkingPrItem(null)}
        onSave={handleLinkPr}
      />

      {/* Saved Reports Drawer */}
      <SavedReportsModal
        isOpen={isSavedReportsOpen}
        onClose={() => setIsSavedReportsOpen(false)}
      />
    </div>
  );
}
