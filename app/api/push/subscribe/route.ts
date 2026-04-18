import { supabase } from '../../../../lib/supabase';

export async function POST(request: Request) {
  const subscription = await request.json();
  if (!subscription?.endpoint) return Response.json({ error: 'Invalid subscription' }, { status: 400 });

  await supabase.from('push_subscriptions').upsert(
    { endpoint: subscription.endpoint, subscription: JSON.stringify(subscription) },
    { onConflict: 'endpoint' }
  );

  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { endpoint } = await request.json();
  if (endpoint) await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  return Response.json({ ok: true });
}
