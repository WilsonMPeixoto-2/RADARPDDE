# Classificação de dados e ambientes do RADAR PDDE

**Atualizado em:** 5 de agosto de 2026

## 1. Objetivo

Definir onde cada classe de dado pode existir e distinguir repositório, navegador, CI, Preview, Supabase e Production.

O RADAR PDDE é ferramenta interna de equipe reduzida. Dados cadastrais funcionais podem ser públicos ou institucionais, mas segredos, credenciais e conteúdos operacionais continuam sujeitos a finalidade e controle de acesso.

## 2. Classes

| Código | Classe | Exemplos | Regra principal |
|---|---|---|---|
| D0 | público institucional | escola, designação, INEP, CNPJ institucional | pode ser exibido quando necessário |
| D1 | interno operacional | status, carteira, pendência, observação | somente usuários autorizados |
| D2 | contato funcional | nomes, e-mails e telefones de função | usar conforme finalidade institucional |
| D3 | segredo | senha, `service_role`, token, chave administrativa | proibido em Git, bundle e logs |
| D4 | configuração pública | modo, URL e chave publicável | permitida no frontend autorizado |
| D5 | fixture | escolas e usuários sintéticos | permitida em testes e CI |
| D6 | log e auditoria | ator, ação, data e versão | acesso e retenção controlados |
| D7 | snapshot/importação | pacote canônico e staging | fora do Git; processo controlado |

## 3. Ambientes

| Ambiente | Persistência | Uso | Restrições |
|---|---|---|---|
| GitHub | código, migrations e documentação | fonte de versão | nenhum D3; fixtures preferencialmente sintéticas |
| Navegador | memória, UI e configuração pública | operação do usuário | conteúdo é inspecionável pelo usuário autenticado |
| LocalStorage | adaptador local | desenvolvimento e contingência por novo build | não sincroniza automaticamente com Supabase |
| Supabase local | pilha descartável | migrations, Auth, RLS e testes | dados sintéticos e identidades efêmeras |
| CI | validação automatizada | testes, build e evidências | secrets no secret store; artefatos minimizados |
| Preview | homologação | código candidato com backend autorizado | não é Production |
| Production | Supabase canônico | operação institucional | Auth, RLS, auditoria, backup e monitoramento |

## 4. Estado corrente

```text
Production: supabase-production
repositório canônico: SupabaseRepository
projeto: scnryinorqeucbfkioxo
LocalStorageRepository: desenvolvimento e contingência controlada
```

A afirmação histórica de que LocalStorage era o backend oficial foi substituída pela ativação do Supabase em Production.

## 5. Configuração e segredos

Podem estar no frontend autorizado:

- URL do Supabase;
- chave publicável;
- modo e ambiente;
- hashes e caminhos de assets públicos.

Nunca podem estar no frontend, repositório ou log:

- `service_role`;
- `sb_secret_*`;
- senha de banco;
- token Vercel ou GitHub;
- senha de usuário;
- credencial Auth Admin;
- chave de bootstrap.

## 6. Dados funcionais

Nomes, e-mails, telefones, CNPJs e processos podem integrar o cadastro operacional quando necessários à atividade institucional. Seu uso deve:

- corresponder a uma finalidade do sistema;
- ser visível somente nos perfis e telas pertinentes;
- evitar reprodução desnecessária em logs e evidências;
- ser mantido na fonte canônica;
- respeitar correção e atualização cadastral.

A classificação de prioridade do projeto é funcional: confiabilidade do fluxo não deve ser adiada por uma discussão abstrata de exposição quando os dados são públicos ou funcionais e o uso é interno controlado. Isso não autoriza incluir segredos ou dados alheios à finalidade.

## 7. Evidências e testes

- preferir massa sintética;
- evidências Excel usam dados sintéticos;
- CI publica contagens, hashes e códigos, não snapshots integrais;
- backup/restauração descartáveis não publicam dumps;
- incidentes automáticos não copiam logs completos;
- traces e screenshots devem evitar conteúdo desnecessário.

## 8. Importação e snapshots

- armazenar fora do Git;
- registrar hash, origem, formato e contagens;
- validar antes de staging;
- promover em operação controlada;
- reconciliar destino;
- preservar snapshot de rollback;
- não usar importação pelo navegador.

## 9. Histórico Git

Remover conteúdo da árvore atual não apaga commits anteriores. Saneamento de histórico é operação autônoma e somente deve ser iniciado quando houver necessidade concreta, análise de impacto e autorização.

## 10. Incidentes

Para segredo real:

1. interromper uso;
2. rotacionar ou revogar;
3. remover da árvore ativa;
4. revisar logs e artefatos;
5. decidir sobre histórico;
6. registrar causa e prevenção.

Para erro funcional ou de autorização:

1. identificar camada exata;
2. preservar evidência mínima;
3. corrigir com regressão;
4. confirmar backend, interface e releitura;
5. atualizar documentação.
