import pathlib

path = pathlib.Path('scripts/audit-functional-persistence.js')
source = path.read_text(encoding='utf-8')
old = """            acorn.parse(decoded, parseOptions);
            if (nameMatch) {
                acorn.parseExpressionAt(decoded, decoded.indexOf(nameMatch[1]), {
                    ...parseOptions,
                    startLocation
                });
            }
"""
new = """            const program = acorn.parse(decoded, parseOptions);
            const firstStatement = program.body[0];
            if (firstStatement?.type === 'ExpressionStatement') {
                const relativeStart = firstStatement.expression.loc?.start || { line: 1, column: 0 };
                const expressionStartLocation = {
                    line: startLocation.line + relativeStart.line - 1,
                    column: relativeStart.line === 1
                        ? startLocation.column + relativeStart.column
                        : relativeStart.column
                };
                acorn.parseExpressionAt(decoded, firstStatement.expression.start, {
                    ...parseOptions,
                    startLocation: expressionStartLocation
                });
            }
"""
if old not in source:
    raise SystemExit('Trecho de parseExpressionAt não encontrado.')
path.write_text(source.replace(old, new, 1), encoding='utf-8')
