const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function parsePrescription(imageBase64, mimeType) {
  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2048,
    thinking: { type: 'adaptive' },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: `Extract medication information from this prescription image. Return a JSON object with these fields:
{
  "name": "medication name",
  "dosage": "dosage amount and unit (e.g. 500mg)",
  "frequency": "how often to take (e.g. twice daily, every 8 hours)",
  "instructions": "special instructions",
  "prescriber": "doctor name if visible",
  "refills": number or null,
  "supply_days": number of days supply or null
}

If any field is not clearly visible, use null. Return only valid JSON, no markdown.`,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('No text response from Claude');

  try {
    const cleaned = textBlock.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Could not parse prescription data from image');
  }
}

async function parsePrescriptionText(text) {
  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2048,
    thinking: { type: 'adaptive' },
    messages: [
      {
        role: 'user',
        content: `Extract medication information from this prescription text. Return a JSON object with these fields:
{
  "name": "medication name",
  "dosage": "dosage amount and unit (e.g. 500mg)",
  "frequency": "how often to take (e.g. twice daily, every 8 hours)",
  "instructions": "special instructions",
  "prescriber": "doctor name if visible",
  "refills": number or null,
  "supply_days": number of days supply or null
}

Prescription text:
${text}

Return only valid JSON, no markdown.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('No text response from Claude');

  const cleaned = textBlock.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

async function checkInteractions(medications) {
  if (medications.length < 2) {
    return { interactions: [], safe: true };
  }

  const medList = medications.map((m) => `- ${m.name} ${m.dosage}`).join('\n');

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    messages: [
      {
        role: 'user',
        content: `You are a clinical pharmacist reviewing a patient's medication list for drug interactions.

Check these medications for interactions:
${medList}

Return a JSON object:
{
  "interactions": [
    {
      "medications": ["drug1", "drug2"],
      "severity": "major|moderate|minor",
      "description": "clinical description of the interaction and what to watch for",
      "recommendation": "what the patient should do"
    }
  ],
  "safe": true/false,
  "summary": "brief overall safety summary"
}

If no interactions found, return interactions as empty array and safe as true.
Return only valid JSON, no markdown. Be thorough but accurate - only flag real, documented interactions.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('No text response from Claude');

  const cleaned = textBlock.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

module.exports = { parsePrescription, parsePrescriptionText, checkInteractions };
