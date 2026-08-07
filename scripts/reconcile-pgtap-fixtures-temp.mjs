import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const databaseDir = path.join(root, 'supabase/tests/database');
const files = fs.readdirSync(databaseDir)
  .filter(name => name.endsWith('.sql'))
  .sort();

function identityFor(id) {
  const hex = crypto.createHash('sha256').update(String(id)).digest('hex');
  const n1 = Number.parseInt(hex.slice(0, 8), 16) % 1_000_000;
  const n2 = Number.parseInt(hex.slice(8, 16), 16) % 1_000_000;
  const n3 = Number.parseInt(hex.slice(16, 20), 16) % 100;
  const a = String(n1).padStart(6, '0');
  const b = String(n2).padStart(6, '0');
  const c = String(n3).padStart(2, '0');
  return {
    inep: `33${a}`,
    cnpj: `90.${a.slice(0, 3)}.${a.slice(3)}/0001-${c}`,
    sici: `SICI-TEST-${hex.slice(0, 12).toUpperCase()}`
  };
}

function splitTuples(valuesPart) {
  const tuples = [];
  let depth = 0;
  let inString = false;
  let start = -1;
  for (let i = 0; i < valuesPart.length; i += 1) {
    const ch = valuesPart[i];
    if (ch === "'") {
      if (inString && valuesPart[i + 1] === "'") {
        i += 1;
        continue;
      }
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '(') {
      if (depth === 0) start = i;
      depth += 1;
    } else if (ch === ')') {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        tuples.push({ start, end: i + 1, text: valuesPart.slice(start, i + 1) });
        start = -1;
      }
    }
  }
  return tuples;
}

function firstSqlString(tupleText) {
  const match = tupleText.match(/^\(\s*'((?:''|[^'])*)'/);
  return match ? match[1].replaceAll("''", "'") : null;
}

function patchDirectSchoolInserts(source, fileName) {
  return source.replace(
    /insert\s+into\s+public\.schools\s*\(([\s\S]*?)\)\s*values\s*([\s\S]*?);/gi,
    (whole, columnsPart, valuesPart) => {
      const columns = columnsPart.split(',').map(value => value.trim().toLowerCase());
      if (columns.includes('inep') && columns.includes('cnpj') && columns.includes('sici')) {
        return whole;
      }
      if (columns.includes('inep') || columns.includes('cnpj') || columns.includes('sici')) {
        throw new Error(`${fileName}: cadastro escolar possui identidade institucional parcial.`);
      }

      const tuples = splitTuples(valuesPart);
      if (tuples.length === 0) throw new Error(`${fileName}: não foi possível decompor VALUES de schools.`);

      let cursor = 0;
      let patchedValues = '';
      for (const tuple of tuples) {
        patchedValues += valuesPart.slice(cursor, tuple.start);
        const id = firstSqlString(tuple.text);
        if (!id) throw new Error(`${fileName}: school id literal não localizado em ${tuple.text.slice(0, 80)}`);
        const identity = identityFor(`${fileName}:${id}`);
        const body = tuple.text.slice(0, -1);
        patchedValues += `${body}, '${identity.inep}', '${identity.cnpj}', '${identity.sici}')`;
        cursor = tuple.end;
      }
      patchedValues += valuesPart.slice(cursor);

      const normalizedColumns = columnsPart.trimEnd();
      const separator = normalizedColumns.includes('\n') ? ',\n    ' : ', ';
      return `insert into public.schools (${normalizedColumns}${separator}inep${separator}cnpj${separator}sici)\nvalues${patchedValues};`;
    }
  );
}

function patchSchoolJsonPayloads(source, fileName) {
  return source.replace(/'({[^'\n]*})'::jsonb/g, (whole, jsonText) => {
    if (!jsonText.includes('"designation"') || !jsonText.includes('"denomination"') || !jsonText.includes('"initial_competence"')) {
      return whole;
    }
    let payload;
    try {
      payload = JSON.parse(jsonText);
    } catch {
      return whole;
    }
    if (!payload.id || payload.inep || payload.cnpj || payload.sici) return whole;
    const identity = identityFor(`${fileName}:${payload.id}`);
    payload.inep = identity.inep;
    payload.cnpj = identity.cnpj;
    payload.sici = identity.sici;
    return `'${JSON.stringify(payload)}'::jsonb`;
  });
}

function patchExerciseVersion(source) {
  return source.replace(
    /(save_exercise_with_competences\(\s*\n?\s*)'({[^'\n]*})'::jsonb,/g,
    (whole, prefix, jsonText) => {
      let payload;
      try {
        payload = JSON.parse(jsonText);
      } catch {
        return whole;
      }
      if (Object.hasOwn(payload, 'row_version')) return whole;
      return `${prefix}jsonb_set('${jsonText}'::jsonb, '{row_version}', to_jsonb((select row_version from public.app_config where id = 'global')), true),`;
    }
  );
}

const changed = [];
for (const fileName of files) {
  const filePath = path.join(databaseDir, fileName);
  const original = fs.readFileSync(filePath, 'utf8');
  let next = original;
  next = patchDirectSchoolInserts(next, fileName);
  next = patchSchoolJsonPayloads(next, fileName);
  next = patchExerciseVersion(next);

  const staleInsert = /insert\s+into\s+public\.schools\s*\((?![\s\S]*?\binep\b[\s\S]*?\bcnpj\b[\s\S]*?\bsici\b)[\s\S]*?\)\s*values/i.test(next);
  if (staleInsert) throw new Error(`${fileName}: ainda existe INSERT de school sem identidade institucional completa.`);

  if (next !== original) {
    fs.writeFileSync(filePath, next);
    changed.push(fileName);
  }
}

if (changed.length === 0) {
  throw new Error('Nenhum fixture pgTAP precisou de reconciliação; esperado ao menos um arquivo antigo.');
}

console.log(`Fixtures reconciliados (${changed.length}):`);
changed.forEach(file => console.log(`- ${file}`));
