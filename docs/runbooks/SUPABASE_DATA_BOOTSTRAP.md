# Bootstrap remoto de dados do RADAR PDDE

## Escopo e segurança

Este procedimento prepara uma carga do snapshot canônico da aplicação local para o repositório remoto. Execute-o somente em ambiente administrativo controlado. Não registre o snapshot, credenciais ou a saída de erro bruta em tickets, commits ou logs compartilhados.

O exportador abre uma instância limpa em `http://127.0.0.1:4175`, espera o contexto de dados e usa `LocalStorageRepository` como contrato de exportação. Ele sempre zera `userProfiles`, `userSchoolScopes`, `auditEvents` e `dataImportRuns`; assim, nenhum dado de identidade ou auditoria artificial é carregado.

## Exportar a fonte canônica

Com a aplicação local em execução, defina `RADAR_SNAPSHOT_FILE` para um caminho fora do repositório e execute:

```powershell
npm run snapshot:export:local
```

O arquivo é criado com permissões locais restritivas. Confira somente o formato, a versão e as contagens sanitizadas; não copie registros individuais.

## Validar e planejar

No mesmo ambiente administrativo, forneça apenas ao processo `RADAR_SUPABASE_URL`, `RADAR_SUPABASE_SERVICE_ROLE_KEY` e `RADAR_SNAPSHOT_FILE`.

```powershell
npm run bootstrap:supabase:validate
npm run bootstrap:supabase:plan
```

Os dois comandos não escrevem no destino. O processo interrompe quando encontrar qualquer ID desconhecido no destino ou conteúdo diferente para o mesmo ID.

## Importar e reconciliar

Depois de revisar o plano, execute:

```powershell
npm run bootstrap:supabase:import
npm run bootstrap:supabase:reconcile
```

O importador grava apenas linhas ausentes, respeitando a ordem canônica e os lotes. Uma repetição do mesmo snapshot não grava linhas. Não há chamadas de exclusão, nem restauração com substituição; dados já existentes e incompatíveis interrompem a operação para revisão humana.

## Recuperação

Em caso de conflito ou reconciliação não aprovada, não tente apagar dados automaticamente. Preserve o snapshot fora do repositório, registre apenas contagens sanitizadas e peça revisão do operador responsável antes de qualquer nova execução.
