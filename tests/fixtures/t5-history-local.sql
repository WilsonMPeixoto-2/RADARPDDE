-- T5: somente dados sintéticos no Supabase descartável do gate existente.
-- Cada jornada e o retry de CI usam conjuntos próprios. Não apagar/recriar
-- patrimônio terminal nem desligar triggers para preparar uma repetição.
do $$
declare
  scenario text;
  retry integer;
  ordinal integer := 0;
  prefix text;
  school text;
  verification text;
  pendency text;
  author_id uuid := '22222222-2222-4222-8222-222222222222';
begin
  foreach scenario in array array['TEXT','EVENTS','AMBIG','CONTACT','ASSET','CONFLICT'] loop
    for retry in 0..1 loop
      ordinal := ordinal + 1;
      prefix := 'T5-' || scenario || '-R' || retry;
      school := 'ESC-' || prefix;
      verification := school || '::2026-05::BASIC';
      insert into public.schools
        (id,designation,denomination,cre,controller_id,initial_competence,inep,cnpj,sici)
      values (school,'04.90.' || lpad((700+ordinal)::text,3,'0'),
        'Escola Fictícia T5 ' || scenario || ' ' || retry,'4ª CRE','controller-other','2026-05',
        (33907000+ordinal)::text,'90.' || lpad(ordinal::text,3,'0') || '.700/0001-90','SICI-' || prefix);
      insert into public.school_programs(id,school_id,program_id,active,starts_on)
      values (school || '_BASIC',school,'BASIC',true,'2026-01-01');
      insert into public.verifications
        (id,school_id,competence_id,program_id,bonification,analysis,bonus_result)
      values (verification,school,'2026-05','BASIC',
        '{"extCC":"Sim","extINV":"Sim","notaFiscal":"Sim","declBBAgil":"Sim","consAssessoria":"Sim","consEnviada":true,"encampInventario":"Sim"}',
        '{"extCC":"Correto","extINV":"Correto","notaFiscal":"Correto","consAssessoria":"Correto","encampInventario":"Correto"}',
        'apta');

      if scenario='TEXT' then
        insert into public.registered_invoices
          (id,school_id,competence_id,program_id,verification_id,source_context_key,
           description,expense_type,invoice_number,amount,payload)
        values (prefix || '-NF',school,'2026-05','BASIC',verification,'2026-05_BASIC',
          'Serviço fictício com análises independentes','servico',prefix || '-101',200,
          '{"analiseDocumentoFiscal":"Correto","consultaAssessoriaEnviada":true,"analiseConsultaAssessoria":"Correto"}'),
          (prefix || '-NEIGHBOR',school,'2026-05','BASIC',verification,'2026-05_BASIC',
          'Consumo vizinho preservado','consumo',prefix || '-102',50,'{"analiseDocumentoFiscal":"Correto"}');
        pendency := prefix || '-P';
        insert into public.pendencies
          (id,school_id,competence_origin,program_id,document_key,registered_invoice_id,
           status,responsible_area,next_actor,reason,resolved_at,payload)
        values (pendency,school,'2026-05','BASIC','notaFiscal',prefix || '-NF',
          'Resolvida','','','', '2026-06-12T12:00:00Z',
          jsonb_build_object('tipo','documental','item','Notas Fiscais','errosAtuais','[]'::jsonb,
            'historico',jsonb_build_array(
              jsonb_build_object('id',prefix || '-E-SEND-1','tipo','novo_envio','tentativaId',prefix || '-A1','dataHora','2026-06-10T09:00:00Z'),
              jsonb_build_object('id',prefix || '-E-REVIEW-1','tipo','reanalise_incorreta','tentativaId',prefix || '-A1','dataHora','2026-06-11T10:00:00Z'),
              jsonb_build_object('id',prefix || '-E-SEND-2','tipo','novo_envio','tentativaId',prefix || '-A2','dataHora','2026-06-12T09:00:00Z'),
              jsonb_build_object('id',prefix || '-E-REVIEW-2','tipo','reanalise_correta','tentativaId',prefix || '-A2','dataHora','2026-06-12T12:00:00Z'))));
        insert into public.pendency_attempts
          (id,pendency_id,attempt_number,available_at,submitted_at,analyzed_at,result,observation,drive_url,errors,created_by,payload)
        values (prefix || '-A1',pendency,1,'2026-06-10','2026-06-10T09:00:00Z','2026-06-11T10:00:00Z',
          'incorreto','Primeiro documento','https://example.test/t5/original-1','["Assinatura ausente"]',author_id,
          '{"status":"analisada","observacaoEscola":"Primeiro documento","observacaoAnalise":"Conferência inicial","analisadoPor":"Assistente Local","analisadoPorId":"22222222-2222-4222-8222-222222222222","authenticatedRoleAnalise":"federal_assistant","actingProfileAnalise":"assistente"}'),
          (prefix || '-A2',pendency,2,'2026-06-12','2026-06-12T09:00:00Z','2026-06-12T12:00:00Z',
          'correto','Complemento documental','https://example.test/t5/original-2','[]',author_id,
          '{"status":"analisada","observacaoEscola":"Complemento documental","observacaoAnalise":"Documento conferido","analisadoPor":"Assistente Local","analisadoPorId":"22222222-2222-4222-8222-222222222222","authenticatedRoleAnalise":"federal_assistant","actingProfileAnalise":"assistente"}');

      elsif scenario='EVENTS' then
        pendency := prefix || '-CANCELED';
        insert into public.pendencies
          (id,school_id,competence_origin,program_id,document_key,status,responsible_area,next_actor,canceled_at,payload)
        values (pendency,school,'2026-05','BASIC','extCC','Cancelada','','','2026-06-23T12:00:00Z',
          jsonb_build_object('tipo','documental','item','Extrato Conta Corrente','errosAtuais','[]'::jsonb,
            'historico',jsonb_build_array(
              jsonb_build_object('id',prefix || '-OLD-REVIEW','tipo','reanalise_incorreta','tentativaId',prefix || '-OLD','dataHora','2026-06-11T10:00:00Z'),
              jsonb_build_object('id',prefix || '-LATER-SEND','tipo','novo_envio','tentativaId',prefix || '-LATER','dataHora','2026-06-12T09:00:00Z'),
              jsonb_build_object('id',prefix || '-LATER-REVIEW','tipo','reanalise_correta','tentativaId',prefix || '-LATER','dataHora','2026-06-12T12:00:00Z'),
              jsonb_build_object('id',prefix || '-CANCEL-EVENT','tipo','cancelamento','dataHora','2026-06-23T12:00:00Z','detalhe','Cancelamento posterior independente'))));
        insert into public.pendency_attempts
          (id,pendency_id,attempt_number,available_at,submitted_at,analyzed_at,result,errors,created_by,payload)
        values (prefix || '-OLD',pendency,1,'2026-06-10','2026-06-10T09:00:00Z','2026-06-11T10:00:00Z','incorreto',
          '["Assinatura ausente"]',author_id,'{"status":"analisada","analisadoPor":"Assistente Local","analisadoPorId":"22222222-2222-4222-8222-222222222222"}'),
          (prefix || '-LATER',pendency,2,'2026-06-12','2026-06-12T09:00:00Z','2026-06-12T12:00:00Z','correto',
          '[]',author_id,'{"status":"analisada"}');
        pendency := prefix || '-LAST';
        insert into public.pendencies
          (id,school_id,competence_origin,program_id,document_key,status,responsible_area,next_actor,resolved_at,payload)
        values (pendency,school,'2026-05','BASIC','extINV','Resolvida','','','2026-06-12T12:00:00Z',
          '{"tipo":"documental","item":"Extrato Investimento","errosAtuais":[]}');
        insert into public.pendency_attempts
          (id,pendency_id,attempt_number,available_at,submitted_at,analyzed_at,result,created_by,payload)
        values (prefix || '-SUPERSEDED',pendency,1,'2026-06-10','2026-06-10T09:00:00Z',null,null,author_id,
          '{"status":"substituida_antes_da_analise"}'),
          (prefix || '-CURRENT',pendency,2,'2026-06-12','2026-06-12T09:00:00Z','2026-06-12T12:00:00Z','correto',author_id,
          '{"status":"analisada","analisadoPor":"Assistente Local","analisadoPorId":"22222222-2222-4222-8222-222222222222","authenticatedRoleAnalise":"federal_assistant","actingProfileAnalise":"assistente"}');

      elsif scenario='AMBIG' then
        pendency := prefix || '-P';
        update public.verifications set analysis=jsonb_set(analysis,'{extCC}','"Incorreto"') where id=verification;
        insert into public.pendencies
          (id,school_id,competence_origin,program_id,document_key,status,responsible_area,next_actor,reason,payload)
        values (pendency,school,'2026-05','BASIC','extCC','Aguardando reanálise','Controlador','Controlador','Assinatura ausente',
          '{"tipo":"documental","item":"Extrato Conta Corrente","errosAtuais":["Assinatura ausente"]}');
        insert into public.pendency_attempts
          (id,pendency_id,attempt_number,available_at,submitted_at,analyzed_at,result,errors,created_by,payload)
        values (prefix || '-OLD',pendency,1,'2026-06-10','2026-06-10T09:00:00Z','2026-06-11T10:00:00Z','incorreto',
          '["Assinatura ausente"]',author_id,'{"status":"analisada"}'),
          (prefix || '-WAITING',pendency,2,'2026-06-12','2026-06-12T09:00:00Z',null,null,
          '[]',author_id,'{"status":"aguardando"}');
        insert into public.pendency_contacts(id,school_id,pendency_id,contact_type,contact_date,description,created_by)
        values (prefix || '-LINKED',school,pendency,'email','2026-06-12','Cobrança do documento',author_id),
          (prefix || '-GENERAL',school,null,'telefone','2026-06-12','Assunto escolar independente',author_id);

      elsif scenario in ('CONTACT','CONFLICT') then
        pendency := prefix || '-P';
        insert into public.pendencies
          (id,school_id,competence_origin,program_id,document_key,status,responsible_area,next_actor,reason,notes,payload)
        values (pendency,school,'2026-05',null,'Outro','Aberta','Escola','Escola','Verificar documento complementar',
          'Detalhe complementar que pode ser limpo',
          '{"tipo":"legada","item":"Outro","documentoKey":"Outro","errosAtuais":[]}');
        insert into public.pendency_contacts
          (id,school_id,pendency_id,contact_type,contact_date,description,official_charge,created_by,payload)
        values (prefix || '-LINKED',school,pendency,'email','2026-06-12','Mensagem inicial',true,author_id,
          '{"responsavel":"Assistente Local"}'),
          (prefix || '-GENERAL',school,null,'telefone','2026-06-13','Contato geral independente',false,author_id,
          '{"responsavel":"Assistente Local"}');

      elsif scenario='ASSET' then
        insert into public.assets
          (id,school_id,competence_id,description,expense_type,invoice_number,amount,status,
           inventory_process,inventoried_at,inventoried_by_member_id,notes,payload)
        values (prefix || '-EDIT',school,'2026-05','Mesa fictícia para correção','permanente','',100,'Inventariada',
          'PROCESSO-DIGITADO-ERRADO','2026-06-12T12:00:00Z','inventory-local','Observação antiga','{}'),
          (prefix || '-DELETE',school,'2026-05','Bem fictício cadastrado em duplicidade','permanente','',110,'Inventariada',
          'PROCESSO-DUPLICADO','2026-06-12T12:00:00Z','inventory-local','','{}'),
          (prefix || '-LINKED',school,'2026-05','Bem da despesa que deve permanecer','permanente',prefix || '-201',300,'Inventariada',
          'PROCESSO-VALIDO','2026-06-12T12:00:00Z','inventory-local','','{}');
        insert into public.registered_invoices
          (id,school_id,competence_id,program_id,verification_id,source_context_key,
           description,expense_type,invoice_number,amount,linked_asset_id,payload)
        values (prefix || '-NF',school,'2026-05','BASIC',verification,'2026-05_BASIC',
          'Despesa válida preservada','permanente',prefix || '-201',300,prefix || '-LINKED',
          '{"analiseDocumentoFiscal":"Correto"}');
      end if;
    end loop;
  end loop;
end
$$;
