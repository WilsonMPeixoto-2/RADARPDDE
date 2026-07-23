-- RADAR PDDE — capacidade pgTAP para homologação transacional remota.
-- A extensão permanece no schema `extensions`, fora do schema público exposto pela API.

begin;

create schema if not exists extensions;
create extension if not exists pgtap with schema extensions;

commit;
