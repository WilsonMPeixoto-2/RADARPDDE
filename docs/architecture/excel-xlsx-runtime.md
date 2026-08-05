# Integração runtime das exportações Excel

**Estado:** vigente, homologado e publicado  
**Atualizado em:** 5 de agosto de 2026

## 1. Produtos

A integração mantém três saídas independentes:

1. relatório institucional XLSX de quatro abas;
2. Excel SME mensal de uma aba e 27 colunas;
3. CSV legado como fallback do relatório institucional.

## 2. Encadeamento

`src/integration/load-excel-export.js` carrega os módulos de modelo, plano, renderer, runtime SME e integração dos botões. O ExcelJS e o template SME são carregados somente no clique.

Fluxo mensal:

```text
competência visível e estado global
→ resolução estrita
→ modelo SME imutável
→ carregamento do manifesto
→ ExcelJS versionado
→ template versionado
→ projeção de 30 para 27 colunas
→ workbook
→ download
```

## 3. Relatório institucional

- botão principal **Gerar relatório Excel (.xlsx)**;
- abas `BONIFICACOES`, `SINTESE`, `QUALIDADE_DADOS` e `METADADOS`;
- histórico multicompetência;
- equivalência obrigatória com CSV;
- CSV secundário e fallback em falha do XLSX.

## 4. Excel SME

O botão:

- exige competência mensal `YYYY-MM`;
- fica desabilitado em `TODAS`, valor ausente, oculto, ambíguo ou divergente;
- usa a mesma competência para dados, nome do arquivo e aba;
- impede cliques concorrentes;
- registra estado de processamento;
- gera uma aba e **27 colunas A:AA**;
- grava designação como texto `XX.XX.XXX`;
- registra o evento de exportação.

### Superfícies

- superfície de exportações já autorizada;
- dashboard inicial da Assistente, ao lado de **Redistribuir Escolas**;
- grupo da Assistente contém exatamente **Relatório RADAR PDDE** e **Excel SME**;
- não inclui CSV nessa superfície;
- o grupo é removido quando o perfil ou a tela muda.

## 5. Runtime resiliente

O carregador do Excel SME possui:

- estados explícitos de carregamento;
- timeout;
- limpeza de listeners;
- remoção de `<script>` fracassado;
- retry real sem recarregar a aplicação;
- `AbortController` para o template;
- validação do manifesto antes do uso;
- erros distintos para motor, manifesto, template, competência, parse, serialização e download.

A presença de um elemento `<script>` não é tratada automaticamente como carregamento concluído.

## 6. Assets publicados

O artefato contém:

- `excel-sme-assets.json`;
- bundle local do ExcelJS 4.4.0;
- `assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx`;
- hashes e tamanhos esperados.

Build, `.vercel/output/static`, smoke e runtime compartilham a identidade dos assets. O template não pode ser substituído pelo fallback HTML da SPA.

## 7. Projeção do template SME

O template-fonte possui 30 colunas. Antes do preenchimento:

1. o renderer valida que Y, R e K contêm `SISTEMÁTICA PREENCHIDA`;
2. remove essas posições em ordem decrescente;
3. valida os 27 cabeçalhos finais;
4. limpa os valores antigos;
5. reconstrói as linhas com o cadastro atual;
6. limita bordas, filtro, impressão e conteúdo a A:AA.

Os campos administrativos posteriores são preservados.

## 8. Formatação e compatibilidade

- borda fina completa;
- cabeçalho horizontal e verticalmente centralizado;
- quebra automática;
- recuo zero no cabeçalho;
- altura 105;
- denominação, parecer e observações como textos descritivos;
- designação em formato `@`;
- congelamento `E2`;
- filtro e área de impressão A:AA;
- ausência deliberada de `dataValidations` incompatíveis.

## 9. Barreiras

A geração SME é bloqueada quando:

- a competência não é mensal;
- há mais de um seletor mensal visível;
- seletor e estado divergem;
- manifesto ou hash divergem;
- ExcelJS ou template não carregam;
- cabeçalhos do template não correspondem ao contrato;
- designação está ausente ou duplicada;
- parse, serialização ou download falham.

Não existe fallback CSV para o produto SME.

## 10. Idempotência

- instalação única;
- botões identificados por `dataset`;
- observação de renderizações tardias;
- remoção ao sair da superfície;
- atualização quando a competência muda;
- bloqueio de clique duplicado;
- restauração da função CSV legada no fluxo de desinstalação de teste.

## 11. Certificação

- geração pelo botão real;
- reabertura pelo ExcelJS;
- inspeção OOXML;
- manifesto sintético determinístico;
- teste do artefato Vercel;
- desktop, Android e iPhone;
- perfis autorizados e não autorizados;
- abertura manual no Microsoft Excel desktop sem reparo.

Referências:

- [`excel-export.md`](excel-export.md);
- [`excel-sme-mensal.md`](excel-sme-mensal.md);
- [`excel-integral-certification.md`](excel-integral-certification.md).

## 12. Reversão

A integração pode ser removida em novo build controlado sem alterar dados do Supabase. O runtime Excel não grava dados de negócio.
