export async function recordAudit(database, userId, action, metadata = {}) {
  await database('audit_logs').insert({ user_id: userId || null, action, metadata })
}