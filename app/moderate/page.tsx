import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";
import ModerationClient from "./moderation-client";

export const dynamic = "force-dynamic";

const MODERATOR_EMAIL = "lisaakselrod@gmail.com";

export default async function ModeratePage() {
  const user = await requireChatGPTUser("/moderate");

  if (user.email.toLocaleLowerCase("en-US") !== MODERATOR_EMAIL) {
    return (
      <main className="moderation-page">
        <section className="moderation-shell moderation-empty">
          <p className="moderation-kicker">Private table</p>
          <h1>You’re not on the list.</h1>
          <a className="moderation-home" href="/">Back to the gossip</a>
        </section>
      </main>
    );
  }

  return (
    <main className="moderation-page">
      <section className="moderation-shell">
        <header className="moderation-header">
          <div>
            <p className="moderation-kicker">For Lisa’s eyes only</p>
            <h1>Guest list</h1>
          </div>
          <nav className="moderation-nav">
            <a href="/">View site</a>
            <a href={chatGPTSignOutPath("/")}>Sign out</a>
          </nav>
        </header>
        <ModerationClient />
      </section>
    </main>
  );
}
