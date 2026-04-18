import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const { comidaActual, comidasDelDia } = await request.json() as {
    comidaActual: { nombre: string; kcal: number; prot: string; carbos: string; grasa: string };
    comidasDelDia: { tipo: string; nombre: string; kcal: number; prot: string; carbos: string; grasa: string }[];
  };

  const resumenDia = comidasDelDia.length > 0
    ? comidasDelDia.map(c => `- ${c.tipo}: ${c.nombre} (${c.kcal} kcal, ${c.prot} prot, ${c.carbos} carbos, ${c.grasa} grasa)`).join('\n')
    : 'Todavía no ha comido nada más hoy.';

  const prompt = `Eres un nutricionista conciso. Cabre acaba de comer o va a comer "${comidaActual.nombre}" (${comidaActual.kcal} kcal, ${comidaActual.prot} proteína, ${comidaActual.carbos} carbohidratos, ${comidaActual.grasa} grasa).

Lo que ha comido hoy hasta ahora:
${resumenDia}

Da UN consejo muy corto (máximo 2 frases) sobre qué postre, snack o complemento sencillo añadir después de esta comida para completar los nutrientes que le faltan.
- Usa nombre concreto del alimento (no marcas)
- Menciona el nutriente que aporta (potasio, fibra, proteína, vitamina C…)
- Tono cercano, sin rollos
- Sin asteriscos ni markdown
- Responde en español`;

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 120,
    messages: [{ role: 'user', content: prompt }],
  });

  const consejo = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
  return Response.json({ consejo });
}
