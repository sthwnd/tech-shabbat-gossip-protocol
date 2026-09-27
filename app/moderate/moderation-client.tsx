"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ModerationSubmission = {
  id: number;
  city: string;
  eventUrl: string;
  hostProfile: string;
  announcementPost: string | null;
  createdAt: string;
};

type ModerationGossip = {
  id: number;
  eventKey: string;
  postUrl: string;
  createdAt: string;
};

export default function ModerationClient() {
  const [submissions, setSubmissions] = useState<ModerationSubmission[]>([]);
  const [gossip, setGossip] = useState<ModerationGossip[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [workingId, setWorkingId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/moderation")
      .then((response) => {
        if (!response.ok) throw new Error("load failed");
        return response.json() as Promise<{
          submissions: ModerationSubmission[];
          gossip: ModerationGossip[];
        }>;
      })
      .then((payload) => {
        setSubmissions(payload.submissions);
        setGossip(payload.gossip);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  async function moderate(
    kind: "shabbat" | "gossip",
    id: number,
    action: "approve" | "reject",
  ) {
    setWorkingId(id);
    setFailed(false);
    try {
      const response = await fetch("/api/moderation", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, id, action }),
      });
      if (!response.ok) throw new Error("moderation failed");
      if (kind === "shabbat") {
        setSubmissions((current) => current.filter((submission) => submission.id !== id));
      } else {
        setGossip((current) => current.filter((item) => item.id !== id));
      }
    } catch {
      setFailed(true);
    } finally {
      setWorkingId(null);
    }
  }

  if (loading) return <p className="moderation-status">Checking the guest list…</p>;

  if (submissions.length === 0 && gossip.length === 0 && !failed) {
    return (
      <div className="moderation-empty">
        <p>No one waiting at the velvet rope.</p>
      </div>
    );
  }

  return (
    <>
      {failed ? <p className="form-error" role="alert">Something went wrong. Refresh and try again.</p> : null}
      {submissions.length > 0 ? <h2 className="moderation-section-title">Shabbats</h2> : null}
      <div className="moderation-list">
        {submissions.map((submission) => (
          <article className="moderation-card" key={submission.id}>
            <div className="moderation-card-copy">
              <div className="event-meta">
                <span>Pending</span>
                <span>{submission.city}</span>
              </div>
              <h2>Shabbat #{submission.id}</h2>
              <div className="moderation-links">
                <a href={submission.eventUrl} target="_blank" rel="noreferrer">
                  Event <ArrowUpRight aria-hidden="true" />
                </a>
                <a href={submission.hostProfile} target="_blank" rel="noreferrer">
                  Host <ArrowUpRight aria-hidden="true" />
                </a>
                {submission.announcementPost ? (
                  <a href={submission.announcementPost} target="_blank" rel="noreferrer">
                    Announcement <ArrowUpRight aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </div>
            <div className="moderation-actions">
              <Button
                type="button"
                className="approve-button"
                disabled={workingId === submission.id}
                onClick={() => moderate("shabbat", submission.id, "approve")}
              >
                <Check aria-hidden="true" /> Approve
              </Button>
              <Button
                type="button"
                variant="outline"
                className="reject-button"
                disabled={workingId === submission.id}
                onClick={() => moderate("shabbat", submission.id, "reject")}
              >
                <X aria-hidden="true" /> Reject
              </Button>
            </div>
          </article>
        ))}
      </div>
      {gossip.length > 0 ? <h2 className="moderation-section-title">Gossip</h2> : null}
      <div className="moderation-list">
        {gossip.map((item) => (
          <article className="moderation-card" key={item.id}>
            <div className="moderation-card-copy">
              <div className="event-meta">
                <span>Pending gossip</span>
                <span>{item.eventKey}</span>
              </div>
              <h2>Receipt #{item.id}</h2>
              <div className="moderation-links">
                <a href={item.postUrl} target="_blank" rel="noreferrer">
                  View post <ArrowUpRight aria-hidden="true" />
                </a>
              </div>
            </div>
            <div className="moderation-actions">
              <Button
                type="button"
                className="approve-button"
                disabled={workingId === item.id}
                onClick={() => moderate("gossip", item.id, "approve")}
              >
                <Check aria-hidden="true" /> Approve
              </Button>
              <Button
                type="button"
                variant="outline"
                className="reject-button"
                disabled={workingId === item.id}
                onClick={() => moderate("gossip", item.id, "reject")}
              >
                <X aria-hidden="true" /> Reject
              </Button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
