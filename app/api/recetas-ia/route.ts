import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const { tipo, restricciones } = await request.json() as {
    tipo: 'desayuno' | 'comida' | 'cena';
    restricciones?: string;
  };

  const restriccionesTexto = restricciones?.trim()
    ? `Restricciones/preferencias: ${restricciones.trim()}.`
    : '';

  const prompt = `Eres un chef experto en comida española sencilla para personas que cocinan solos en casa.
Genera UNA receta de ${tipo} para Cabre (26 años, vive solo, cocina sencilla, presupuesto ajustado).
${restriccionesTexto}

IMPORTANTE:
- Exactamente 1 plato principal (puede tener acompañamiento integrado, no postres separados)
- Calorías reales: desayuno 250-400 kcal, comida 400-600 kcal, cena 250-450 kcal
- Ingredientes baratos y accesibles en supermercado español
- Pasos muy concretos y cortos (máximo 4 pasos)
- Tiempo total realista para novato

Responde SOLO con JSON válido, sin markdown, sin explicaciones, exactamente este formato:
{
  "nombre": "Nombre del plato",
  "emoji": "🍳",
  "nivel": "facil",
  "tiempo": "15 min",
  "kcal": 380,
  "prot": "25g",
  "carbos": "30g",
  "grasa": "12g",
  "utensilio": "Sartén",
  "ingredientes": [
    { "emoji": "🥚", "nombre": "Huevos", "qty": "2 ud", "cat": "Proteínas" }
  ],
  "pasos": [
    "Paso 1 concreto.",
    "Paso 2 concreto.",
    "Paso 3 concreto."
  ]
}

"nivel" debe ser "facil", "normal" o "atrevo".
"cat" de ingrediente debe ser uno de: Cereales, Lácteos, Proteínas, Verduras, Frutas, Varios.`;

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = msg.content[0].type === 'text' ? msg.content[0].text : '';
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const receta = JSON.parse(text);

  return Response.json({ receta });
}
