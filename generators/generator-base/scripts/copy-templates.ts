import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const GENERATORS_DIR = 'generators';
const DIST_DIR = 'dist';

// Walked and copied file-by-file rather than via fs.cpSync(src, dest,
// { recursive: true }): that single-call directory copy has proven
// unreliable on some overlay filesystems (observed leaving phantom,
// unreadable directory entries in dist/), where the same tree copied
// file-by-file works fine.
/**
 * Recursively copies src into dest, creating directories as needed.
 *
 * @param src - Source directory.
 * @param dest - Destination directory.
 */
function copyDir(src: string, dest: string) {
  mkdirSync(dest, { recursive: true });

  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

for (const entry of readdirSync(GENERATORS_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const templatesDir = join(GENERATORS_DIR, entry.name, 'templates');
  if (!existsSync(templatesDir)) continue;

  copyDir(templatesDir, join(DIST_DIR, templatesDir));
}
