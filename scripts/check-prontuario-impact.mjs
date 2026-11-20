#!/usr/bin/env node
/**
 * Decisões não são tarefas efêmeras: cada obrigação sobrevive ao chat,
 * branch e etapa até prova de cumprimento, substituição explícita ou revogação.
 * Verificação puramente local, sem acesso a Supabase/GitHub/produção.
 */
import fs from 'node:fs';
import { parseArgs } from 'node:util';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const relativeRoot = 'docs/continuity/prontuario-t0-t6';
const SURFACES = new Set([
  'domain','ui','visual','tests','db','security',
  'reports','documentation','release','governance'
]);
const STATES = new Set(['planned','candidate','gate-pending','preserve','verified','superseded']);
const GITHUB = 'https://github.com/WilsonMPeixoto-2/RADARPDDE/';

function record(x) {
  return x && typeof x === 'object' && !Array.isArray(x);
}
function nonempty(x) {
  return typeof x === 'string' && x.trim().length > 0;
}
function safeRelative(p) {
  return nonempty(p) && !path.isAbsolute(p)
    && !p.split('/').includes('..') && !p.startsWith('.')
    && !p.includes('\\');
}
function loadDecisionImpact(rootDir = root) {
  const read = filename => JSON.parse(
    fs.readFileSync(path.join(rootDir, relativeRoot, filename), 'utf8')
  );
  return {impact:read('decision-impact.json'), registry:read('registry.json'), lineage:read('lineage.json')};
}

function validateDecisionImpact({impact, registry, lineage}, {rootDir = null} = {}) {
  const errors = [];
  if (!record(impact) || !record(registry) || !record(lineage)) {
    return ['decision-impact: impacto, registro e genealogia obrigatórios'];
  }
  if (impact.schemaVersion !== 1 || impact.workstream !== 'RADARPDDE/PRONTUARIO-T0-T6') {
    errors.push('decision-impact: esquema/frente inválidos');
  }
  if (impact.registryPath !== relativeRoot+'/registry.json'
    || impact.lineagePath !== relativeRoot+'/lineage.json') {
    errors.push('decision-impact: caminhos canônicos divergentes');
  }
  const decisionMap = new Map((registry.decisions || []).filter(record).map(d=>[d.id,d]));
  const requirementMap = new Map((lineage.requirements || []).filter(record).map(r=>[r.id,r]));
  const records = Array.isArray(impact.records) ? impact.records : [];
  if (!records.length) errors.push('decision-impact: decisões sem nenhum mapa');
  const seenRecords = new Set(), seenObligations = new Set();
  for (const [i,entry] of records.entries()) {
    const where = 'decision-impact.records['+i+']';
    if (!record(entry)) {errors.push(where+': inválido');continue;}
    if (seenRecords.has(entry.decisionId)) errors.push(entry.decisionId+': mapa duplicado');
    seenRecords.add(entry.decisionId);
    const decision = decisionMap.get(entry.decisionId);
    if (!decision) {errors.push(entry.decisionId+': decisão inexistente');continue;}
    if (entry.status !== decision.status) errors.push(entry.decisionId+': status divergente do registro aprovado');
    if (decision.status === 'superseded') {
      const successor = (registry.decisions || []).find(d =>
        Array.isArray(d.supersedes) && d.supersedes.includes(entry.decisionId));
      if (!successor || entry.supersededBy !== successor.id) {
        errors.push(entry.decisionId+': supersessão sem sucessor correto');
      }
      if (!Array.isArray(entry.obligations) || entry.obligations.length) {
        errors.push(entry.decisionId+': obrigação ativa em decisão substituída');
      }
      continue;
    }
    if (!Array.isArray(entry.obligations) || !entry.obligations.length) {
      errors.push(entry.decisionId+': decisão aprovada sem obrigações');
      continue;
    }
    for (const [j,o] of entry.obligations.entries()) {
      const loc = entry.decisionId+'/obligation['+j+']';
      if (!record(o)) {errors.push(loc+': inválida');continue;}
      if (!/^T0T6-I[0-9]{3}-[0-9]{2}$/.test(String(o.id||''))) {
        errors.push(loc+': ID inválido');
      }
      if (seenObligations.has(o.id)) errors.push(loc+': obrigação duplicada '+o.id);
      seenObligations.add(o.id);
      if (!SURFACES.has(o.surface)) errors.push(loc+': superfície inválida');
      if (!/^T[0-6]$/.test(String(o.phase||''))) errors.push(loc+': fase inválida');
      if (!STATES.has(o.status)) errors.push(loc+': status inválido');
      if (o.status === 'superseded' &&
        (!nonempty(o.replacedBy) || o.replacedBy === o.id)) {
        errors.push(loc+': obrigação superseded exige ID sucessor explícito');
      }
      if (!nonempty(o.acceptance)) errors.push(loc+': contrato de aceite ausente');
      if (!Array.isArray(o.requirementIds) || !o.requirementIds.length) {
        errors.push(loc+': obrigação sem requisito histórico');
      } else for(const reqId of o.requirementIds) {
        const req = requirementMap.get(reqId);
        if (!req) errors.push(loc+': requisito inexistente '+reqId);
        else if (!(req.decisionIds || []).includes(entry.decisionId)) {
          errors.push(loc+': genealogia sem vínculo recíproco '+reqId);
        }
      }
      if (!Array.isArray(o.targetPaths) || !o.targetPaths.length) {
        errors.push(loc+': obrigação sem ao menos uma superfície ou artefato-alvo');
      } else for(const target of o.targetPaths) {
        if (!safeRelative(target) || (rootDir && !fs.existsSync(path.join(rootDir,target)))) {
          errors.push(loc+': caminho de impacto inexistente ou inseguro '+target);
        }
      }
      if (!Array.isArray(o.evidenceRefs)) errors.push(loc+': evidenceRefs precisa ser array');
      else if (o.status === 'verified' &&
        (!o.evidenceRefs.length || !o.evidenceRefs.every(ref=>nonempty(ref)&&ref.startsWith(GITHUB)))) {
        errors.push(loc+': verified exige evidência GitHub real');
      }
    }
  }

  const tracked = Array.isArray(impact.trackedObligationIds) ? impact.trackedObligationIds : [];
  if (!tracked.length) errors.push('decision-impact: registro persistente de obrigações ausente');
  const trackedSet = new Set(tracked);
  if (trackedSet.size !== tracked.length) errors.push('decision-impact: chaves persistentes duplicadas');
  for(const id of trackedSet) {
    if (!seenObligations.has(id)) errors.push(id+': obrigação perdida no mapa; não apagar histórico, registrar transição');
  }
  for(const entry of records) {
    for(const obligation of (entry.obligations || [])) {
      if (obligation?.status === 'superseded' &&
        !seenObligations.has(obligation.replacedBy)) {
        errors.push(obligation.id+': sucessora de obrigação não localizada');
      }
    }
  }
  for(const id of seenObligations) {
    if (!trackedSet.has(id)) errors.push(id+': obrigação não registrada no catálogo de chaves persistentes');
  }
  for(const decision of decisionMap.values()) {
    if (decision.status === 'approved' && !seenRecords.has(decision.id)) {
      errors.push(decision.id+': decisão aprovada sem mapa de impacto');
    }
    if (decision.status === 'superseded' && !seenRecords.has(decision.id)) {
      errors.push(decision.id+': decisão substituída sem rastro histórico');
    }
  }
  return errors;
}

function queryDecisionImpact(impact,{phase='',surface='',file='',decision='',status='',open=false}={}) {
  const result=[];
  for(const entry of (impact.records||[])) {
    if (!record(entry) || entry.status !== 'approved') continue;
    if (decision && entry.decisionId!==decision) continue;
    for(const obligation of (entry.obligations||[])) {
      if (phase && obligation.phase!==phase) continue;
      if (surface && obligation.surface!==surface) continue;
      if (file && !obligation.targetPaths.includes(file)) continue;
      if (status && obligation.status !== status) continue;
      if (obligation.status === 'superseded' && status !== 'superseded') continue;
      if (open && obligation.status==='verified') continue;
      result.push({decisionId:entry.decisionId,obligation});
    }
  }
  return result;
}
function readOptions() {
  const {values} = parseArgs({ options: {
    check: {type: 'boolean'}, query: {type: 'boolean'}, open: {type: 'boolean'},
    phase: {type: 'string'}, surface: {type: 'string'}, file: {type: 'string'},
    decision: {type: 'string'}, status: {type: 'string'}
  }});
  if (values.check && values.query) throw new Error('Escolha --check ou --query.');
  for (const key of ['phase', 'surface', 'file', 'decision', 'status', 'open']) {
    if (values[key] === undefined) continue;
    if (!values.query || values[key] === '') throw new Error('--' + key + ' exige --query e um filtro válido.');
  }
  if (values.phase && !/^T[0-6]$/.test(values.phase)) throw new Error('Fase esperada entre T0 e T6.');
  if (values.surface && !SURFACES.has(values.surface)) throw new Error('Superfície válida: ' + [...SURFACES].join(', '));
  if (values.status && !STATES.has(values.status)) throw new Error('Status válido: ' + [...STATES].join(', '));
  if (values.file) values.file = path.posix.normalize(values.file.replaceAll('\\', '/'));
  return values;
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {
    const options = readOptions();
    const f=loadDecisionImpact();
    const issues=validateDecisionImpact(f,{rootDir:root});
    if(issues.length) {
      issues.forEach(e=>console.error('[impacto] '+e));
      process.exitCode=1;
    } else if(!options.query) {
      const count=f.impact.records.reduce((n,x)=>n+x.obligations.length,0);
      console.log('[impacto] '+f.impact.records.length+' decisões rastreadas, '+count+
        ' obrigações vinculadas às fases e artefatos, sem vínculos inválidos.');
      console.log('[impacto] Verificação de integridade NÃO significa cumprimento ou homologação.');
    } else {
      const selection = queryDecisionImpact(f.impact, options);
      console.log('[impacto] '+selection.length+' obrigações aplicáveis:');
      for(const {decisionId,obligation:o} of selection) {
        console.log('- '+decisionId+' / '+o.id+' / '+o.phase+' / '+o.surface+' / '+o.status+
          '\n  '+o.acceptance+'\n  Alvos: '+o.targetPaths.join(', '));
      }
      if(!selection.length) console.log('Nenhuma obrigação mapeada para esse filtro; isso NÃO comprova ausência de impacto.');
    }
  } catch(error) {
    console.error('[impacto] ' + error.message);
    process.exitCode=1;
  }
}
export {loadDecisionImpact,validateDecisionImpact,queryDecisionImpact};
