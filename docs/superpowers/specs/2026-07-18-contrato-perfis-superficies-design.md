# Contrato integral de perfis, superfícies e segregação de funções

**Data:** 18/07/2026  
**Status:** especificação aprovada para planejamento pela autorização de prosseguimento do responsável pelo produto  
**Base funcional:** `main@72c13a74a1c41e4c0fd4924c400e12d624af1482`  
**Origem:** [`../../audits/2026-07-18-auditoria-integral-perfis-superficies.md`](../../audits/2026-07-18-auditoria-integral-perfis-superficies.md)

---

## 1. Problema

O RADAR possui quatro perfis simulados na interface local e cinco papéis preparados para Auth/RLS. O papel `technical_admin` é convertido em `assistente`, enquanto a Gestão de Equipe atual permite à Assistente executar ações que a matriz futura de permissões reserva à Gestão SME e ao Administrador técnico.

Sem um contrato único, a ativação remota poderia produzir dois tipos de falha:

1. a interface exibir ações que o RLS bloqueará;
2. o RLS permitir ou a interface oferecer ações incompatíveis com a segregação de funções pretendida.

A solução não é apenas renomear perfis. É alinhar, para cada superfície e ação:

```text
identidade → papel → escopo → navegação → ação visível → serviço → política RLS → auditoria
```

---

## 2. Objetivos

1. estabelecer cinco experiências distintas;
2. impedir que Administrador técnico herde a operação da Assistente;
3. separar distribuição operacional de carteiras da administração estrutural de pessoas;
4. garantir equivalência entre modo local, Supabase local e Preview remoto;
5. tornar toda negação previsível, acessível e testável;
6. preservar integralmente os fluxos documentais aprovados.

---

## 3. Princípios protegidos

- unidade escolar continua sendo a entidade monitorada;
- bonificação, análise técnica e pendência permanecem independentes;
- pendência segue o ciclo `Aberta → Aguardando reanálise → Resolvida` ou retorna a `Aberta`;
- não existe estado `Vencida`;
- retificação administrativa não altera automaticamente análise ou pendência;
- ações críticas permanecem auditáveis;
- usuário operacional não recebe exclusão física;
- controle de acesso não depende de ocultação visual;
- o destino sempre revalida autorização, ainda que o contexto tenha sido transportado pela navegação.

---

## 4. Perfis canônicos de interface

| Papel Auth/RLS | Perfil de interface | Finalidade principal |
|---|---|---|
| `controller` | `controlador` | operar a própria carteira e o ciclo documental |
| `federal_assistant` | `assistente` | operar transversalmente e distribuir trabalho autorizado |
| `inventory` | `inventario` | operar filas e registros patrimoniais |
| `sme_management` | `sme` | acompanhar resultados e administrar parâmetros e estrutura |
| `technical_admin` | `admin_tecnico` | administrar identidades, escopos, infraestrutura, importações e exceções |

### Decisão D-PERF-01

`technical_admin` deixa de ser convertido em `assistente` e passa a possuir perfil próprio `admin_tecnico`.

### Decisão D-PERF-02

O perfil `admin_tecnico` não recebe Dashboard operacional, filas de documentos ou ações de análise por padrão. Sua página inicial é a Administração Técnica.

---

## 5. Segregação da Gestão de Equipe

A superfície atual reúne três capacidades que devem ser separadas:

1. **distribuição operacional de carteira**;
2. **cadastro e manutenção de integrantes**;
3. **administração técnica de identidade e escopo**.

### 5.1 Distribuição operacional

Inclui:

- consultar integrantes ativos;
- consultar contagem de escolas;
- reatribuir uma ou várias escolas entre controladores ativos;
- consultar histórico da movimentação.

**Perfis:** Assistente, Gestão SME e Administrador técnico.  
**Assistente:** criação e alteração somente de vínculos escola–controlador, nunca da identidade da pessoa.

### 5.2 Cadastro e manutenção estrutural

Inclui:

- cadastrar integrante;
- editar nome e contato institucional;
- ativar ou desativar integrante;
- escolher destinatário das escolas na desativação;
- manter equipe de Inventário.

**Perfis:** Gestão SME e Administrador técnico.  
**Assistente:** leitura, sem botões de cadastro, edição ou desativação.

### 5.3 Identidades, perfis e escopos

Inclui:

- vincular usuário autenticado a perfil;
- conceder ou revogar escopo;
- consultar negações e eventos de autorização;
- administrar importações;
- executar exclusão física excepcional, quando prevista e justificada.

**Perfil:** Administrador técnico.  
**Gestão SME:** leitura de perfis e escopos, sem credenciais ou operações técnicas privilegiadas.

---

## 6. Matriz de navegação

| Área | Controlador | Assistente | Inventário | Gestão SME | Admin técnico |
|---|---:|---:|---:|---:|---:|
| Dashboard operacional | sim | sim | sim, patrimonial | sim, gerencial | não |
| Carteira | própria | transversal autorizada | contexto patrimonial | leitura ampla | suporte excepcional |
| Competências | operar | operar | leitura contextual | leitura | suporte excepcional |
| Pendências | operar | operar | leitura patrimonial | leitura | suporte excepcional |
| Prontuário | operar | operar | operar patrimônio | leitura | suporte excepcional |
| Capital e Inventário | leitura | operar autorizado | operar | leitura | suporte excepcional |
| Registros Internos | próprio escopo | escopo autorizado | escopo patrimonial | amplo | amplo e técnico |
| Distribuição de Carteiras | não | sim | não | sim | sim |
| Cadastro de Equipe | não | não | não | sim | sim |
| Configurações SME | não | não | não | sim | suporte técnico |
| Administração Técnica | não | não | não | leitura limitada | sim |

---

## 7. Superfície Administração Técnica

A nova área deve ser separada da Gestão de Equipe e de Configurações SME.

### 7.1 Abas mínimas

1. **Usuários e perfis** — identidade, perfil ativo, estado e último acesso;
2. **Escopos** — CRE, escola, leitura/escrita e vigência;
3. **Importações** — execuções, estado, hash, reconciliação e rollback;
4. **Auditoria técnica** — eventos de autenticação, autorização, configuração e exceção;
5. **Saúde da integração** — modo de dados, versão de schema e conectividade, sem expor segredo.

### 7.2 Regras

- nenhuma chave secreta é exibida;
- nenhuma senha é armazenada ou apresentada;
- exclusão física exige justificativa, confirmação crítica e registro auditável;
- suporte excepcional a uma entidade operacional não altera o perfil cotidiano do administrador;
- eventual impersonação depende de decisão autônoma futura e não integra este pacote.

---

## 8. Ações visíveis e ações autorizadas

A interface deve aplicar duas camadas independentes:

1. **apresentação:** esconder ou desabilitar ação sem utilidade para o papel;
2. **autorização:** serviço e RLS negam a ação mesmo que chamada diretamente.

### Padrão de negação

- título: `Ação não autorizada`;
- explicação: informa a capacidade necessária, sem revelar dados de outro escopo;
- ação recuperável: voltar ao contexto permitido;
- região `aria-live` para falhas dinâmicas;
- evento de auditoria para tentativas relevantes, sem registrar conteúdo sensível desnecessário.

---

## 9. Navegação e contexto

Toda transição deve transportar, quando aplicável:

- escola;
- competência;
- programa;
- documento;
- pendência;
- fila e filtros de origem;
- posição de retorno;
- perfil e escopo somente como contexto de interface, nunca como prova de autorização.

O perfil efetivo sempre é obtido da sessão autenticada no modo remoto.

---

## 10. Modo local

O seletor simulado continua disponível somente quando Auth remoto estiver desativado.

Deve apresentar cinco opções:

- Controlador;
- Assistente de Verbas Federais;
- Equipe de Inventário;
- Gestão SME;
- Administrador técnico.

O modo local deve reproduzir visibilidade, bloqueios e mensagens do modo remoto. Não pode funcionar como um superusuário informal.

---

## 11. Contratos de dados e privacidade

- busca e listas respeitam escopo antes de renderizar;
- contato pessoal não é exibido apenas porque existe no cadastro;
- URL não recebe telefone, e-mail, nome pessoal ou justificativa sensível;
- logs exibem apenas campos necessários ao papel;
- exportação segue autorização própria e registra o recorte gerado;
- Administrador técnico não recebe acesso irrestrito a conteúdo operacional sem finalidade de suporte comprovada.

---

## 12. Estados obrigatórios por perfil

Cada superfície deve distinguir:

1. carregando;
2. sem registros no escopo;
3. nenhum resultado para os filtros;
4. acesso insuficiente;
5. sessão expirada;
6. indisponibilidade de dados;
7. conflito de alteração;
8. sucesso.

A redação deve mencionar o recorte efetivo sem expor a existência de dados fora do escopo.

---

## 13. Testes obrigatórios

### 13.1 Contrato de mapeamento

- cada papel Auth resolve para um perfil distinto;
- papel desconhecido é negado;
- `technical_admin` nunca resolve para `assistente`.

### 13.2 Navegação

- cada perfil vê somente grupos e itens previstos;
- URL direta não abre superfície proibida;
- troca local de perfil limpa estado incompatível;
- logout remove identidade e bloqueia o app.

### 13.3 Gestão de Equipe

- Assistente reatribui escola;
- Assistente não cadastra, edita ou desativa integrante;
- Gestão SME cadastra, edita, desativa e reatribui;
- Admin técnico executa as mesmas capacidades estruturais com auditoria;
- Controlador e Inventário não alteram equipe.

### 13.4 Domínio

- Inventário não altera análise técnica;
- Gestão SME não modifica pendência cotidiana por padrão;
- Admin técnico não recebe ação operacional por herança;
- Controlador não acessa escola externa sem escopo explícito.

### 13.5 Ambientes

Executar em:

- memória/localStorage;
- Supabase local;
- Preview remoto autorizado;
- desktop Chromium;
- Android/Chromium;
- iPhone/WebKit para regressão essencial.

---

## 14. Critérios de aceite

- cinco perfis distintos na interface e na autorização;
- ausência de mapeamento `technical_admin → assistente`;
- Gestão de Equipe dividida entre distribuição e estrutura;
- Assistente preserva distribuição operacional, sem administrar identidade;
- SME e Admin técnico administram estrutura conforme autorização;
- nova Administração Técnica existe e não contém operação documental cotidiana;
- modo local e remoto são equivalentes em visibilidade e negação;
- todos os cenários de perfil passam nos testes;
- nenhuma regressão nos fluxos documentais, patrimoniais, Excel ou mobile;
- documentação e matriz RLS refletem exatamente a implementação.

---

## 15. Fora do escopo

- ativação do Supabase remoto;
- importação de dados reais;
- reescrita do histórico Git;
- redesign completo das superfícies;
- impersonação de usuário;
- observabilidade de produção;
- mudança nas regras de bonificação, análise, pendência ou inventário.

---

## 16. Resultado esperado

Ao final, o RADAR terá um contrato verificável de responsabilidade:

> cada usuário vê as superfícies necessárias, executa somente as ações próprias de sua função e encontra a mesma decisão de autorização na interface, nos serviços e no banco.
