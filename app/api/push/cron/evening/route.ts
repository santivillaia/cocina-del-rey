export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/push/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authorization: `Bearer ${process.env.CRON_SECRET}` },
    body: JSON.stringify({ title: '🌙 Recap del día', body: '¿Has marcado todas las misiones de hoy?' }),
  });
  return Response.json({ ok: true });
}
