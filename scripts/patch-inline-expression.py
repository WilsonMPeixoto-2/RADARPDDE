import pathlib

path = pathlib.Path('scripts/audit-functional-persistence.js')
source = path.read_text(encoding='utf-8')

old_expression = """            acorn.parse(decoded, parseOptions);
            if (nameMatch) {
                acorn.parseExpressionAt(decoded, decoded.indexOf(nameMatch[1]), {
                    ...parseOptions,
                    startLocation
                });
            }
"""
new_expression = """            const program = acorn.parse(decoded, parseOptions);
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
if old_expression not in source:
    raise SystemExit('Trecho de parseExpressionAt não encontrado.')
source = source.replace(old_expression, new_expression, 1)

html_decoder_end = """        .replace(/&amp;/gi, '&');
}

function inspectInlineHandlers"""
static_decoder = """        .replace(/&amp;/gi, '&');
}

function decodeStaticJavaScriptEscapes(value) {
    return String(value || '').replace(/\\\\(['\"\\\\])/g, '$1');
}

function inspectInlineHandlers"""
if html_decoder_end not in source:
    raise SystemExit('Ponto de inserção do decodificador JavaScript não encontrado.')
source = source.replace(html_decoder_end, static_decoder, 1)

old_decoded = """        const decoded = decodeHtmlEntities(raw);
        const nameMatch = decoded.trimStart().match(/^([A-Za-z_$][\\w$]*)/);
"""
new_decoded = """        const htmlDecoded = decodeHtmlEntities(raw);
        const decoded = /\\.(?:c|m)?js$/i.test(file)
            ? decodeStaticJavaScriptEscapes(htmlDecoded)
            : htmlDecoded;
        const nameMatch = decoded.trimStart().match(/^([A-Za-z_$][\\w$]*)/);
"""
if old_decoded not in source:
    raise SystemExit('Construção do handler decodificado não encontrada.')
source = source.replace(old_decoded, new_decoded, 1)

path.write_text(source, encoding='utf-8')
