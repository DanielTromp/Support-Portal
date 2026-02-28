import fs from 'fs';
import path from 'path';

function walk(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, fileList);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const targetDir = path.join(process.cwd(), 'src/app/api/admin');
const files = walk(targetDir);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  if (content.includes("session?.user?.role !== 'admin'")) {
    // We need to inject import { checkAccess } from '@/lib/rbac';
    if (!content.includes("checkAccess")) {
      content = content.replace("import { auth } from '@/lib/auth';", "import { auth } from '@/lib/auth';\nimport { checkAccess } from '@/lib/rbac';");
    }

    // Replace the specific file's check path. E.g. /app/api/admin/users/route.ts -> '/admin/users'
    const match = file.match(/src\/app\/api(\/admin\/.*?)\/route\.ts/);
    const requiredPath = match ? match[1] : '/admin';

    content = content.replace(
      /if\s*\(\s*session\?\.user\?\.role !== 'admin'\s*\)\s*\{/g, 
      `if (!await checkAccess(session?.user?.role, '${requiredPath}')) {`
    );

    fs.writeFileSync(file, content, 'utf-8');
    console.log('Updated', file);
  }
}
