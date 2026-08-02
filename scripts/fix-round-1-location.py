import pathlib

path = pathlib.Path('scripts/audit-functional-persistence.js')
source = path.read_text(encoding='utf-8')
old = """        try {
            acorn.parse(decoded, {
                ecmaVersion: 'latest',
                sourceType: 'script',
                allowAwaitOutsideFunction: true,
                allowReturnOutsideFunction: true,
                locations: true,
                startLocation
            });
        } catch (error) {
            syntaxErrors.push({
                file,
                line: error.loc?.line || startLocation.line,
                column: error.loc?.column ?? startLocation.column,
                message: String(error.message || 'JavaScript inválido')
                    .replace(/\\s*\\(\\d+:\\d+\\)\\s*$/, '')
            });
        }
"""
new = """        try {
            const parseOptions = {
                ecmaVersion: 'latest',
                sourceType: 'script',
                allowAwaitOutsideFunction: true,
                allowReturnOutsideFunction: true,
                locations: true
            };
            acorn.parse(decoded, parseOptions);
            if (nameMatch) {
                acorn.parseExpressionAt(decoded, decoded.indexOf(nameMatch[1]), {
                    ...parseOptions,
                    startLocation
                });
            }
        } catch (error) {
            const relativeLine = error.loc?.line || 1;
            const relativeColumn = error.loc?.column ?? 0;
            syntaxErrors.push({
                file,
                line: startLocation.line + relativeLine - 1,
                column: relativeLine === 1
                    ? startLocation.column + relativeColumn
                    : relativeColumn,
                message: String(error.message || 'JavaScript inválido')
                    .replace(/\\s*\\(\\d+:\\d+\\)\\s*$/, '')
            });
        }
"""
if old not in source:
    raise SystemExit('Bloco de parsing inline não encontrado para correção.')
path.write_text(source.replace(old, new, 1), encoding='utf-8')
