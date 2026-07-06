import { db } from '../db';
import { Staff } from '../db';

export async function withAuditLog<T>(
  currentUser: Staff | null,
  action: string,
  details: string,
  operation: () => Promise<T>
): Promise<T> {
  const result = await operation();
  
  if (currentUser?.id) {
    await db.auditLogs.add({
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      details,
      timestamp: Date.now()
    });
  }
  
  return result;
}
