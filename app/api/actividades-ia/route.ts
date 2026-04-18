import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const { hora, apetece } = await request.json() as { hora: number; apetece?: string };

  const momento = hora < 14 ? 'mañana' : hora < 20 ? 'tarde' : 'noche';
  const contexto = apetece?.trim()
    ? `El usuario quiere algo relacionado con: "${apetece.trim()}".`
    : '';

  const prompt = `Sugiere 4 planes concretos para Cabre (26 años, vive solo, le gustan los animes, los videojuegos, caminar y la rutina tranquila) para esta ${momento}.
${contexto}

Responde SOLO con JSON válido, sin markdown:
[
  { "emoji": "🎮", "label": "Plan corto y concreto" },
  { "emoji": "📺", "label": "Plan corto y concreto" },
  { "emoji": "🚶", "label": "Plan corto y concreto" },
  { "emoji": "📞", "label": "Plan corto y concreto" }
]

Basa las 4 sugerencias en lo que el usuario ha escrito. Sé específico (nombre del anime, tipo de juego, ruta concreta, etc). Sin asteriscos.`;

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = msg.content[0].type === 'text' ? msg.content[0].text : '[]';
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const actividades = JSON.parse(text);

  return Response.json({ actividades });
}
