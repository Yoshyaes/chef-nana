export default function DocsPage() {
  return (
    <div style={{ maxWidth: 760, paddingBottom: 80 }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--brown)', fontWeight: 400, marginBottom: 6 }}>
        How Georgina&apos;s Assistant works
      </h1>
      <p style={{ fontSize: 14, color: '#9a7d5a', marginBottom: 40, lineHeight: 1.6 }}>
        A reference guide to every feature and how to get the most out of it.
      </p>

      <Section id="overview" title="What this assistant does">
        <P>
          Georgina&apos;s Assistant is a private AI system built to handle the business side of Nana&apos;s
          private chef practice — finding high-value leads, writing outreach in her exact voice, monitoring
          her Gmail for replies, and routing every draft through her for approval before anything goes out.
          Nothing is sent automatically.
        </P>
        <P>
          There are two core workflows: <strong>outbound</strong> (finding leads and reaching out) and
          <strong> inbound</strong> (catching replies and drafting responses). Both end the same way — a
          draft lands in the Drafts page and in Discord, where Nana approves or rejects with one click.
        </P>
      </Section>

      <Divider />

      <Section id="outbound" title="Outbound workflow — finding and reaching out to leads">
        <Step n={1} label="Add a lead">
          Go to <strong>Leads → + Add lead</strong> and fill in name, org, email, and market. Or use the Apollo
          search in <strong>Settings</strong> to find and import leads in bulk by searching a description like
          &ldquo;estate manager Hamptons family office.&rdquo; Imported leads land directly in your pipeline.
        </Step>
        <Step n={2} label="Research the lead">
          Open any lead detail page and click <strong>Research</strong>. Claude reads everything available about
          the person and writes a structured brief — who they are, why they&apos;re a fit for Nana, estimated
          annual value, and the specific angle to lead with. This brief powers every draft for that lead.
        </Step>
        <Step n={3} label="Generate a draft">
          From the lead detail page, click <strong>Generate draft</strong>. Claude writes a first-touch email
          using Nana&apos;s brand voice, the research brief, and any writing examples you&apos;ve added in Settings.
          The draft appears in the <strong>Drafts</strong> page within seconds.
        </Step>
        <Step n={4} label="Review and approve">
          Open Drafts, read the &ldquo;Why this draft&rdquo; note to see Claude&apos;s reasoning, then choose:
          <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 2, fontSize: 14, color: '#5c3a22' }}>
            <li><strong>Approve &amp; send</strong> — sends immediately from nana@mail.chefnanawilmot.com</li>
            <li><strong>Edit</strong> — edit subject and body inline, then save and approve</li>
            <li><strong>Redraft</strong> — queues a new Claude generation from scratch</li>
            <li><strong>Reject</strong> — dismisses the draft with no action</li>
          </ul>
        </Step>
        <Step n={5} label="Follow-ups">
          If there&apos;s no reply after a few days, generate a step 2 or step 3 draft from the lead detail page.
          Claude knows it&apos;s a follow-up and writes accordingly — shorter, adds a new hook, no desperation.
        </Step>
      </Section>

      <Divider />

      <Section id="inbound" title="Inbound workflow — catching and replying to leads who write back">
        <P>
          This workflow runs automatically in the background. Once Gmail is connected, the system checks
          georginasfoods@gmail.com every 10 minutes.
        </P>
        <Step n={1} label="Lead replies to Nana's email">
          The Gmail poller detects the new message, matches the sender&apos;s email address to a lead in the
          database, and saves the message to the conversation history.
        </Step>
        <Step n={2} label="Claude drafts a reply">
          Within minutes, Claude reads the inbound message, the full conversation history, and the lead&apos;s
          research brief, then writes a reply in Nana&apos;s voice. The draft is saved as pending.
        </Step>
        <Step n={3} label="Discord notification arrives">
          A message appears in the configured Discord channel showing the draft subject, a preview of the
          body, and two buttons: <strong>Approve ✓</strong> and <strong>Reject ✗</strong>.
        </Step>
        <Step n={4} label="Approve from Discord or the web">
          Click Approve in Discord — the email sends immediately and the Discord message updates to
          &ldquo;Sent ✓.&rdquo; Or open Drafts in the browser to read the full thread, edit if needed, then approve.
          Either path works.
        </Step>
        <Callout>
          <strong>Important:</strong> the inbound flow only triggers for leads whose email address is
          already in the database. If someone new writes in, add them as a lead first (with their exact
          email address), then the next polling cycle will catch any messages from them.
        </Callout>
      </Section>

      <Divider />

      <Section id="today" title="Today — your daily brief">
        <P>
          The Today view generates a prioritized morning brief each time you open it. Claude looks at all
          pending tasks — drafts waiting for approval, leads with no follow-up, replies that came in
          overnight — and surfaces them ranked by value and urgency.
        </P>
        <P>
          Hot tasks (fit score 80+, or a lead who replied) appear first. Cool tasks are things that can
          wait. The TLDR at the top tells you the single most important thing to do right now.
        </P>
      </Section>

      <Divider />

      <Section id="pipeline" title="Pipeline — your lead kanban">
        <P>
          The pipeline is a Kanban board with five stages: <strong>Sourced → Contacted → Responded →
          Negotiating → Trial &amp; Won</strong>. Move a lead by changing the stage dropdown on their card.
        </P>
        <P>
          Each card shows the lead&apos;s fit score, estimated annual value, and whether they&apos;re a recurring
          or one-off client. High-fit leads (80+) are highlighted in green.
        </P>
        <P>
          Use the search bar to filter cards across all stages simultaneously. Click any lead name to open
          their full detail page.
        </P>
      </Section>

      <Divider />

      <Section id="drafts" title="Drafts — reviewing AI-written emails">
        <P>
          Every email Claude writes — whether outbound outreach or a reply to an inbound message — lands
          here as a pending draft. No email is ever sent without Nana touching it first.
        </P>
        <P><strong>Thread view:</strong> click &ldquo;▸ View thread&rdquo; on any draft to see the full conversation
          history with that lead — every inbound and outbound message, with timestamps. Useful for reply
          drafts where context matters.</P>
        <P><strong>Why this draft:</strong> the amber box above the email shows Claude&apos;s reasoning — what
          tone it chose, what it referenced, and what it&apos;s trying to achieve. Read this first; if the
          reasoning is off, hit Redraft rather than editing line by line.</P>
      </Section>

      <Divider />

      <Section id="voice" title="Getting the voice right">
        <P>
          The AI starts with a detailed brand voice built in — Nana&apos;s credentials, her markets, rules
          about never using em dashes or hollow phrases, and 30+ banned AI writing patterns. But the most
          powerful tuning is adding real examples.
        </P>
        <P>Go to <strong>Settings → Writing examples</strong> and paste 3–5 emails Nana has actually sent.
          Include a mix — a first touch, a reply, a follow-up. The more varied the examples, the better
          Claude can match her exact sentence rhythm, punctuation style, and sign-off.</P>
        <P>Use the <strong>Your voice</strong> field for contextual notes that change over time — e.g.
          &ldquo;Focus on Hamptons families right now, don&apos;t pitch corporate events unless they bring it up first.&rdquo;
          Update this whenever Nana&apos;s priorities shift.</P>
        <Callout>
          Even two good examples will dramatically change the output. The AI picks up on small signals:
          does she use contractions? How does she sign off? Does she ask one question or three? Paste
          real emails and those patterns transfer immediately.
        </Callout>
      </Section>

      <Divider />

      <Section id="leads" title="Leads — the full roster">
        <P>
          The Leads page shows every lead across all stages in a searchable table. Click any name to open
          their detail page, which shows their research brief, full message history, all drafts, and their
          pipeline stage.
        </P>
        <P>
          Add leads manually with <strong>+ Add lead</strong>, or import from Apollo via Settings.
          Make sure every lead has an accurate email address — that&apos;s how the inbound Gmail flow matches
          replies to the right person.
        </P>
      </Section>

      <Divider />

      <Section id="integrations" title="Integrations — what&apos;s connected">
        <P>The <strong>Integrations</strong> page shows live stats from four connected services:</P>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2, fontSize: 14, color: '#5c3a22', marginBottom: 12 }}>
          <li><strong>Google Analytics (GA4)</strong> — website visitors and sessions for the last 7 and 30 days</li>
          <li><strong>Vercel</strong> — current deployment status and recent deploy history</li>
          <li><strong>Resend</strong> — emails sent this month and recent send counts</li>
          <li><strong>Sanity (Content)</strong> — count of events, services, credentials, and press entries</li>
        </ul>
        <P>Use this as a quick health check — if Vercel shows a failed deploy or Resend shows 0 sends
          after approving a draft, something needs attention.</P>
      </Section>

      <Divider />

      <Section id="content" title="Content — managing the public website">
        <P>
          The <strong>Content</strong> section links to the Sanity Studio CMS where Nana can update the
          live website without a developer:
        </P>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2, fontSize: 14, color: '#5c3a22', marginBottom: 12 }}>
          <li><strong>Events</strong> — upcoming dinners, supper clubs, and appearances</li>
          <li><strong>Services</strong> — private chef, travel chef, supper club descriptions</li>
          <li><strong>Credentials</strong> — awards, positions, and milestones timeline</li>
          <li><strong>Press</strong> — press mentions and features</li>
          <li><strong>Site Settings</strong> — hero tagline, bio, and supper club copy</li>
        </ul>
        <P>Changes publish to chefnanawilmot.com within seconds of saving in Sanity.</P>
      </Section>

      <Divider />

      <Section id="settings" title="Settings reference">
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <tbody>
            {[
              ['Anthropic API key', 'Powers all AI features — drafts, research, daily brief. Required.'],
              ['Apollo API key', 'Enables lead search. Optional but recommended for sourcing at scale.'],
              ['Monthly budget cap', 'Hard cap on Claude API spend. Default $25/mo. Raise it as volume grows.'],
              ['Your voice', 'Notes about current priorities, things to always/never say. Update whenever focus shifts.'],
              ['Writing examples', 'Paste 3–5 real sent emails. The single most impactful voice tuning you can do.'],
              ['Approve before sending', 'Always leave this on. Nothing sends without a human touch.'],
              ['Gmail', 'OAuth connection to georginasfoods@gmail.com. Reconnect if it ever shows disconnected.'],
              ['Discord', 'Requires DISCORD_BOT_TOKEN + DISCORD_CHANNEL_ID in Vercel. Shows draft notifications with Approve/Reject buttons. Add DISCORD_NANA_USER_ID + DISCORD_JULIAN_USER_ID to @-mention them so new drafts ping their devices.'],
              ['Sending domain', 'Emails send from nana@mail.chefnanawilmot.com. Only change this if the domain changes.'],
            ].map(([setting, desc]) => (
              <tr key={setting} style={{ borderBottom: '1px solid #f0e8db' }}>
                <td style={{ padding: '12px 16px 12px 0', fontWeight: 500, color: 'var(--brown)', width: 200, verticalAlign: 'top' }}>
                  {setting}
                </td>
                <td style={{ padding: '12px 0', color: '#5c3a22', lineHeight: 1.6 }}>
                  {desc}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Divider />

      <Section id="tips" title="Tips for getting the most out of the system">
        <ul style={{ paddingLeft: 20, lineHeight: 2.4, fontSize: 14, color: '#5c3a22' }}>
          <li><strong>Add writing examples before the first real outreach</strong> — it takes 2 minutes and the quality difference is immediate.</li>
          <li><strong>Research before generating drafts</strong> — a lead with no research gets a generic draft. Research first, then draft.</li>
          <li><strong>Keep lead emails accurate</strong> — the inbound flow depends on exact email matching. If a reply isn&apos;t getting caught, check that the lead&apos;s email address matches the sender address exactly.</li>
          <li><strong>Use Redraft liberally</strong> — if the tone is wrong, don&apos;t manually rewrite; hit Redraft and add a note to &ldquo;Your voice&rdquo; explaining what was off so future drafts improve.</li>
          <li><strong>Check Today first thing</strong> — it&apos;s built as a morning triage tool. Open it daily and work from the top down.</li>
          <li><strong>Discord is for speed</strong> — if a reply comes in and Claude drafts a response, you can approve it from your phone in Discord without opening a laptop.</li>
          <li><strong>The pipeline stages matter</strong> — keep them current so the Today brief can correctly prioritize hot leads and flag stale ones.</li>
        </ul>
      </Section>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: 40 }}>
      <h2 style={{
        fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--brown)',
        fontWeight: 400, marginBottom: 16, paddingBottom: 8,
        borderBottom: '1px solid #eee5d7',
      }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 14, color: '#5c3a22', lineHeight: 1.75, marginBottom: 12 }}>{children}</p>
}

function Step({ n, label, children }: { n: number; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', background: 'var(--gold)',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1,
      }}>{n}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--brown)', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 14, color: '#5c3a22', lineHeight: 1.7 }}>{children}</div>
      </div>
    </div>
  )
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fffbf4', border: '1px solid #f0e3cc', borderRadius: 10,
      padding: '14px 16px', marginTop: 16, marginBottom: 4,
      fontSize: 13, color: '#7a6652', lineHeight: 1.7,
    }}>
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: '#eee5d7', marginBottom: 40 }} />
}
