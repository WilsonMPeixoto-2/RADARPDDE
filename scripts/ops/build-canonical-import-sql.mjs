import fs from 'node:fs';
import crypto from 'node:crypto';

const snapshotPath = process.env.RADAR_SNAPSHOT_FILE || '/tmp/radar-pdde-snapshot.json';
const sqlPath = process.env.RADAR_IMPORT_SQL_FILE || '/tmp/radar-pdde-import.sql';
const summaryPath = process.env.RADAR_IMPORT_SUMMARY_FILE || '/tmp/radar-pdde-import-summary.json';
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
const entities = snapshot.entities || {};

const expectedCounts = Object.freeze({
  appConfig: 1,
  programs: 8,
  controllers: 5,
  inventoryTeamMembers: 3,
  competences: 12,
  schools: 163,
  schoolPrograms: 430,
  userProfiles: 0,
  userSchoolScopes: 0,
  auditEvents: 0,
  dataImportRuns: 0
});

if (String(snapshot.version) !== '1') throw new Error(`SNAPSHOT_VERSION_MISMATCH:${snapshot.version}`);
if (Object.keys(entities).length !== 19) throw new Error(`SNAPSHOT_COLLECTION_COUNT_MISMATCH:${Object.keys(entities).length}`);
for (const [entity, expected] of Object.entries(expectedCounts)) {
  const actual = Array.isArray(entities[entity]) ? entities[entity].length : -1;
  if (actual !== expected) throw new Error(`SNAPSHOT_ENTITY_COUNT_MISMATCH:${entity}:${actual}:${expected}`);
}

const specs = Object.freeze([
  {
    entity: 'programs', table: 'programs', temp: 'tmp_programs',
    columns: [['id', 'text'], ['name', 'text'], ['description', 'text'], ['active', 'boolean']]
  },
  {
    entity: 'controllers', table: 'controllers', temp: 'tmp_controllers',
    columns: [['id', 'text'], ['name', 'text'], ['email', 'text'], ['active', 'boolean']]
  },
  {
    entity: 'inventoryTeamMembers', table: 'inventory_team_members', temp: 'tmp_inventory_team_members',
    columns: [['id', 'text'], ['name', 'text'], ['email', 'text'], ['active', 'boolean']]
  },
  {
    entity: 'competences', table: 'competences', temp: 'tmp_competences',
    columns: [
      ['id', 'text'], ['label', 'text'], ['exercise', 'integer'], ['starts_on', 'date'],
      ['ends_on', 'date'], ['closed_at', 'timestamptz'], ['bonus_deadline', 'date']
    ]
  },
  {
    entity: 'schools', table: 'schools', temp: 'tmp_schools',
    columns: [
      ['id', 'text'], ['designation', 'text'], ['denomination', 'text'], ['phone', 'text'],
      ['institutional_mobile', 'text'], ['email', 'text'], ['director_name', 'text'],
      ['director_phone', 'text'], ['deputy_director_name', 'text'], ['deputy_director_phone', 'text'],
      ['inep', 'text'], ['cnpj', 'text'], ['cre', 'text'], ['ra', 'text'], ['sici', 'text'],
      ['controller_id', 'text'], ['inventory_process', 'text'], ['initial_competence', 'text'],
      ['active', 'boolean']
    ]
  },
  {
    entity: 'schoolPrograms', table: 'school_programs', temp: 'tmp_school_programs',
    columns: [
      ['id', 'text'], ['school_id', 'text'], ['program_id', 'text'], ['active', 'boolean'],
      ['starts_on', 'date'], ['ends_on', 'date']
    ]
  },
  {
    entity: 'appConfig', table: 'app_config', temp: 'tmp_app_config',
    columns: [
      ['id', 'text'], ['exercises', 'jsonb'], ['closing_competence', 'text'],
      ['bonus_deadline_extended', 'date'], ['settings', 'jsonb']
    ]
  }
]);

const dollarTag = '$radar_snapshot$';
const profileBaseline = [
  { id: 'technical_admin', label: 'Administrador técnico', priority: 10, description: 'Administração técnica e segurança do ambiente.', active: true },
  { id: 'sme_management', label: 'Gestão SME', priority: 20, description: 'Leitura gerencial e administração institucional.', active: true },
  { id: 'federal_assistant', label: 'Assistente de Verbas Federais', priority: 30, description: 'Operação transversal de verbas federais.', active: true },
  { id: 'controller', label: 'Controlador', priority: 40, description: 'Operação da carteira de escolas vinculada.', active: true },
  { id: 'inventory', label: 'Equipe de Inventário', priority: 50, description: 'Operação patrimonial e de inventariação.', active: true }
];

function compactJson(value) {
  const text = JSON.stringify(value);
  if (text.includes(dollarTag)) throw new Error('SNAPSHOT_DOLLAR_TAG_COLLISION');
  return text;
}

function columnNames(spec, qualifier = '') {
  return spec.columns.map(([name]) => `${qualifier}${name}`).join(', ');
}

function rowExpression(spec, qualifier) {
  return `row(${spec.columns.map(([name]) => `${qualifier}.${name}`).join(', ')})`;
}

const lines = [];
lines.push('begin;');
lines.push("set local lock_timeout = '10s';");
lines.push("set local statement_timeout = '180s';");
lines.push('');
lines.push('do $$');
lines.push('declare');
lines.push('  v_profiles jsonb;');
lines.push('begin');
lines.push("  if not exists (select 1 from supabase_migrations.schema_migrations where version = '20260720030046') then");
lines.push("    raise exception 'MIGRATION_14_MISSING';");
lines.push('  end if;');
lines.push('  if (select count(*) from supabase_migrations.schema_migrations) <> 14 then');
lines.push("    raise exception 'MIGRATION_COUNT_MISMATCH';");
lines.push('  end if;');
for (const spec of specs) {
  lines.push(`  if (select count(*) from public.${spec.table}) <> 0 then`);
  lines.push(`    raise exception 'TARGET_NOT_EMPTY:${spec.table}';`);
  lines.push('  end if;');
}
lines.push("  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'label', label, 'priority', priority, 'description', description, 'active', active) order by priority), '[]'::jsonb)");
lines.push('    into v_profiles from public.profiles;');
lines.push(`  if v_profiles is distinct from ${dollarTag}${compactJson(profileBaseline)}${dollarTag}::jsonb then`);
lines.push("    raise exception 'PROFILE_BASELINE_MISMATCH';");
lines.push('  end if;');
lines.push('end');
lines.push('$$;');
lines.push('');

for (const spec of specs) {
  const json = compactJson(entities[spec.entity]);
  const definitions = spec.columns.map(([name, type]) => `${name} ${type}`).join(', ');
  lines.push(`create temp table ${spec.temp} on commit drop as`);
  lines.push(`select * from jsonb_to_recordset(${dollarTag}${json}${dollarTag}::jsonb) as x(${definitions});`);
  lines.push(`insert into public.${spec.table} (${columnNames(spec)})`);
  lines.push(`select ${columnNames(spec)} from ${spec.temp};`);
  lines.push('');
}

lines.push('do $$');
lines.push('begin');
for (const spec of specs) {
  const expected = entities[spec.entity].length;
  lines.push(`  if (select count(*) from public.${spec.table}) <> ${expected} then`);
  lines.push(`    raise exception 'POST_COUNT_MISMATCH:${spec.table}';`);
  lines.push('  end if;');
  lines.push('  if exists (');
  lines.push(`    select 1 from ${spec.temp} t`);
  lines.push(`    full join public.${spec.table} p using (id)`);
  lines.push(`    where t.id is null or p.id is null or ${rowExpression(spec, 't')} is distinct from ${rowExpression(spec, 'p')}`);
  lines.push('  ) then');
  lines.push(`    raise exception 'POST_DATA_MISMATCH:${spec.table}';`);
  lines.push('  end if;');
}
lines.push('  if exists (select 1 from public.schools s left join public.controllers c on c.id = s.controller_id where s.controller_id is not null and c.id is null) then');
lines.push("    raise exception 'ORPHAN_SCHOOL_CONTROLLER';");
lines.push('  end if;');
lines.push('  if exists (select 1 from public.schools s left join public.competences c on c.id = s.initial_competence where s.initial_competence is not null and c.id is null) then');
lines.push("    raise exception 'ORPHAN_SCHOOL_COMPETENCE';");
lines.push('  end if;');
lines.push('  if exists (select 1 from public.school_programs sp left join public.schools s on s.id = sp.school_id left join public.programs p on p.id = sp.program_id where s.id is null or p.id is null) then');
lines.push("    raise exception 'ORPHAN_SCHOOL_PROGRAM';");
lines.push('  end if;');
lines.push('end');
lines.push('$$;');
lines.push('commit;');
lines.push('');
lines.push('select jsonb_build_object(');
lines.push("  'ok', true,");
lines.push("  'appConfig', (select count(*) from public.app_config),");
lines.push("  'programs', (select count(*) from public.programs),");
lines.push("  'controllers', (select count(*) from public.controllers),");
lines.push("  'inventoryTeamMembers', (select count(*) from public.inventory_team_members),");
lines.push("  'competences', (select count(*) from public.competences),");
lines.push("  'schools', (select count(*) from public.schools),");
lines.push("  'schoolPrograms', (select count(*) from public.school_programs),");
lines.push("  'profiles', (select count(*) from public.profiles),");
lines.push("  'authUsers', (select count(*) from auth.users)");
lines.push(') as import_summary;');

fs.writeFileSync(sqlPath, `${lines.join('\n')}\n`, { mode: 0o600 });
const summary = {
  ok: true,
  snapshotVersion: String(snapshot.version),
  importId: String(snapshot.importId || ''),
  domainHash: crypto.createHash('sha256').update(JSON.stringify(entities)).digest('hex'),
  counts: Object.fromEntries(Object.keys(entities).sort().map(entity => [entity, entities[entity].length])),
  sqlSha256: crypto.createHash('sha256').update(fs.readFileSync(sqlPath)).digest('hex')
};
fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, { mode: 0o600 });
process.stdout.write(`${JSON.stringify(summary)}\n`);
