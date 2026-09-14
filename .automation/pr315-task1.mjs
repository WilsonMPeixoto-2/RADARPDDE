import fs from 'node:fs';

function replaceOnce(path, before, after) {
  const source = fs.readFileSync(path, 'utf8');
  if (!source.includes(before)) throw new Error(`Trecho não encontrado em ${path}`);
  const next = source.replace(before, after);
  if (next === source) throw new Error(`Nenhuma alteração aplicada em ${path}`);
  fs.writeFileSync(path, next);
}

replaceOnce(
  'src/domain/competencia.js',
  `    function isFutureCompetence(value, referenceDate = new Date()) {`,
  `    function previousCompetenceKeyFromDate(referenceDate = new Date()) {\n        const date = referenceDate instanceof Date\n            ? new Date(referenceDate.getTime())\n            : new Date(referenceDate);\n        if (Number.isNaN(date.getTime())) {\n            throw new TypeError('A data de referência da competência é inválida.');\n        }\n        date.setMonth(date.getMonth() - 1);\n        return competenceKeyFromDate(date);\n    }\n\n    function isFutureCompetence(value, referenceDate = new Date()) {`
);

replaceOnce(
  'src/domain/competencia.js',
  `        competenceKeyFromDate,\n        formatCompetencia,`,
  `        competenceKeyFromDate,\n        previousCompetenceKeyFromDate,\n        formatCompetencia,`
);

replaceOnce(
  'src/application/data-service.js',
  `        const now = new Date();\n        const calendar = \`${'${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, \'0\')}'}\`;`,
  `        const now = new Date();\n        now.setMonth(now.getMonth() - 1);\n        const calendar = \`${'${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, \'0\')}'}\`;`
);

replaceOnce(
  'src/integration/global-competence-selector.js',
  `        const calendarCompetence = root.RadarCompetencia?.competenceKeyFromDate\n            ? text(root.RadarCompetencia.competenceKeyFromDate())\n            : '';`,
  `        const calendarCompetence = root.RadarCompetencia?.previousCompetenceKeyFromDate\n            ? text(root.RadarCompetencia.previousCompetenceKeyFromDate())\n            : (root.RadarCompetencia?.competenceKeyFromDate\n                ? text(root.RadarCompetencia.competenceKeyFromDate())\n                : '');`
);
