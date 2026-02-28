import { getDb } from './db';

// Simple RBAC checker
export async function checkAccess(roleName: string | undefined | null, requiredPath: string): Promise<boolean> {
  if (!roleName) return false;
  if (roleName === 'admin') return true; // Admin has full access to everything in code

  const db = getDb();
  const role = db.prepare('SELECT permissions_json FROM roles WHERE name = ?').get(roleName) as { permissions_json: string } | undefined;
  
  if (!role || !role.permissions_json) return false;

  try {
    const perms: string[] = JSON.parse(role.permissions_json);
    // If '*' is present, they have access
    if (perms.includes('*')) return true;
    // Check if exact match or if requiredPath starts with something they have access to?
    // Let's do exact match or startsWith
    return perms.some(p => requiredPath === p || requiredPath.startsWith(`${p}/`));
  } catch {
    return false;
  }
}
