import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse';

const dir = path.resolve('output', 'pdf');

async function listFiles() {
  const files = await fs.readdir(dir);
  return files.filter((f) => f.toLowerCase().endsWith('.pdf'));
}

async function countPages(file) {
  const buf = await fs.readFile(path.join(dir, file));
  const data = await pdf(buf);
  return data.numpages || data.numpages === 0 ? data.numpages : null;
}

(async () => {
  try {
    const files = await listFiles();
    for (const file of files) {
      try {
        const pages = await countPages(file);
        console.log(`${file}: ${pages ?? 'unknown'} pages`);
      } catch (err) {
        console.error(`${file}: error reading (${err.message})`);
      }
    }
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
})();
