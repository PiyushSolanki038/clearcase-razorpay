# How to use these files with Claude Code

## Setup (one time, 5 minutes)

1. Create an empty folder called `clearcase-razorpay` and open it in VS Code.
2. Drop `CLAUDE.md`, `ROADMAP.md`, and `TODO.md` into the folder root.
3. Open Claude Code in VS Code (the extension panel or terminal).
4. Paste the **kickoff prompt** below into Claude Code as your first message.

Claude Code automatically reads `CLAUDE.md` from the project root, so it will always have the full project context.

---

## Kickoff prompt — paste this on Day 0, session 1

```
I'm Piyush. I'm building the Razorpay AI Buildathon submission for Track 02
(AI Risk Manager). Deadline is 5 Sept 2026. I have 10 hrs/day.

Before we do anything:

1. Read CLAUDE.md, ROADMAP.md, and TODO.md in full.
2. In your reply, summarize back to me in your own words:
   - The project mission in one sentence
   - The 5 differentiators
   - What's on today's TODO list
   - The 5 things you will NEVER do (from the Hard NOs section)
3. Ask me any clarifying question you have BEFORE we start coding.
4. Do not write any code in this first message.

Once I confirm your summary is correct, we start Day 0 tasks in order.
```

---

## Session-start prompt — paste at the start of every other session

```
New session. Read CLAUDE.md, ROADMAP.md, and TODO.md.

Then:
1. Tell me what day of the roadmap we're on (based on TODO.md).
2. Tell me what's left from yesterday and what today's plan is.
3. Ask me if anything changed since last session.
4. Wait for me to confirm before starting.
```

---

## When Claude Code goes off track — use this

```
Stop. You're deviating from CLAUDE.md.

Specifically: [what it's doing wrong — feature creep / wrong stack / skipping audit log / etc.]

Re-read CLAUDE.md sections: [Hard NOs / Locked tech stack / whichever applies].

Explain in one paragraph what you were about to do and why it violates the plan.
Then propose the correct next action.
```

---

## Daily rhythm

- **Morning**: paste session-start prompt. Confirm plan. Code.
- **Every commit**: Claude Code updates TODO.md.
- **Every 2 hours**: quick check — are we still on the day's plan? If not, negotiate scope, don't drift.
- **End of session**: Claude Code marks done items, drafts tomorrow's TODO, commits + pushes.

---

## When you're stuck on a technical decision

Ask Claude Code with this frame:

```
Decision needed: [what you're deciding]

Options I see:
- A: [option A + tradeoff]
- B: [option B + tradeoff]

Constraints from CLAUDE.md that apply:
- [locked stack / hard no / deadline / etc.]

Which option is right for this project, and why? Give me the answer, not a
list of considerations.
```

Do not accept "it depends" answers. Push for a pick.

---

## Guardrails for you (Piyush), not just for Claude Code

- Do NOT add new features mid-day. Log them in a `IDEAS.md` file and revisit at end of Day 5.
- Do NOT tweak the UI before the core loop works end-to-end.
- Do NOT skip the metrics script — it IS the submission.
- Sleep 6+ hours a night. Sleep-deprived Day 5 will destroy Day 6.
- Commit at least every 90 minutes. If your laptop dies mid-Day 4, you don't want to lose 8 hours.
