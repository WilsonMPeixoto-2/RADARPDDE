# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task-9-pendencias.spec.js >> detalhe legível e opaco em 1280px
- Location: tests\e2e\task-9-pendencias.spec.js:314:3

# Error details

```
Error: expect(received).not.toBe(expected) // Object.is equality

Expected: not "rgba(0, 0, 0, 0)"
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - complementary "Navegação principal" [ref=e3]:
      - img "RADAR PDDE — Registro de Acompanhamento das Demandas, Análises e Regularizações do PDDE" [ref=e6]
      - generic [ref=e7]:
        - generic [ref=e8]: Operação
        - generic [ref=e9] [cursor=pointer]: Painel
        - generic [ref=e16] [cursor=pointer]: Carteira de Escolas
        - generic [ref=e21] [cursor=pointer]: Competências Mensais
        - generic [ref=e25] [cursor=pointer]: Pendências Operacionais
        - button "Guia do Controlador" [ref=e29] [cursor=pointer]
      - generic [ref=e34]:
        - generic [ref=e35]: Interno
        - generic [ref=e36] [cursor=pointer]: Capital e Inventário
        - generic [ref=e41] [cursor=pointer]: Registros Internos
      - generic [ref=e47]:
        - generic [ref=e48]: W
        - generic [ref=e49]:
          - generic [ref=e50]: Wilson Peixoto
          - generic [ref=e51]: Controlador
    - main [ref=e52]:
      - generic [ref=e53]:
        - combobox "Buscar escola, programa, competência, pendência ou área..." [ref=e55]
        - generic [ref=e56]:
          - generic [ref=e57]:
            - generic [ref=e58]: Competência
            - combobox "Competência global" [ref=e59] [cursor=pointer]:
              - option "Janeiro 2026"
              - option "Fevereiro 2026"
              - option "Março 2026"
              - option "Abril 2026"
              - option "Maio 2026"
              - option "Junho 2026"
              - option "Julho 2026"
              - option "Agosto 2026"
              - option "Setembro 2026"
              - option "Outubro 2026" [selected]
              - option "Novembro 2026"
              - option "Dezembro 2026"
          - combobox "Selecionar exercício" [ref=e60] [cursor=pointer]:
            - option "Exercício 2026" [selected]
          - button "Mudar para tema escuro" [ref=e61] [cursor=pointer]
          - button "Alertas de ação, 82 pendentes" [ref=e65] [cursor=pointer]:
            - generic [ref=e69]: "82"
          - button "Sair" [ref=e70] [cursor=pointer]
          - button "Controlador" [ref=e76] [cursor=pointer]
      - generic [ref=e83]:
        - generic [ref=e84]:
          - button "Voltar para Painel" [ref=e85] [cursor=pointer]: ← Voltar para Painel
          - generic [ref=e86]:
            - heading "Pendências operacionais" [level=1] [ref=e87]
            - paragraph [ref=e88]: Acompanhe o passivo de pendências de todas as competências, com prioridade para o que ainda exige providência.
          - generic [ref=e89]:
            - button "Baixar planilha de pendências em formato Excel" [ref=e90] [cursor=pointer]:
              - generic [ref=e94]: Baixar planilha
            - generic "Resumo de pendências ativas" [ref=e95]:
              - strong [ref=e96]: "2"
              - generic [ref=e97]: pendências ativas
        - note [ref=e98]:
          - generic [ref=e99]:
            - strong [ref=e100]: Visão de todas as competências
            - generic [ref=e101]: As pendências históricas permanecem nesta fila até sua conclusão. Use o filtro de competência apenas quando quiser restringir a consulta.
          - generic [ref=e102]:
            - generic [ref=e103]: Competência global
            - strong [ref=e104]: Outubro de 2026
        - region "Busca e filtros" [ref=e105]:
          - generic [ref=e106]:
            - generic [ref=e107]:
              - heading "Busca e filtros" [level=2] [ref=e108]
              - paragraph [ref=e109]: Por padrão, nenhuma competência limita esta lista.
            - button "Limpar filtros" [disabled] [ref=e110]
          - search "Pesquisar e filtrar pendências" [ref=e111]:
            - generic [ref=e112]:
              - generic [ref=e113]: Busca global
              - searchbox "Buscar pendências" [ref=e114]
            - generic [ref=e115]:
              - generic [ref=e116]: Unidade escolar
              - combobox "Unidade escolar" [ref=e117]:
                - option "Todas" [selected]
                - option "Centro de Educação de Jovens e Adultos CEJA - Avenida Brasil · 04.10.701"
                - option "Centro de Educação de Jovens e Adultos CEJA - Maré · 04.30.701"
                - option "Ciep Deputado José Carlos Brandão Monteiro · 04.11.502"
                - option "Ciep Elis Regina · 04.30.502"
                - option "Ciep Graciliano Ramos · 04.31.502"
                - option "Ciep Gregório Bezerra · 04.11.202"
                - option "Ciep Hélio Smidt · 04.30.206"
                - option "Ciep Juscelino Kubitschek · 04.10.501"
                - option "Ciep Leonel de Moura Brizola · 04.30.503"
                - option "Ciep Maestro Francisco Mignone · 04.10.502"
                - option "Ciep Mestre Cartola (Agenor de Oliveira) · 04.31.501"
                - option "Ciep Ministro Gustavo Capanema · 04.30.201"
                - option "Ciep Operário Vicente Mariano · 04.30.204"
                - option "Ciep Presidente Samora Machel · 04.30.501"
                - option "Ciep Yuri Gagarin · 04.10.202"
                - option "Creche Municipal Acauã · 04.31.607"
                - option "Creche Municipal Ari Pimentel · 04.31.608"
                - option "Creche Municipal Barbosa Lima Sobrinho · 04.31.602"
                - option "Creche Municipal Betinho · 04.11.604"
                - option "Creche Municipal Caracol · 04.11.605"
                - option "Creche Municipal Carlos Drummond de Andrade · 04.11.601"
                - option "Creche Municipal Chico Bento · 04.10.603"
                - option "Creche Municipal Chico Mendes · 04.31.603"
                - option "Creche Municipal Coração de Geneve · 04.31.604"
                - option "Creche Municipal Dr. Juvenil de Souza Lopes · 04.10.602"
                - option "Creche Municipal Luís Carlos de Oliveira Câmara · 04.31.601"
                - option "Creche Municipal Manguinhos · 04.10.601"
                - option "Creche Municipal Maria Altamira C. Olegário · 04.11.607"
                - option "Creche Municipal Menino Maluquinho · 04.30.601"
                - option "Creche Municipal Monteiro Lobato · 04.30.604"
                - option "Creche Municipal Morro da Paz · 04.11.603"
                - option "Creche Municipal Mussum - O Trapalhão · 04.11.610"
                - option "Creche Municipal Nova Holanda · 04.30.605"
                - option "Creche Municipal Professor Paulo Freire · 04.30.607"
                - option "Creche Municipal Sempre Vida Dique · 04.31.605"
                - option "Creche Municipal Tempo de Aprender · 04.11.602"
                - option "Creche Municipal Tia Ruth Costa dos Santos · 04.11.609"
                - option "Creche Municipal Tio Mário · 04.30.603"
                - option "Creche Municipal Vila Pinheiro · 04.30.602"
                - option "Creche Municipal Visconde de Sabugosa · 04.31.606"
                - option "EDI Alfredo Valladão · 04.31.804"
                - option "EDI Almir Leite Ribeiro · 04.10.808"
                - option "EDI Armando de Salles Oliveira · 04.30.813"
                - option "EDI Azoilda Trindade (Zô) · 04.30.808"
                - option "EDI Carvalho Mourão · 04.31.801"
                - option "EDI Cleia Santos de Oliveira · 04.30.806"
                - option "EDI Compositor Neoci Dias de Andrade · 04.10.805"
                - option "EDI Cônego Fernandes Pinheiro · 04.31.805"
                - option "EDI Coronel Assunção · 04.10.812"
                - option "EDI Cremilda da Silva dos Santos · 04.30.804"
                - option "EDI Doutor Antônio Fernandes Figueira · 04.10.802"
                - option "EDI Doutor Domingos Arthur Machado Filho · 04.10.801"
                - option "EDI Edmundo da Luz Pinto · 04.11.805"
                - option "EDI Göethe · 04.11.806"
                - option "EDI João Crisóstomo · 04.30.814"
                - option "EDI Joaquim Venâncio · 04.10.803"
                - option "EDI Joel Luiz de Azevedo Bastos · 04.11.802"
                - option "EDI Lais Netto dos Reis · 04.10.811"
                - option "EDI Maria Amélia Castro e Silva Belfort · 04.30.807"
                - option "EDI Maria de Lourdes Ferreira · 04.11.803"
                - option "EDI Mariana Rocha de Souza · 04.11.801"
                - option "EDI Medalhista Olímpico Eder Francis Carbonera · 04.30.812"
                - option "EDI Medalhista Olímpico Evandro Motta Marcondes Guerra · 04.30.810"
                - option "EDI Medalhista Olímpico Luiz Felipe Marques Fonteles · 04.30.809"
                - option "EDI Medalhista Olímpico William Peixoto Arjona · 04.30.811"
                - option "EDI Miguel Couto · 04.10.810"
                - option "EDI Morro da Fé · 04.11.804"
                - option "EDI Pescador Albano Rosa · 04.30.815"
                - option "EDI Pescador Isidoro Duarte - \"Doro\" · 04.30.801"
                - option "EDI Pierre Janet · 04.10.806"
                - option "EDI Pioneiras Sociais Nº 12 · 04.11.808"
                - option "EDI Professor Carlos Falseth · 04.31.802"
                - option "EDI Professor Emmanuel Pereira Filho · 04.31.803"
                - option "EDI Professor Moacyr de Góes · 04.30.803"
                - option "EDI Professora Kelita Faria de Paula · 04.30.802"
                - option "EDI Professora Solange Conceição Tricarico · 04.30.805"
                - option "EDI Professora Tania da Rocha Correa · 04.10.807"
                - option "EDI São Vicente · 04.11.809"
                - option "EDI Sargento Jorge Faleiro Souza · 04.10.804"
                - option "Escola Municipal Albino Souza Cruz · 04.10.002"
                - option "Escola Municipal Alfredo Gomes · 04.31.004"
                - option "Escola Municipal Andrade Neves · 04.31.024"
                - option "Escola Municipal Anibal Freire · 04.10.025"
                - option "Escola Municipal Ariosto Espinheira · 04.11.007"
                - option "Escola Municipal Armando Fajardo · 04.31.010"
                - option "Escola Municipal Ary Barroso · 04.31.001"
                - option "Escola Municipal Bahia · 04.30.003"
                - option "Escola Municipal Berlim · 04.10.018"
                - option "Escola Municipal Bernardo de Vasconcellos · 04.11.002"
                - option "Escola Municipal Brant Horta · 04.11.010"
                - option "Escola Municipal Brasil · 04.10.021"
                - option "Escola Municipal Cantor e Compositor Gonzaguinha · 04.11.049"
                - option "Escola Municipal Cardeal Câmara · 04.31.017"
                - option "Escola Municipal Carlos Chagas · 04.10.013"
                - option "Escola Municipal Chile · 04.10.016"
                - option "Escola Municipal Cientista Mário Kroeff · 04.11.009"
                - option "Escola Municipal Clóvis Beviláqua · 04.10.015"
                - option "Escola Municipal Conde de Agrolongo · 04.11.006"
                - option "Escola Municipal Cruzada São Sebastião · 04.31.016"
                - option "Escola Municipal David Perez · 04.31.002"
                - option "Escola Municipal Dilermando Cruz · 04.10.009"
                - option "Escola Municipal Edmundo Lins · 04.10.011"
                - option "Escola Municipal Ema Negrão de Lima · 04.10.001"
                - option "Escola Municipal Embaixador Barros Hurtado · 04.31.007"
                - option "Escola Municipal Eneyda Rabello de Andrade · 04.31.022"
                - option "Escola Municipal Erpídio Cabral de Souza( Índio da Maré) · 04.30.015"
                - option "Escola Municipal Escritor Bartolomeu Campos de Queirós · 04.30.010"
                - option "Escola Municipal Escritor Lêdo Ivo · 04.30.011"
                - option "Escola Municipal Escritor Millôr Fernandes · 04.30.019"
                - option "Escola Municipal F. J. Oliveira Viana · 04.11.036"
                - option "Escola Municipal Fernando Tude de Souza · 04.11.013"
                - option "Escola Municipal Genival Pereira de Albuquerque · 04.30.012"
                - option "Escola Municipal Grécia · 04.11.020"
                - option "Escola Municipal Heitor Beltrão · 04.31.021"
                - option "Escola Municipal Herbert Moses · 04.31.026"
                - option "Escola Municipal IV Centenário · 04.30.004"
                - option "Escola Municipal João Barbalho · 04.10.005"
                - option "Escola Municipal João de Deus · 04.11.014"
                - option "Escola Municipal João Marques dos Reis · 04.11.012"
                - option "Escola Municipal Joracy Camargo · 04.10.020"
                - option "Escola Municipal Jorge de Gouveia · 04.31.019"
                - option "Escola Municipal Joseph Bloch · 04.31.015"
                - option "Escola Municipal Leonor Coelho Pereira · 04.11.004"
                - option "Escola Municipal Lino Martins da Silva · 04.30.014"
                - option "Escola Municipal Luiz Cesar Sayão Garcez · 04.10.023"
                - option "Escola Municipal Marcílio Dias · 04.11.022"
                - option "Escola Municipal Medalhista Olímpico Lucas Saatkamp · 04.30.018"
                - option "Escola Municipal Miguel Ângelo · 04.11.021"
                - option "Escola Municipal Miguel Gustavo · 04.31.003"
                - option "Escola Municipal Ministro Afrânio Costa · 04.11.017"
                - option "Escola Municipal Ministro Lafayette de Andrada · 04.31.014"
                - option "Escola Municipal Ministro Plínio Casado · 04.11.023"
                - option "Escola Municipal Monsenhor Rocha · 04.11.001"
                - option "Escola Municipal Montese · 04.31.013"
                - option "Escola Municipal Nerval de Gouveia · 04.10.010"
                - option "Escola Municipal Nova Holanda · 04.30.007"
                - option "Escola Municipal Odilon Braga · 04.31.008"
                - option "Escola Municipal Odilon de Andrade · 04.10.022"
                - option "Escola Municipal Olimpíadas Rio 2016 · 04.30.016"
                - option "Escola Municipal Osmar Paiva Camelo · 04.30.013"
                - option "Escola Municipal Padre Manuel da Nóbrega · 04.10.007"
                - option "Escola Municipal Pedro Lessa · 04.10.004"
                - option "Escola Municipal Presidente Eurico Dutra · 04.11.005"
                - option "Escola Municipal Presidente Gronchi · 04.31.023"
                - option "Escola Municipal Professor Ary Quintella · 04.11.018"
                - option "Escola Municipal Professor Augusto Motta · 04.11.011"
                - option "Escola Municipal Professor Carneiro Ribeiro · 04.10.006"
                - option "Escola Municipal Professor Josué de Castro · 04.30.001"
                - option "Escola Municipal Professor Paulo Freire · 04.30.009"
                - option "Escola Municipal Professor Souza Carneiro · 04.11.008"
                - option "Escola Municipal Professora Maria de Cerqueira e Silva · 04.10.026"
                - option "Escola Municipal Raul Pederneiras · 04.31.011"
                - option "Escola Municipal República do Líbano · 04.31.018"
                - option "Escola Municipal Roraima · 04.31.009"
                - option "Escola Municipal Ruy Barbosa · 04.10.003"
                - option "Escola Municipal São João Batista · 04.31.006"
                - option "Escola Municipal São Paulo · 04.11.028"
                - option "Escola Municipal Suíça · 04.11.015"
                - option "Escola Municipal Tenente General Napion · 04.30.005"
                - option "Escola Municipal Teotonio Vilela · 04.30.002"
                - option "Escola Municipal Vereadora Marielle Franco · 04.30.020"
                - option "Escola Municipal Walt Disney · 04.10.008"
                - option "Escola Municipal Zélia Braune · 04.31.027"
            - generic [ref=e118]:
              - generic [ref=e119]: Competência
              - combobox "Competência" [ref=e120]:
                - option "Todas as competências" [selected]
                - option "Maio/2026"
            - group [ref=e121]:
              - generic "Mais filtros" [ref=e122] [cursor=pointer]
              - option "Todos" [selected]
              - option "PDDE Básico"
              - option "Todos" [selected]
              - option "Declaração BB Ágil"
              - option "Extrato Conta Corrente"
              - option "Extrato Investimento"
              - option "Notas Fiscais"
              - option "Todos" [selected]
              - option "Competência incorreta"
              - option "Dados divergentes"
              - option "Documento ilegível"
              - option "Documento incompleto"
              - option "Todos" [selected]
              - option "Escola"
              - option "Controlador"
              - option "Todos" [selected]
              - option "Érika Reis"
              - option "Todas" [selected]
              - option "Até 7 dias"
              - option "8 a 15 dias"
              - option "16 a 30 dias"
              - option "30 dias ou mais"
          - status [ref=e123]: 4 de 4 registros encontrados.
        - tablist "Situações das pendências" [ref=e124]:
          - tab "Abertas 1 registro" [ref=e125] [cursor=pointer]:
            - text: Abertas
            - generic "1 registro" [ref=e126]: "1"
          - tab "Aguardando reanálise 1 registro" [selected] [ref=e127] [cursor=pointer]:
            - text: Aguardando reanálise
            - generic "1 registro" [ref=e128]: "1"
          - tab "Resolvidas 1 registro" [ref=e129] [cursor=pointer]:
            - text: Resolvidas
            - generic "1 registro" [ref=e130]: "1"
          - tab "Canceladas 1 registro" [ref=e131] [cursor=pointer]:
            - text: Canceladas
            - generic "1 registro" [ref=e132]: "1"
        - tabpanel "Aguardando reanálise 1 registro" [ref=e134]:
          - table [ref=e136]:
            - rowgroup [ref=e137]:
              - row [ref=e138]:
                - columnheader "Unidade escolar" [ref=e139]
                - columnheader "Competência" [ref=e140]
                - columnheader "Programa e documento" [ref=e141]
                - columnheader "Erros atuais" [ref=e142]
                - columnheader "Situação" [ref=e143]
                - columnheader "Próxima ação" [ref=e144]
                - columnheader "Última movimentação" [ref=e145]
                - columnheader "Tentativas" [ref=e146]
                - columnheader "Ações" [ref=e147]
            - rowgroup [ref=e148]:
              - row "Escola Municipal Ema Negrão de Lima. Competência Maio/2026. Abrir detalhes da pendência." [ref=e149] [cursor=pointer]:
                - cell "Escola Municipal Ema Negrão de Lima 04.10.001 · Érika Reis" [ref=e150]:
                  - strong [ref=e151]: Escola Municipal Ema Negrão de Lima
                  - generic [ref=e152]: 04.10.001 · Érika Reis
                - cell "Maio/2026" [ref=e153]
                - cell "PDDE Básico Extrato Investimento" [ref=e154]:
                  - strong [ref=e155]: PDDE Básico
                  - generic [ref=e156]: Extrato Investimento
                - cell [ref=e157]:
                  - list "Erros atuais" [ref=e158]:
                    - listitem [ref=e159]: Documento incompleto
                - cell "Aguardando reanálise" [ref=e160]
                - 'cell "Conferir o novo arquivo Responsável: Controlador" [ref=e162]':
                  - strong [ref=e163]: Conferir o novo arquivo
                  - generic [ref=e164]: "Responsável: Controlador"
                - cell "10/07/2026 123 dias aguardando" [ref=e165]:
                  - text: 10/07/2026
                  - generic [ref=e166]: 123 dias aguardando
                - cell "1" [ref=e167]
                - cell [ref=e168]:
                  - generic [ref=e169]:
                    - button "Ver detalhes" [active] [ref=e170]
                    - button "Reanalisar" [ref=e171]
                    - button "Abrir no Prontuário" [ref=e172]
                    - button "Registrar contato" [ref=e173]
                    - button "Cancelar pendência" [ref=e174]
  - dialog [aria-hidden]:
    - generic:
      - generic:
        - heading [level=3]: Registrar Contato / Atendimento
        - button: ×
      - generic:
        - generic:
          - generic:
            - generic: Tipo de Contato
            - combobox
          - generic:
            - generic:
              - generic: Data do Atendimento
              - textbox
            - generic:
              - generic: Vincular a uma Pendência (Opcional)
              - combobox
          - generic:
            - generic: Descrição do Atendimento
            - textbox:
              - /placeholder: Descreva os pontos tratados no contato com a escola...
          - generic:
            - button: Cancelar
            - button: Registrar
  - dialog [aria-hidden]:
    - generic:
      - generic:
        - generic:
          - generic:
            - heading [level=3]: Gerar comunicação com a unidade
            - paragraph: Selecione as pendências que devem constar na mensagem. Copiar o texto apenas prepara a comunicação; depois do envio, registre o contato realizado.
        - button: ×
      - generic:
        - region:
          - generic:
            - generic:
              - heading [level=4]: Pendências selecionadas
              - paragraph: Pendências internas e registros técnicos de homologação não são incluídos.
        - region:
          - generic:
            - generic:
              - heading [level=4]: Pré-visualização da mensagem
              - paragraph: Texto final pronto para copiar e encaminhar por e-mail ou WhatsApp.
        - generic:
          - button: Fechar
          - button: Copiar texto
  - dialog [aria-hidden]:
    - generic:
      - generic:
        - heading [level=3]: Editar Dados da Unidade
        - button: ×
      - generic:
        - generic:
          - group:
            - generic: Identificação institucional
            - generic:
              - generic:
                - generic: Código institucional
                - textbox
              - generic:
                - generic: Designação
                - textbox
            - generic:
              - generic:
                - generic: Denominação
                - textbox
              - generic:
                - generic: INEP
                - textbox
            - generic:
              - generic:
                - generic: CNPJ
                - textbox
          - generic:
            - generic:
              - generic: SICI
              - textbox
            - generic:
              - generic: E-mail da Unidade
              - textbox
          - generic:
            - generic:
              - generic: Diretor(a) Geral
              - textbox
            - generic:
              - generic: Telefone do Diretor(a)
              - textbox
          - generic:
            - generic:
              - generic: Diretor(a) Adjunto(a)
              - textbox
            - generic:
              - generic: Telefone do Adjunto(a)
              - textbox
          - generic:
            - generic:
              - generic: Telefone da Unidade
              - textbox
            - generic:
              - generic: Celular Institucional
              - textbox
          - generic:
            - generic:
              - generic: Controlador Responsável
              - combobox
            - generic:
              - generic: Processo de Inventário (Exercício)
              - textbox:
                - /placeholder: Nº Processo Administrativo
          - generic: Programas Vinculados no Exercício
          - generic:
            - button: Cancelar
            - button: Salvar Alterações
  - dialog [aria-hidden]:
    - generic:
      - generic:
        - heading [level=3]: Abrir Pendência Manual
        - button: ×
      - generic:
        - generic:
          - generic:
            - generic:
              - generic: Competência de Origem
              - combobox
            - generic:
              - generic: Item / Documento
              - combobox
          - generic:
            - generic:
              - generic: Motivo da ocorrência
              - combobox
            - generic:
              - generic: Responsável pela Ação
              - combobox
          - generic:
            - generic: Observações / Detalhes
            - textbox:
              - /placeholder: Descreva detalhadamente o que causou a pendência...
          - generic:
            - button: Cancelar
            - button: Criar Pendência
  - dialog [aria-hidden]:
    - generic:
      - generic:
        - generic:
          - generic:
            - heading [level=3]: Registrar novo envio para conferência
            - paragraph: Registre a nova disponibilização do documento para que a pendência siga para reanálise.
        - button: ×
      - generic:
        - generic:
          - region:
            - heading [level=4]: Contexto da pendência
          - generic:
            - generic:
              - generic: Data em que o arquivo foi disponibilizado no Drive
              - textbox
            - generic:
              - generic: Observação
              - textbox:
                - /placeholder: Descreva informações relevantes sobre este envio
            - generic:
              - generic: Link direto do arquivo no Drive (opcional)
              - textbox:
                - /placeholder: https://drive.google.com/...
          - generic:
            - button: Cancelar
            - button: Registrar e enviar para reanálise
  - dialog [aria-hidden]:
    - generic:
      - generic:
        - heading [level=3]: Reanalisar pendência documental
        - button: ×
      - generic:
        - generic:
          - paragraph: Confira o último arquivo recebido antes de registrar o resultado. A reanálise pertence à Pendência e ao documento identificados abaixo.
          - region:
            - generic:
              - generic: Decisão técnica
              - heading [level=4]: Registre o resultado desta tentativa
              - paragraph: Use o resultado abaixo para concluir a Pendência ou devolver o documento à escola para novo envio.
            - generic:
              - generic: Resultado da reanálise
              - combobox
            - generic:
              - generic: Observação da análise
              - textbox
          - generic:
            - button: Cancelar
            - button: Confirmar reanálise
  - dialog [aria-hidden]:
    - generic:
      - generic:
        - heading [level=3]: Dados da Nota Fiscal / Despesa
        - button: ×
      - generic:
        - generic:
          - paragraph: Cadastre o gasto referente a esta Nota Fiscal para que o sistema direcione as obrigações operacionais corretas.
          - generic:
            - generic: Descrição do Gasto
            - textbox:
              - /placeholder: "Ex: Ar Condicionado Split, Pintura de Sala, Papelaria..."
          - generic:
            - generic:
              - generic: Tipo de Gasto
              - combobox
          - generic:
            - generic:
              - generic: Número ou referência do documento
              - textbox:
                - /placeholder: "Ex: NF-12345"
            - generic:
              - generic: Valor do Gasto (R$)
              - spinbutton
          - generic:
            - button: Cancelar
            - button: Salvar Gasto
  - dialog [aria-hidden]:
    - generic:
      - generic:
        - heading [level=3]: Inventariar Bem Patrimonial
        - button: ×
      - generic:
        - generic:
          - generic:
            - paragraph: "Você está registrando o tombamento e inventariação definitiva do bem:"
          - generic:
            - generic: Responsável pela Inventariação
            - combobox
          - generic:
            - generic: Observações de Controle
            - textbox:
              - /placeholder: Insira detalhes como número de tombamento, estado de conservação ou localização física do bem...
          - generic:
            - button: Cancelar
            - button: Confirmar Inventariação
  - dialog [aria-hidden]:
    - generic:
      - generic:
        - generic:
          - heading [level=3]: Observação do Item de Inventário
          - paragraph: Registre impedimentos, documentos faltantes ou outras informações úteis sem alterar o status do bem.
        - button: ×
      - generic:
        - generic:
          - generic:
            - generic: Observação
            - textbox:
              - /placeholder: "Ex.: não foi possível inventariar porque falta a Nota Fiscal no processo."
            - text: O campo pode ser atualizado ou apagado posteriormente. Salvar a observação não conclui a inventariação.
          - generic:
            - button: Cancelar
            - button: Salvar observação
  - dialog [aria-hidden]:
    - generic:
      - generic:
        - heading [level=3]: Cadastrar Controlador
        - button: ×
      - generic:
        - generic:
          - generic:
            - generic: Nome Completo
            - textbox:
              - /placeholder: "Ex: João da Silva"
          - generic:
            - generic: E-mail Corporativo
            - textbox:
              - /placeholder: "Ex: joao.silva@cre.gov.br"
          - generic:
            - button: Cancelar
            - button: Salvar Controlador
  - dialog [aria-hidden]:
    - generic:
      - generic:
        - heading [level=3]: Cadastrar Integrante de Inventário
        - button: ×
      - generic:
        - generic:
          - generic:
            - generic: Nome Completo
            - textbox:
              - /placeholder: "Ex: Jorge Oliveira"
          - generic:
            - generic: E-mail Corporativo
            - textbox:
              - /placeholder: "Ex: jorge.oliveira@sme.rj.gov.br"
          - generic:
            - button: Cancelar
            - button: Salvar Integrante
  - dialog [aria-hidden]:
    - generic:
      - generic:
        - generic:
          - heading [level=2]: Registrar contato da pendência
          - paragraph: O contato integra a linha do tempo sem alterar a situação da pendência.
        - button: ×
      - generic:
        - generic:
          - generic: Canal
          - combobox
        - generic:
          - generic: Descrição do contato
          - textbox
        - generic:
          - button: Cancelar
          - button: Salvar contato
  - dialog [aria-hidden]:
    - generic:
      - generic:
        - generic:
          - heading [level=2]: Cancelar pendência
          - paragraph: Use somente para lançamento indevido. A ação será preservada no histórico.
        - button: ×
      - generic:
        - generic: O cancelamento retira o registro das filas ativas, mas não altera bonificação ou análise técnica.
        - generic:
          - generic: Justificativa do cancelamento
          - textbox
        - generic:
          - button: Voltar
          - button: Confirmar cancelamento
  - dialog [aria-hidden]:
    - generic:
      - generic:
        - generic:
          - heading [level=2]: Reabrir pendência
          - paragraph: Informe os erros atuais e a razão administrativa da reabertura.
        - button: ×
      - generic:
        - group:
          - generic: Erros documentais
          - generic:
            - generic:
              - checkbox
              - text: Documento ausente
            - generic:
              - checkbox
              - text: Documento ilegível
            - generic:
              - checkbox
              - text: Competência incorreta
            - generic:
              - checkbox
              - text: Extrato incompleto
            - generic:
              - checkbox
              - text: Sem assinatura
            - generic:
              - checkbox
              - text: Arquivo incompatível
            - generic:
              - checkbox
              - text: Dados divergentes
            - generic:
              - checkbox
              - text: Documento incompleto
            - generic:
              - checkbox
              - text: Arquivo não localizado ou inacessível
            - generic:
              - checkbox
              - text: Outro
        - generic:
          - generic: Justificativa da reabertura
          - textbox
        - generic:
          - button: Cancelar
          - button: Confirmar reabertura
  - dialog [aria-hidden]:
    - generic:
      - banner:
        - generic:
          - heading [level=2]: Retificar consolidação
          - paragraph: Contexto não selecionado.
        - button: ×
      - generic:
        - generic:
          - generic:
            - generic: Resultado atual
            - strong: —
          - generic [aria-hidden]: →
          - generic:
            - generic: Resultado projetado
            - strong: —
        - generic:
          - generic: Justificativa da retificação
          - textbox
        - region:
          - heading [level=3]: Comparação antes e depois
          - generic: Nenhuma alteração selecionada.
        - generic:
          - button: Cancelar
          - button: Confirmar retificação
```

# Test source

```ts
  239 |
  240 |   test('preserva busca, aba, seleção e rolagem ao retornar do Prontuário', async ({ page }, testInfo) => {
  241 |     test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');
  242 |
  243 |     await page.goto('/');
  244 |     const seeded = await seedFourPendencyStates(page);
  245 |
  246 |     await page.evaluate(schoolId => {
  247 |       window.RadarNavigationHistory.navigate(window, {
  248 |         view: 'pendencias',
  249 |         filters: { escola: schoolId }
  250 |       });
  251 |     }, seeded.schoolId);
  252 |     await expect(page).toHaveURL(new RegExp(`/pendencias\\?escola=${seeded.schoolId}$`));
  253 |     await expect(page.locator('#pendency-filter-school')).toHaveValue(seeded.schoolId);
  254 |
  255 |     const search = page.getByRole('searchbox', { name: 'Buscar pendências' });
  256 |     await search.fill(seeded.schoolDesignation);
  257 |     await visibleRecord(page, 'task9-open').getByRole('button', { name: 'Ver detalhes' }).click();
  258 |
  259 |     const drawer = page.getByRole('complementary', { name: 'Detalhes da pendência' });
  260 |     await drawer.getByRole('button', { name: 'Abrir no Prontuário' }).click();
  261 |
  262 |     await expect(page.getByRole('button', { name: 'Voltar às Pendências' })).toBeVisible();
  263 |     await expect(page.locator('#main-container')).toContainText(seeded.schoolName);
  264 |     await expect(page).toHaveURL(new RegExp(`/escolas/${seeded.schoolId}$`));
  265 |     await expect.poll(() => page.evaluate(() => window.RadarNavigationHistory.currentRoute(window).view))
  266 |       .toBe('prontuario');
  267 |
  268 |     await page.getByRole('button', { name: 'Voltar às Pendências' }).click();
  269 |     await expect(page).toHaveURL(new RegExp(`/pendencias\\?escola=${seeded.schoolId}$`));
  270 |     await expect.poll(() => page.evaluate(() => (
  271 |       window.RadarNavigationHistory.currentRoute(window).filters.escola || ''
  272 |     ))).toBe(seeded.schoolId);
  273 |     await expect(page.locator('#pendency-filter-school')).toHaveValue(seeded.schoolId);
  274 |     await expect(search).toHaveValue(seeded.schoolDesignation);
  275 |     await expect(page.getByRole('complementary', { name: 'Detalhes da pendência' })).toBeVisible();
  276 |     await expect(visibleRecord(page, 'task9-open')).toHaveClass(/pendency-row-selected/);
  277 |   });
  278 |
  279 |   test('permite percorrer as abas pelo teclado', async ({ page }, testInfo) => {
  280 |     test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');
  281 |
  282 |     await page.goto('/');
  283 |     await seedFourPendencyStates(page);
  284 |
  285 |     const openTab = page.getByRole('tab', { name: /^Abertas\b/ });
  286 |     const awaitingTab = page.getByRole('tab', { name: /^Aguardando reanálise\b/ });
  287 |     await openTab.focus();
  288 |     await page.keyboard.press('ArrowRight');
  289 |     await expect(awaitingTab).toHaveAttribute('aria-selected', 'true');
  290 |     await expect(awaitingTab).toBeFocused();
  291 |   });
  292 |
  293 |   test('substitui a tabela por cartões e abre o detalhe em tela inteira no celular', async ({ page }, testInfo) => {
  294 |     test.skip(!testInfo.project.name.startsWith('mobile-'), 'Cenário exclusivo dos projetos mobile.');
  295 |
  296 |     await page.goto('/');
  297 |     await seedFourPendencyStates(page);
  298 |
  299 |     const card = visibleRecord(page, 'task9-open');
  300 |     await expect(card).toBeVisible();
  301 |     await expect(card).toHaveCSS('display', 'grid');
  302 |     await card.getByRole('button', { name: 'Ver detalhes' }).click();
  303 |
  304 |     const drawer = page.getByRole('dialog', { name: 'Detalhes da pendência' });
  305 |     await expect(drawer).toBeVisible();
  306 |     const box = await drawer.boundingBox();
  307 |     expect(box).not.toBeNull();
  308 |     expect(Math.abs(box.x)).toBeLessThanOrEqual(2);
  309 |     expect(Math.abs(box.width - (await page.evaluate(() => innerWidth)))).toBeLessThanOrEqual(2);
  310 |   });
  311 | });
  312 |
  313 | for (const width of [1440, 1280]) {
  314 |   test(`detalhe legível e opaco em ${width}px`, async ({ page }, testInfo) => {
  315 |     await page.setViewportSize({ width, height: 900 });
  316 |     await page.goto('/');
  317 |     await seedFourPendencyStates(page);
  318 |     await page.getByRole('tab', { name: /^Aguardando reanálise/ }).click();
  319 |     await visibleRecord(page, 'task9-awaiting').getByRole('button', { name: 'Ver detalhes' }).click();
  320 |     const drawer = page.locator('#pendency-detail-drawer');
  321 |     await expect(drawer).toBeVisible();
  322 |     await drawer.locator('.is-attempts').scrollIntoViewIfNeeded();
  323 |     await page.screenshot({ path: testInfo.outputPath('drawer.png') });
  324 |     const geometry = await drawer.evaluate(el => {
  325 |       const attempt = el.querySelector('.pendency-attempt-list > li');
  326 |       const box = attempt.getBoundingClientRect();
  327 |       const body = el.querySelector('.pendency-drawer-body');
  328 |       return {
  329 |         background: getComputedStyle(el).backgroundColor,
  330 |         overflow: body.scrollWidth - body.clientWidth,
  331 |         escaped: [...attempt.querySelectorAll('dt, dd, p, strong, .badge')].filter(child => {
  332 |           const range = document.createRange();
  333 |           range.selectNodeContents(child);
  334 |           const r = range.getBoundingClientRect();
  335 |           return r.left < box.left || r.right > box.right || r.top < box.top || r.bottom > box.bottom;
  336 |         }).map(child => child.textContent)
  337 |       };
  338 |     });
> 339 |     expect.soft(geometry.background).not.toBe('rgba(0, 0, 0, 0)');
      |                                          ^ Error: expect(received).not.toBe(expected) // Object.is equality
  340 |     expect.soft(geometry.overflow).toBeLessThanOrEqual(1);
  341 |     expect(geometry.escaped).toEqual([]);
  342 |     await page.keyboard.press('Escape');
  343 |     await expect(drawer).toBeHidden();
  344 |   });
  345 | }
  346 |
```