import fs from 'node:fs';

const migrationPath = 'supabase/migrations/20260714220146_preconnection_reversible_import.sql';
let sql = fs.readFileSync(migrationPath, 'utf8');
const tables = [
    'administrative_logs',
    'registered_invoices',
    'assets',
    'pendency_contacts',
    'pendency_attempts',
    'pendencies',
    'verifications',
    'school_programs',
    'schools',
    'app_config',
    'competences',
    'programs'
];

for (const table of tables) {
    const unsafe = `delete from public.${table};`;
    const safe = `delete from public.${table} where true;`;
    if (!sql.includes(unsafe)) {
        throw new Error(`Exclusão esperada não localizada: ${unsafe}`);
    }
    sql = sql.replace(unsafe, safe);
}

fs.writeFileSync(migrationPath, sql);
