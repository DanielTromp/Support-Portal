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
  if (content.includes("session.user.name")) {
    content = content.replace(/session\.user\.name/g, "session?.user?.name || 'unknown'");
    fs.writeFileSync(file, content, 'utf-8');
    console.log('Fixed lints in', file);
  }
}
