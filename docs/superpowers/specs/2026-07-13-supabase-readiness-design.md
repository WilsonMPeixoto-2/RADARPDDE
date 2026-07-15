# Preparação do RADAR PDDE para futura integração com Supabase

## Objetivo

Preparar integralmente o projeto para uma futura conexão com Supabase sem ativar qualquer conexão em produção e sem alterar o comportamento, os fluxos, as regras de negócio, o layout ou a persistência atualmente baseada em `localStorage`.

## Restrições globais

1. Produção permanece exclusivamente em modo local.
2. Nenhuma chamada ao Supabase pode ocorrer enquanto o modo de dados estiver configurado como `local`.
3. URL e chave publicável, mesmo preenchidas acidentalmente, não podem ativar a conexão sem uma flag explícita.
4. Nenhuma chave secreta, `service_role`, senha de banco ou token administrativo poderá ser incluído no repositório.
5. Dashboard, Carteira, Pendências, Competências, Prontuário, exportação, bonificação, análise técnica, retificação e inventário devem manter comportamento idêntico.
6. O trabalho deve permanecer isolado em branch própria, com PR em rascunho e sem merge ou publicação em produção sem autorização expressa.

## Arquitetura proposta

A aplicação passa a dispor de uma camada de persistência independente das telas e regras de negócio:

```text
Interface e regras do RADAR
        ↓
Contrato de repositório
        ↓
LocalStorageRepository — ativo
SupabaseRepository — preparado e bloqueado
```

A primeira entrega não substituirá as chamadas legadas do `app.js`. Ela criará os contratos, adaptadores, validações, migrations e testes necessários para que a futura migração possa ocorrer de forma incremental. O `localStorage` seguirá como fonte oficial.

## Modos de dados

A configuração deverá reconhecer três modos explícitos:

- `local`: único modo autorizado nesta etapa;
- `supabase-preview`: reservado para validação futura em Preview;
- `supabase-production`: reservado para promoção futura após homologação.

A configuração publicada continuará em `local`. O código deverá sanitizar as credenciais em memória nesse modo, impedindo inicialização acidental do cliente.

## Componentes

### Configuração segura

- modo de dados explícito;
- feature flag de conexão;
- validação de chave publicável;
- bloqueio de chaves secretas;
- arquivo de exemplo sem credenciais reais;
- diagnóstico legível para desenvolvimento e testes.

### Contrato de repositório

O contrato deverá definir operações de leitura, gravação, exclusão, snapshot e verificação de saúde. Os dois adaptadores deverão implementar as mesmas assinaturas.

### Adaptador local

O adaptador local encapsulará acesso ao `localStorage`, serialização, clonagem defensiva, versionamento e restauração de snapshot. Nesta etapa ele será testado como referência de comportamento.

### Adaptador Supabase

O adaptador Supabase será implementado sem conexão ativa e deverá:

- receber um cliente por injeção;
- mapear entidades do RADAR para tabelas normalizadas;
- rejeitar operação sem cliente válido;
- produzir erros tipados;
- não realizar seed automático;
- não depender de segredos administrativos.

### Modelo de dados

Serão versionadas migrations para:

- `app_config`;
- `programs`;
- `profiles`;
- `user_profiles`;
- `controllers`;
- `inventory_team_members`;
- `schools`;
- `school_programs`;
- `competences`;
- `verifications`;
- `pendencies`;
- `pendency_attempts`;
- `pendency_contacts`;
- `assets`;
- `registered_invoices`;
- `administrative_logs`;
- `data_import_runs`;
- `audit_events`.

As migrations deverão incluir chaves, relacionamentos, constraints, índices, timestamps e versionamento otimista onde aplicável.

### Autenticação e RLS futuras

O desenho deve prever os perfis:

- Controlador;
- Assistente de Verbas Federais;
- Equipe de Inventário;
- Gestão SME;
- Administrador técnico.

As políticas RLS serão versionadas para aplicação futura e deverão restringir dados por perfil, controlador, escola e área funcional. A ativação efetiva de autenticação fica fora desta etapa.

### Migração e reconciliação

Serão preparados utilitários puros para:

- exportar snapshot local;
- validar versão e estrutura;
- normalizar registros;
- gerar lotes de importação;
- comparar contagens e identificadores;
- produzir relatório de reconciliação;
- impedir importações duplicadas por `import_id`.

Nenhuma importação será executada nesta etapa.

### Testes

- contrato de configuração segura;
- bloqueio de conexão no modo local;
- rejeição de chaves secretas;
- contrato do adaptador local;
- contrato do adaptador Supabase com cliente simulado;
- validação e reconciliação de snapshots;
- validação estática das migrations;
- verificação de presença de RLS;
- verificação de ausência de segredos;
- regressão Playwright existente.

### CI e documentação

A CI deverá validar os módulos novos e as migrations sem exigir projeto Supabase real. A documentação incluirá arquitetura, dicionário de dados, matriz de permissões, conexão futura, migração, homologação e rollback.

## Estratégia de ativação futura

1. Criar projeto Supabase.
2. Aplicar migrations em ambiente de desenvolvimento.
3. Configurar Preview com `supabase-preview`.
4. Importar snapshot em modo controlado.
5. Executar reconciliação e testes de equivalência.
6. Homologar perfis e RLS.
7. Manter rollback local disponível.
8. Somente após autorização, promover para produção.

## Critérios de aceite

- produção continua em `localStorage`;
- nenhuma chamada de rede ao Supabase no modo `local`;
- credenciais vazias ou preenchidas não ativam conexão sem flag;
- nenhum segredo no GitHub;
- migrations e políticas versionadas;
- adaptadores testados por contrato;
- ferramentas de snapshot e reconciliação testadas;
- testes atuais permanecem aprovados;
- documentação completa e procedimento de rollback disponível.
