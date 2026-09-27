# Ferramentas para evolução visual profissional do RADAR

**Classe:** avaliação técnica datada; não altera o contrato visual aprovado.  
**Data:** 27/09/2026. **Base inspecionada:** PR #378 / `060a6573`.  
**Escopo:** viabilidade, compatibilidade e método para a próxima frente desktop.

## Conclusão

O RADAR já possui infraestrutura adequada para um acabamento visual de alto nível: CSS com tokens, SVG inline, fontes Outfit/Plus Jakarta Sans, Floating UI, Playwright, axe, Stylelint e Lighthouse. O ganho principal virá de uma direção de arte consistente aplicada a componentes e estados reais: hierarquia de informação, densidade, tipografia, espaçamentos, contraste e feedback. Instalar bibliotecas, por si só, não garante essa qualidade.

A aplicação atual usa JavaScript/CSS sem framework de componentes. A recomendação é evoluir sobre essa arquitetura. Migrar para React/shadcn/Tailwind somente para obter aparência diferente traria custo e risco desnecessários nesta frente.

## Verificação efetiva das opções

As versões abaixo são as retornadas pelo registry nesta data. Não constituem recomendação de usar `latest` em produção; a adoção deve fixar versão e lockfile.

| Componente | Resultado verificado | Aplicação ao RADAR | Prioridade |
|---|---|---|---|
| Sharp 0.35.4 | Instalado em ambiente isolado Node 24.19; WebP/AVIF gerados e reabertos em 640×400 e 1280×800 | Pipeline de fotografias e imagens: múltiplas larguras, recorte consistente, `srcset`, dimensões explícitas, sem aumentar artificialmente a fonte | Alta quando houver fotos reais |
| SVGO 4.1.0 | Instalado; SVG processado e `viewBox` preservado | Otimizar logos/ilustrações/ícones vetoriais no build, com conferência visual | Alta para novos assets |
| Lucide 1.48.0 | Instalado; catálogo de 2.114 ícones acessível | Padronizar desenho, espessura e tamanho de ícones. Importar somente os necessários ou gerar SVGs; não carregar o catálogo inteiro | Alta, após inventário dos ícones existentes |
| Fontsource Variable Outfit e Plus Jakarta Sans 5.3.0 | Instalados; WOFF2 disponíveis; licença OFL-1.1 | Hospedar as famílias já usadas, reduzindo dependência do Google Fonts e mantendo métricas previsíveis | Alta; requer comparar wrapping/alturas e cobertura de acentos |
| Style Dictionary 5.5.5 | Metadados consultados; requer Node >=22, compatível com Node 24; instalação não executada | Gerar CSS a partir de tokens de cor, espaço, tipografia e elevação quando houver necessidade real de sincronização com design | Condicional; CSS variables existentes podem bastar |
| Storybook Web Components/Vite 10.6.0 | Pacote e documentação confirmados; integração não implementada | Galeria de componentes e estados isolados. Exige adaptação dos renderizadores atuais e disciplina contra duplicação de HTML | Posterior a inventário/componentização; começar por galeria usando renderizadores reais |
| Figma | Conector autenticado confirmado; equipe Pro com assento Collab; edição depende de permissões/capacidades do arquivo alvo | Canvas de referência e sistema visual; sem migração do runtime | Disponível para a próxima frente |
| Superdesign CLI 0.14.0 | Preflight executou; sessão não autenticada | Canvas para comparar direções de arte, extrair sistema visual e trabalhar telas em conjunto | Útil para concepção; conexão pendente |
| Playwright MCP 0.0.82 | Configuração versionada no PR; não é dependência do runtime | Inspeção navegada, screenshots, ARIA e jornadas reais | Já preparado; extensão é necessária somente no modo de sessão autenticada |

Instalações experimentais foram feitas fora do repositório. Nenhum desses novos pacotes foi incorporado ao `package.json` do RADAR nesta avaliação. Evidências: `design-package-metadata.json` e `design-package-proof.json`. A imagem uniforme usada no teste prova codecs e dimensões, não qualidade perceptual/compressão de fotografias reais.

## Limites de conexão e ambiente

A revisão automática bloqueou a tentativa de login do Superdesign porque autenticar um CLI envolve credenciais e ultrapassa a autorização de avaliar ferramentas. Não houve tentativa alternativa de autenticação. A utilização do canvas depende de conexão autorizada; a entrega do PR não depende dela.

O Chromium oficial desta sessão retornou arquivo truncado no download; um executável de sessão anterior falhou antes de abrir página. Isso não foi convertido em defeito do RADAR. O CI canônico permanece a referência de comparação visual Linux/Chromium.

## Próxima frente proposta

1. Capturar o desktop real (1440×900 e 1920×1080), em estados operacionais representativos, incluindo Prontuário, Pendências, envio, reanálise, erros, vazios e sucesso. Usar dados sintéticos com comprimento/densidade realistas em Preview.
2. Consolidar a direção visual aprovada: paleta semântica, contraste, escala tipográfica, entrelinhas, números tabulares, grid, espaçamentos, raios, elevação, ícones e estados de foco. Preservar significado das cores e distinção entre histórico e providência atual.
3. Especificar componentes compartilhados: cabeçalho/contexto, linhas de documento, chips, ações, formulários, drawer, modais e feedback. Evitar botões redundantes e excesso de caixas/cores concorrentes.
4. Produzir proposta visual conectando as telas e a jornada. Figma ou Superdesign podem servir como canvas; as referências aprovadas tornam-se especificação, com extração de tokens e medidas antes de implementar.
5. Implementar uma superfície completa em Preview, reaproveitando renderizadores/serviços existentes. Comparar as screenshots renderizadas com a referência e testar a ação real, foco/teclado, persistência/releitura e efeitos relacionados.
6. Expandir o padrão para as demais superfícies após validar o piloto. Atualizar goldens somente quando a mudança visual for deliberada e revisada.

## Critérios concretos de qualidade

- A ação principal fica encontrável e inequívoca; escola, competência e programa aparecem antes da decisão.
- Tipografia consistente entre títulos, corpo, tabelas, valores e mensagens; zoom a 200% sem perda de conteúdo ou ação.
- Contraste verificado e estados compreensíveis sem depender apenas da cor; foco visível e navegação por teclado.
- Sem colisão/corte de textos, controles ou mensagens nos viewports desktop alvo.
- SVG para ícones/identidade; fotos autênticas/licenciadas das unidades com recorte planejado, resolução compatível com o tamanho exibido e variantes 1×/2×. Não apresentar escola inventada como fotografia de unidade real.
- Fotos novas devem ser otimizadas a partir de originais de qualidade. Upscale não recupera detalhe que nunca existiu; geração de arte é apropriada para ilustrações, não para fabricar evidência institucional.
- Microinterações discretas, com `prefers-reduced-motion`; efeitos decorativos não podem competir com a leitura ou atrasar operações.
- Orçamento de bytes e carregamento verificados antes/depois; não adicionar bibliotecas ou imagens pesadas sem benefício observável.

## Fontes primárias consultadas

- Sharp, formatos: https://sharp.pixelplumbing.com/api-output/
- Sharp, redimensionamento: https://sharp.pixelplumbing.com/api-resize/
- SVGO: https://svgo.dev/docs/usage/
- Lucide para JavaScript: https://lucide.dev/guide/lucide
- Fontsource: https://fontsource.org/docs/getting-started/introduction
- Fontes variáveis: https://fontsource.org/docs/getting-started/variable
- Style Dictionary: https://styledictionary.com/getting-started/installation/
- Storybook: https://storybook.js.org/docs/get-started/frameworks/web-components-vite
- Superdesign: https://superdesign.dev/blog/best-ai-ui-generator

A seleção e a prioridade são avaliação técnica baseada na arquitetura inspecionada; não promessa de resultado estético automático nem adoção aprovada de todas as opções.
