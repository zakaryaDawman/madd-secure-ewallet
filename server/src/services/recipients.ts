import { pool } from '../db/pool';
import { firstName, maskName, maskPhone } from '../utils/mask';

/** What the sender is allowed to see about someone they might pay. */
export type Recipient = {
  phone: string; // full number, already typed by the sender (needed to send money)
  maskedName: string;
  maskedPhone: string;
};

export type LookupResult = { found: Recipient } | { error: 'not_found' | 'self' };

/** Finds the MADD user with this phone number (not a deactivated one). Refuses the sender's own number. */
export async function lookupRecipient(senderId: number, phone: string): Promise<LookupResult> {
  const { rows } = await pool.query<{ id: number; full_name: string; phone: string }>(
    'SELECT id, full_name, phone FROM users WHERE phone = $1 AND deactivated_at IS NULL',
    [phone],
  );
  const user = rows[0];
  if (!user) return { error: 'not_found' };
  if (user.id === senderId) return { error: 'self' };
  return { found: { phone: user.phone, maskedName: maskName(user.full_name), maskedPhone: maskPhone(user.phone) } };
}

export type RecentRecipient = Recipient & { firstName: string };

/** The last 4 different people the user sent money to, most recent first. */
export async function recentRecipients(senderId: number): Promise<RecentRecipient[]> {
  const { rows } = await pool.query<{ full_name: string; phone: string }>(
    `SELECT u.full_name, u.phone
     FROM transactions t JOIN users u ON u.id = t.receiver_id
     WHERE t.sender_id = $1
     GROUP BY u.id
     ORDER BY max(t.created_at) DESC
     LIMIT 4`,
    [senderId],
  );
  return rows.map((r) => ({
    phone: r.phone,
    firstName: firstName(r.full_name),
    maskedName: maskName(r.full_name),
    maskedPhone: maskPhone(r.phone),
  }));
}
