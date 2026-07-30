import fs from 'fs/promises';
import path from 'path';
import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const mapping = [
  { slug: 'project-management-field-guide', file: 'project-management-field-guide.pdf', pages: 100 },
  { slug: 'contract-management-practice-handbook', file: 'contract-management-practice-handbook.pdf', pages: 100 },
  { slug: 'integrated-project-contract-playbook', file: 'integrated-project-contract-playbook.pdf', pages: 100 },
];

const uploadDir = path.resolve('public', 'uploads', 'library');

const mysqlConfig = {
  host: process.env.MYSQL_HOST ?? '127.0.0.1',
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER ?? 'root',
  password: process.env.MYSQL_PASSWORD ?? '',
  database: process.env.MYSQL_DATABASE ?? 'pcmo',
};

(async () => {
  const conn = await mysql.createConnection(mysqlConfig);
  try {
    for (const m of mapping) {
      const filePath = path.join(uploadDir, m.file);
      try {
        const stat = await fs.stat(filePath);
        const size = stat.size;
        const attachments = [
          { title: m.slug.replace(/-/g, ' '), url: `/uploads/library/${m.file}`, mime: 'application/pdf', size },
        ];
        const attachmentsJson = JSON.stringify(attachments);
        console.log(`Updating ${m.slug} -> ${m.file} (${m.pages} pages, ${size} bytes)`);
        const [updateResult] = await conn.execute(
          `UPDATE library_contents SET attachments = ?, page_count = ? WHERE slug = ? LIMIT 1`,
          [attachmentsJson, m.pages, m.slug],
        );
        // If no rows matched, insert a new library_contents record
        if (updateResult.affectedRows === 0) {
          const id = randomUUID();
          const title = m.slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          const insertSql = `INSERT INTO library_contents (id, title, slug, excerpt, body, type, status, attachments, sale_enabled, price, currency, page_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'published', ?, FALSE, 0, 'USD', ?, NOW(), NOW())`;
          const [ins] = await conn.execute(insertSql, [id, title, m.slug, '', '', 'publication', attachmentsJson, m.pages]);
          console.log('Inserted:', ins);
        } else {
          console.log('Updated existing library_contents row');
        }
      } catch (err) {
        console.error(`Failed for ${m.file}: ${err.message}`);
      }
    }
  } finally {
    await conn.end();
  }
})();
