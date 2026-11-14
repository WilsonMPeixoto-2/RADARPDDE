# Correção e exclusão simples de lançamentos — análise de relações e proposta funcional

**Classe:** análise e proposta de mudança; não substitui ainda os contratos implementados.  
**Data da consolidação:** 14/11/2026 UTC.  
**Repositório e baseline:** `WilsonMPeixoto-2/RADARPDDE`, `main@190e44942d0bb6927d1a7eeb83fb94fc782171b8`, novamente conferida no GitHub durante a análise.  
**Banco consultado:** projeto institucional Supabase `scnryinorqeucbfkioxo`; somente SELECT de catálogos, definições de funções e contagens agregadas.  
**Solicitação:** permitir à equipe corrigir e excluir lançamentos, inclusive com Pendência e histórico, sem justificativa obrigatória. Resolver especialmente lançamentos feitos na competência ou no programa errado.  
**Entrega desta etapa:** diagnóstico, matriz de permissividade, consequências de cada operação, critérios de implementação e de homologação. Nenhum código de produto, migration, registro operacional ou configuração de publicação foi alterado.

## 1. Conclusão executiva

A flexibilização é viável e adequada ao uso do RADAR. O histórico não precisa transformar um erro de lançamento em um registro impossível de corrigir. A solução recomendada é permitir edição dos dados e exclusão dos objetos operacionais em qualquer situação de seu ciclo, mantendo a consistência dos registros que dependem deles.

Não basta remover `disabled` ou apagar as validações do formulário. Existem proteções na interface, nos serviços, nas funções SQL e nos triggers. Há também relações que não são chaves estrangeiras. A exclusão deve ser uma operação única, calculada e executada pelo servidor: ou o conjunto correto é removido e suas projeções são reconciliadas, ou nada é alterado.

Recomendações centrais:

1. **Editar diretamente** número/referência, descrição, valor, observações e demais dados cadastrais compatíveis com o mesmo objeto. Pendência, consolidação e histórico não devem bloquear esses ajustes.
2. **Corrigir resultados e limpar avaliações**, inclusive quando geraram Pendências, por um comando que ajuste também os registros dependentes. Corrigir lançamento equivocado não deve exigir simular um novo envio ou uma reanálise que não aconteceram.
3. **Excluir qualquer lançamento operacional**, inclusive Pendência resolvida/cancelada, despesa a identificar e despesa ligada a bem inventariado. Cada exclusão tem alcance definido; não é um DELETE irrestrito da tabela.
4. **Manter competência, programa e escola como identidade do lançamento no editor comum.** Para erro de contexto, oferecer exclusão completa e novo cadastro. Mover é tecnicamente possível, mas exige operação própria com validação de destino; não é necessário para resolver o problema agora.
5. **Eliminar justificativa, observação e confirmação textual obrigatórias.** Uma confirmação curta de exclusão, com objeto e efeitos reais, é suficiente. Informação complementar continua disponível e opcional.
6. **Preservar a independência entre despesa/análise técnica e bonificação consolidada.** Excluir uma NF não pode, por acidente, reabrir ou apagar uma bonificação válida. Quando a própria bonificação for corrigida, a alteração do seu resultado precisa ser explícita e coerente.

Não existe edição “sem risco” em termos absolutos. Há edições simples, edições com efeitos conhecidos e mudanças de identidade que merecem outro fluxo. O objetivo é absorver essa complexidade no sistema, sem transferi-la ao operador.

## 2. Método, evidência e limites

Foram examinados o modelo canônico, o catálogo de superfícies, o estágio corrente, o método de engenharia, o gate de validação pelo frontend, a matriz funcional e as decisões vigentes, antes dos módulos específicos. A leitura incluiu os serviços e integrações de avaliações, notas, Pendências, Assessoria, inventário, movimentação provisória e conversão de estado remoto/local.

As evidências têm três níveis:

- **Confirmado no código:** comportamento da baseline citada; os módulos de integração também foram considerados, pois ampliam permissões que parecem bloqueadas numa leitura isolada do serviço.
- **Confirmado no banco ativo:** FKs, políticas DELETE, triggers, RPCs selecionadas e contagens agregadas. Isso não foi inferido apenas a partir de migrations antigas.
- **Proposto:** política futura e desenho das operações. Não são funcionalidades já disponíveis nem homologadas.

O [catálogo de evidências da consulta](../../evidence/2026-11-14-flexibilizacao-lancamentos-catalogo.json) acompanha este documento com horário UTC, definições de FKs/políticas/triggers, funções SQL selecionadas, contagens e relação dos testes. São metadados técnicos e agregados; não é uma exportação de registros operacionais.

Foram executados 45 testes unitários existentes, todos aprovados, em sete arquivos focalizados em histórico de NF, exclusão patrimonial terminal, efeitos da NF, retificação, atomicidade, conversão Pendência/NF e Assessoria. Eles confirmam a compreensão do contrato atual; **não provam a implementação da flexibilização**, que ainda não existe. Não houve CRUD, ensaio de exclusão ou homologação de novos fluxos em Production.

### 2.1. Alcance real observado no banco

| Consulta agregada | Quantidade na consulta | Interpretação correta |
|---|---:|---|
| Despesas com ao menos uma Pendência vinculada | 424 | Entram no bloqueio histórico atual de exclusão; não significa que sejam erros |
| Despesas vinculadas a bem Inventariada | 1 | A mudança também precisa alcançar a proteção patrimonial terminal |
| Bens ligados a mais de uma NF | 0 | Não foram encontrados; o comando ainda deve validar essa condição concorrente |
| Pendências fiscais/Assessoria sem FK individual para NF | 2 | A associação causal não pode ser presumida pelo mês/programa |
| Contatos com vínculo de Pendência | 5 | O alcance da exclusão de contatos precisa ser tratado explicitamente |
| Provisórias identificadas sem NF vinculada | 0 | O problema é potencial na regra SET NULL, não incidente encontrado |
| NFs sem vínculo de verificação | 0 | Não foram encontradas na consulta |
| Divergências de escola/competência/programa entre NF e verificação vinculada | 0 | Não foram encontradas na consulta |

As duas Pendências sem FK individual são uma `notaFiscal / Aguardando reanálise` e uma `consAssessoria / Cancelada`. Nenhuma possui ID de NF alternativo nos campos de compatibilidade examinados do payload. Isso não permite afirmar sua causa ou classificá-las automaticamente como inválidas. Não foram alteradas.

Essas contagens são um retrato do instante de consulta, não inventário permanente. Não foram coletados nomes de usuários, escolas, descrições de despesas ou conteúdo de contatos para o relatório.

## 3. O que restringe o uso atualmente

| Área | Regra encontrada | Consequência para o pedido |
|---|---|---|
| Dados da NF | A integração de retificação já permite descrição, número/referência e valor com histórico/Pendência | Preservar o avanço; não reconstruir a edição do zero |
| Exclusão de NF | `assertDeletionHistorySafe` rejeita qualquer histórico individual; trigger SQL também protege | Remover a impossibilidade de negócio nos dois lados e excluir dependentes corretamente |
| Classificação da despesa | Há correção com histórico exclusivamente fiscal encerrado/cancelado; Pendência ativa, Assessoria e patrimônio terminal restringem | Não dizer que toda classificação está bloqueada; ampliar apenas com plano dos efeitos |
| Despesa a identificar | O editor integrado permite retificação cadastral; remoção comum segue bloqueada | Oferecer exclusão do conjunto despesa + Pendência, sem identificação fictícia |
| Resultado técnico com Pendência | A edição genérica usa anulação/Cancelada, confirmação e justificativa; NF/Assessoria têm autoridades individuais | Unificar a experiência de correção, preservando a autoridade de cada tipo |
| Limpar marca de bonificação | Bloqueios por Pendência ativa e, para NF, existência de despesas; consolidação restringe Controlador | Distinguir apagar a marca de entrega, corrigir a análise e apagar as despesas |
| Bonificação consolidada | Retificação formal é restrita ao Assistente na autoridade de domínio e exige justificativa | Propor correção pelo operador autorizado, com reabertura explícita quando muda a bonificação |
| Pendência manual | Retificação exige item, motivo, responsável e observação | Observação e justificativa devem ser opcionais; manter apenas identificação e classificação necessárias |
| Envio/reanálise/cancelamento/reabertura | Domínio exige textos em diversos caminhos; serviços de reanálise já suprem observação com texto padrão em alguns casos | Retirar a obrigação de modo consistente, sem inserir texto fingindo declaração do usuário |
| Patrimônio | Inventariada bloqueia mudança de status e exclusão no banco; exclusão da NF também protegida | A nova política deve permitir correção do lançamento terminal por operação própria |
| Provisória do Qualidade | Edição/exclusão diretas somente em `open`; identificada tem NF vinculada | Tratar desfazer identificação e excluir a saída identificada como operações compostas |

### 3.1. As permissões de tabela não contam a história inteira

As políticas DELETE diretas de `verifications`, `registered_invoices`, `pendencies`, `pendency_attempts`, `pendency_contacts` e `assets` exigem `technical_admin`. Isso **não** significa que o Controlador seja incapaz de toda exclusão: `delete_invoice_with_effects` já oferece exclusão mediada, com autorização escolar e controle de versão.

A proposta deve ampliar os comandos de negócio autorizados para os perfis operacionais. Não se recomenda liberar DELETE genérico em todas as tabelas, usar credenciais administrativas no navegador ou restringir correções ao autor original. A ADR-056 mantém o trabalho colaborativo entre escolas cadastradas; carteira e CRE não devem criar nova barreira artificial. Perfis de consulta não se transformam em operadores por esta mudança.

Para as operações compostas propostas, Controlador, Assistente de Verbas Federais e Administrador Técnico recebem a capacidade de corrigir/excluir o conjunto fiscal e seus dependentes. O perfil Inventário pode corrigir/desfazer o lançamento de inventariação que pertence ao seu domínio, mas essa capacidade não concede automaticamente exclusão de NF, análise fiscal ou Pendência. A interface do Inventário deve distinguir **Desfazer inventariação** de **Excluir despesa e bem**; esta última exige a capacidade sobre o conjunto completo. A restrição é pelo tipo de operação, nunca pelo autor do registro. Não exigir escalada ao Assistente para correções já abrangidas pelo papel de Controlador.

## 4. Mapa causal: o que realmente precisa acompanhar a exclusão

| Origem → dependência | Relação atual | Efeito atual de excluir a origem | Tratamento proposto |
|---|---|---|---|
| Verificação → Pendência documental genérica | Associação lógica por escola, competência, programa e documento; sem FK para verificação | Não há cascata automática | Identificar e remover o conjunto documental escolhido; não deixar Pendência de avaliação eliminada |
| Verificação → NF | `registered_invoices.verification_id` | SET NULL | Excluir NFs do pacote se o pacote inteiro for apagado; ao limpar só um campo, preservar verificação/NFs válidas |
| NF → Pendência fiscal ou Assessoria | `pendencies.registered_invoice_id` | RESTRICT, mais trigger de histórico | Excluir os dependentes daquela NF dentro da mesma transação |
| Pendência → tentativa | `pendency_attempts.pendency_id` | CASCADE | Aproveitar a cascata na exclusão total; edição/exclusão parcial exige reconciliar o fluxo |
| Pendência → contato | `pendency_contacts.pendency_id` | SET NULL | Remover os contatos pertencentes ao conjunto excluído; preservar contatos escolares independentes |
| NF → bem | NF aponta `linked_asset_id` | Excluir NF não apaga o bem só pela FK | Excluir o bem exclusivo e reconciliar inventário; não excluir bem compartilhado com registro válido |
| Mudança de vínculo NF/bem | Trigger após UPDATE de `linked_asset_id` | Pode apagar o bem desvinculado | Considerar na ordem de execução; não executar dois planos conflitantes de remoção |
| Provisória Qualidade → NF identificada | `registered_invoice_id`, único quando preenchido | Excluir NF faz SET NULL na provisória | Reabrir provisória ou excluir também a saída, conforme ação escolhida |
| Pendência → histórico/eventos embutidos | JSON `payload`, incluindo histórico e cópia das tentativas | Desaparecem com a Pendência | Em correção parcial, remover/reconciliar também as referências embutidas |
| Operação → auditoria/log administrativo | Registro independente, triggers e logs de aplicação | Não acompanha automaticamente as exclusões | Manter recibo automático da correção, sem Pendência operacional residual |
| Fonte → cards/tabelas/contadores/exportações | Projeções e caches | Dependem de releitura/invalidação | Atualizar todas as projeções atingidas e outras sessões |

O carregamento remoto de Pendências reconstrói `tentativas` a partir de `pendency_attempts`, sobrescrevendo a cópia do payload. O trigger `sync_pendency_attempt_statuses` apenas atualiza o status de tentativas já existentes; não recria tentativas apagadas. Mesmo assim, a escrita parcial deve atualizar payload, histórico e tabela normalizada conjuntamente, porque o adaptador de persistência exporta essas representações e a timeline também lê eventos históricos.

Não existe vínculo suficiente para atribuir toda Pendência antiga a uma instância específica de avaliação. Uma exclusão não pode selecionar por semelhança de texto, data aproximada ou apenas programa. Quando o alvo for o histórico completo de um item, o comando deve declarar esse alcance. Quando for uma Pendência específica, deve usar seu ID e validar o contexto.

## 5. Matriz de edição recomendada

**Direta** significa edição no mesmo formulário, com validação ordinária e gravação consistente. **Coordenada** significa experiência simples, mas com efeitos calculados pelo servidor. **Excluir e refazer** é o caminho inicial recomendado para mudança estrutural; não é uma proibição de exclusão.

| Campo/objeto | Regra proposta | Relações que precisam acompanhar |
|---|---|---|
| Número ou referência da NF | Direta, inclusive com Pendência e bem inventariado | Sincronizar número no bem derivado; não trocar IDs nem Pendências |
| Descrição da despesa | Direta | Atualizar descrição derivada do bem; preservar avaliações e outros dados patrimoniais |
| Valor | Direta, com número válido | Atualizar valor derivado do bem e totais; não resolver Pendência automaticamente |
| Observação, link e detalhes complementares | Direta e opcional, inclusive poder limpar | Não modificar resultado só por editar texto |
| Marca manual Sim/Não/N/A da bonificação | Coordenada, inclusive consolidada | Reabrir resultado quando a própria bonificação mudar; respeitar aplicabilidade e derivados |
| Resultado técnico de documento genérico | Coordenada | Ajustar a Pendência exata, seus dependentes e análise; manter a bonificação independente |
| Resultado fiscal de uma NF | Coordenada e individual | Não afetar NF vizinha; recalcular resumo fiscal |
| Consulta à Assessoria enviada/analisada | Coordenada por NF de serviço | Ajustar Pendência de Assessoria e resumo; não alterar análise fiscal da mesma NF sem comando para isso |
| Motivo/erros atuais da Pendência | Editável | Atualizar resumo atual; não reescrever silenciosamente o erro de tentativas históricas |
| Item/responsável da Pendência manual | Editável dentro do domínio manual | Não converter Pendência manual em documental pela troca de um rótulo |
| Responsável/próximo ator de Pendência documental | Derivado do estado | Corrigir o fluxo que produz o ator; não criar dropdown que contradiga o estado |
| Data de disponibilização de um envio | Coordenada | Pode mudar a classificação Correto/Correto (Atrasado); recomputar análise afetada sem mexer na bonificação |
| Texto/link de tentativa anterior | Direta, mantendo sua identidade | Atualizar linha normalizada e representações correspondentes |
| Resultado de reanálise anterior | Coordenada, com dependências posteriores | Não basta editar o texto; recompor estado ou excluir a reanálise e os efeitos que dela dependam |
| Classificação consumo/permanente/serviço/boleto | Coordenada quando compatível; excluir/refazer nos casos complexos iniciais | Criar/remover bem, Assessoria aplicável e agregados; boleto somente CONECTADA |
| Converter `a_identificar` em despesa identificada | Fluxo de identificação existente, com detalhes não obrigatórios além dos dados essenciais | Preservar identidade no fluxo normal; excluir conjunto se o lançamento inteiro era errado |
| Escola, competência, programa de objeto existente | Não editar como campo cadastral comum; excluir e refazer inicialmente | Identidade, unicidade, prazos, regras por programa e objetos derivados |
| Data/membro/processo de inventariação digitados errados | Coordenada | Corrigir o fato cadastrado, sem executar baixa ou mudança no sistema patrimonial externo |
| Status Inventariada lançado errado | Correção explícita permitida na proposta | Atualizar metadados terminais e projeção de encaminhamento na mesma operação |
| ID, autoria original, versão, chave de intenção e timestamps técnicos | Gerados pelo sistema | Não são campos de edição do operador; autoria da correção é automática |

Não se recomenda manter um bloqueio de correção só porque o registro é antigo, está consolidado ou pertence a colega. Validações de competência futura de novos lançamentos são outra regra: não devem impedir a exclusão de um registro equivocado que já exista.

### 5.1. N/A não é sinônimo de apagar os dados

- O guard atual bloqueia alterar a marca de Notas Fiscais para N/A quando existem despesas. Entretanto, a ADR-055 permite cadastrar despesas quando a marca já está N/A. Portanto, a coexistência não é uma contradição universal nem fundamento para obrigar a apagar NFs válidas. Há uma assimetria entre o editor da bonificação e o ciclo de despesas.
- Recomenda-se permitir corrigir/limpar a marca manual da bonificação preservando as despesas. A correção deve reabrir o resultado quando pertinente, sem transformar a nova marca em aprovação técnica de NFs existentes. A análise individual e seu agregado continuam derivados das despesas. Rever conjuntamente os efeitos de `setBonification` e os estados efetivos para que N/A não sobrescreva resultados fiscais válidos.
- Oferecer exclusão conjunta quando os próprios lançamentos fiscais estiverem errados e forem selecionados como alvo. Não tornar essa exclusão consequência necessária nem silenciosa da correção da bonificação.
- BB Ágil N/A implica estado técnico efetivo Correto segundo o contrato atual. Se o lançamento errado de Incorreto gerou Pendência, a correção para N/A precisa tratar essa Pendência conjuntamente.
- Assessoria e encaminhamento de inventário têm valores derivados. Corrigir os registros que os alimentam; não oferecer alteração manual do agregado que será desfeita no próximo reload.
- Se uma exclusão/classificação retirar o último objeto ao qual se aplicava uma análise de Assessoria ou encaminhamento, revisar também suas Pendências documentais de contexto. Não deixar Pendência ativa de um item que passou a não se aplicar. Pendência legada sem origem inequívoca entra na resolução explícita descrita na seção 8.

### 5.2. Bonificação consolidada

A mudança solicitada justifica retirar a exigência de Assistente para a **correção dos lançamentos** pelo Controlador. Corrigir marca da própria bonificação consolidada deve reabrir o resultado daquele programa/mês e indicar visualmente que precisa ser consolidado novamente. O usuário não deve preencher justificativa nem digitar um resultado arbitrário para contornar a regra.

A capacidade de consolidar pode continuar conforme o perfil já autorizado para essa operação. Não é necessário conceder administração geral para permitir correção. A operação de correção deve permitir deixar incompleto um lançamento antes consolidado; a obrigação de preenchimento pertence à consolidação, não ao ato de corrigir.

Operações de NF, Pendência, Assessoria e inventário preservam o resultado de bonificação, como estabelece a ADR-055, mesmo quando atualizam projeções derivadas. Apenas um comando cujo alvo inclua a própria bonificação ou todo o pacote pode limpar seu resultado. Não recalcular uma bonificação histórica automaticamente a partir de uma reanálise posterior.

## 6. Matriz de exclusão: nomes e alcance para o usuário

| Ação visível | O que desaparece | O que permanece/recalcula |
|---|---|---|
| **Limpar marca de bonificação** | A marca selecionada; consolidação é reaberta se pertinente | NF, análise técnica e Pendências válidas permanecem; observar a assimetria N/A descrita na seção 5.1 |
| **Limpar análise deste item** | Resultado atual e somente a Pendência identificada como consequência do lançamento equivocado, com seus dependentes | Documento/NF, bonificação e histórico anterior independente permanecem; análise volta a Não analisado, salvo estado obrigatório de aplicabilidade |
| **Excluir avaliações e histórico deste item** | Todas as avaliações/Pendências do item e contexto explicitamente apresentados no conjunto | Documento/NF e outros itens permanecem; esta ação de alcance maior não é o padrão de Limpar análise |
| **Corrigir resultado da análise** | Registros do erro de avaliação que forem substituídos, identificados no plano | Novo resultado coerente; demais análises e histórias independentes permanecem |
| **Excluir despesa** | NF, suas Pendências fiscais e de Assessoria, tentativas, contatos vinculados e bem derivado exclusivo | Outras NFs/contatos permanecem; agregados atualizados; bonificação manual/consolidada preservada |
| **Excluir despesa a identificar** | Despesa e sua Pendência obrigatória, mais dependentes | Não exigir identificação prévia nem deixar despesa Incorreta sem Pendência |
| **Excluir Pendência manual** | Pendência selecionada, tentativas, contatos vinculados e histórico operacional | Outros lançamentos permanecem |
| **Excluir Pendência documental** | Pendência selecionada e seus dependentes | Se ela sustenta o Incorreto atual, limpar/reconciliar a análise correspondente; não marcar Correto automaticamente |
| **Excluir envio** | Tentativa selecionada e dependências exclusivas de sua análise | Reconstituir estado coerente da Pendência e documento; envios posteriores independentes permanecem |
| **Excluir reanálise** | Resultado e efeitos da reanálise selecionada | Envio permanece, em estado que permita reanálise quando for o atual; ajustar estado presente conforme sequência válida restante |
| **Excluir contato** | Contato escolhido | Não resolver Pendência nem apagar análise; histórico de contato não pode continuar duplicado em outra projeção |
| **Excluir registro patrimonial independente** | Bem manual selecionado e seus dados próprios | Não apagar NFs sem vínculo causal |
| **Excluir bem gerado por NF** | Preferir ação contextual que exclui a despesa e o bem; apresentar ambos | Alternativa: corrigir classificação e efeitos se a despesa é válida. Não deixar NF permanente órfã |
| **Excluir saída provisória aberta** | Apenas a saída ainda não identificada | Não existe NF/Pendência a remover nessa origem |
| **Desfazer identificação da saída** | NF criada pela identificação e seus dependentes | A saída real permanece aberta, com dados originais e possibilidade de identificar novamente |
| **Excluir saída identificada** | Saída provisória e NF derivada com seus dependentes | Não deixar link para NF inexistente nem saída ainda marcada identificada |
| **Excluir lançamentos deste programa neste mês** | Verificação, marcas, análises, resultado, NFs e dependentes, Pendências documentais e manuais explicitamente pertencentes ao contexto | Outros programas/meses, cadastro escolar e contatos escolares gerais permanecem |

Uma Pendência resolvida ou cancelada continua excluível. A correção não deve se limitar a mudar seu status para Cancelada e deixar o erro reaparecendo nas listas históricas.

Se não for possível atribuir com segurança uma Pendência ao lançamento atual, **Limpar análise** não deve selecionar todo o histórico do item como substituto dessa atribuição. Apresentar os alvos concretos para seleção ou oferecer a limpeza completa explicitamente nomeada. Remover uma Pendência antiga independente não pode limpar uma análise mais recente que não depende dela; conferir sempre quem sustenta o estado atual.

Para uma despesa `a_identificar`, excluir só a Pendência violaria a regra de existência do próprio registro. O botão contextual deve oferecer excluir a despesa com a Pendência, sem exigir uma identificação inventada. É uma operação simples com alcance maior, não uma nova impossibilidade de exclusão.

O pacote de um programa não inclui automaticamente toda a conta PDDE Qualidade: uma saída provisória aberta não tem programa conhecido. A saída identificada ligada à NF excluída deve retornar a aberta por padrão na exclusão da NF/pacote; a ação específica **Excluir saída identificada** elimina também a origem quando a própria saída estava errada. O texto da confirmação precisa informar essa diferença.

O escopo “todos os registros” aqui corresponde aos lançamentos operacionais mencionados pelo usuário. Não inclui excluir escolas, usuários, programas, competências globais, configurações de prazo, credenciais ou trilhas técnicas do sistema.

## 7. Edição e exclusão de envios/reanálises: não reconstruir uma história fictícia

Envio e reanálise não são apenas linhas decorativas. A tentativa atual, o último resultado, os erros atuais, as datas, o próximo ator e o estado Aberta/Aguardando reanálise/Resolvida dependem da sequência.

Recomenda-se o seguinte comportamento:

1. Corrigir observação/link não altera resultado nem sequência.
2. Corrigir a data de disponibilização recalcula a classificação de atraso das análises que usam essa data. Não altera o resultado histórico de bonificação.
3. Excluir o envio atualmente aguardando análise remove a tentativa e recompõe a Pendência a partir do último estado válido. Uma tentativa anteriormente substituída não deve ser reativada por simples ordenação sem regra explícita.
4. Excluir uma reanálise correta que encerrou a Pendência pode retirar a resolução e recolocar o envio atual em reanálise. Apagar uma reanálise antiga não deve apagar envios posteriores que são fatos independentes.
5. Quando a reconstrução não puder ser determinada pelos dados restantes, o sistema deve remover o resultado dependente e indicar Não analisado/Aguardando reanálise, conforme o envio válido existente. Não inventar aprovação, erro ou data.
6. A exclusão do conjunto completo continua sempre disponível quando o próprio lançamento da Pendência era errado; não exige navegar e apagar evento por evento.

Para implementar exclusões parciais, definir antes uma tabela de transições e testes com múltiplos envios, substituição antes de análise, reabertura, cancelamento e correção posterior. Não é necessário criar uma arquitetura nova de event sourcing. A representação atual possui histórico e estado redundantes, mas não garante que todo passado possa ser reproduzido como comandos originais completos.

## 8. Casos especiais que exigem decisão técnica, sem burocracia para o operador

### 8.1. Competência, programa e escola

Mover registros é possível no PostgreSQL; não se trata simplesmente de “levar para outra tela”. O problema está nas relações: unicidade da verificação, composição de IDs/contextos, competência de origem da Pendência, tipo de programa, prazo usado no atraso, permissão da operação, NF, bem e eventual origem provisória.

Para a primeira implementação, manter os três campos fora da edição comum e oferecer **Excluir e cadastrar no local correto**. O usuário não precisa corrigir ou encerrar Pendências antes de excluir. Um futuro comando Mover poderia existir, mas teria que tratar destino já preenchido, compatibilidade de programa e todos os vínculos numa transação. Não incluir essa complexidade como pré-requisito da solução atual.

### 8.2. Patrimônio já inventariado

A terminalidade atual é uma decisão de negócio expressa em triggers, não uma limitação física do banco. O pedido do usuário permite propor sua revisão: um registro Inventariada lançado errado deve ser corrigível/excluível, sem exigir baixar um bem fictício ou envolver outro perfil apenas por causa do estado.

Na implementação, alterar explicitamente as proteções para admitir o comando de correção autorizado. Não desligar triggers globalmente nem aceitar uma flag de bypass enviada pelo navegador. O comando deve validar o conjunto, tratar concorrência e atualizar/remover os dados de inventariação vinculados.

Excluir o lançamento no RADAR não retira um bem físico da escola nem desfaz registro no SIGMA/SEI/Processo.Rio. Essa distinção deve aparecer apenas quando o objeto envolver inventariação; não precisa virar termo de responsabilidade ou justificativa obrigatória.

### 8.3. Contatos

Contato com `pendency_id` pertence ao conjunto operacional daquela Pendência na proposta. Excluir o conjunto elimina esses contatos, com a quantidade indicada. Contatos gerais da escola, sem esse vínculo, não devem ser apagados por coincidência de data, assunto ou texto.

Se um contato vinculado contiver também informação escolar independente, a pessoa pode editar/desvincular o contato antes, sem obrigação de fazê-lo. Não tentar inferir essa intenção lendo descrição livre. Mensagens ou e-mails enviados fora do RADAR não são apagados por excluir o registro interno.

### 8.4. Legados sem vínculo individual

As duas ocorrências observadas impedem prometer que um simples filtro por `registered_invoice_id` eliminará toda possível causalidade histórica. Elas precisam de tratamento explícito:

- Na exclusão de uma NF, não absorver automaticamente uma Pendência sem vínculo porque a escola, o mês e o programa coincidem.
- Se houver evidência determinística suficiente numa etapa de reconciliação, estabelecer a relação correta com prova; não adivinhar por número de nota em texto.
- Sem prova, manter a exclusão individual da Pendência disponível e oferecer seleção dos registros do contexto numa limpeza de conjunto, com seus nomes e impactos, sem justificativa textual.
- Ao excluir todo o pacote do programa/mês, incluir Pendências cuja pertença a esse contexto esteja confirmada, mesmo sem NF individual; preservar as de contexto diferente ou indeterminado.

Esse caso não deve recriar o bloqueio geral de 424 despesas. É uma condição pontual de associação, a ser resolvida com seleção de alvo e mensagens concretas.

### 8.5. Idempotência e retorno antigo

A função ativa `save_invoice_with_effects_v2_impl` retorna o resultado armazenado quando a mesma intenção já foi concluída. O resultado contém o objeto salvo. Após uma exclusão futura, repetir uma gravação antiga poderia devolver um snapshot anterior; isso não prova recriação da linha no banco, mas pode induzir estado visual obsoleto se o cliente o reaplicar.

A exclusão deve invalidar/reconciliar respostas antigas e deixar a intenção concluída identificável. Não apagar simplesmente as chaves de idempotência, pois um retry poderia ser interpretado como criação inédita. Uma nova criação no local correto deve ter novo ID e nova intenção. Respostas assíncronas de consultas antigas também não podem recolocar objetos excluídos na tela.

## 9. Campos opcionais e validações que continuam fazendo sentido

| Informação | Política proposta |
|---|---|
| Justificativa de correção/exclusão/cancelamento/reabertura | Opcional; ausência nunca bloqueia a operação |
| Observação de abertura, envio e reanálise | Opcional; rótulo explícito “Observações (opcional)” |
| Detalhamento narrativo de motivo | Opcional quando uma categoria de erro já identifica o problema |
| Link e informações adicionais | Opcionais, salvo se um fluxo específico realmente usar o link como seu objeto, o que precisa de justificativa técnica própria |
| Identificação do objeto e contexto | Capturada do item/tela, não digitada novamente |
| Resultado selecionado e tipo aplicável | Necessários para entender o estado solicitado |
| Categoria de erro para uma Pendência documental nova | Manter classificação mínima selecionável; texto adicional opcional |
| Data de disponibilização de um novo envio | Dado de negócio usado no cálculo temporal; manter campo válido, corrigível, sem exigir narrativa |
| Número de NF identificada e valores estruturados | Continuar com validações pertinentes; `a_identificar` e provisória mantêm sua flexibilidade própria |
| Autoria, data da correção, antes/depois e IDs afetados | Registro automático pelo servidor |

É necessário retirar a exigência em todas as camadas: atributo HTML `required`, validação do modal, serviços, domínio, RPCs e eventuais schemas/constraints. Preencher automaticamente “justificativa não informada” para satisfazer uma regra antiga não é a solução; ausência deve ser representada como ausência. Texto automático do sistema pode descrever a ação realizada, sem fingir que foi escrito pelo usuário.

Rastreabilidade pode existir sem formulário obrigatório. Recomenda-se manter auditoria passiva e recibo automático da operação; não manter a Pendência excluída como entidade ativa/oculta em métricas. A timeline pode mostrar “Lançamento excluído” como evento, claramente distinto de uma Pendência ou aprovação ainda vigente. A remoção desses logs técnicos não faz parte deste pedido.

## 10. Experiência de uso integrada ao desenho aprovado

Manter a elevação visual existente e acrescentar poucas ações previsíveis:

- **Editar**, **Limpar análise** e **Excluir lançamento** no contexto do objeto. Não multiplicar botões roxos nas linhas nem esconder toda correção em uma aba de auditoria.
- Cabeçalho do editor/confirmador com escola, mês, programa e nome do item sempre visíveis. Esses dados evitam repetir o erro de contexto.
- Editor comum sem justificativa obrigatória. Observações opcionais em área secundária expansível, sem competir com campos operacionais.
- Uma confirmação para remoção: “Excluir esta despesa? Serão excluídos também 2 Pendências, 3 envios e 1 bem vinculado.” Os números devem vir do plano real do servidor.
- Botões **Cancelar** e **Excluir despesa**. Sem digitar palavra de confirmação, marcar declarações ou abrir vários modais em sequência.
- Em correção que remove dependentes, o resumo do impacto pode estar no próprio diálogo de edição. Não criar uma segunda confirmação depois de a pessoa confirmar o mesmo alcance.
- Após confirmação remota, fechar/atualizar o drawer, ajustar contadores e conservar o contexto de navegação. Exibir a opção de cadastrar de novo no contexto escolhido sem copiar silenciosamente programa ou competência errados.
- Em conflito concorrente, mostrar que o registro mudou e recarregar o conjunto. Não dizer que foi excluído se a operação não foi confirmada; se o commit ocorreu mas a sincronização falhou, informar essa distinção e refazer a leitura, não repetir a exclusão como se nunca tivesse acontecido.

Não prometer botão Desfazer temporário se não houver mecanismo real de restauração do conjunto. Exclusão simples e clara é melhor que um desfazer meramente visual.

## 11. Contrato técnico recomendado para implementação posterior

### 11.1. Uma intenção, um conjunto, uma transação

O formato final da API pode reaproveitar/estender as RPCs atuais. O requisito é que haja uma autoridade por operação, não uma coleção de DELETEs independentes disparados pelo navegador.

1. Receber tipo de ação, ID/contexto do alvo, versão esperada, chave de intenção e observação opcional.
2. Autorizar pelo usuário autenticado e capacidade operacional, mantendo colaboração escolar. Não confiar no perfil visual simulado.
3. Resolver no servidor o conjunto afetado, inclusive dependências lógicas, versões e objetos preservados. Apresentar esse alcance ao operador.
4. Ao executar, reler e bloquear o conjunto em ordem determinística. Conferir novamente versões e novos dependentes; não executar um alcance destrutivo maior do que o confirmado.
5. Aplicar deleções/correções, FKs, reconciliação de payloads e projeções no mesmo commit. A ordem concreta deve considerar os triggers atuais, especialmente a remoção do bem ao desvinculá-lo.
6. Recalcular somente os campos de propriedade da operação, com regras compartilhadas e verificadas no servidor. Não aceitar um patch arbitrário do cliente que apague bonificação de outro domínio.
7. Registrar a operação automaticamente e devolver IDs excluídos, entidades atualizadas, contexto escolar e recibo de commit. Repetição da mesma intenção deve produzir resposta coerente.
8. Invalidar/recarregar somente as fatias afetadas e rejeitar respostas antigas. Conferir outra sessão e reload.

O bloqueio precisa abranger também os produtores de novos dependentes. `FOR UPDATE` apenas na NF/verificação não basta para impedir que outra sessão crie uma Pendência de contexto sem FK enquanto o plano é executado. Definir protocolo comum de serialização por agregado/contexto para abertura, envio, reanálise, identificação, inventariação e exclusão; conferir a pertença novamente dentro da transação. Não resolver concorrência aumentando o alcance da exclusão sem nova apresentação ao usuário.

Não se recomenda apagar a linha inteira de `verifications` para limpar um campo. Ela contém múltiplas dimensões e referências. Excluir a linha cabe ao pacote completo ou a uma situação comprovadamente vazia, com suas relações resolvidas.

### 11.2. Projeções obrigatórias

Conferir Prontuário (bonificação, análise, despesas, Assessoria, histórico, Capital), Pendências e seu drawer, Competências, Carteira, Dashboard, Inventário, timeline, busca global e novas exportações. Um arquivo Excel já baixado não se atualiza retroativamente; nova exportação deve refletir o estado corrigido.

O catálogo ativo mostrou triggers de invalidação nas entidades principais. Em `quality_provisional_movements`, a inspeção encontrou apenas o trigger de atualização de metadados. Isso não demonstra sozinho falha atual da tela, que tem hidratação própria, mas exige tratar explicitamente a atualização do painel provisório quando a exclusão ocorrer pela NF ou por outra sessão.

Não voltar ao refresh global para resolver tudo. Utilizar a reconciliação escolar/contextual já estabelecida, incluindo remoções reais de IDs no estado local, coleções normalizadas e índices de busca.

## 12. Contratos que mudam e contratos preservados

| Contrato vigente | Destino proposto |
|---|---|
| Histórico impede excluir NF | Substituir por exclusão transacional dos dependentes corretos |
| Inventariada nunca pode ser corrigida/excluída | Manter proteção do fluxo ordinário, permitir comando explícito de correção/exclusão do lançamento |
| Tentativa é imutável | Permitir correção e exclusão com recomposição da sequência |
| Retificação exige justificativa e papel de Assistente | Retirar exigência narrativa e liberar correção para operador autorizado no domínio |
| Pendência precisa ser encerrada pelo ciclo normal mesmo quando nasceu por erro | Acrescentar correção/exclusão direta; manter ciclo normal para problemas reais |
| Identidade escola/mês/programa não muda no editor comum | Preservar inicialmente, com exclusão/refazimento sempre acessível |
| ADR-055: despesa/análise não reabrem bonificação | Preservar; somente correção da própria bonificação/pacote altera seu resultado |
| ADR-056: colaboração escolar | Preservar; não exigir autor original, carteira ou outra CRE para corrigir |
| Incorreto novo e `a_identificar` exigem Pendência coerente | Preservar; exclusão do conjunto evita estados órfãos |
| Assessoria individual e resumo fiscal derivado | Preservar |
| Supabase autoritativo, versões, atomicidade e convergência | Preservar e aplicar aos novos comandos |

Na implementação, atualizar juntos `SYSTEM_CANONICAL_MODEL`, `FUNCTIONAL_CONTRACT_MATRIX.md` e JSON fonte, matriz de permissões, ADRs afetadas, guias de uso e testes. Entre as operações diretamente atingidas estão VER-04 e INV-01/02/03/04, além das operações de Pendência, contato e inventário correspondentes na matriz. A política nova deve ser registrada como revisão deliberada; testes antigos de proibição absoluta não podem causar retorno ao comportamento que o usuário quer eliminar.

Este documento registra a direção solicitada, mas não declara contratos já alterados em Production.

## 13. Sequência de entrega sugerida

1. **Correção e exclusão completas de análise/Pendência/NF:** resolver o problema principal em um módulo, com efeitos patrimoniais e provisórios quando presentes. Não entregar apenas botão que falha nos registros com histórico.
2. **Correção de bonificação consolidada e limpeza de pacote por programa/mês:** facilitar especialmente lançamentos no contexto errado, preservando a separação de dimensões nas operações menores.
3. **Edição/exclusão granular de envios, reanálises, contatos e dados de inventariação:** fechar a liberdade sobre eventos individuais com reconstrução determinística.

Essa sequência divide a implementação, não limita a política desejada. Mesmo antes da edição granular de uma tentativa, a exclusão de todo o lançamento errado com seus dependentes deve funcionar. Não declarar a flexibilização integral concluída enquanto houver categorias operacionais permanentemente bloqueadas.

Cada etapa deve ser homologada em Preview conectado a Supabase descartável com dados sintéticos. Um Preview local sem banco não prova FKs, RLS, triggers, rollback ou sincronização remota. Nada nesta análise autoriza ensaiar deleções em Production.

## 14. Cenários de aceitação baseados no uso real

| Cenário | Resultado necessário |
|---|---|
| Avaliação no mês errado com Pendência e dois envios | Excluir o conjunto na origem e refazer no destino; nenhum vestígio operacional indevido no mês antigo |
| NF no programa errado com Pendência fiscal e Assessoria | Excluir NF/dependentes exatos, preservando NF vizinha e a bonificação consolidada |
| Corrigir valor/número com Pendência ativa | Salvar sem justificativa, atualizar bem quando houver e manter a Pendência |
| Excluir NF cujo histórico contém Pendência Resolvida/Cancelada | Funcionar; histórico não é impedimento |
| Excluir despesa a identificar | Despesa, Pendência e dependentes somem juntos |
| Excluir NF Inventariada equivocada | Remover NF/bem/efeitos, sem burlar autorização nem alterar objetos independentes |
| Corrigir inventariação digitada errada | Atualizar metadados e projeção, com leitura coerente após reload |
| Limpar só análise fiscal de NF A | NF A permanece; NF B e Assessoria não são limpas por engano |
| Trocar resultado Incorreto lançado por engano | Não obrigar novo envio; eliminar/reconciliar Pendência errada e mostrar novo resultado |
| Alterar bonificação consolidada | Correção permitida, sem narrativa; resultado reaberto somente nesse contexto |
| Corrigir marca da NF para N/A quando há despesas válidas | Preservar despesas, Pendências e resultados fiscais; não aprovar análise técnica por efeito da marca |
| Limpar análise atual com histórico anterior legítimo | Remover apenas consequências identificadas do erro atual; exclusão de todo o histórico é uma ação distinta |
| Perfil Inventário desfaz inventariação | Corrigir o lançamento patrimonial sem receber implicitamente poder de excluir NF/Pendências |
| Excluir NF de saída provisória identificada | Saída retorna a aberta; nova identificação funciona com nova intenção |
| Excluir a própria saída identificada | Remover origem e descendentes, sem registro identificado sem NF |
| Pendência legada sem vínculo individual | Não associar automaticamente a uma NF; permitir exclusão do alvo explícito |
| Excluir contato vinculado ou geral | Remover só o contato escolhido; exclusão de conjunto não apaga contatos gerais |
| Excluir envio atual e reanálise histórica | Reconstruir estado, erros, ator e datas sem inventar fatos nem apagar envios independentes |
| Deixar observações vazias em todas as operações de correção | Funcionar em interface, domínio e SQL; sem texto artificial atribuído ao usuário |
| Falha no meio da transação | Nenhuma exclusão parcial, nenhum órfão |
| Dois colegas alteram o conjunto simultaneamente | Conflito detectado; alcance maior não é apagado silenciosamente |
| Repetir clique/retry após timeout | Uma operação consistente, sem duplicidade ou retorno visual de objeto excluído |
| Reload, outra sessão, busca e exportação | Todos convergem para o estado confirmado no banco |
| Usuário apenas leitor tenta executar comando | Recusa coerente; nenhuma elevação indevida de perfil |

Para cada cenário destrutivo, conferir também os **registros que devem permanecer**. Verificar só a ausência do alvo não detecta exclusão excessiva. A homologação precisa cobrir formulário real, confirmação, resultado percebido, persistência e releitura, e não apenas testes de funções isoladas.

## 15. Referências verificáveis da baseline

Os links abaixo são fixados no SHA analisado, não em branches móveis.

- [Serviço de avaliações](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/src/application/verification-service.js): marcas de bonificação, bloqueio de consolidação, análise técnica, retificação.
- [Serviço de NF](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/src/application/invoice-service.js): elegibilidade de classificação, guardas de histórico, patrimônio, `a_identificar`, remoção.
- [Retificação integrada](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/src/integration/auditable-retification.js): ampliação já existente de edição cadastral e edição manual de Pendência.
- [Correção de avaliações](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/src/integration/evaluation-retification.js) e [interface](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/src/integration/evaluation-retification-ui.js): limpeza e anulação com justificativa.
- [Efeitos de NF](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/src/domain/invoice-effects.js): bem derivado, resumo fiscal, Assessoria e encaminhamento.
- [Domínio de Pendências](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/src/domain/pendencias.js) e [serviço](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/src/application/pendency-service.js): tentativas, reanálises, cancelamento, reabertura e contatos.
- [Inventário](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/src/application/inventory-service.js): vínculo da NF e recomposição do encaminhamento.
- [Estado remoto para interface](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/src/data/state-bridge.js) e [adaptador de persistência](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/src/data/legacy-state-adapter.js): tabelas normalizadas e payloads.
- [Movimentações provisórias](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/src/integration/quality-provisional-ux.js) e [migration de identificação](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/supabase/migrations/20261024120000_quality_provisional_movements.sql).
- [Propriedade dos campos e exclusão de NF](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/supabase/migrations/20260930003000_expense_verification_field_ownership.sql): também confrontada com a função ativa no banco.
- [Justificativa obrigatória no SQL](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/supabase/migrations/20260910201500_evaluation_retification_atomic_cancel.sql).
- [Matriz funcional](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md) e [decisões ADR-055/056](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/docs/DECISION_LOG.md).

**Estado final desta entrega:** análise concluída e proposta documentada. Implementação, migrations, homologação dos novos comportamentos, merge e deploy ainda não realizados nesta frente.
