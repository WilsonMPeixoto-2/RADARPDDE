# PR #211 — classificação de dados legados e fixtures de teste

**Data:** 29 de agosto de 2026  
**Ambiente consultado:** Supabase Production `scnryinorqeucbfkioxo`  
**Natureza da investigação:** somente leitura  
**Production alterada durante a investigação:** não

## 1. Finalidade

Separar registros históricos legítimos de registros produzidos apenas para teste durante a investigação visual/funcional do hotfix.

A classificação não usa descrição, valor, número da NF ou aparência do dado como critério principal. A evidência autoritativa é a autoria registrada nos logs administrativos contemporâneos à criação.

A conta técnica de teste foi comprovada pelo `actor_user_id`:

`17a51409-4823-4a36-8d85-4d4ed08da249`

Os registros legítimos abaixo foram atribuídos a Controladores reais por seus respectivos logs administrativos.

## 2. Despesas a identificar anteriores ao novo contrato

Production possuía 20 registros `a_identificar` sem análise individual explícita e sem Pendência individual vinculada.

A auditoria de autoria dividiu esse conjunto em:

| Classificação | Quantidade | Decisão |
|---|---:|---|
| históricos legítimos de Controladores | 16 | preservar |
| fixtures da conta técnica de teste | 4 | remover pela migration, sob preflight fail-closed |

### 2.1 Históricos legítimos preservados

**Juliana — 15 registros**

- `nota-c01a24ee-4b16-4cd3-991c-f9620a1da5a2`
- `nota-d1111f0c-c50f-462b-84da-8388d39b5edc`
- `nota-0358ab0b-679a-4459-a605-528930f533f8`
- `nota-f089eb54-15e5-4605-b0ec-6c9c0e45b3bd`
- `nota-858e01d1-3dd8-49fc-9696-6b389eaa193f`
- `nota-4747fb95-8588-4a72-968c-7cf8aa0d6a61`
- `nota-e939595e-e4be-4813-a40e-ebd30d4cc727`
- `nota-fd0b9b08-3cfb-4ca3-a9b3-a91104c9e7f9`
- `nota-b2586de6-6dc7-4fed-901b-d14a0e34010a`
- `nota-fbde51e0-816f-430a-a218-a664bd2b2652`
- `nota-57a4f108-ef57-4375-9af0-e67395d0d5d4`
- `nota-187fc7a5-24a4-4767-861e-75d8b836ce01`
- `nota-5546ce0b-163c-4162-b048-0b284cee9a3c`
- `nota-85162b9b-f38f-4b06-a146-d8dc5940cafc`
- `nota-3c2642fd-dba4-49df-8c20-d027d5f41c0a`

**Mônica — 1 registro**

- `nota-864bd096-fbdb-4573-bba8-7405f7c8617a`

Esses 16 registros:

- não recebem análise individual retroativa;
- não recebem Pendência inventada;
- não são transformados automaticamente;
- aparecem no novo painel como **Registro legado**;
- permanecem com o conteúdo histórico original;
- não oferecem edição/exclusão comum no Prontuário enquanto estiverem nessa condição histórica.

## 3. Fixtures de teste que podem ser removidas

A auditoria comprovou 12 despesas/NFs produzidas pela conta técnica exclusivamente nos contextos usados para testar este hotfix e seu layout:

- `nota-c6d2e4d1-d836-4c65-b9b1-4c9be8ce3612`
- `nota-b8c2a224-186c-4938-99f9-0b4456cea833`
- `nota-b4962927-deff-4a69-bea0-777b9054311b`
- `nota-a2da969c-2e29-41f9-a9fc-f34a306e00ed`
- `nota-9838a0a5-49ca-4e12-b174-95a71d64e1f9`
- `nota-acdc7e0d-fd87-424c-b95d-ee1dbf2ff8a5`
- `nota-4bed5f8e-826a-465a-ac85-44024ccb74a5`
- `nota-81cd8e05-047c-4dbc-9376-63b7daccc252`
- `nota-0b4c974a-a525-4151-b8e2-60bc92370634`
- `nota-cb959bc9-d691-40bc-9720-bfc18e9a0621`
- `nota-51028cd5-7080-46f9-8264-7aeb70895480`
- `nota-825dea6a-8032-4f6d-b49f-f5f4b9d98b9c`

Também foram comprovadas três Pendências genéricas antigas de Notas Fiscais criadas pela mesma conta durante os testes:

- `pend-46134ec0-1842-4787-9804-4bb0080cd989`
- `pend-384d9cc0-634f-4e74-9eac-f22da3b6e2c5`
- `pend-fc828ec9-d1f5-4ab2-bed9-ceba4e93d88b`

As três permaneciam `Aberta`, sem `registered_invoice_id` e sem tentativa.

## 4. Boleto 1234

A decisão anterior de reparar cirurgicamente o vínculo entre:

- `pend-384d9cc0-634f-4e74-9eac-f22da3b6e2c5`;
- `nota-a2da969c-2e29-41f9-a9fc-f34a306e00ed`;

fica **formalmente superada**.

A auditoria posterior comprovou que tanto o boleto quanto a Pendência foram criados pela conta técnica de teste. Portanto, não existe história operacional real a preservar nesse par.

A migration passa a removê-los junto das demais fixtures comprovadas, em vez de fabricar um vínculo que só perpetuaria dados de teste.

## 5. Proteção fail-closed da limpeza

A migration somente executa a limpeza se comprovar simultaneamente:

- os 12 IDs de despesas esperados;
- os 12 logs de criação esperados;
- o mesmo `actor_user_id` técnico;
- escola, competência, programa, tipo, número e valor esperados;
- os três IDs de Pendência esperados;
- os três logs que registraram sua abertura;
- ausência de tentativas nas três Pendências;
- ausência de histórico individual ligado às 12 despesas;
- ausência de outras despesas nos cinco contextos usados exclusivamente para esses testes;
- existência das cinco verificações esperadas e ausência de consolidação;
- autoria técnica comprovada do último lançamento de bonificação de Notas Fiscais em cada um dos cinco contextos antes da limpeza do resumo fiscal.

Qualquer divergência interrompe a migration.

Os logs administrativos não são apagados. Eles permanecem como evidência de que a limpeza removeu fixtures e não registros institucionais legítimos.

## 6. Limite do escopo

A conta técnica realizou outros testes em partes diferentes do RADAR. Este hotfix **não** transforma a identificação da conta em autorização genérica para apagar todo dado criado por ela.

A limpeza desta migration é restrita aos 12 registros de despesa e às três Pendências fiscais comprovadamente vinculados à investigação do PR #211.

Qualquer limpeza adicional exige inventário próprio e decisão separada.

## 7. Estado antes da publicação

Até a data desta evidência:

- nenhuma alteração desta migration foi aplicada em Production;
- os 16 registros legítimos continuam preservados;
- as fixtures de teste continuam presentes até eventual aplicação da migration;
- a classificação acima foi obtida por consultas somente de leitura.
