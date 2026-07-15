# Auditoria de dados e ambientes — estado atual

## Escopo

A auditoria examinou dados iniciais, configuração, `localStorage`, snapshots, fixtures, logs, Excel, CI e arquitetura Supabase. Nenhum valor pessoal é reproduzido neste documento.

## Evidências

| Evidência | Local atual | Classe | Exposição atual | Proteção atual | Proteção futura | Classe do achado | Conduta |
|---|---|---|---|---|---|---|---|
| 163 registros iniciais de escola com campos de direção, telefone, e-mail, INEP, CNPJ e processo | `app.js:79-4180` | D0, D1 e D2 misturados | repositório público e bundle | nenhuma restrição de leitura do bundle | banco protegido e RLS não removem o bundle legado | `DC` para D2 no bundle público; `DQ` para tratamento do histórico | separar dados reais do código; decidir saneamento do histórico |
| nomes dos controladores iniciais | `app.js:48-78` | D1/D2 conforme política institucional | repositório e bundle | sem e-mail preenchido | perfis remotos e diretório protegido | `FA` | substituir por fixtures fictícias fora do ambiente autorizado |
| nome do usuário no shell | `index.html:121` | D2 | repositório e bundle | apenas apresentação | identidade Auth remota | `FA` | usar usuário fictício no modo demonstração e sessão real no remoto |
| runtime fail-closed | `config.js:120-242`; `config.runtime.js` | D4 | público | valida modo, ambiente, flag, URL e chave | mesma configuração em Preview/produção | `CP` | preservar e testar |
| proibição de chaves privilegiadas | `config.js:156-166`; readiness | D3 | regra pública | erro explícito antes de criar cliente | secret store e menor privilégio | `CP` | preservar; nunca registrar valor |
| estado funcional local | chaves `radar_pdde_*` em serviços e adaptador | D0–D2/D6 | dispositivo local do usuário | contrato de repositório, snapshot e rollback | RLS por usuário/perfil | `ID` | manter até ativação remota autorizada |
| snapshot canônico e migração | `src/data/snapshot-tools.js`, `import-coordinator.js`, CLI | D7 | código contém estrutura; dados reais não versionados | hash, validação, staging, checkpoint, reconciliação e rollback | armazenamento controlado remoto | `CP` para arquitetura; `DF` para execução remota | preservar; aplicar política de cópia controlada |
| fixtures Auth locais | `supabase/fixtures`, scripts e testes | D5/D3 de teste | manifesto determinístico; senha vem de variável temporária | bootstrap limitado à pilha local e autorização explícita | usuários reais no Ciclo F | `CP` | preservar separação entre fixture e usuário real |
| logs administrativos | `administrative_logs`, `audit_events`, serviços | D6 | schemas e fixtures | atores, ações, versões e RLS preparados | retenção, acesso e monitoramento remotos | `DF` para política operacional | definir retenção no Ciclo F/G |
| exportação Excel | módulos de exportação e referência v2.1 | D0–D2/D6 | arquivo gerado pelo usuário | conteúdo depende do recorte exportado | permissões e política de distribuição | `ID` e `DQ` | preservar referência; definir classificação do arquivo exportado |
| artefatos CI | Playwright, relatórios e uploads | D5/D6 técnico | acesso conforme GitHub e retenção | screenshots de falha podem capturar tela | mascaramento e retenção explícitos | `FA` | baseline do Ciclo A neutraliza contatos e desativa trace/vídeo |
| Google Fonts | `styles.css` | metadado de rede | requisição externa no navegador | sem dado funcional enviado intencionalmente | política de CSP e recursos externos | `EP` | avaliar no hardening de entrega |

## Risco atual independente do Supabase

O achado mais relevante é a presença de dados de contato e direção em `INITIAL_ESCOLAS`. Como o repositório é público e o array é entregue ao navegador, RLS futura não restringirá essa cópia. A correção ativa deve retirar D2 do código e do bundle; o tratamento do histórico requer decisão separada.

## Proteções já resolvidas ou preparadas

- modo local não inicializa conexão Supabase;
- chave privilegiada é rejeitada;
- configuração de produção exige autorização explícita;
- cliente recebe somente chave publicável;
- migrations, grants e RLS estão versionados;
- importação possui hash, checkpoint, reconciliação e rollback;
- fixtures Auth não são usuários de produção.

## Atividades deliberadamente futuras

São `DF`, não falhas atuais:

- criar projeto remoto;
- configurar Preview;
- aplicar migrations remotas;
- criar usuários reais;
- homologar perfis e negações;
- executar migração de cópia controlada;
- configurar Advisors;
- testar backup e restauração;
- definir MFA e política de incidentes;
- autorizar produção remota.

## Dúvidas materiais

### DQ-01 — Tratamento do histórico Git com dados de contato

- **Evidência:** campos D2 existem em commits públicos anteriores e na árvore ativa.
- **Intenção não comprovada:** não há decisão sobre preservar histórico integral ou reescrevê-lo.
- **Alternativa A:** remover apenas da árvore atual. Consequência: reduz exposição futura no bundle, mas o histórico continua acessível.
- **Alternativa B:** reescrever histórico e coordenar clones, PRs, tags e Vercel. Consequência: maior redução de exposição, com impacto operacional e de rastreabilidade.
- **Recomendação técnica provisória:** retirar D2 da árvore ativa no primeiro pacote de proteção de dados e fazer avaliação autônoma do histórico antes de reescrever.
- **Decisão necessária:** nível de saneamento autorizado e responsáveis pela classificação institucional.

### DQ-02 — Fonte oficial e necessidade operacional dos contatos de direção

- **Evidência:** nome, telefone e contato de direção estão acoplados ao cadastro inicial de escolas.
- **Intenção não comprovada:** quais campos são indispensáveis no RADAR, qual a fonte oficial e quais perfis precisam de acesso.
- **Alternativa A:** manter todos no banco protegido. Consequência: continuidade funcional, maior responsabilidade de atualização e acesso.
- **Alternativa B:** manter somente contato institucional e abrir fonte oficial externa para os demais. Consequência: menor exposição e possível aumento de cliques.
- **Recomendação técnica provisória:** manter no RADAR apenas dados necessários à ação operacional, privilegiando contato institucional e acesso por perfil.
- **Decisão necessária:** lista oficial de campos e perfis autorizados.

### DQ-03 — Classificação da exportação Excel

- **Evidência:** o relatório pode reunir dados operacionais e escolares.
- **Intenção não comprovada:** política de distribuição, retenção e responsabilidade após o download.
- **Alternativa A:** aviso e classificação no próprio workbook. Consequência: orientação persistente no arquivo.
- **Alternativa B:** orientação apenas na interface. Consequência: menor alteração do protótipo congelado, mas aviso não acompanha a cópia.
- **Recomendação técnica provisória:** tratar em plano autônomo sem alterar a referência v2.1 antes de aprovação.
- **Decisão necessária:** classificação institucional do arquivo e forma de comunicação.
