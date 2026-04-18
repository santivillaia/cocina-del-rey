import webpush from 'web-push';
import { supabase } from '../../../../lib/supabase';

webpush.setVapidDetails(
  'mailto:santivilla.ia@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, body } = await request.json() as { title: string; body: string };

  const { data: subs } = await supabase.from('push_subscriptions').select('subscription');
  if (!subs?.length) return Response.json({ sent: 0 });

  const payload = JSON.stringify({ title, body, url: '/' });
  let sent = 0;
  await Promise.all(
    subs.map(async (row) => {
      try {
        await webpush.sendNotification(JSON.parse(row.subscription), payload);
        sent++;
      } catch (err: unknown) {
        if ((err as { statusCode?: number }).statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('subscription', row.subscription);
        }
      }
    })
  );

  return Response.json({ sent });
}
