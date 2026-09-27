"use client";

import { type FormEvent, useEffect, useState } from "react";
import { ArrowUpRight, Check, CircleHelp, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Event = {
  host: string;
  city: "San Francisco" | "Tel Aviv";
  date: string;
  status: "Past event" | "Upcoming event";
  tweets: string[];
  eventUrl?: string;
  lumaBanner?: string;
};

type Submission = {
  id: number;
  city: string;
  eventUrl: string;
  hostProfile: string;
  announcementPost: string | null;
  createdAt: string;
};

const defaultCities = [
  "San Francisco",
  "Tel Aviv",
  "New York",
  "Los Angeles",
  "London",
  "Paris",
  "Berlin",
  "Lisbon",
  "Miami",
  "Austin",
  "Boston",
  "Seattle",
  "Toronto",
  "Mexico City",
  "Buenos Aires",
  "Dubai",
  "Singapore",
];

declare global {
  interface Window {
    twttr?: { widgets?: { load: (element?: HTMLElement) => void } };
  }
}

const pastEvents: Event[] = [
  {
    host: "Katie Kirsch",
    city: "San Francisco",
    date: "September 25",
    status: "Past event",
    tweets: [
      "https://x.com/katiekirsch/status/2103729281272811641?s=20",
      "https://x.com/katiekirsch/status/2100657145075368251?s=20",
      "https://x.com/LaurenBoles_/status/2103901649123373239?s=20",
      "https://x.com/katiekirsch/status/2104273617311998411?s=20",
    ],
  },
  {
    host: "Ashley Paston",
    city: "San Francisco",
    date: "September 25",
    status: "Past event",
    tweets: [
      "https://x.com/ashleypaston/status/1978919969313210688?s=20",
      "https://x.com/ashleypaston/status/2103893577738891417?s=20",
    ],
  },
  {
    host: "Jared + Sahar",
    city: "San Francisco",
    date: "September 25",
    status: "Past event",
    tweets: [
      "https://x.com/jaredzel/status/2104006536158986377?s=20",
      "https://x.com/sahar__alon/status/2103960338635067731?s=20",
      "https://x.com/harleyf/status/2104172853784350886?s=20",
    ],
  },
  {
    host: "Adam + IsraValley",
    city: "San Francisco",
    date: "September 25",
    status: "Past event",
    tweets: [
      "https://x.com/cryptobuilder_/status/2103693756675559672?s=20",
      "https://x.com/adamcohenhillel/status/2103727060216906180?s=20",
    ],
  },
];

const upcomingEvents: Event[] = [
  {
    host: "Vitor Zucher",
    city: "Tel Aviv",
    date: "October 23",
    status: "Upcoming event",
    tweets: ["https://x.com/vzucher/status/2104275755920445875?s=20"],
    eventUrl: "https://luma.com/bhet1w5c",
    lumaBanner:
      "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=contain,dpr=1,anim=false,background=white,quality=85,width=1200,height=630/event-social/n3/2923162e-0420-48b7-8ed0-f6830e4949b4.png",
  },
  {
    host: "Neta Dror",
    city: "Tel Aviv",
    date: "Week of October 20",
    status: "Upcoming event",
    tweets: ["https://x.com/netadror/status/2103796793452482770?s=20"],
  },
];

function TwitterEmbed({ url }: { url: string }) {
  useEffect(() => {
    const loadTweets = () => window.twttr?.widgets?.load();
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://platform.twitter.com/widgets.js"]',
    );

    if (existingScript) {
      loadTweets();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.charset = "utf-8";
    script.onload = loadTweets;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="tweet-shell">
      <blockquote
        className="twitter-tweet"
        data-dnt="true"
        data-theme="light"
        data-conversation="none"
      >
        <a href={url} aria-label="Open post on X" />
      </blockquote>
    </div>
  );
}

function AddShabbatDialog({
  cities,
  onCreated,
}: {
  cities: string[];
  onCreated: (submission: Submission) => void;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [city, setCity] = useState("");
  const [customCity, setCustomCity] = useState("");

  async function submitShabbat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFailed(false);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const selectedCity = city === "__other" ? customCity.trim() : city;

    if (!selectedCity) {
      setFailed(true);
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/shabbats", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          city: selectedCity,
          eventUrl: formData.get("eventUrl"),
          hostProfile: formData.get("hostProfile"),
          announcementPost: formData.get("announcementPost"),
        }),
      });

      if (!response.ok) throw new Error("submission failed");

      const payload = (await response.json()) as { submission: Submission };
      onCreated(payload.submission);
      form.reset();
      setCity("");
      setCustomCity("");
      setSubmitted(true);
    } catch {
      setFailed(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setSubmitted(false);
          setFailed(false);
          setCity("");
          setCustomCity("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="add-button">
          <Plus aria-hidden="true" />
          Add a Shabbat
        </Button>
      </DialogTrigger>
      <DialogContent className="submission-dialog">
        {submitted ? (
          <div className="success-state">
            <span className="success-mark"><Check aria-hidden="true" /></span>
            <DialogTitle>On the map.</DialogTitle>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="dialog-title">Add a Shabbat</DialogTitle>
            </DialogHeader>
            <form
              className="submission-form"
              onSubmit={submitShabbat}
            >
              <label>
                <span>City</span>
                <Select value={city} onValueChange={(value) => setCity(value ?? "")}>
                  <SelectTrigger className="city-select" aria-label="City">
                    <SelectValue placeholder="Choose a city" />
                  </SelectTrigger>
                  <SelectContent className="city-select-content">
                    {cities.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                    <SelectItem value="__other">Another city</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              {city === "__other" ? (
                <label>
                  <span>City name</span>
                  <Input
                    required
                    value={customCity}
                    onChange={(event) => setCustomCity(event.target.value)}
                    autoComplete="address-level2"
                  />
                </label>
              ) : null}
              <label>
                <span>Event link</span>
                <Input required name="eventUrl" type="url" placeholder="https://" />
              </label>
              <label>
                <span>Host profile</span>
                <small>Twitter or LinkedIn link.</small>
                <Input required name="hostProfile" type="url" placeholder="https://" />
              </label>
              <label>
                <span>Announcement post <i>(optional)</i></span>
                <small>Twitter or LinkedIn link.</small>
                <Input name="announcementPost" type="url" placeholder="https://" />
              </label>
              {failed ? <p className="form-error" role="alert">Couldn’t add it. Try again.</p> : null}
              <Button disabled={submitting} type="submit" className="dialog-submit">Add Shabbat</Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function hostLabel(profile: string) {
  try {
    const url = new URL(profile);
    const path = url.pathname.split("/").filter(Boolean);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "linkedin.com") {
      const name = path.at(-1);
      return name ? name.replace(/-/g, " ") : "LinkedIn";
    }

    const name = path[0];
    return name ? `@${name}` : url.hostname;
  } catch {
    return profile;
  }
}

function isXPost(url: string | null) {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host === "x.com" || host === "twitter.com";
  } catch {
    return false;
  }
}

function isLinkedInPost(url: string | null) {
  if (!url) return false;
  try {
    return new URL(url).hostname.replace(/^www\./, "") === "linkedin.com";
  } catch {
    return false;
  }
}

function EventCard({ event }: { event: Event }) {
  return (
    <article className="event-card">
      <div className="event-intro">
        <div className="event-meta">
          <span>{event.status}</span>
          <span>{event.date}</span>
        </div>
        <p className="host-label">Hosted by</p>
        <h3>{event.host}</h3>
        <p className="city-label">{event.city}</p>
      </div>

      {event.lumaBanner ? (
        <a
          className="luma-banner"
          href={event.eventUrl}
          target="_blank"
          rel="noreferrer"
        >
          <img src={event.lumaBanner} alt="" />
        </a>
      ) : null}

      <div className="tweet-stack">
        {event.tweets.map((tweet) => <TwitterEmbed key={tweet} url={tweet} />)}
      </div>

      <div className="event-actions">
        {event.eventUrl ? (
          <a className="primary-link" href={event.eventUrl} target="_blank" rel="noreferrer">
            Request a seat <ArrowUpRight aria-hidden="true" />
          </a>
        ) : (
          <div className="cosign-control">
            <button className="primary-link" type="button">Cosign the table</button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="cosign-help" type="button" aria-label="What does cosign mean?">
                    <CircleHelp aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="cosign-tooltip" sideOffset={8}>
                  Been to this table—or know the host? Cosign it.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
    </article>
  );
}

function CommunityEventCard({ event }: { event: Submission }) {
  return (
    <article className="event-card">
      <div className="event-intro">
        <div className="event-meta">
          <span>Upcoming event</span>
          <span>{event.city}</span>
        </div>
        <p className="host-label">Hosted by</p>
        <h3>
          <a href={event.hostProfile} target="_blank" rel="noreferrer">
            {hostLabel(event.hostProfile)}
          </a>
        </h3>
      </div>

      {isXPost(event.announcementPost) ? (
        <div className="tweet-stack">
          <TwitterEmbed url={event.announcementPost!} />
        </div>
      ) : null}

      <div className="event-actions">
        <a className="primary-link" href={event.eventUrl} target="_blank" rel="noreferrer">
          Request a seat <ArrowUpRight aria-hidden="true" />
        </a>
        {isLinkedInPost(event.announcementPost) ? (
          <a className="announcement-link" href={event.announcementPost!} target="_blank" rel="noreferrer">
            Announcement <ArrowUpRight aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </article>
  );
}

export default function Home() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    let active = true;

    fetch("/api/shabbats")
      .then((response) => {
        if (!response.ok) throw new Error("load failed");
        return response.json() as Promise<{ submissions: Submission[] }>;
      })
      .then((payload) => {
        if (active) setSubmissions(payload.submissions);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const cities = Array.from(
    new Set(["San Francisco", "Tel Aviv", ...submissions.map((submission) => submission.city)]),
  );
  const cityOptions = Array.from(new Set([...defaultCities, ...cities]));

  function addSubmission(submission: Submission) {
    setSubmissions((current) => [
      submission,
      ...current.filter((item) => item.id !== submission.id),
    ]);
  }

  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Tech Shabbat Gossip Protocol home">
          <span>TS</span>
          <b>Tech Shabbat<br />Gossip Protocol</b>
        </a>
        <AddShabbatDialog cities={cityOptions} onCreated={addSubmission} />
      </header>

      <section id="top" className="hero">
        <div className="hero-copy">
          <h1>Not everyone gets a seat at the Shabbat table. But everyone gets the Twitter gossip.</h1>
          <p className="hero-deck">
            A distributed network of Friday-night gatherings for founders, builders,
            investors, and friends around the world.
          </p>
          <div className="hero-intro-wrap">
            <p className="hero-intro">
              Every Friday, tech Shabbat tables are set around the world. Some are announced.
              Some are whispered into group chats. Some have a waitlist you’re pretending not
              to check. Others reveal themselves the next morning, one Twitter post at a time.
              And some remain exactly where they began: off the record, around a table, without you.
            </p>
            <p className="hero-intro">
              Tech Shabbat Gossip Protocol follows the gossip that escapes the table. Add your
              gathering, share the gossip, or gaze longingly at the Shabbats you missed.
            </p>
          </div>
        </div>

        <div className="hero-monogram" aria-hidden="true">
          <div className="monogram-frame">
            <span>T</span><span>S</span><span>G</span><span>P</span>
          </div>
        </div>
      </section>

      <section className="city-section" aria-labelledby="city-title">
        <h2 id="city-title">Where Friday night is happening.</h2>
        <div className="city-description">
          <p>Starting with San Francisco and Tel Aviv. The rest of the world can add itself.</p>
          <div className="city-list">
            {cities.map((city) => <span key={city}>{city}</span>)}
          </div>
        </div>
      </section>

      <section className="events-section past-section" aria-labelledby="past-title">
        <div className="section-heading">
          <h2 id="past-title">Past events</h2>
          <span>San Francisco</span>
        </div>
        <div className="event-grid event-grid-three">
          {pastEvents.map((event) => <EventCard key={event.host} event={event} />)}
        </div>
      </section>

      <section className="events-section upcoming-section" aria-labelledby="upcoming-title">
        <div className="section-heading">
          <h2 id="upcoming-title">Upcoming events</h2>
          <span>{cities.slice(1).join(" · ")}</span>
        </div>
        <div className="event-grid event-grid-two">
          {upcomingEvents.map((event) => <EventCard key={event.host} event={event} />)}
          {submissions.map((event) => <CommunityEventCard key={event.id} event={event} />)}
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-signoff">
          <a href="https://x.com/cryptobuilder_" target="_blank" rel="noreferrer">
            Built for you by Lisa Akselrod.
          </a>
          <p>XOXO, Shabbat shalom.</p>
        </div>
        <span className="footer-monogram" aria-hidden="true">TSGP</span>
      </footer>
    </main>
  );
}
