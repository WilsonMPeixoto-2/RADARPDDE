# Origem dos guias oficiais

Os sete diretórios oficiais em `.agents/skills/` foram copiados, sem alterações,
do pacote npm `chrome-devtools-mcp@1.12.0`, publicado por Google LLC sob
Apache License 2.0. A [licença](LICENSE) acompanha esta cópia.

- Repositório: https://github.com/ChromeDevTools/chrome-devtools-mcp
- Tag: `chrome-devtools-mcp-v1.12.0`
- Commit da tag: `af2834411a564d366f9cab63efb046d9084f4dba`
- Pacote: https://www.npmjs.com/package/chrome-devtools-mcp/v/1.12.0
- Integridade do tarball npm: `sha512-lAGpH0zXT1ZdaPefP1KK/MvxwihOlu7VGQ7p4wbhD9OhN17vUC4KWk/ImUYR9DE4s+7r4r0ySV4xr2OkTa7ZMA==`

Diretórios: `chrome-devtools`, `chrome-devtools-cli`, `a11y-debugging`,
`debug-optimize-lcp`, `cookie-debugging`, `memory-leak-debugging` e `troubleshooting`.
Os arquivos `SKILL.md` e `references/*.md` preservam o conteúdo do pacote.

`radar-browser-diagnostics` é a adaptação local, não uma oitava skill oficial.
Suas ressalvas e roteamento não modificam os arquivos upstream. Atualizar as
cópias junto com a versão MCP e manter esta proveniência consistente.
