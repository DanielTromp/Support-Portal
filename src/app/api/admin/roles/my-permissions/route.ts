import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET() {
  const session = await auth();
  const roleName = session?.user?.role;
  if (!roleName) {
    return NextResponse.json({ permissions: [] });
  }

  if (roleName === 'admin') {
    return NextResponse.json({ permissions: ['*'] });
  }

  const db = getDb();
  const role = db.prepare('SELECT permissions_json FROM roles WHERE name = ?').get(roleName) as { permissions_json: string } | undefined;
  
  if (!role || !role.permissions_json) {
    return NextResponse.json({ permissions: [] });
  }

  try {
    const permissions: string[] = JSON.parse(role.permissions_json);
    return NextResponse.json({ permissions });
  } catch {
    return NextResponse.json({ permissions: [] });
  }
}
