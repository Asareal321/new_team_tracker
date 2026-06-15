import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You write daily status update emails for a small team, following a strict template.

Output plain text only (no markdown headers, no asterisks, no code fences). Follow this template exactly:

Subject: Daily Update — {date}

Hi {recipientName},

Please find below some updates from today:

{For each section in the input, in the order given, output:}
{Section title on its own line, written in Title Case, no markdown}
- {Fact bullet — a concise statement of what happened or the current status today, based on the task data and updates provided}
- {Implication bullet — what this means for the project or team: risk, dependency, or milestone impact}
- {Next action bullet — what happens next, who is doing it, or what's needed}

{leave one blank line between sections}

Best,
{senderName}

Rules:
- Always exactly 3 bullets per section, in Fact / Implication / Next action order — but do not include literal labels like "Fact:", "Implication:", or "Next action:". Write each as a natural, concise sentence.
- Base everything strictly on the provided task data and updates; do not invent facts.
- If a section had no meaningful activity today, write a brief "no movement today" fact, a neutral implication, and a sensible next action (e.g. follow up, keep on the backlog).
- Keep each bullet to one sentence.
- Do not add any sections, commentary, or sign-offs beyond what the template specifies.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { date, recipientName, senderName, sections } = req.body || {}

  if (!Array.isArray(sections) || sections.length === 0) {
    res.status(400).json({ error: 'No task data provided' })
    return
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' })
    return
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            date,
            recipientName: recipientName || 'Rohan',
            senderName: senderName || 'Asa',
            sections,
          }),
        },
      ],
    })

    const textBlock = response.content.find(block => block.type === 'text')
    res.status(200).json({ summary: textBlock?.text || '' })
  } catch (err) {
    console.error('daily-summary generation failed', err)
    res.status(500).json({ error: 'Failed to generate summary' })
  }
}
