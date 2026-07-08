# RADAR PDDE

Aplicacao estatica para acompanhamento operacional de demandas, analises e regularizacoes do PDDE.

## Rodar localmente

```bash
npm install
npm start
```

Abra `http://127.0.0.1:4175`.

## Validar

```bash
npm run check
```

## Dados

Por padrao, a aplicacao usa dados iniciais e `localStorage`, sem depender de Supabase externo.

Para ligar um Supabase proprio, preencha `config.js` com a URL do projeto e a chave publicavel. Nao use chave `service_role` no frontend.
