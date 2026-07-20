import fs from 'node:fs';
import crypto from 'node:crypto';

const source = process.env.RADAR_SNAPSHOT_FILE || '/tmp/radar-pdde-snapshot.json';
const target = process.env.RADAR_IMPORT_SQL_FILE || '/tmp/radar-pdde-import.sql';
const summaryFile = process.env.RADAR_IMPORT_SUMMARY_FILE || '/tmp/radar-pdde-import-summary.json';
const snapshot = JSON.parse(fs.readFileSync(source, 'utf8'));
const E = snapshot.entities || {};
const expected = { appConfig:1, programs:8, controllers:5, inventoryTeamMembers:3, competences:12, schools:163, schoolPrograms:430, userProfiles:0, userSchoolScopes:0, auditEvents:0, dataImportRuns:0 };
if (String(snapshot.version) !== '1' || Object.keys(E).length !== 19) throw new Error('SNAPSHOT_CONTRACT_MISMATCH');
for (const [name,count] of Object.entries(expected)) if (!Array.isArray(E[name]) || E[name].length !== count) throw new Error(`SNAPSHOT_COUNT_MISMATCH:${name}`);

const specs = [
 ['programs','programs','id:text,name:text,description:text,active:boolean'],
 ['controllers','controllers','id:text,name:text,email:text,active:boolean'],
 ['inventoryTeamMembers','inventory_team_members','id:text,name:text,email:text,active:boolean'],
 ['competences','competences','id:text,label:text,exercise:integer,starts_on:date,ends_on:date,closed_at:timestamptz,bonus_deadline:date'],
 ['schools','schools','id:text,designation:text,denomination:text,phone:text,institutional_mobile:text,email:text,director_name:text,director_phone:text,deputy_director_name:text,deputy_director_phone:text,inep:text,cnpj:text,cre:text,ra:text,sici:text,controller_id:text,inventory_process:text,initial_competence:text,active:boolean'],
 ['schoolPrograms','school_programs','id:text,school_id:text,program_id:text,active:boolean,starts_on:date,ends_on:date'],
 ['appConfig','app_config','id:text,exercises:jsonb,closing_competence:text,bonus_deadline_extended:date,settings:jsonb']
].map(([entity,table,definition]) => ({ entity, table, columns: definition.split(',').map(item => item.split(':')) }));
const profiles = [
 {id:'technical_admin',label:'Administrador técnico',priority:10,description:'Administração técnica e segurança do ambiente.',active:true},
 {id:'sme_management',label:'Gestão SME',priority:20,description:'Leitura gerencial e administração institucional.',active:true},
 {id:'federal_assistant',label:'Assistente de Verbas Federais',priority:30,description:'Operação transversal de verbas federais.',active:true},
 {id:'controller',label:'Controlador',priority:40,description:'Operação da carteira de escolas vinculada.',active:true},
 {id:'inventory',label:'Equipe de Inventário',priority:50,description:'Operação patrimonial e de inventariação.',active:true}
];
const tag = '$radar_snapshot$';
const json = value => { const text=JSON.stringify(value); if(text.includes(tag)) throw new Error('DOLLAR_TAG_COLLISION'); return text; };
const names = spec => spec.columns.map(([name])=>name).join(', ');
const qualified = (spec,alias) => spec.columns.map(([name])=>`${alias}.${name}`).join(', ');
const row = (spec,alias) => `row(${qualified(spec,alias)})`;
const sql=[];
sql.push('begin;',"set local lock_timeout='10s';","set local statement_timeout='180s';",'do $$ declare v jsonb; begin');
sql.push("if not exists(select 1 from supabase_migrations.schema_migrations where version='20260720193000') then raise exception 'MIGRATION_15_MISSING'; end if;");
sql.push("if (select count(*) from supabase_migrations.schema_migrations)<>15 then raise exception 'MIGRATION_COUNT_MISMATCH'; end if;");
sql.push("select coalesce(jsonb_agg(jsonb_build_object('id',id,'label',label,'priority',priority,'description',description,'active',active) order by priority),'[]'::jsonb) into v from public.profiles;");
sql.push(`if v is distinct from ${tag}${json(profiles)}${tag}::jsonb then raise exception 'PROFILE_BASELINE_MISMATCH'; end if; end $$;`);
for(const spec of specs){
 const temp=`tmp_${spec.table}`;
 const defs=spec.columns.map(([name,type])=>`${name} ${type}`).join(', ');
 sql.push(`create temp table ${temp} on commit drop as select * from jsonb_to_recordset(${tag}${json(E[spec.entity])}${tag}::jsonb) as x(${defs});`);
 sql.push(`do $$ begin if exists(select 1 from public.${spec.table} p left join ${temp} t on t.id=p.id where t.id is null) then raise exception 'DESTINATION_EXTRA_ROW:${spec.table}'; end if; if exists(select 1 from public.${spec.table} p join ${temp} t on t.id=p.id where ${row(spec,'t')} is distinct from ${row(spec,'p')}) then raise exception 'DESTINATION_CONFLICT:${spec.table}'; end if; end $$;`);
 sql.push(`insert into public.${spec.table} (${names(spec)}) select ${qualified(spec,'t')} from ${temp} t where not exists(select 1 from public.${spec.table} p where p.id=t.id);`);
}
sql.push('do $$ begin');
for(const spec of specs){
 const temp=`tmp_${spec.table}`, count=E[spec.entity].length;
 sql.push(`if (select count(*) from public.${spec.table})<>${count} then raise exception 'POST_COUNT_MISMATCH:${spec.table}'; end if;`);
 sql.push(`if exists(select 1 from ${temp} t full join public.${spec.table} p using(id) where t.id is null or p.id is null or ${row(spec,'t')} is distinct from ${row(spec,'p')}) then raise exception 'POST_DATA_MISMATCH:${spec.table}'; end if;`);
}
sql.push("if exists(select 1 from public.schools s left join public.controllers c on c.id=s.controller_id where s.controller_id is not null and c.id is null) then raise exception 'ORPHAN_SCHOOL_CONTROLLER'; end if;");
sql.push("if exists(select 1 from public.schools s left join public.competences c on c.id=s.initial_competence where s.initial_competence is not null and c.id is null) then raise exception 'ORPHAN_SCHOOL_COMPETENCE'; end if;");
sql.push("if exists(select 1 from public.school_programs sp left join public.schools s on s.id=sp.school_id left join public.programs p on p.id=sp.program_id where s.id is null or p.id is null) then raise exception 'ORPHAN_SCHOOL_PROGRAM'; end if; end $$;",'commit;');
sql.push("select jsonb_build_object('ok',true,'profiles',(select count(*) from public.profiles),'programs',(select count(*) from public.programs),'controllers',(select count(*) from public.controllers),'inventoryTeamMembers',(select count(*) from public.inventory_team_members),'competences',(select count(*) from public.competences),'schools',(select count(*) from public.schools),'schoolPrograms',(select count(*) from public.school_programs),'appConfig',(select count(*) from public.app_config),'authUsers',(select count(*) from auth.users)) as import_summary;");
fs.writeFileSync(target,`${sql.join('\n')}\n`,{mode:0o600});
const summary={ok:true,version:String(snapshot.version),domainHash:crypto.createHash('sha256').update(JSON.stringify(E)).digest('hex'),counts:Object.fromEntries(Object.keys(E).sort().map(name=>[name,E[name].length])),sqlSha256:crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex')};
fs.writeFileSync(summaryFile,`${JSON.stringify(summary,null,2)}\n`,{mode:0o600});
console.log(JSON.stringify(summary));
