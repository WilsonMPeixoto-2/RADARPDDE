// RADAR PDDE - Lógica Operacional e Gerenciamento de Estado (MVP)

// ==========================================
// 1. DADOS INICIAIS E MOCK DATA
// ==========================================

const INITIAL_PROGRAMS = [
    { id: 'BASIC', name: 'PDDE Básico', desc: 'Recursos gerais de custeio e capital.' },
    { id: 'CONECTADA', name: 'Educação Conectada', desc: 'Inovação e conectividade escolar.' },
    { id: 'PROEC', name: 'PROEC', desc: 'Programa de apoio às escolas de ensino integral.' },
    { id: 'ED_FAMILIA', name: 'Educação e Família', desc: 'Fomento à participação das famílias.' },
    { id: 'ADOLESCENCIAS', name: 'Escola das Adolescências', desc: 'Apoio aos anos finais do ensino fundamental.' },
    { id: 'LEITURA', name: 'Cantinho da Leitura', desc: 'Leitura e alfabetização.' },
    { id: 'TEMPO_APRENDER', name: 'Tempo de Aprender', desc: 'Apoio pedagógico para alfabetização.' },
    { id: 'RECURSOS', name: 'Sala de Recursos', desc: 'Atendimento educacional especializado.' }
];

const INITIAL_CONTROLADORES = [
    { id: 'carlos', name: 'Carlos Souza', email: 'carlos.souza@cre.gov.br' },
    { id: 'ana', name: 'Ana Costa', email: 'ana.costa@cre.gov.br' },
    { id: 'mariana', name: 'Mariana Lima', email: 'mariana.lima@cre.gov.br' }
];

const INITIAL_ESCOLAS = [
    {
        id: '1',
        inep: '33095825',
        cnpj: '12.369.459/0001-46',
        denominação: "EDI MORRO DA FÉ",
        designação: '04.11.804',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411804@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA', 'LEITURA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '2',
        inep: '33163987',
        cnpj: '17.553.027/0001-04',
        denominação: "EDI COMPOSITOR NEOCI DIAS DE ANDRADE",
        designação: '04.10.805',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410805@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '3',
        inep: '33070741',
        cnpj: '01.211.046/0001-12',
        denominação: "EM ODILON BRAGA",
        designação: '04.31.008',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431008@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'PROEC', 'RECURSOS'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '4',
        inep: '33069204',
        cnpj: '01.325.768/0001-06',
        denominação: "EDI CORONEL ASSUNÇÃO",
        designação: '04.10.812',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410812@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '5',
        inep: '33167478',
        cnpj: '21.362.407/0001-39',
        denominação: "EM ESCRITOR BARTOLOMEU CAMPOS DE QUEIRÓS",
        designação: '04.30.010',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430010@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '6',
        inep: '33068720',
        cnpj: '03.178.700/0001-69',
        denominação: "CIEP LEONEL DE MOURA BRIZOLA",
        designação: '04.30.503',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430503@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '7',
        inep: '33070679',
        cnpj: '01.155.025/0001-27',
        denominação: "EDI MIGUEL COUTO",
        designação: '04.10.810',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410810@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '8',
        inep: '33069409',
        cnpj: '05.406.794/0001-01',
        denominação: "EM PROFESSOR CARNEIRO RIBEIRO",
        designação: '04.10.006',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410006@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '9',
        inep: '33070784',
        cnpj: '05.011.104/0001-15',
        denominação: "EM PROFESSOR ARY QUINTELLA",
        designação: '04.11.018',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411018@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '10',
        inep: '33070660',
        cnpj: '03.172.518/0001-09',
        denominação: "EM LEONOR COELHO PEREIRA",
        designação: '04.11.004',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411004@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '11',
        inep: '33070482',
        cnpj: '01.464.150/0001-19',
        denominação: "EM CANTOR E COMPOSITOR GONZAGUINHA",
        designação: '04.11.049',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411049@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA', 'RECURSOS'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '12',
        inep: '33137331',
        cnpj: '12.582.479/0001-09',
        denominação: "CM BARBOSA LIMA SOBRINHO",
        designação: '04.31.602',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431602@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '13',
        inep: '33069441',
        cnpj: '04.017.619/0001-60',
        denominação: "EM TENENTE GENERAL NAPION",
        designação: '04.30.005',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430005@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '14',
        inep: '33122776',
        cnpj: '12.743.515/0001-60',
        denominação: "EDI PESCADOR ALBANO ROSA",
        designação: '04.30.815',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430815@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '15',
        inep: '33069514',
        cnpj: '05.614.260/0001-70',
        denominação: "EM NOVA HOLANDA",
        designação: '04.30.007',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430007@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '16',
        inep: '33074593',
        cnpj: '02.516.909/0001-22',
        denominação: "EM MIGUEL ÂNGELO",
        designação: '04.11.021',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411021@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '17',
        inep: '33073988',
        cnpj: '01.124.831/0001-38',
        denominação: "CIEP GRACILIANO RAMOS",
        designação: '04.31.502',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431502@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '18',
        inep: '33070598',
        cnpj: '03.188.922/0001-62',
        denominação: "EDI GÖETHE",
        designação: '04.11.806',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411806@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '19',
        inep: '33069360',
        cnpj: '01.451.980/0001-01',
        denominação: "EM PADRE MANUEL DA NÓBREGA",
        designação: '04.10.007',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410007@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '20',
        inep: '33144710',
        cnpj: '12.219.144/0001-12',
        denominação: "CM ARI PIMENTEL",
        designação: '04.31.608',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431608@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '21',
        inep: '33070687',
        cnpj: '02.347.032/0001-93',
        denominação: "EM MIGUEL GUSTAVO",
        designação: '04.31.003',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431003@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '22',
        inep: '33069263',
        cnpj: '01.868.604/0001-17',
        denominação: "EM IV CENTENÁRIO",
        designação: '04.30.004',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430004@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '23',
        inep: '33069158',
        cnpj: '01.158.075/0001-68',
        denominação: "EM BRASIL",
        designação: '04.10.021',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410021@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '24',
        inep: '33179565',
        cnpj: '31.563.583/0001-92',
        denominação: "EDI JOÃO CRISÓSTOMO",
        designação: '04.30.814',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430814@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '25',
        inep: '33070628',
        cnpj: '05.492.717/0001-11',
        denominação: "EM JOÃO DE DEUS",
        designação: '04.11.014',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411014@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '26',
        inep: '33176884',
        cnpj: '26.469.796/0001-10',
        denominação: "EM OSMAR PAIVA CAMELO",
        designação: '04.30.013',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430013@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '27',
        inep: '33095892',
        cnpj: '16.729.081/0001-03',
        denominação: "CM VISCONDE DE SABUGOSA",
        designação: '04.31.606',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431606@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '28',
        inep: '33122768',
        cnpj: '12.246.672/0001-60',
        denominação: "CM MARIA ALTAMIRA C. OLEGÁRIO",
        designação: '04.11.607',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411607@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '29',
        inep: '33068801',
        cnpj: '01.950.897/0001-87',
        denominação: "CIEP PRESIDENTE SAMORA MACHEL",
        designação: '04.30.501',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430501@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '30',
        inep: '33175950',
        cnpj: '26.204.472/0001-50',
        denominação: "EM LINO MARTINS DA SILVA",
        designação: '04.30.014',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430014@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '31',
        inep: '33070571',
        cnpj: '01.243.944/0001-52',
        denominação: "EM F. J. OLIVEIRA VIANA",
        designação: '04.11.036',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411036@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '32',
        inep: '33069123',
        cnpj: '01.875.458/0001-57',
        denominação: "EDI ARMANDO DE SALLES OLIVEIRA",
        designação: '04.30.813',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430813@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '33',
        inep: '33171092',
        cnpj: '20.549.732/0001-42',
        denominação: "EDI PROFESSORA TANIA DA ROCHA CORREA",
        designação: '04.10.807',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410807@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '34',
        inep: '33069131',
        cnpj: '02.439.519/0001-04',
        denominação: "EM BAHIA",
        designação: '04.30.003',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430003@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '35',
        inep: '33070881',
        cnpj: '01.709.902/0001-64',
        denominação: "EM SUÍÇA",
        designação: '04.11.015',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411015@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '36',
        inep: '33136947',
        cnpj: '12.558.497/0001-47',
        denominação: "CM MANGUINHOS",
        designação: '04.10.601',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410601@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '37',
        inep: '33069093',
        cnpj: '04.552.825/0001-70',
        denominação: "EM ALBINO SOUZA CRUZ",
        designação: '04.10.002',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410002@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '38',
        inep: '33144680',
        cnpj: '12.290.969/0001-23',
        denominação: "CM MUSSUM - O TRAPALHÃO",
        designação: '04.11.610',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411610@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '39',
        inep: '33096465',
        cnpj: '12.396.418/0001-49',
        denominação: "CM TIO MÁRIO",
        designação: '04.30.603',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430603@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '40',
        inep: '33170983',
        cnpj: '22.787.794/0001-18',
        denominação: "EDI CLEIA SANTOS DE OLIVEIRA",
        designação: '04.30.806',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430806@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA', 'TEMPO_APRENDER'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '41',
        inep: '33146071',
        cnpj: '05.967.616/0001-50',
        denominação: "EM PROFESSOR PAULO FREIRE",
        designação: '04.30.009',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430009@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '42',
        inep: '33069450',
        cnpj: '07.361.588/0001-58',
        denominação: "EM TEOTONIO VILELA",
        designação: '04.30.002',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430002@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '43',
        inep: '33070423',
        cnpj: '04.511.496/0001-19',
        denominação: "EM ARIOSTO ESPINHEIRA",
        designação: '04.11.007',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411007@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '44',
        inep: '33074542',
        cnpj: '01.549.332/0001-92',
        denominação: "EM MARCÍLIO DIAS",
        designação: '04.11.022',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411022@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '45',
        inep: '33068763',
        cnpj: '02.784.061/0001-12',
        denominação: "CIEP MAESTRO FRANCISCO MIGNONE",
        designação: '04.10.502',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410502@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '46',
        inep: '33123063',
        cnpj: '12.346.678/0001-00',
        denominação: "CM BETINHO",
        designação: '04.11.604',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411604@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '47',
        inep: '33167362',
        cnpj: '18.329.758/0001-33',
        denominação: "EDI CREMILDA DA SILVA DOS SANTOS",
        designação: '04.30.804',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430804@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '48',
        inep: '33179450',
        cnpj: '31.538.188/0001-50',
        denominação: "EM MEDALHISTA OLÍMPICO LUCAS SAATKAMP",
        designação: '04.30.018',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430018@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '49',
        inep: '33070555',
        cnpj: '01.509.987/0001-37',
        denominação: "EM EMBAIXADOR BARROS HURTADO",
        designação: '04.31.007',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431007@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '50',
        inep: '33096368',
        cnpj: '12.445.093/0001-47',
        denominação: "CM TIA RUTH COSTA DOS SANTOS",
        designação: '04.11.609',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411609@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '51',
        inep: '33122539',
        cnpj: '23.731.402/0001-61',
        denominação: "CM PROFESSOR PAULO FREIRE",
        designação: '04.30.607',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430607@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '52',
        inep: '33070806',
        cnpj: '01.268.536/0001-55',
        denominação: "EDI PROFESSOR EMMANUEL PEREIRA FILHO",
        designação: '04.31.803',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431803@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '53',
        inep: '33070490',
        cnpj: '02.998.816/0001-81',
        denominação: "EM CARDEAL CÂMARA",
        designação: '04.31.017',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431017@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '54',
        inep: '33160929',
        cnpj: '17.102.964/0001-43',
        denominação: "EDI PESCADOR ISIDORO DUARTE - DORO",
        designação: '04.30.801',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430801@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '55',
        inep: '33167885',
        cnpj: '19.725.741/0001-68',
        denominação: "EDI PROFESSOR MOACYR DE GÓES",
        designação: '04.30.803',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430803@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA', 'TEMPO_APRENDER'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '56',
        inep: '33176060',
        cnpj: '27.438.664/0001-93',
        denominação: "EM OLIMPÍADAS RIO 2016",
        designação: '04.30.016',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430016@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'RECURSOS'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '57',
        inep: '33069190',
        cnpj: '02.034.159/0001-52',
        denominação: "EM CLÓVIS BEVILÁQUA",
        designação: '04.10.015',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410015@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '58',
        inep: '33523258',
        cnpj: '18.959.919/0001-72',
        denominação: "EDI DOUTOR DOMINGOS ARTHUR MACHADO FILHO",
        designação: '04.10.801',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410801@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '59',
        inep: '33070890',
        cnpj: '03.827.454/0001-29',
        denominação: "EM ZÉLIA BRAUNE",
        designação: '04.31.027',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431027@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'PROEC', 'RECURSOS'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '60',
        inep: '33096511',
        cnpj: '12.672.659/0001-73',
        denominação: "CM DR. JUVENIL DE SOUZA LOPES",
        designação: '04.10.602',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410602@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '61',
        inep: '33070563',
        cnpj: '01.878.402/0001-56',
        denominação: "EM ENEYDA RABELLO DE ANDRADE",
        designação: '04.31.022',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431022@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '62',
        inep: '33167877',
        cnpj: '21.037.828/0001-94',
        denominação: "EDI MARIA DE LOURDES FERREIRA",
        designação: '04.11.803',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411803@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '63',
        inep: '33171106',
        cnpj: '21.470.618/0001-95',
        denominação: "EDI ALMIR LEITE RIBEIRO",
        designação: '04.10.808',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410808@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '64',
        inep: '33069166',
        cnpj: '03.108.351/0001-09',
        denominação: "EM CARLOS CHAGAS",
        designação: '04.10.013',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410013@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'RECURSOS'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '65',
        inep: '33069417',
        cnpj: '02.900.428/0001-16',
        denominação: "EM PROFESSOR JOSUÉ DE CASTRO",
        designação: '04.30.001',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430001@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '66',
        inep: '33069336',
        cnpj: '01.235.532/0001-70',
        denominação: "EM ODILON DE ANDRADE",
        designação: '04.10.022',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410022@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '67',
        inep: '33164118',
        cnpj: '16.838.101/0001-76',
        denominação: "EDI PROFESSORA KELITA FARIA DE PAULA",
        designação: '04.30.802',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430802@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '68',
        inep: '33070768',
        cnpj: '01.872.287/0001-02',
        denominação: "EM PRESIDENTE EURICO DUTRA",
        designação: '04.11.005',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411005@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA', 'PROEC', 'RECURSOS'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '69',
        inep: '33176892',
        cnpj: '27.289.067/0001-44',
        denominação: "EM GENIVAL PEREIRA DE ALBUQUERQUE",
        designação: '04.30.012',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430012@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '70',
        inep: '33070512',
        cnpj: '01.197.181/0001-50',
        denominação: "EM CONDE DE AGROLONGO",
        designação: '04.11.006',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411006@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '71',
        inep: '33070857',
        cnpj: '02.690.400/0001-00',
        denominação: "EM SÃO JOÃO BATISTA",
        designação: '04.31.006',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431006@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'LEITURA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '72',
        inep: '33070792',
        cnpj: '01.194.881/0001-91',
        denominação: "EM PROFESSOR AUGUSTO MOTTA",
        designação: '04.11.011',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411011@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '73',
        inep: '33069387',
        cnpj: '13.898.976/0001-75',
        denominação: "EDI PIERRE JANET",
        designação: '04.10.806',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410806@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '74',
        inep: '33095833',
        cnpj: '12.586.443/0001-95',
        denominação: "CM MONTEIRO LOBATO",
        designação: '04.30.604',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430604@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '75',
        inep: '33070504',
        cnpj: '01.859.441/0001-06',
        denominação: "EDI CARVALHO MOURÃO",
        designação: '04.31.801',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431801@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '76',
        inep: '33070695',
        cnpj: '05.392.564/0001-30',
        denominação: "EM MINISTRO LAFAYETTE DE ANDRADA",
        designação: '04.31.014',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431014@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '77',
        inep: '33070407',
        cnpj: '01.412.221/0001-30',
        denominação: "EDI ALFREDO VALLADÃO",
        designação: '04.31.804',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431804@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '78',
        inep: '33096520',
        cnpj: '12.649.139/0001-40',
        denominação: "CM SEMPRE VIDA DIQUE",
        designação: '04.31.605',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431605@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '79',
        inep: '33169500',
        cnpj: '23.013.482/0001-10',
        denominação: "EM ESCRITOR LÊDO IVO",
        designação: '04.30.011',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430011@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '80',
        inep: '33122822',
        cnpj: '21.554.317/0001-40',
        denominação: "CM CARLOS DRUMMOND DE ANDRADE",
        designação: '04.11.601',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411601@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '81',
        inep: '33070865',
        cnpj: '01.285.788/0001-92',
        denominação: "EM SÃO PAULO",
        designação: '04.11.028',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411028@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '82',
        inep: '33096546',
        cnpj: '12.470.388/0001-73',
        denominação: "CM CORAÇÃO DE GENEVE",
        designação: '04.31.604',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431604@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '83',
        inep: '33167893',
        cnpj: '21.510.074/0001-48',
        denominação: "EDI PROFESSORA SOLANGE CONCEIÇÃO TRICARICO",
        designação: '04.30.805',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430805@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '84',
        inep: '33179581',
        cnpj: '31.471.375/0001-63',
        denominação: "EDI MEDALHISTA OLÍMPICO EDER FRANCIS CARBONERA",
        designação: '04.30.812',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430812@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '85',
        inep: '33070709',
        cnpj: '04.130.541/0001-95',
        denominação: "EM MINISTRO AFRÂNIO COSTA",
        designação: '04.11.017',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411017@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '86',
        inep: '33070822',
        cnpj: '01.956.704/0001-03',
        denominação: "EM RAUL PEDERNEIRAS",
        designação: '04.31.011',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431011@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '87',
        inep: '33069182',
        cnpj: '02.808.542/0001-10',
        denominação: "CENTRO DE EDUCAÇÃO DE JOVENS E ADULTOS - AVENIDA BRASIL",
        designação: '04.10.701',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410701@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '88',
        inep: '33068739',
        cnpj: '01.175.154/0001-87',
        denominação: "CIEP ELIS REGINA",
        designação: '04.30.502',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430502@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '89',
        inep: '33069824',
        cnpj: '01.878.626/0001-68',
        denominação: "CIEP MESTRE CARTOLA (AGENOR DE OLIVEIRA)",
        designação: '04.31.501',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431501@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '90',
        inep: '33069468',
        cnpj: '01.197.182/0001-03',
        denominação: "EM WALT DISNEY",
        designação: '04.10.008',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410008@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '91',
        inep: '33144699',
        cnpj: '12.329.092/0001-37',
        denominação: "CM LUÍS CARLOS DE OLIVEIRA CÂMARA",
        designação: '04.31.601',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431601@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '92',
        inep: '33069271',
        cnpj: '01.226.403/0001-16',
        denominação: "EM JOÃO BARBALHO",
        designação: '04.10.005',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410005@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '93',
        inep: '33183813',
        cnpj: '32.065.019/0001-02',
        denominação: "EM VEREADORA MARIELLE FRANCO",
        designação: '04.30.020',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430020@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '94',
        inep: '33160910',
        cnpj: '17.561.015/0001-21',
        denominação: "EDI JOAQUIM VENÂNCIO",
        designação: '04.10.803',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410803@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '95',
        inep: '33070458',
        cnpj: '01.235.528/0001-02',
        denominação: "EM BERNARDO DE VASCONCELLOS",
        designação: '04.11.002',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411002@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '96',
        inep: '33070830',
        cnpj: '01.213.617/0001-58',
        denominação: "EM REPÚBLICA DO LÍBANO",
        designação: '04.31.018',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431018@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '97',
        inep: '33147248',
        cnpj: '12.468.491/0001-89',
        denominação: "CM ACAUÃ",
        designação: '04.31.607',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431607@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '98',
        inep: '33070652',
        cnpj: '01.187.789/0001-02',
        denominação: "EM JOSEPH BLOCH",
        designação: '04.31.015',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431015@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '99',
        inep: '33095752',
        cnpj: '12.449.488/0001-18',
        denominação: "CM NOVA HOLANDA",
        designação: '04.30.605',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430605@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '100',
        inep: '33070873',
        cnpj: '01.530.851/0001-09',
        denominação: "EDI SÃO VICENTE",
        designação: '04.11.809',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411809@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '101',
        inep: '33070520',
        cnpj: '01.294.812/0001-50',
        denominação: "EDI CÔNEGO FERNANDES PINHEIRO",
        designação: '04.31.805',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431805@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '102',
        inep: '33179514',
        cnpj: '31.059.011/0001-70',
        denominação: "EDI MEDALHISTA OLÍMPICO LUIZ FELIPE MARQUES FONTELES",
        designação: '04.30.809',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430809@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '103',
        inep: '33070580',
        cnpj: '01.205.726/0001-23',
        denominação: "EM FERNANDO TUDE DE SOUZA",
        designação: '04.11.013',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411013@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'PROEC', 'RECURSOS'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '104',
        inep: '33070601',
        cnpj: '04.494.649/0001-67',
        denominação: "EM HEITOR BELTRÃO",
        designação: '04.31.021',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431021@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '105',
        inep: '33070466',
        cnpj: '01.918.335/0001-56',
        denominação: "EM BRANT HORTA",
        designação: '04.11.010',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411010@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '106',
        inep: '33069280',
        cnpj: '01.197.673/0001-46',
        denominação: "EM JORACY CAMARGO",
        designação: '04.10.020',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410020@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'ED_FAMILIA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '107',
        inep: '33170991',
        cnpj: '23.402.143/0001-25',
        denominação: "EDI PROFESSOR CARLOS FALSETH",
        designação: '04.31.802',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431802@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '108',
        inep: '33069379',
        cnpj: '04.974.720/0001-09',
        denominação: "EM PEDRO LESSA",
        designação: '04.10.004',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410004@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '109',
        inep: '33069816',
        cnpj: '01.260.828/0001-41',
        denominação: "CIEP DEPUTADO JOSÉ CARLOS BRANDÃO MONTEIRO",
        designação: '04.11.502',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411502@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '110',
        inep: '33070849',
        cnpj: '01.529.826/0001-05',
        denominação: "EM RORAIMA",
        designação: '04.31.009',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431009@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '111',
        inep: '33069220',
        cnpj: '01.859.799/0001-39',
        denominação: "EM DILERMANDO CRUZ",
        designação: '04.10.009',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410009@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '112',
        inep: '33096554',
        cnpj: '12.518.272/0001-67',
        denominação: "CM CARACOL",
        designação: '04.11.605',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411605@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '113',
        inep: '33068771',
        cnpj: '03.170.355/0001-17',
        denominação: "CIEP MINISTRO GUSTAVO CAPANEMA",
        designação: '04.30.201',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430201@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '114',
        inep: '33070334',
        cnpj: '01.197.186/0001-83',
        denominação: "EM CIENTISTA MÁRIO KROEFF",
        designação: '04.11.009',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411009@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'LEITURA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '115',
        inep: '33069140',
        cnpj: '01.194.306/0001-99',
        denominação: "EM BERLIM",
        designação: '04.10.018',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410018@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '116',
        inep: '33070393',
        cnpj: '01.275.362/0001-58',
        denominação: "EM ALFREDO GOMES",
        designação: '04.31.004',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431004@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '117',
        inep: '33069239',
        cnpj: '01.320.115/0001-26',
        denominação: "EM EDMUNDO LINS",
        designação: '04.10.011',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410011@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '118',
        inep: '33069328',
        cnpj: '05.485.540/0001-26',
        denominação: "EM NERVAL DE GOUVEIA",
        designação: '04.10.010',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410010@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'PROEC', 'RECURSOS'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '119',
        inep: '33176051',
        cnpj: '26.231.528/0001-65',
        denominação: "EM ERPÍDIO CABRAL DE SOUZA (ÍNDIO DA MARÉ)",
        designação: '04.30.015',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430015@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '120',
        inep: '33070636',
        cnpj: '01.266.143/0001-02',
        denominação: "EM JOÃO MARQUES DOS REIS",
        designação: '04.11.012',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411012@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '121',
        inep: '33147264',
        cnpj: '12.558.016/0001-01',
        denominação: "CM VILA PINHEIRO",
        designação: '04.30.602',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430602@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '122',
        inep: '33069298',
        cnpj: '01.226.405/0001-05',
        denominação: "EDI LAIS NETTO DOS REIS",
        designação: '04.10.811',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410811@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '123',
        inep: '33176043',
        cnpj: '28.626.726/0001-53',
        denominação: "EDI MARIA AMÉLIA CASTRO E SILVA BELFORT",
        designação: '04.30.807',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430807@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '124',
        inep: '33069247',
        cnpj: '04.500.463/0001-73',
        denominação: "EM EMA NEGRÃO DE LIMA",
        designação: '04.10.001',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410001@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '125',
        inep: '33144672',
        cnpj: '12.301.433/0001-66',
        denominação: "CM TEMPO DE APRENDER",
        designação: '04.11.602',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411602@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '126',
        inep: '33068755',
        cnpj: '05.374.513/0001-86',
        denominação: "CIEP YURI GAGARIN",
        designação: '04.10.202',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410202@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA', 'LEITURA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '127',
        inep: '33164070',
        cnpj: '17.112.690/0001-73',
        denominação: "EDI MARIANA ROCHA DE SOUZA",
        designação: '04.11.801',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411801@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '128',
        inep: '33070717',
        cnpj: '01.392.813/0001-37',
        denominação: "EM MINISTRO PLÍNIO CASADO",
        designação: '04.11.023',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411023@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '129',
        inep: '33070440',
        cnpj: '03.056.773/0001-88',
        denominação: "EM ARY BARROSO",
        designação: '04.31.001',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431001@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '130',
        inep: '33070113',
        cnpj: '01.432.937/0001-07',
        denominação: "EM GRÉCIA",
        designação: '04.11.020',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411020@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '131',
        inep: '33070733',
        cnpj: '01.187.790/0001-29',
        denominação: "EM MONTESE",
        designação: '04.31.013',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431013@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '132',
        inep: '33069808',
        cnpj: '02.034.313/0001-96',
        denominação: "CIEP GREGÓRIO BEZERRA",
        designação: '04.11.202',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411202@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '133',
        inep: '33070474',
        cnpj: '02.849.204/0001-27',
        denominação: "EM CRUZADA SÃO SEBASTIÃO",
        designação: '04.31.016',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431016@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '134',
        inep: '33070610',
        cnpj: '02.293.014/0001-76',
        denominação: "EM HERBERT MOSES",
        designação: '04.31.026',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431026@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '135',
        inep: '33144702',
        cnpj: '12.353.633/0001-62',
        denominação: "CM MENINO MALUQUINHO",
        designação: '04.30.601',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430601@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '136',
        inep: '33070776',
        cnpj: '03.016.915/0001-83',
        denominação: "EM PRESIDENTE GRONCHI",
        designação: '04.31.023',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431023@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '137',
        inep: '33069174',
        cnpj: '05.624.227/0001-21',
        denominação: "EM CHILE",
        designação: '04.10.016',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410016@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '138',
        inep: '33147337',
        cnpj: '12.285.566/0001-96',
        denominação: "CM MORRO DA PAZ",
        designação: '04.11.603',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411603@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '139',
        inep: '33068780',
        cnpj: '02.702.349/0001-09',
        denominação: "CIEP OPERÁRIO VICENTE MARIANO",
        designação: '04.30.204',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430204@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '140',
        inep: '33070431',
        cnpj: '01.268.540/0001-13',
        denominação: "EM ARMANDO FAJARDO",
        designação: '04.31.010',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431010@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '141',
        inep: '33070725',
        cnpj: '03.530.444/0001-27',
        denominação: "EM MONSENHOR ROCHA",
        designação: '04.11.001',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411001@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'ED_FAMILIA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '142',
        inep: '33096503',
        cnpj: '12.493.499/0001-03',
        denominação: "CM CHICO MENDES",
        designação: '04.31.603',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431603@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '143',
        inep: '33167486',
        cnpj: '20.061.862/0001-31',
        denominação: "CENTRO DE EDUCAÇÃO DE JOVENS E ADULTOS CEJA - MARÉ",
        designação: '04.30.701',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430701@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '144',
        inep: '33179573',
        cnpj: '31.538.152/0001-76',
        denominação: "EDI MEDALHISTA OLÍMPICO EVANDRO MOTTA MARCONDES GUERRA",
        designação: '04.30.810',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430810@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '145',
        inep: '33069115',
        cnpj: '01.376.044/0001-83',
        denominação: "EM ANIBAL FREIRE",
        designação: '04.10.025',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410025@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '146',
        inep: '33070547',
        cnpj: '02.024.924/0001-53',
        denominação: "EDI EDMUNDO DA LUZ PINTO",
        designação: '04.11.805',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411805@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '147',
        inep: '33163979',
        cnpj: '17.318.714/0001-45',
        denominação: "EDI SARGENTO JORGE FALEIRO SOUZA",
        designação: '04.10.804',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410804@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '148',
        inep: '33160902',
        cnpj: '17.571.841/0001-51',
        denominação: "EDI DOUTOR ANTÔNIO FERNANDES FIGUEIRA",
        designação: '04.10.802',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410802@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '149',
        inep: '33179549',
        cnpj: '31.291.413/0001-04',
        denominação: "EDI MEDALHISTA OLÍMPICO WILLIAM PEIXOTO ARJONA",
        designação: '04.30.811',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430811@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '150',
        inep: '33068747',
        cnpj: '02.016.546/0001-66',
        denominação: "CIEP HÉLIO SMIDT",
        designação: '04.30.206',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430206@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '151',
        inep: '33179395',
        cnpj: '31.099.076/0001-40',
        denominação: "EM ESCRITOR MILLÔR FERNANDES",
        designação: '04.30.019',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430019@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '152',
        inep: '33070539',
        cnpj: '01.878.401/0001-01',
        denominação: "EM DAVID PEREZ",
        designação: '04.31.002',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431002@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '153',
        inep: '33070415',
        cnpj: '01.959.159/0001-09',
        denominação: "EM ANDRADE NEVES",
        designação: '04.31.024',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431024@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA', 'LEITURA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '154',
        inep: '33164096',
        cnpj: '17.042.644/0001-45',
        denominação: "EDI JOEL LUIZ DE AZEVEDO BASTOS",
        designação: '04.11.802',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411802@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '155',
        inep: '33096538',
        cnpj: '12.128.507/0001-04',
        denominação: "CM CHICO BENTO",
        designação: '04.10.603',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410603@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '156',
        inep: '33070814',
        cnpj: '01.406.223/0001-16',
        denominação: "EM PROFESSOR SOUZA CARNEIRO",
        designação: '04.11.008',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411008@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '157',
        inep: '33175942',
        cnpj: '28.027.038/0001-77',
        denominação: "EDI AZOILDA TRINDADE (ZÔ)",
        designação: '04.30.808',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0430808@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '158',
        inep: '33070644',
        cnpj: '01.859.807/0001-47',
        denominação: "EM JORGE DE GOUVEIA",
        designação: '04.31.019',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0431019@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'ED_FAMILIA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '159',
        inep: '33070750',
        cnpj: '02.485.279/0001-76',
        denominação: "EDI PIONEIRAS SOCIAIS Nº12",
        designação: '04.11.808',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0411808@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '160',
        inep: '33068798',
        cnpj: '02.894.802/0001-18',
        denominação: "CIEP JUSCELINO KUBITSCHEK",
        designação: '04.10.501',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410501@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '161',
        inep: '33069433',
        cnpj: '01.856.391/0001-03',
        denominação: "EM RUY BARBOSA",
        designação: '04.10.003',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410003@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'ana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'ED_FAMILIA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '162',
        inep: '33069301',
        cnpj: '04.847.415/0001-56',
        denominação: "EM LUIZ CESAR SAYÃO GARCEZ",
        designação: '04.10.023',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410023@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'mariana',
        processoInventario: '',
        programasIds: ['ADOLESCENCIAS', 'BASIC', 'CONECTADA', 'ED_FAMILIA', 'PROEC'],
        competenciaInicial: '2026-03'
    }
,
    {
        id: '163',
        inep: '33069395',
        cnpj: '02.820.657/0001-20',
        denominação: "EM PROFESSORA MARIA DE CERQUEIRA E SILVA",
        designação: '04.10.026',
        cre: '4ª CRE',
        ra: '4ª CRE - Geral',
        email: 'em0410026@rioeduca.net',
        diretor: 'Diretor(a) Geral',
        telefone: '(21) 2222-3333',
        controladorId: 'carlos',
        processoInventario: '',
        programasIds: ['BASIC', 'CONECTADA'],
        competenciaInicial: '2026-03'
    }

];

// Competências de 2026
const COMPETENCIAS = [
    { key: '2026-01', label: 'Janeiro 2026', bonifPrazo: '2026-02-15' },
    { key: '2026-02', label: 'Fevereiro 2026', bonifPrazo: '2026-03-15' },
    { key: '2026-03', label: 'Março 2026', bonifPrazo: '2026-04-15' },
    { key: '2026-04', label: 'Abril 2026', bonifPrazo: '2026-05-15' },
    { key: '2026-05', label: 'Maio 2026', bonifPrazo: '2026-06-15' },
    { key: '2026-06', label: 'Junho 2026', bonifPrazo: '2026-07-15' },
    { key: '2026-07', label: 'Julho 2026', bonifPrazo: '2026-08-15' },
    { key: '2026-08', label: 'Agosto 2026', bonifPrazo: '2026-09-15' },
    { key: '2026-09', label: 'Setembro 2026', bonifPrazo: '2026-10-15' },
    { key: '2026-10', label: 'Outubro 2026', bonifPrazo: '2026-11-15' },
    { key: '2026-11', label: 'Novembro 2026', bonifPrazo: '2026-12-15' },
    { key: '2026-12', label: 'Dezembro 2026', bonifPrazo: '2027-01-15' }
];

// Configuração Inicial de Bonificações e Análises Técnicas
// Estrutura: { [escolaId]: { [competencia]: { bonificacao: { extCC: 'Sim', extINV: 'Sim', ... }, analise: { extCC: 'Correto', ... }, resultadoBonif: 'apta' } } }
const INITIAL_VERIFICACOES = {
    '1': {
        '2026-03': {
            bonificacao: { extCC: 'Sim', extINV: 'Sim', notaFiscal: 'NÃ£o', consAssessoria: 'NÃ£o se aplica', declBBAgil: 'Sim', encampInventario: 'NÃ£o se aplica' },
            analise: { extCC: 'Correto', extINV: 'Correto', notaFiscal: 'Incorreto', consAssessoria: 'NÃ£o analisado', declBBAgil: 'Correto', encampInventario: 'NÃ£o analisado' },
            resultadoBonif: 'inapta'
        }
    }
};

const INITIAL_PENDENCIAS = [
    {
        id: 'p1',
        escolaId: '1',
        competencia: '2026-03',
        item: 'Notas Fiscais',
        motivo: 'Documento ausente',
        responsavel: 'Escola',
        status: 'Aberta',
        dataAbertura: '2026-04-16',
        dataResolucao: null,
        observacao: 'Falta nota fiscal no drive para regularizaÃ§Ã£o.'
    }
];

const INITIAL_CONTATOS = [
    {
        id: 'c1',
        escolaId: '1',
        tipo: 'WhatsApp',
        dataAtendimento: '2026-04-20',
        dataRegistro: '2026-04-20T10:00:00Z',
        desc: 'Contato com a direÃ§Ã£o cobrando as Notas Fiscais pendentes de MarÃ§o.',
        pendenciaId: 'p1'
    }
];

const INITIAL_LOGS = [
    { id: 'l1', usuario: 'Carlos Souza', perfil: 'Controlador', dataHora: '2026-04-16T09:15:00Z', acao: 'Abertura de Pendência', detalhes: 'Pendência p1 aberta para E.M. Amélia Tomás (Março/2026 - Notas Fiscais).' },
    { id: 'l2', usuario: 'Ana Costa', perfil: 'Controlador', dataHora: '2026-03-18T14:22:00Z', acao: 'Abertura de Pendência', detalhes: 'Pendência p2 aberta para C.M. Marechal Rondon (Fevereiro/2026 - Encaminhamento Inventário).' }
];

// Bens de Capital das escolas (para a equipe de Inventário)
const INITIAL_BENS = [];

// Calendário Global configurado pela SME
const INITIAL_CONFIG = {
    exercicios: ['2026'],
    competenciaFechamento: '2026-05', // Mês operacional ativo (Maio/2026)
    prazoBonificacaoProrrogado: false
};


// ==========================================
// 2. CONTROLE DE ESTADO E INICIALIZAÇÃO LOCAL
// ==========================================

let escolas = [];
let pendencias = [];
let contatos = [];
let logs = [];
let bens = [];
let verificacoes = {};
let config = {};
let programas = [];
let controladores = [];
let equipeInventario = [];
let activeEquipeTab = 'controladores'; // controladores, inventario

let currentProfile = 'controlador'; // controlador, assistente, sme, inventario
let currentExercise = '2026';
let currentView = 'dashboard'; // dashboard, escolas, competencias, pendencias, inventario, auditoria, sme-config
let activeSchoolId = null; // ID da escola em exibição no prontuário
let activeCompetenciaKey = '2026-05'; // Competência selecionada na visão por competência
let searchResultFiltered = null; // Filtro de busca global
let activeControladorRAFilter = 'carteira'; // carteira, todas, 10, 11, 30, 31
let expandedControllerId = null; // ID do controlador expandido na tabela do assistente
let activeControladorSubFilter = 'all'; // all, naoAnalisadas, pendencias, bens
let activeInventarioSubFilter = 'all'; // all, naoEncamp, aguardando, concluido
let activeAssistenteSubFilter = 'all'; // all, apto, inapto, emAndamento, naoAnalisado
let activeAssistenteControllerFilter = 'all'; // all, or controllerId
let activeAssistenteRAFilter = 'all'; // all, or RA string
let activeAssistenteSearchQuery = ''; // persistent search query
let activeSMECreFilter = null; // null or CRE name (e.g. '4ª CRE')
let activeProntuarioCompetencia = null; // competência selecionada no prontuário da escola
let notasRegistradas = []; // lista unificada de todas as notas fiscais registradas
let showSMEConsolidado = false; // toggle para exibir relatório detalhado de itens na visão da SME

function normalizeEscolaRecord(record) {
    const denominacao = record.denominação || record.denominacao || record['denominaçao'] || record['denominaÃ§Ã£o'];
    const designacao = record.designação || record.designacao || record['designaçao'] || record['designaÃ§Ã£o'];

    return {
        ...record,
        denominação: denominacao || '',
        designação: designacao || ''
    };
}

function normalizeEscolas(records) {
    return (records || []).map(normalizeEscolaRecord);
}

// ==========================================
// SUPABASE CLIENT INITIALIZATION
// ==========================================
const runtimeConfig = window.RADAR_PDDE_CONFIG || {};
const supabaseConfig = runtimeConfig.supabase || {};
const supabaseClient = (supabaseConfig.url && supabaseConfig.publishableKey && window.supabase)
    ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.publishableKey)
    : null;


async function initData() {
    // Força atualização se houver codificação antiga incorreta na LocalStorage
    const storedProgs = localStorage.getItem('radar_pdde_programas');
    if (storedProgs && (storedProgs.includes('BÃ¡sico') || storedProgs.includes('EducaÃ'))) {
        localStorage.removeItem('radar_pdde_programas');
    }

    if (!supabaseClient) {
        loadLocalFallback();
        return;
    }

    try {
        // Buscar Configurações do Supabase
        let { data: dbConfig, error: cfgErr } = await supabaseClient.from('config').select('*').limit(1);
        if (cfgErr) throw cfgErr;

        // Se o banco estiver vazio, executar o seed automático
        if (!dbConfig || dbConfig.length === 0) {
            console.log("Banco de dados do Supabase vazio. Executando seed de dados iniciais...");
            await seedDatabaseSupabase();
            let { data: newCfg, error: newCfgErr } = await supabaseClient.from('config').select('*').limit(1);
            if (newCfgErr) throw newCfgErr;
            dbConfig = newCfg;
        }

        config = dbConfig[0];

        // Buscar dados de todas as outras tabelas
        const [
            resEscolas,
            resPendencias,
            resContatos,
            resLogs,
            resBens,
            resVerificacoes,
            resProgramas,
            resControladores,
            resEquipe,
            resNotas
        ] = await Promise.all([
            supabaseClient.from('escolas').select('*'),
            supabaseClient.from('pendencias').select('*'),
            supabaseClient.from('contatos').select('*'),
            supabaseClient.from('logs').select('*'),
            supabaseClient.from('bens').select('*'),
            supabaseClient.from('verificacoes').select('*'),
            supabaseClient.from('programas').select('*'),
            supabaseClient.from('controladores').select('*'),
            supabaseClient.from('equipe_inventario').select('*'),
            supabaseClient.from('notas_registradas').select('*')
        ]);

        if (resEscolas.error) throw resEscolas.error;
        if (resPendencias.error) throw resPendencias.error;
        if (resContatos.error) throw resContatos.error;
        if (resLogs.error) throw resLogs.error;
        if (resBens.error) throw resBens.error;
        if (resVerificacoes.error) throw resVerificacoes.error;
        if (resProgramas.error) throw resProgramas.error;
        if (resControladores.error) throw resControladores.error;
        if (resEquipe.error) throw resEquipe.error;
        if (resNotas.error) throw resNotas.error;

        // Remapear nomes de colunas do Supabase para os nomes de propriedades usados no app
        escolas = normalizeEscolas((resEscolas.data || []).map(e => {
            const keys = Object.keys(e);
            keys.forEach(k => {
                if (k.indexOf('denomina') === 0 && k !== 'denomina\u00e7ao') {
                    e['denomina\u00e7ao'] = e[k];
                }
                if (k.indexOf('designa') === 0 && k !== 'designa\u00e7ao') {
                    e['designa\u00e7ao'] = e[k];
                }
            });
            return e;
        }));
        pendencias = resPendencias.data || [];
        contatos = resContatos.data || [];
        logs = (resLogs.data || []).sort((a, b) => (b.dataHora || '').localeCompare(a.dataHora || ''));
        bens = resBens.data || [];
        programas = resProgramas.data || [];
        controladores = resControladores.data || [];
        equipeInventario = resEquipe.data || [];
        notasRegistradas = resNotas.data || [];

        // Reconstruir objeto verificacoes
        verificacoes = {};
        resVerificacoes.data.forEach(v => {
            if (!verificacoes[v.escolaId]) {
                verificacoes[v.escolaId] = {};
            }
            const compProgKey = `${v.competencia}_${v.programaId}`;
            verificacoes[v.escolaId][compProgKey] = {
                bonificacao: v.bonificacao || {},
                analise: v.analise || {},
                resultadoBonif: v.resultadoBonif
            };
        });

        activeCompetenciaKey = config.competenciaFechamento;
    } catch (err) {
        console.error("Erro ao carregar dados do Supabase. Carregando fallback local.", err);
        loadLocalFallback();
    }
}

async function seedDatabaseSupabase() {
    // 1. Inserir tabelas base independentes
    await supabaseClient.from('config').insert([
        { id: 'global', exercicios: INITIAL_CONFIG.exercicios, competenciaFechamento: INITIAL_CONFIG.competenciaFechamento, prazoBonificacaoProrrogado: INITIAL_CONFIG.prazoBonificacaoProrrogado }
    ]);
    
    await supabaseClient.from('programas').insert(INITIAL_PROGRAMS);
    await supabaseClient.from('controladores').insert(INITIAL_CONTROLADORES);
    
    const INITIAL_EQUIPE_INVENTARIO = [
        { id: 'inv_1', name: 'Jorge Oliveira', email: 'jorge.oliveira@sme.rj.gov.br' },
        { id: 'inv_2', name: 'Patrícia Souza', email: 'patricia.souza@sme.rj.gov.br' }
    ];
    await supabaseClient.from('equipe_inventario').insert(INITIAL_EQUIPE_INVENTARIO);

    // 2. Inserir Escolas
    await supabaseClient.from('escolas').insert(INITIAL_ESCOLAS);

    // 3. Inserir tabelas dependentes
    await supabaseClient.from('pendencias').insert(INITIAL_PENDENCIAS);
    await supabaseClient.from('contatos').insert(INITIAL_CONTATOS);
    
    const initialLogsFormatted = INITIAL_LOGS.map(l => ({
        id: l.id,
        usuario: l.usuario,
        perfil: l.perfil,
        dataHora: l.dataHora,
        acao: l.acao,
        detalhes: l.detalhes
    }));
    await supabaseClient.from('logs').insert(initialLogsFormatted);

    // 4. Inserir Verificações iniciais
    const flatVerif = [];
    Object.keys(INITIAL_VERIFICACOES).forEach(escId => {
        Object.keys(INITIAL_VERIFICACOES[escId]).forEach(compKey => {
            const dataVal = INITIAL_VERIFICACOES[escId][compKey];
            flatVerif.push({
                id: `${escId}_${compKey}_BASIC`,
                escolaId: escId,
                competencia: compKey,
                programaId: 'BASIC',
                bonificacao: dataVal.bonificacao,
                analise: dataVal.analise,
                resultadoBonif: dataVal.resultadoBonif
            });
        });
    });
    if (flatVerif.length > 0) {
        await supabaseClient.from('verificacoes').insert(flatVerif);
    }
}

function loadLocalFallback() {
    if (!localStorage.getItem('radar_pdde_escolas')) {
        localStorage.setItem('radar_pdde_escolas', JSON.stringify(INITIAL_ESCOLAS));
        localStorage.setItem('radar_pdde_pendencias', JSON.stringify(INITIAL_PENDENCIAS));
        localStorage.setItem('radar_pdde_contatos', JSON.stringify(INITIAL_CONTATOS));
        localStorage.setItem('radar_pdde_logs', JSON.stringify(INITIAL_LOGS));
        localStorage.setItem('radar_pdde_bens', JSON.stringify(INITIAL_BENS));
        localStorage.setItem('radar_pdde_verificacoes', JSON.stringify(INITIAL_VERIFICACOES));
        localStorage.setItem('radar_pdde_config', JSON.stringify(INITIAL_CONFIG));
        localStorage.setItem('radar_pdde_programas', JSON.stringify(INITIAL_PROGRAMS));
    }
    if (!localStorage.getItem('radar_pdde_controladores')) {
        localStorage.setItem('radar_pdde_controladores', JSON.stringify(INITIAL_CONTROLADORES));
    }
    if (!localStorage.getItem('radar_pdde_equipe_inventario')) {
        const INITIAL_EQUIPE_INVENTARIO = [
            { id: 'inv_1', name: 'Jorge Oliveira', email: 'jorge.oliveira@sme.rj.gov.br' },
            { id: 'inv_2', name: 'Patrícia Souza', email: 'patricia.souza@sme.rj.gov.br' }
        ];
        localStorage.setItem('radar_pdde_equipe_inventario', JSON.stringify(INITIAL_EQUIPE_INVENTARIO));
    }
    if (!localStorage.getItem('radar_pdde_notas_registradas')) {
        localStorage.setItem('radar_pdde_notas_registradas', JSON.stringify([]));
    }
    
    const storedEscolas = JSON.parse(localStorage.getItem('radar_pdde_escolas'));
    escolas = normalizeEscolas(storedEscolas);
    let schoolsMigrated = JSON.stringify(storedEscolas) !== JSON.stringify(escolas);
    escolas.forEach(e => {
        if (e.cre === '1ª CRE' || e.cre === '1\u00aa CRE') {
            e.cre = '4ª CRE';
            schoolsMigrated = true;
        }
    });
    if (schoolsMigrated) {
        localStorage.setItem('radar_pdde_escolas', JSON.stringify(escolas));
    }
    pendencias = JSON.parse(localStorage.getItem('radar_pdde_pendencias'));
    contatos = JSON.parse(localStorage.getItem('radar_pdde_contatos'));
    logs = JSON.parse(localStorage.getItem('radar_pdde_logs'));
    bens = JSON.parse(localStorage.getItem('radar_pdde_bens'));
    verificacoes = JSON.parse(localStorage.getItem('radar_pdde_verificacoes'));
    config = JSON.parse(localStorage.getItem('radar_pdde_config'));
    programas = JSON.parse(localStorage.getItem('radar_pdde_programas'));
    controladores = JSON.parse(localStorage.getItem('radar_pdde_controladores') || '[]');
    equipeInventario = JSON.parse(localStorage.getItem('radar_pdde_equipe_inventario') || '[]');
    notasRegistradas = JSON.parse(localStorage.getItem('radar_pdde_notas_registradas') || '[]');
    
    activeCompetenciaKey = config.competenciaFechamento;
}

function persist(changedTable = null) {
    // 1. Salvar na LocalStorage
    localStorage.setItem('radar_pdde_escolas', JSON.stringify(escolas));
    localStorage.setItem('radar_pdde_pendencias', JSON.stringify(pendencias));
    localStorage.setItem('radar_pdde_contatos', JSON.stringify(contatos));
    localStorage.setItem('radar_pdde_logs', JSON.stringify(logs));
    localStorage.setItem('radar_pdde_bens', JSON.stringify(bens));
    localStorage.setItem('radar_pdde_verificacoes', JSON.stringify(verificacoes));
    localStorage.setItem('radar_pdde_config', JSON.stringify(config));
    localStorage.setItem('radar_pdde_programas', JSON.stringify(programas));
    localStorage.setItem('radar_pdde_controladores', JSON.stringify(controladores));
    localStorage.setItem('radar_pdde_equipe_inventario', JSON.stringify(equipeInventario));
    localStorage.setItem('radar_pdde_notas_registradas', JSON.stringify(notasRegistradas));

    // 2. Sincronizar com Supabase em segundo plano
    if (supabaseClient) {
        if (changedTable) {
            persistSingleTableSupabase(changedTable);
        } else {
            persistSingleTableSupabase('escolas');
            persistSingleTableSupabase('pendencias');
            persistSingleTableSupabase('contatos');
            persistSingleTableSupabase('logs');
            persistSingleTableSupabase('bens');
            persistSingleTableSupabase('verificacoes');
            persistSingleTableSupabase('config');
            persistSingleTableSupabase('controladores');
            persistSingleTableSupabase('equipe_inventario');
            persistSingleTableSupabase('notas_registradas');
        }
    }
}

async function persistSingleTableSupabase(tableName) {
    try {
        if (tableName === 'escolas') {
            await supabaseClient.from('escolas').upsert(escolas);
        } else if (tableName === 'pendencias') {
            await supabaseClient.from('pendencias').upsert(pendencias);
        } else if (tableName === 'contatos') {
            await supabaseClient.from('contatos').upsert(contatos);
        } else if (tableName === 'logs') {
            await supabaseClient.from('logs').upsert(logs);
        } else if (tableName === 'bens') {
            await supabaseClient.from('bens').upsert(bens);
        } else if (tableName === 'config') {
            await supabaseClient.from('config').upsert({
                id: 'global',
                exercicios: config.exercicios,
                competenciaFechamento: config.competenciaFechamento,
                prazoBonificacaoProrrogado: config.prazoBonificacaoProrrogado
            });
        } else if (tableName === 'controladores') {
            await supabaseClient.from('controladores').upsert(controladores);
        } else if (tableName === 'equipe_inventario') {
            await supabaseClient.from('equipe_inventario').upsert(equipeInventario);
        } else if (tableName === 'notas_registradas') {
            await supabaseClient.from('notas_registradas').upsert(notasRegistradas);
        } else if (tableName === 'verificacoes') {
            const flatVerif = [];
            Object.keys(verificacoes).forEach(escId => {
                Object.keys(verificacoes[escId]).forEach(compKey => {
                    const partes = compKey.split('_');
                    const competencia = partes[0];
                    const programaId = partes[1] || 'BASIC';
                    const dataVal = verificacoes[escId][compKey];
                    flatVerif.push({
                        id: `${escId}_${competencia}_${programaId}`,
                        escolaId: escId,
                        competencia: competencia,
                        programaId: programaId,
                        bonificacao: dataVal.bonificacao,
                        analise: dataVal.analise,
                        resultadoBonif: dataVal.resultadoBonif
                    });
                });
            });
            if (flatVerif.length > 0) {
                await supabaseClient.from('verificacoes').upsert(flatVerif);
            }
        }
    } catch (err) {
        console.error("Erro na sincronização síncrona com Supabase para", tableName, err);
    }
}

function registerLog(acao, detalhes) {
    const userMap = {
        'controlador': { name: 'Carlos Souza', role: 'Controlador' },
        'assistente': { name: 'Sandra Pires', role: 'Assistente de Verbas Federais' },
        'sme': { name: 'Alberto Magno', role: 'SME' },
        'inventario': { name: 'Jorge Oliveira', role: 'Equipe de Inventário' }
    };
    const user = userMap[currentProfile];
    const newLog = {
        id: 'log-' + Date.now(),
        usuario: user.name,
        perfil: user.role,
        dataHora: new Date().toISOString(),
        acao: acao,
        detalhes: detalhes
    };
    logs.unshift(newLog);
    persist();
}


// ==========================================
// 3. ENGENHARIA DE ALERTAS E AÇÕES RÁPIDAS
// ==========================================

function getAlerts() {
    const alerts = [];
    const now = new Date();
    
    // Alerta 1: Pendências abertas há mais de 10 dias (permanecem até serem resolvidas)
    pendencias.forEach(p => {
        if (p.status === 'Aberta') {
            // Achar último contato dessa pendência para exibição
            const pContatos = contatos.filter(c => c.pendenciaId === p.id);
            let lastDate = new Date(p.dataAbertura);
            if (pContatos.length > 0) {
                const dates = pContatos.map(c => new Date(c.dataAtendimento));
                lastDate = new Date(Math.max.apply(null, dates));
            }
            const diffDays = Math.ceil((now - new Date(p.dataAbertura)) / (1000 * 60 * 60 * 24));
            if (diffDays > 10) {
                const esc = escolas.find(e => e.id === p.escolaId);
                const pData = getFormattedPendencyData(p);
                const ctrl = esc ? controladores.find(c => c.id === esc.controladorId) : null;
                const ctrlText = ctrl ? ctrl.name : 'Não designado';
                const desigText = esc ? esc.designação : '';
                const timeLabel = pContatos.length > 0 
                    ? `Último contato em ${lastDate.toLocaleDateString('pt-BR')}` 
                    : `Aberta em ${new Date(p.dataAbertura).toLocaleDateString('pt-BR')}`;
                alerts.push({
                    id: 'stale-' + p.id,
                    type: 'danger',
                    text: `Pendência (${pData.item}) de ${esc ? esc.denominação : 'Escola'} (${desigText} | Resp: ${ctrlText}) aberta há ${diffDays} dias!`,
                    time: timeLabel,
                    action: () => openSchoolVerification(p.escolaId, p.competencia)
                });
            }
        }
    });

    // Alerta 2: Bens de capital não encaminhados por falta de Nota ou Processo de Inventário
    bens.forEach(b => {
        if (b.status === 'Não encaminhada') {
            const esc = escolas.find(e => e.id === b.escolaId);
            const faltaNF = !b.notaFiscal;
            const faltaProc = esc ? !esc.processoInventario : true;
            if (faltaNF || faltaProc) {
                const ctrl = esc ? controladores.find(c => c.id === esc.controladorId) : null;
                const ctrlText = ctrl ? ctrl.name : 'Não designado';
                const desigText = esc ? esc.designação : '';
                alerts.push({
                    id: 'capital-' + b.id,
                    type: 'warning',
                    text: `Aquisição de capital em ${esc ? esc.denominação : 'Escola'} (${desigText} | Resp: ${ctrlText}) não encaminhada: ${faltaNF ? 'Falta Nota Fiscal' : ''}${faltaNF && faltaProc ? ' e ' : ''}${faltaProc ? 'Falta Processo de Inventário' : ''}.`,
                    time: `Pendente de verificação interna`,
                    action: () => openSchoolVerification(b.escolaId, b.competencia)
                });
            }
        }
    });

    // Alerta 3: Se perfil é controlador/assistente, mostrar análises de programa sem bonificação preenchida
    if (currentProfile === 'controlador' || currentProfile === 'assistente') {
        const targetControlador = currentProfile === 'controlador' ? 'carlos' : null;
        escolas.forEach(esc => {
            if (!targetControlador || esc.controladorId === targetControlador) {
                // Verificar se o monitoramento já começou para essa escola nesta competência
                if (isCompetenceInScope(esc.competenciaInicial, activeCompetenciaKey)) {
                    esc.programasIds.forEach(progId => {
                        const compProgKey = `${activeCompetenciaKey}_${progId}`;
                        const v = verificacoes[esc.id]?.[compProgKey];
                        const prog = programas.find(p => p.id === progId);
                        if (!v || !v.bonificacao || Object.keys(v.bonificacao).length === 0) {
                            const ctrl = esc ? controladores.find(c => c.id === esc.controladorId) : null;
                            const ctrlText = ctrl ? ctrl.name : 'Não designado';
                            const desigText = esc ? esc.designação : '';
                            alerts.push({
                                id: `nobonif-${esc.id}-${progId}`,
                                type: 'info',
                                text: `Bonificação de ${esc.denominação} (${desigText} | Resp: ${ctrlText}) para o programa ${prog ? prog.name : progId} na competência ${activeCompetenciaKey} não registrada.`,
                                time: `Janela de fechamento ativa`,
                                action: () => openSchoolVerification(esc.id, activeCompetenciaKey)
                            });
                        }
                    });
                }
            }
        });
    }

    return alerts;
}

function updateAlertsBell() {
    const list = getAlerts();
    const countEl = document.getElementById('alerts-count');
    const dropCountEl = document.getElementById('alerts-dropdown-count');
    const listContainer = document.getElementById('alerts-list');
    
    countEl.innerText = list.length;
    dropCountEl.innerText = list.length;
    
    if (list.length === 0) {
        listContainer.innerHTML = `<div class="alert-empty">Nenhum alerta pendente. Operação em dia!</div>`;
        return;
    }
    
    listContainer.innerHTML = list.map(a => `
        <div class="alert-item alert-${a.type}" onclick="handleAlertClick('${a.id}')">
            <div class="alert-icon">
                ${a.type === 'danger' ? `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                ` : a.type === 'warning' ? `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                ` : `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                `}
            </div>
            <div class="alert-content">
                <div class="alert-text">${a.text}</div>
                <div class="alert-time">${a.time}</div>
            </div>
        </div>
    `).join('');
}

function handleAlertClick(alertId) {
    const alerts = getAlerts();
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
        alert.action();
        document.getElementById('alerts-dropdown').classList.remove('show');
    }
}

// Helpers para abrir seções específicas do Prontuário a partir do Alerta
function openSchoolTimeline(schoolId, compKey = null) {
    activeSchoolId = schoolId;
    if (compKey) {
        activeProntuarioCompetencia = compKey;
    }
    switchView('prontuario');
    setTimeout(() => {
        const tab = document.querySelector('[data-tab="contatos"]');
        if (tab) tab.click();
    }, 100);
}

function openSchoolCapital(schoolId, compKey = null) {
    activeSchoolId = schoolId;
    if (compKey) {
        activeProntuarioCompetencia = compKey;
    }
    switchView('prontuario');
    setTimeout(() => {
        const tab = document.querySelector('[data-tab="capital"]');
        if (tab) tab.click();
    }, 100);
}

function openSchoolVerification(schoolId, compKey = null) {
    activeSchoolId = schoolId;
    if (compKey) {
        activeProntuarioCompetencia = compKey;
    }
    switchView('prontuario');
    setTimeout(() => {
        const tab = document.querySelector('[data-tab="verificacoes"]');
        if (tab) tab.click();
    }, 100);
}


// ==========================================
// 4. MUDANÇA DE PERFIS E NAVEGAÇÃO
// ==========================================

function switchProfile(profile) {
    currentProfile = profile;
    activeControladorSubFilter = 'all';
    activeInventarioSubFilter = 'all';
    activeAssistenteSubFilter = 'all';
    activeAssistenteControllerFilter = 'all';
    activeAssistenteRAFilter = 'all';
    activeAssistenteSearchQuery = '';
    activeSMECreFilter = null;
    document.getElementById('profile-btn-label').innerText = {
        'controlador': 'Controlador',
        'assistente': 'Assistente de Verbas Federais',
        'sme': 'SME (Gestão)',
        'inventario': 'Equipe de Inventário'
    }[profile];
    
    // Atualiza badge de perfil ativo no sidebar
    const nameEl = document.getElementById('current-user-name');
    const roleEl = document.getElementById('current-user-role');
    const avatarEl = document.getElementById('current-avatar');
    
    if (profile === 'controlador') {
        nameEl.innerText = 'Carlos Souza';
        roleEl.innerText = 'Controlador';
        avatarEl.innerText = 'C';
    } else if (profile === 'assistente') {
        nameEl.innerText = 'Sandra Pires';
        roleEl.innerText = 'Assistente CRE';
        avatarEl.innerText = 'S';
    } else if (profile === 'sme') {
        nameEl.innerText = 'Alberto Magno';
        roleEl.innerText = 'SME';
        avatarEl.innerText = 'A';
    } else if (profile === 'inventario') {
        nameEl.innerText = 'Jorge Oliveira';
        roleEl.innerText = 'Inventariador';
        avatarEl.innerText = 'J';
    }

    // Exibe ou oculta navegação de Parâmetros SME
    const smeGroup = document.getElementById('nav-sme-group');
    if (profile === 'sme') {
        smeGroup.style.display = 'block';
    } else {
        smeGroup.style.display = 'none';
        if (currentView === 'sme-config') {
            currentView = 'dashboard';
        }
    }
    
    // Ajusta links no Sidebar para perfil inventario
    const navCompetencias = document.getElementById('nav-competencias');
    const navPendencias = document.getElementById('nav-pendencias');
    const navAuditoria = document.getElementById('nav-auditoria');
    
    if (profile === 'inventario') {
        if (navCompetencias) navCompetencias.style.display = 'none';
        if (navPendencias) navPendencias.style.display = 'none';
        if (navAuditoria) navAuditoria.style.display = 'none';
        if (['competencias', 'pendencias', 'auditoria'].includes(currentView)) {
            currentView = 'dashboard';
        }
    } else {
        if (navCompetencias) navCompetencias.style.display = 'flex';
        if (navPendencias) navPendencias.style.display = 'flex';
        if (navAuditoria) navAuditoria.style.display = 'flex';
    }
    
    // Ajusta link de equipe para perfil assistente
    const navEquipe = document.getElementById('nav-equipe');
    if (profile === 'assistente') {
        if (navEquipe) navEquipe.style.display = 'flex';
    } else {
        if (navEquipe) navEquipe.style.display = 'none';
        if (currentView === 'equipe') {
            currentView = 'dashboard';
        }
    }
    
    // Fechar Dropdown
    document.getElementById('profile-dropdown').classList.remove('show');
    
    // Fechar menu ativo de perfil no switcher
    document.querySelectorAll('.profile-option').forEach(el => el.classList.remove('active'));
    document.getElementById(`prof-opt-${profile}`).classList.add('active');

    // Forçar re-render da tela ativa
    switchView(currentView);
    updateAlertsBell();
}

function switchView(view, param = null) {
    currentView = view;
    
    // Atualiza links no Sidebar
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navItem = document.getElementById(`nav-${view}`);
    if (navItem) navItem.classList.add('active');
    
    if (view === 'prontuario') {
        if (param) {
            if (activeSchoolId !== param) activeProntuarioCompetencia = null;
            activeSchoolId = param;
        }
        renderProntuario(activeSchoolId);
    } else {
        activeSchoolId = null;
        if (view === 'dashboard') renderDashboard();
        else if (view === 'escolas') renderEscolas();
        else if (view === 'competencias') renderCompetencias();
        else if (view === 'pendencias') renderPendencias();
        else if (view === 'inventario') renderInventarioView();
        else if (view === 'auditoria') renderAuditoria();
        else if (view === 'sme-config') renderSMEConfig();
        else if (view === 'equipe') renderEquipe();
    }
}

function toggleProfileDropdown(e) {
    e.stopPropagation();
    document.getElementById('profile-dropdown').classList.toggle('show');
    document.getElementById('alerts-dropdown').classList.remove('show');
}

function toggleAlertsDropdown(e) {
    e.stopPropagation();
    document.getElementById('alerts-dropdown').classList.toggle('show');
    document.getElementById('profile-dropdown').classList.remove('show');
}

// Fechar dropdowns ao clicar fora
window.addEventListener('click', () => {
    document.getElementById('profile-dropdown').classList.remove('show');
    document.getElementById('alerts-dropdown').classList.remove('show');
});


// ==========================================
// 5. REGRA OPERACIONAL: ESCOPO DE COMPETÊNCIA
// ==========================================

function isCompetenceInScope(inicioMonitoramento, competenciaAtual) {
    if (!inicioMonitoramento) return true;
    return competenciaAtual >= inicioMonitoramento;
}

function getRAFromDesignacao(designacao) {
    if (!designacao) return '4ª CRE - Geral';
    const partes = designacao.split('.');
    if (partes.length < 2) return '4ª CRE - Geral';
    const raNum = partes[1];
    if (raNum === '10') return '10ª R.A.';
    if (raNum === '11') return '11ª R.A.';
    if (raNum === '30') return '30ª R.A.';
    if (raNum === '31') return '31ª R.A.';
    return `${parseInt(raNum)}ª R.A.`;
}

function getEscolasStats(escolasList, compKey) {
    let apto = 0;
    let inapto = 0;
    let emAndamento = 0;
    let naoAnalisado = 0; // Análise de programa não vista
    let foraEscopo = 0;
    
    const aptoList = [];
    const inaptoList = [];
    const emAndamentoList = [];
    const naoAnalisadoList = [];

    escolasList.forEach(e => {
        // Se possui pendências ou verificações lançadas neste mês/escola, o mês está ativo independente da data de início
        const hasPendencies = pendencias.some(p => p.escolaId === e.id && p.competencia === compKey);
        let hasVerifications = false;
        if (verificacoes[e.id]) {
            hasVerifications = Object.keys(verificacoes[e.id]).some(k => k.startsWith(compKey));
        }
        const forceInScope = hasPendencies || hasVerifications;

        if (!forceInScope && !isCompetenceInScope(e.competenciaInicial, compKey)) {
            foraEscopo++;
            return;
        }
        
        // Iterar sobre cada programa da escola
        e.programasIds.forEach(progId => {
            const compProgKey = `${compKey}_${progId}`;
            const v = verificacoes[e.id]?.[compProgKey];
            
            // Referência dinâmica contendo dados da escola e o programa associado
            const schoolProgRef = {
                ...e,
                programaId: progId,
                compProgKey: compProgKey
            };

            if (!v || !v.bonificacao || Object.keys(v.bonificacao).length === 0) {
                naoAnalisado++;
                naoAnalisadoList.push(schoolProgRef);
                return;
            }

            const analiseVals = Object.values(v.analise);
            const temIncorreto = analiseVals.includes('Incorreto');
            
            if (v.resultadoBonif === 'inapta' || temIncorreto) {
                inapto++;
                inaptoList.push(schoolProgRef);
            } else if (v.resultadoBonif === 'apta' || (analiseVals.every(x => x === 'Correto' || x === 'Correto (Atrasado)') && !analiseVals.includes('Não analisado'))) {
                apto++;
                aptoList.push(schoolProgRef);
            } else {
                emAndamento++;
                emAndamentoList.push(schoolProgRef);
            }
        });
    });

    return {
        apto,
        inapto,
        emAndamento,
        naoAnalisado,
        foraEscopo,
        lists: {
            apto: aptoList,
            inapto: inaptoList,
            emAndamento: emAndamentoList,
            naoAnalisado: naoAnalisadoList
        }
    };
}


// ==========================================
// 6. BUSCA INTELIGENTE GLOBAL
// ==========================================

function handleGlobalSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
        searchResultFiltered = null;
        if (currentView === 'escolas') renderEscolas();
        return;
    }
    
    // Função para remover acentos para busca insensível
    const removeAccents = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cleanQuery = removeAccents(query);
    
    searchResultFiltered = escolas.filter(esc => {
        const cNome = removeAccents(esc.denominação.toLowerCase());
        const cDiretor = removeAccents(esc.diretor.toLowerCase());
        const cInep = esc.inep;
        const cCnpj = esc.cnpj.replace(/\D/g, "");
        const cDesignacao = esc.designação.toLowerCase();
        const cProcesso = esc.processoInventario.toLowerCase();
        
        return cNome.includes(cleanQuery) || 
               cDiretor.includes(cleanQuery) || 
               cInep.includes(cleanQuery) || 
               cCnpj.includes(cleanQuery.replace(/\D/g, "")) || 
               cDesignacao.includes(cleanQuery) ||
               cProcesso.includes(cleanQuery);
    });

    if (currentView !== 'escolas') {
        switchView('escolas');
    } else {
        renderEscolas();
    }
}


// ==========================================
// 7. RENDER DA TELA: DASHBOARDS
// ==========================================

function renderDashboard() {
    const container = document.getElementById('main-container');
    
    if (currentProfile === 'controlador') {
        renderDashboardControlador(container);
    } else if (currentProfile === 'assistente') {
        renderDashboardAssistente(container);
    } else if (currentProfile === 'sme') {
        renderDashboardSME(container);
    } else if (currentProfile === 'inventario') {
        renderDashboardInventario(container);
    }
}

// 7.1 Dashboard do Controlador
function renderDashboardControlador(container) {
    const filterRa = activeControladorRAFilter;
    let targetEscolas = [];
    
    if (filterRa === 'carteira') {
        targetEscolas = escolas.filter(e => e.controladorId === 'carlos');
    } else if (filterRa === 'todas') {
        targetEscolas = escolas;
    } else {
        targetEscolas = escolas.filter(e => {
            const partes = e.designação.split('.');
            return partes.length >= 2 && partes[1] === filterRa;
        });
    }

    const targetIds = targetEscolas.map(e => e.id);
    
    // Contagem de pendências ativas das escolas do filtro
    const pAtivas = pendencias.filter(p => targetIds.includes(p.escolaId) && p.status === 'Aberta');
    
    // Contagem de bens não encaminhados
    const bPendentes = bens.filter(b => targetIds.includes(b.escolaId) && b.status === 'Não encaminhada');
    
    // Listas filtradas auxiliares para sub-filtros
    const escolasNaoAnalisadas = targetEscolas.filter(e => {
        if (!isCompetenceInScope(e.competenciaInicial, activeCompetenciaKey)) return false;
        return e.programasIds.some(progId => {
            const compProgKey = `${activeCompetenciaKey}_${progId}`;
            const v = verificacoes[e.id]?.[compProgKey];
            return !v || !v.bonificacao || Object.keys(v.bonificacao).length === 0;
        });
    });

    const escolasComPendencias = targetEscolas.filter(e => {
        return pendencias.some(p => p.escolaId === e.id && p.status === 'Aberta');
    });

    const escolasComBensPendentes = targetEscolas.filter(e => {
        return bens.some(b => b.escolaId === e.id && b.status === 'Não encaminhada');
    });

    // Calcular estatísticas da carteira filtrada usando getEscolasStats
    const cStats = getEscolasStats(targetEscolas, activeCompetenciaKey);
    const naoAnalisadasCount = cStats.naoAnalisado;

    // Aplicar sub-filtro na lista de escolas a renderizar
    let renderedEscolas = [...targetEscolas];
    let subFilterLabel = '';
    if (activeControladorSubFilter === 'naoAnalisadas') {
        renderedEscolas = escolasNaoAnalisadas;
        subFilterLabel = ' (Filtrado: Não Analisadas)';
    } else if (activeControladorSubFilter === 'pendencias') {
        renderedEscolas = escolasComPendencias;
        subFilterLabel = ' (Filtrado: Com Pendências Abertas)';
    } else if (activeControladorSubFilter === 'bens') {
        renderedEscolas = escolasComBensPendentes;
        subFilterLabel = ' (Filtrado: Com Bens Não Encaminhados)';
    }

    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Painel do Controlador</h1>
                <p>Suas R.As designadas: <strong>10ª R.A.</strong> e <strong>11ª R.A.</strong>. Você pode navegar por outras R.As ou pesquisar na CRE.</p>
            </div>
            <div class="badge badge-info">Mês Ativo: ${COMPETENCIAS.find(c => c.key === activeCompetenciaKey).label}</div>
        </div>

        <div class="tab-container" style="margin-bottom: 20px;">
            <button class="tab-button ${filterRa === 'carteira' ? 'active' : ''}" onclick="changeControladorRAFilter('carteira')">Minha Carteira (Carlos)</button>
            <button class="tab-button ${filterRa === '10' ? 'active' : ''}" onclick="changeControladorRAFilter('10')">10ª R.A.</button>
            <button class="tab-button ${filterRa === '11' ? 'active' : ''}" onclick="changeControladorRAFilter('11')">11ª R.A.</button>
            <button class="tab-button ${filterRa === '30' ? 'active' : ''}" onclick="changeControladorRAFilter('30')">30ª R.A.</button>
            <button class="tab-button ${filterRa === '31' ? 'active' : ''}" onclick="changeControladorRAFilter('31')">31ª R.A.</button>
            <button class="tab-button ${filterRa === 'todas' ? 'active' : ''}" onclick="changeControladorRAFilter('todas')">Todas da CRE</button>
        </div>

        <div class="grid-stats">
            <div class="card-stat ${activeControladorSubFilter === 'all' ? 'active-all' : ''}" style="cursor: pointer;" onclick="changeControladorSubFilter('all')">
                <div class="stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                </div>
                <div class="stat-label">Escolas no Filtro</div>
                <div class="stat-value">${targetEscolas.length} Unidades</div>
            </div>
            <div class="card-stat ${activeControladorSubFilter === 'naoAnalisadas' ? 'active-naoAnalisadas' : ''}" style="cursor: pointer;" onclick="changeControladorSubFilter('naoAnalisadas')">
                <div class="stat-icon" style="background-color: var(--warning-bg); color: var(--warning);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
                <div class="stat-label">Não Analisadas (${activeCompetenciaKey})</div>
                <div class="stat-value">${escolasNaoAnalisadas.length} Escolas</div>
            </div>
            <div class="card-stat ${activeControladorSubFilter === 'pendencias' ? 'active-pendencias' : ''}" style="cursor: pointer;" onclick="changeControladorSubFilter('pendencias')">
                <div class="stat-icon" style="background-color: var(--danger-bg); color: var(--danger);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>
                </div>
                <div class="stat-label">Pendências Abertas</div>
                <div class="stat-value">${escolasComPendencias.length} Escolas</div>
            </div>
            <div class="card-stat ${activeControladorSubFilter === 'bens' ? 'active-bens' : ''}" style="cursor: pointer;" onclick="changeControladorSubFilter('bens')">
                <div class="stat-icon" style="background-color: var(--info-bg); color: var(--info);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <div class="stat-label">Bens Não Encaminhados</div>
                <div class="stat-value">${escolasComBensPendentes.length} Escolas</div>
            </div>
        </div>

        <div class="dash-layout">
            <!-- Coluna Esquerda: Listagem de Unidades -->
            <div>
                <div class="panel-card">
                    <div class="panel-header">
                        <h2>Lista de Escolas - Visualização: ${filterRa === 'carteira' ? 'Minha Carteira' : filterRa === 'todas' ? 'Todas da CRE' : `${filterRa}ª R.A.`}${subFilterLabel}</h2>
                    </div>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Unidade Escolar</th>
                                    <th>INEP</th>
                                    <th>Contatos</th>
                                    <th>Bonificação (${activeCompetenciaKey})</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${renderedEscolas.length === 0 ? `
                                    <tr>
                                        <td colspan="5" style="text-align:center; color:var(--text-muted); padding:32px;">Nenhuma escola encontrada com este filtro!</td>
                                    </tr>
                                ` : renderedEscolas.map(e => {
                                    let statusHTML = '';
                                    e.programasIds.forEach(progId => {
                                        const compProgKey = `${activeCompetenciaKey}_${progId}`;
                                        const v = verificacoes[e.id]?.[compProgKey];
                                        const prog = programas.find(p => p.id === progId);
                                        const progName = prog ? prog.name : progId;
                                        
                                        let progBadge = `<span class="badge badge-gray" style="font-size:0.65rem; padding: 2px 4px; font-weight:500;">Não Analisada</span>`;
                                        if (v) {
                                            const analiseVals = Object.values(v.analise);
                                            const temIncorreto = analiseVals.includes('Incorreto');
                                            
                                            if (v.resultadoBonif === 'inapta' || temIncorreto) {
                                                progBadge = `<span class="badge badge-danger" style="font-size:0.65rem; padding: 2px 4px; font-weight:500;">Inapta</span>`;
                                            } else if (v.resultadoBonif === 'apta' || (analiseVals.every(x => x === 'Correto' || x === 'Correto (Atrasado)') && !analiseVals.includes('Não analisado'))) {
                                                progBadge = `<span class="badge badge-success" style="font-size:0.65rem; padding: 2px 4px; font-weight:500;">Apta</span>`;
                                            } else {
                                                progBadge = `<span class="badge badge-warning" style="font-size:0.65rem; padding: 2px 4px; font-weight:500;">Em Andamento</span>`;
                                            }
                                        }
                                        statusHTML += `<div style="margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                                            <span style="font-size:0.75rem; font-weight:500; color:var(--text-muted);">${progName}:</span>
                                            ${progBadge}
                                        </div>`;
                                    });
                                    
                                    const cCount = contatos.filter(c => c.escolaId === e.id).length;
                                    const ctrl = controladores.find(c => c.id === e.controladorId);
                                    
                                    const ctrlLabel = e.controladorId === 'carlos'
                                        ? `<span class="badge badge-info" style="font-size:0.65rem; padding: 2px 4px; font-weight:500;">Sua Carteira</span>`
                                        : `<span style="font-size:0.75rem; color:var(--text-muted);">Controlador: ${ctrl ? ctrl.name : 'Sem designação'}</span>`;

                                    return `
                                        <tr>
                                            <td>
                                                <strong>${e.denominação}</strong><br>
                                                <small style="color:var(--text-muted)">${e.designação} • ${getRAFromDesignacao(e.designação)}</small><br>
                                                ${ctrlLabel}
                                            </td>
                                            <td>${e.inep}</td>
                                            <td><span class="badge badge-info">${cCount} Contatos</span></td>
                                            <td>${statusHTML}</td>
                                            <td>
                                                <button class="btn btn-secondary btn-sm" onclick="switchView('prontuario', '${e.id}')">Ver Unidade</button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Coluna Direita: Alertas Relacionados -->
            <div>
                <div class="panel-card">
                    <div class="panel-header">
                        <h2>Gargalos de Trabalho (Pendências no Filtro)</h2>
                    </div>
                    <div id="controlador-gargalos">
                        <!-- Será preenchido por alertas locais filtrados -->
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Injetar os alertas do controlador no painel lateral com base nas escolas filtradas
    const gargalosEl = document.getElementById('controlador-gargalos');
    const localAlerts = getAlerts().filter(a => {
        const matchSchoolId = targetIds.some(id => a.id.includes(id));
        return matchSchoolId && (a.id.startsWith('stale-') || a.id.startsWith('nobonif-') || a.id.startsWith('capital-'));
    });
    
    if (localAlerts.length === 0) {
        gargalosEl.innerHTML = `<div style="text-align:center; padding: 24px; color:var(--text-muted)">Sem pendências críticas neste filtro! Bom trabalho.</div>`;
    } else {
        gargalosEl.innerHTML = localAlerts.map(a => `
            <div class="contact-card" style="border-left: 3px solid var(--${a.type === 'danger' ? 'danger' : a.type === 'warning' ? 'warning' : 'info'}); margin-bottom: 12px; cursor:pointer;" onclick="handleAlertClick('${a.id}')">
                <div class="contact-meta">
                    <span style="font-weight:700; color:var(--${a.type === 'danger' ? 'danger' : a.type === 'warning' ? 'warning' : 'info'})">${a.type.toUpperCase()}</span>
                    <span>${a.time}</span>
                </div>
                <div class="contact-desc" style="font-size:0.8rem">${a.text}</div>
            </div>
        `).join('');
    }
}

function changeControladorRAFilter(filter) {
    activeControladorRAFilter = filter;
    activeControladorSubFilter = 'all';
    renderDashboard();
}

function changeControladorSubFilter(subFilter) {
    if (activeControladorSubFilter === subFilter) {
        activeControladorSubFilter = 'all';
    } else {
        activeControladorSubFilter = subFilter;
    }
    renderDashboard();
}


function getSchoolAggregateStatus(e, compKey) {
    const status = getCompMonthStatus(e.id, compKey);
    if (status === 'out-of-scope') return 'foraEscopo';
    if (status === 'inapta') return 'inapto';
    if (status === 'apta') return 'apto';
    if (status === 'em-andamento') return 'emAndamento';
    return 'naoAnalisado';
}

function renderDashboardAssistente(container) {
    // Calcular estatísticas agregadas por escola
    const stats = {
        apto: 0,
        inapto: 0,
        emAndamento: 0,
        naoAnalisado: 0,
        foraEscopo: 0
    };
    
    escolas.forEach(e => {
        const aggStatus = getSchoolAggregateStatus(e, activeCompetenciaKey);
        if (aggStatus === 'foraEscopo') stats.foraEscopo++;
        else stats[aggStatus]++;
    });
    
    const totalEscolasValidas = stats.apto + stats.inapto + stats.emAndamento + stats.naoAnalisado;

    // Consolidações por Controlador
    const statsControladores = controladores.map(ctrl => {
        const carteira = escolas.filter(e => e.controladorId === ctrl.id);
        
        let cApto = 0;
        let cInapto = 0;
        let cEmAndamento = 0;
        let cNaoAnalisado = 0;
        let cForaEscopo = 0;
        
        carteira.forEach(e => {
            const aggStatus = getSchoolAggregateStatus(e, activeCompetenciaKey);
            if (aggStatus === 'apto') cApto++;
            else if (aggStatus === 'inapto') cInapto++;
            else if (aggStatus === 'emAndamento') cEmAndamento++;
            else if (aggStatus === 'naoAnalisado') cNaoAnalisado++;
            else if (aggStatus === 'foraEscopo') cForaEscopo++;
        });
        
        const tot = cApto + cInapto + cEmAndamento + cNaoAnalisado;
        const analisadas = cApto + cInapto;
        const faltam = cEmAndamento + cNaoAnalisado;
        const pendentesAtivas = pendencias.filter(p => carteira.map(e => e.id).includes(p.escolaId) && p.status === 'Aberta').length;

        // Montar listas para exibição de escolas pendentes no detalhamento do controlador
        const emAndamentoList = carteira.filter(e => getSchoolAggregateStatus(e, activeCompetenciaKey) === 'emAndamento');
        const naoAnalisadoList = carteira.filter(e => getSchoolAggregateStatus(e, activeCompetenciaKey) === 'naoAnalisado');

        return {
            ...ctrl,
            stats: {
                apto: cApto,
                inapto: cInapto,
                emAndamento: cEmAndamento,
                naoAnalisado: cNaoAnalisado,
                lists: {
                    emAndamento: emAndamentoList,
                    naoAnalisado: naoAnalisadoList
                }
            },
            totalEscolas: carteira.length,
            totalValidos: tot,
            analisadas: analisadas,
            faltam: faltam,
            pendenciasAtivas: pendentesAtivas
        };
    });

    const totalPendentesGeral = pendencias.filter(p => p.status === 'Aberta').length;
    const bensSemEncaminhamento = bens.filter(b => b.status === 'Não encaminhada').length;

    // Calcular escolas filtradas para o visualizador do assistente
    let filteredEscolas = [...escolas];
    if (activeAssistenteSubFilter !== 'all') {
        filteredEscolas = filteredEscolas.filter(e => {
            const aggStatus = getSchoolAggregateStatus(e, activeCompetenciaKey);
            return aggStatus === activeAssistenteSubFilter;
        });
    }
    if (activeAssistenteControllerFilter !== 'all') {
        filteredEscolas = filteredEscolas.filter(e => e.controladorId === activeAssistenteControllerFilter);
    }
    if (activeAssistenteRAFilter !== 'all') {
        filteredEscolas = filteredEscolas.filter(e => {
            const partes = e.designação.split('.');
            return partes.length >= 2 && partes[1] === activeAssistenteRAFilter;
        });
    }
    if (activeAssistenteSearchQuery && activeAssistenteSearchQuery.trim() !== '') {
        const cleanQuery = activeAssistenteSearchQuery.toLowerCase().trim();
        filteredEscolas = filteredEscolas.filter(e => e.denominação.toLowerCase().includes(cleanQuery));
    }

    const escolasListHTML = filteredEscolas.length === 0 
        ? `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:32px;">Nenhuma unidade escolar encontrada neste filtro.</td></tr>`
        : filteredEscolas.map(e => {
            const ctrl = controladores.find(c => c.id === e.controladorId);
            const aggStatus = getSchoolAggregateStatus(e, activeCompetenciaKey);
            let statusText = '';
            let badgeCls = '';
            
            if (aggStatus === 'apto') {
                statusText = 'Apta';
                badgeCls = 'badge-success';
            } else if (aggStatus === 'inapto') {
                statusText = 'Inapta';
                badgeCls = 'badge-danger';
            } else if (aggStatus === 'emAndamento') {
                statusText = 'Em Andamento';
                badgeCls = 'badge-primary';
            } else {
                statusText = 'Não Analisada';
                badgeCls = 'badge-secondary';
            }

            return `
                <tr class="assistente-escola-row" data-escola="${e.denominação.toLowerCase()}">
                    <td><strong>${e.denominação}</strong></td>
                    <td>${e.designação} (${getRAFromDesignacao(e.designação)})</td>
                    <td>${ctrl ? ctrl.name : 'Não designado'}</td>
                    <td><span class="badge ${badgeCls}">${statusText}</span></td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="switchView('prontuario', '${e.id}')">Ver Unidade</button>
                    </td>
                </tr>
            `;
        }).join('');

    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Painel do Assistente de Verbas Federais</h1>
                <p>Gestão operacional da CRE e suporte aos Controladores de carteiras.</p>
            </div>
            <button class="btn btn-primary" onclick="openRedistributionModal()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M17 11l2 2 4-4"></path></svg>
                Redistribuir Escolas
            </button>
        </div>

        <div class="grid-stats">
            <div class="card-stat ${activeAssistenteSubFilter === 'apto' ? 'active-concluido' : ''}" style="cursor: pointer;" onclick="changeAssistenteSubFilter('apto')">
                <div class="stat-icon" style="background-color: var(--success-bg); color: var(--success);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <div class="stat-label">Unidades Aptas (${activeCompetenciaKey})</div>
                <div class="stat-value">${stats.apto} Escolas</div>
            </div>
            <div class="card-stat ${activeAssistenteSubFilter === 'inapto' ? 'active-pendencias' : ''}" style="cursor: pointer;" onclick="changeAssistenteSubFilter('inapto')">
                <div class="stat-icon" style="background-color: var(--danger-bg); color: var(--danger);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                </div>
                <div class="stat-label">Unidades Inaptas (${activeCompetenciaKey})</div>
                <div class="stat-value">${stats.inapto} Escolas</div>
            </div>
            <div class="card-stat ${activeAssistenteSubFilter === 'emAndamento' ? 'active-bens' : ''}" style="cursor: pointer;" onclick="changeAssistenteSubFilter('emAndamento')">
                <div class="stat-icon" style="background-color: rgba(157, 125, 252, 0.1); color: var(--primary);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
                <div class="stat-label">Análise em Andamento</div>
                <div class="stat-value">${stats.emAndamento} Escolas</div>
            </div>
            <div class="card-stat ${activeAssistenteSubFilter === 'naoAnalisado' ? 'active-naoAnalisadas' : ''}" style="cursor: pointer;" onclick="changeAssistenteSubFilter('naoAnalisado')">
                <div class="stat-icon" style="background-color: rgba(255, 255, 255, 0.06); color: var(--text-muted);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </div>
                <div class="stat-label">Não Analisadas (Não vistas)</div>
                <div class="stat-value">${stats.naoAnalisado} Unidades</div>
            </div>
        </div>

        <div class="dash-layout">
            <!-- Esquerda: Produtividade dos Controladores -->
            <div>
                <div class="panel-card">
                    <div class="panel-header">
                        <h2>Acompanhamento por Carteira / Controlador</h2>
                        <span style="font-size:0.75rem; color:var(--text-muted)">Clique na linha do controlador para abrir o detalhamento.</span>
                    </div>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Controlador</th>
                                    <th>Escolas Ativas (Escopo)</th>
                                    <th>Progresso das Análises (${activeCompetenciaKey})</th>
                                    <th>Pendências Abertas</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${statsControladores.map(c => {
                                    const percent = c.totalValidos > 0 ? Math.round((c.analisadas / c.totalValidos) * 100) : 0;
                                    let colorCls = 'danger';
                                    if (percent > 80) colorCls = 'success';
                                    else if (percent > 40) colorCls = 'warning';
                                    
                                    const isExpanded = expandedControllerId === c.id;
                                    const faltamList = [...c.stats.lists.emAndamento, ...c.stats.lists.naoAnalisado];

                                    return `
                                        <tr style="cursor: pointer;" onclick="toggleControllerDetail('${c.id}')" class="tr-hoverABLE ${isExpanded ? 'tr-expanded-active' : ''}">
                                            <td>
                                                <div style="display:flex; align-items:center; gap:8px;">
                                                    <span style="transform: rotate(${isExpanded ? '90' : '0'}deg); transition: transform 0.2s; color: var(--primary);">▶</span>
                                                    <strong>${c.name}</strong>
                                                </div>
                                                <small style="color:var(--text-muted); margin-left: 18px;">${c.email}</small>
                                            </td>
                                            <td>${c.totalValidos} unidades</td>
                                            <td>
                                                <div style="display:flex; align-items:center; gap:8px;">
                                                    <div style="flex-grow:1; height:6px; background:rgba(255,255,255,0.05); border-radius:3px; position:relative;">
                                                        <div style="position:absolute; left:0; top:0; bottom:0; width:${percent}%; background:var(--primary); border-radius:3px;"></div>
                                                    </div>
                                                    <span>${percent}%</span>
                                                </div>
                                            </td>
                                            <td><span class="badge badge-danger">${c.pendenciasAtivas}</span></td>
                                            <td>
                                                <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); toggleControllerDetail('${c.id}')">
                                                    ${isExpanded ? 'Recolher' : 'Detalhamento'}
                                                 </button>
                                            </td>
                                        </tr>
                                        ${isExpanded ? `
                                            <tr class="controller-detail-row">
                                                <td colspan="5">
                                                    <div class="controller-detail-card" style="padding: 16px; background-color: var(--card-bg-hover); border-radius: 8px; border: 1px dashed var(--border-color); margin: 6px 0;">
                                                        <div style="display: grid; grid-template-columns: 1.1fr 1.3fr; gap: 20px;">
                                                            <div>
                                                                <h4 style="margin-bottom: 10px; color: var(--primary); font-size: 0.9rem;">Situação Operacional da Carteira</h4>
                                                                <div style="display:flex; flex-direction:column; gap:8px;">
                                                                    <div style="display:flex; justify-content:space-between; font-size: 0.85rem;">
                                                                        <span><strong>Analisados (Concluídos)</strong></span>
                                                                        <strong>${c.analisadas} de ${c.totalValidos} (${percent}%)</strong>
                                                                    </div>
                                                                    <div style="display:flex; flex-direction:column; gap:6px; margin-left:12px; font-size:0.8rem; color:var(--text-muted)">
                                                                        <div class="hover-filter-row" style="cursor: pointer; padding: 4px 8px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;" onclick="event.stopPropagation(); filterAssistenteByStatusAndController('apto', '${c.id}')">
                                                                            <span>• Aptas</span>
                                                                            <span class="badge badge-success" style="font-size: 0.7rem; padding: 2px 6px;">${c.stats.apto}</span>
                                                                        </div>
                                                                        <div class="hover-filter-row" style="cursor: pointer; padding: 4px 8px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;" onclick="event.stopPropagation(); filterAssistenteByStatusAndController('inapto', '${c.id}')">
                                                                            <span>• Inaptas</span>
                                                                            <span class="badge badge-danger" style="font-size: 0.7rem; padding: 2px 6px;">${c.stats.inapto}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div style="display:flex; justify-content:space-between; font-size: 0.85rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top:8px; margin-top:4px;">
                                                                        <span><strong>Falta Analisar</strong></span>
                                                                        <strong>${c.faltam} de ${c.totalValidos} (${c.totalValidos > 0 ? Math.round((c.faltam / c.totalValidos) * 100) : 0}%)</strong>
                                                                    </div>
                                                                    <div style="display:flex; flex-direction:column; gap:6px; margin-left:12px; font-size:0.8rem; color:var(--text-muted)">
                                                                        <div class="hover-filter-row" style="cursor: pointer; padding: 4px 8px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;" onclick="event.stopPropagation(); filterAssistenteByStatusAndController('emAndamento', '${c.id}')">
                                                                            <span>• Análise em Andamento</span>
                                                                            <span class="badge badge-primary" style="font-size: 0.7rem; padding: 2px 6px;">${c.stats.emAndamento}</span>
                                                                        </div>
                                                                        <div class="hover-filter-row" style="cursor: pointer; padding: 4px 8px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;" onclick="event.stopPropagation(); filterAssistenteByStatusAndController('naoAnalisado', '${c.id}')">
                                                                            <span>• Não Analisadas (Não vistas)</span>
                                                                            <span class="badge badge-secondary" style="font-size: 0.7rem; padding: 2px 6px;">${c.stats.naoAnalisado}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h4 style="margin-bottom: 10px; color: var(--warning); font-size: 0.9rem;">Escolas com Análise Pendente (${c.faltam})</h4>
                                                                ${faltamList.length === 0 ? `
                                                                    <div style="color: var(--success); font-size: 0.85rem; padding: 12px; text-align: center; border: 1px solid rgba(135,212,143,0.1); border-radius: 6px; background-color: rgba(135,212,143,0.02)">
                                                                        <strong>Tudo correto!</strong> Todas as escolas deste controlador foram analisadas.
                                                                    </div>
                                                                ` : `
                                                                    <div style="max-height: 190px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding-right: 4px;">
                                                                        ${faltamList.map(esc => {
                                                                            const isEmAndamento = c.stats.lists.emAndamento.includes(esc);
                                                                            const escStatus = isEmAndamento 
                                                                                 ? `<span class="badge badge-warning" style="font-size:0.65rem; padding: 2px 6px;">Em Andamento</span>` 
                                                                                 : `<span class="badge badge-gray" style="font-size:0.65rem; padding: 2px 6px;">Não Analisada</span>`;
                                                                            const raName = getRAFromDesignacao(esc.designação);
                                                                            return `
                                                                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: rgba(255,255,255,0.02); border-radius: 6px; border: 1px solid rgba(255,255,255,0.03);">
                                                                                    <div style="flex-grow: 1; padding-right: 8px;">
                                                                                        <div style="font-size: 0.8rem; font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 240px;" title="${esc.denominação}">${esc.denominação}</div>
                                                                                        <div style="font-size: 0.7rem; color: var(--text-muted);">${esc.designação} (${raName}) | Resp: ${c.name}</div>
                                                                                    </div>
                                                                                    <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                                                                                        ${escStatus}
                                                                                        <button class="btn btn-secondary btn-sm" style="padding: 2px 8px; font-size: 0.7rem;" onclick="event.stopPropagation(); switchView('prontuario', '${esc.id}')">Ver Unidade</button>
                                                                                    </div>
                                                                                </div>
                                                                            `;
                                                                        }).join('')}
                                                                    </div>
                                                                `}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ` : ''}
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Direita: Gargalos e Alertas de Prazos -->
            <div>
                <div class="panel-card">
                    <div class="panel-header">
                        <h2>Gargalos de Regularização (Pendências Estagnadas)</h2>
                    </div>
                    <div id="assistente-gargalos">
                        <!-- Preenchido via Alertas -->
                    </div>
                </div>
            </div>
        </div>

        <div class="panel-card" style="margin-top: 24px;" id="assistente-visualizador-container">
            <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-bottom: none; padding-bottom: 0;">
                <div>
                    <h2>Visualizador de Unidades Escolares</h2>
                    <p style="font-size:0.8rem; color:var(--text-muted)">
                        Consulte e filtre todas as escolas da CRE e os status de bonificação do mês ativo.
                    </p>
                </div>
                <div>
                    <input type="text" id="assistente-escola-search" class="form-control" placeholder="Buscar unidade por nome..." style="width: 250px; font-size: 0.85rem; padding: 6px 12px; height: auto;" value="${activeAssistenteSearchQuery}" oninput="filterAssistenteEscolas(this.value)">
                </div>
            </div>
            
            <!-- Barra de Filtros Avançados -->
            <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin: 16px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 16px;">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Status de Bonificação</label>
                    <select id="filter-assistente-status" class="form-control" style="width: 180px; font-size: 0.85rem; padding: 6px 12px; height: auto;" onchange="changeAssistenteFilter('status', this.value)">
                        <option value="all" ${activeAssistenteSubFilter === 'all' ? 'selected' : ''}>Todos os Status</option>
                        <option value="apto" ${activeAssistenteSubFilter === 'apto' ? 'selected' : ''}>Apta</option>
                        <option value="inapto" ${activeAssistenteSubFilter === 'inapto' ? 'selected' : ''}>Inapta</option>
                        <option value="emAndamento" ${activeAssistenteSubFilter === 'emAndamento' ? 'selected' : ''}>Em Andamento</option>
                        <option value="naoAnalisado" ${activeAssistenteSubFilter === 'naoAnalisado' ? 'selected' : ''}>Não Analisada</option>
                    </select>
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Controlador</label>
                    <select id="filter-assistente-controlador" class="form-control" style="width: 180px; font-size: 0.85rem; padding: 6px 12px; height: auto;" onchange="changeAssistenteFilter('controlador', this.value)">
                        <option value="all" ${activeAssistenteControllerFilter === 'all' ? 'selected' : ''}>Todos os Controladores</option>
                        ${controladores.map(ctrl => `<option value="${ctrl.id}" ${activeAssistenteControllerFilter === ctrl.id ? 'selected' : ''}>${ctrl.name}</option>`).join('')}
                    </select>
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Região Administrativa (R.A.)</label>
                    <select id="filter-assistente-ra" class="form-control" style="width: 180px; font-size: 0.85rem; padding: 6px 12px; height: auto;" onchange="changeAssistenteFilter('ra', this.value)">
                        <option value="all" ${activeAssistenteRAFilter === 'all' ? 'selected' : ''}>Todas as R.As</option>
                        <option value="10" ${activeAssistenteRAFilter === '10' ? 'selected' : ''}>10ª R.A.</option>
                        <option value="11" ${activeAssistenteRAFilter === '11' ? 'selected' : ''}>11ª R.A.</option>
                        <option value="30" ${activeAssistenteRAFilter === '30' ? 'selected' : ''}>30ª R.A.</option>
                        <option value="31" ${activeAssistenteRAFilter === '31' ? 'selected' : ''}>31ª R.A.</option>
                    </select>
                </div>
                ${(activeAssistenteSubFilter !== 'all' || activeAssistenteControllerFilter !== 'all' || activeAssistenteRAFilter !== 'all' || (activeAssistenteSearchQuery && activeAssistenteSearchQuery.trim() !== '')) ? `
                    <div style="display: flex; align-items: flex-end; padding-top: 18px;">
                        <button class="btn btn-secondary btn-sm" onclick="clearAssistenteFilters()" style="padding: 6px 12px; font-size: 0.8rem; border-color: rgba(255,255,255,0.1);">Limpar Filtros</button>
                    </div>
                ` : ''}
            </div>

            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Unidade Escolar</th>
                            <th>Designação / R.A.</th>
                            <th>Controlador</th>
                            <th>Status de Bonificação</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${escolasListHTML}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const gargalosEl = document.getElementById('assistente-gargalos');
    const staleAlerts = getAlerts().filter(a => a.id.startsWith('stale-') || a.id.startsWith('capital-'));
    if (staleAlerts.length === 0) {
        gargalosEl.innerHTML = `<div style="text-align:center; padding: 24px; color:var(--text-muted)">Sem gargalos de pendências ativas nas carteiras!</div>`;
    } else {
        gargalosEl.innerHTML = staleAlerts.map(a => `
            <div class="contact-card" style="border-left: 3px solid var(--${a.type === 'danger' ? 'danger' : 'warning'}); margin-bottom:12px; cursor:pointer;" onclick="handleAlertClick('${a.id}')">
                <div class="contact-meta">
                    <span style="font-weight:700; color:var(--${a.type === 'danger' ? 'danger' : 'warning'})">${a.type.toUpperCase()}</span>
                    <span>${a.time}</span>
                </div>
                <div class="contact-desc" style="font-size:0.8rem">${a.text}</div>
            </div>
        `).join('');
    }
}

function changeAssistenteSubFilter(subFilter) {
    if (activeAssistenteSubFilter === subFilter) {
        activeAssistenteSubFilter = 'all';
    } else {
        activeAssistenteSubFilter = subFilter;
    }
    renderDashboard();
}

function filterAssistenteEscolas(query) {
    activeAssistenteSearchQuery = query;
    const cleanQuery = query.toLowerCase().trim();
    document.querySelectorAll('.assistente-escola-row').forEach(row => {
        const schoolText = row.getAttribute('data-escola') || '';
        if (schoolText.includes(cleanQuery)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function toggleControllerDetail(ctrlId) {
    expandedControllerId = (expandedControllerId === ctrlId) ? null : ctrlId;
    renderDashboard();
}

function filterAssistenteByStatusAndController(status, controllerId) {
    activeAssistenteSubFilter = status;
    activeAssistenteControllerFilter = controllerId;
    renderDashboard();
    setTimeout(() => {
        const visualizer = document.getElementById('assistente-visualizador-container');
        if (visualizer) {
            visualizer.scrollIntoView({ behavior: 'smooth' });
        }
    }, 100);
}

function changeAssistenteFilter(type, value) {
    if (type === 'status') {
        activeAssistenteSubFilter = value;
    } else if (type === 'controlador') {
        activeAssistenteControllerFilter = value;
    } else if (type === 'ra') {
        activeAssistenteRAFilter = value;
    }
    renderDashboard();
}

function clearAssistenteFilters() {
    activeAssistenteSubFilter = 'all';
    activeAssistenteControllerFilter = 'all';
    activeAssistenteRAFilter = 'all';
    activeAssistenteSearchQuery = '';
    renderDashboard();
}


// 7.3 Dashboard da SME
function renderDashboardSME(container) {
    const stats = getEscolasStats(escolas, activeCompetenciaKey);
    const totalEscolasValidas = stats.apto + stats.inapto + stats.emAndamento + stats.naoAnalisado;

    // Obter lista de CREs únicas nas escolas cadastradas
    const activeSMECreList = [...new Set(escolas.map(e => e.cre || '4ª CRE'))];
    
    // Computar estatísticas por CRE
    const cresStats = activeSMECreList.map(creName => {
        const carteira = escolas.filter(e => e.cre === creName);
        const cStats = getEscolasStats(carteira, activeCompetenciaKey);
        const total = cStats.apto + cStats.inapto + cStats.emAndamento + cStats.naoAnalisado;
        return { name: creName, stats: cStats, total };
    });

    let consolidadoHTML = '';
    if (activeSMECreFilter) {
        const filteredSMEEscolas = escolas.filter(e => e.cre === activeSMECreFilter);
        
        consolidadoHTML = `
            <div class="panel-card" style="margin-top: 20px; animation: slideDown 0.25s ease;">
                <div class="panel-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <div>
                        <h2>Resumo de Itens por Unidade - ${activeSMECreFilter} - Mês: ${COMPETENCIAS.find(c => c.key === activeCompetenciaKey).label}</h2>
                        <p style="font-size:0.8rem; color:var(--text-muted)">Visualização das respostas Sim, Não e N/A que geraram a conformidade das escolas.</p>
                    </div>
                    <input type="text" class="form-control" style="width:250px; font-size:0.8rem;" placeholder="Filtrar por escola..." id="sme-detail-filter" onkeyup="filterSMEDetailTable(this.value)">
                </div>
                <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
                    <table class="data-table" id="sme-detail-table">
                        <thead>
                            <tr>
                                <th>Unidade Escolar</th>
                                <th>Programa</th>
                                <th>Ext. CC</th>
                                <th>Ext. INV</th>
                                <th>N. Fiscais</th>
                                <th>Cons. Assessoria</th>
                                <th>Decl. BB Ágil</th>
                                <th>Enc. Inventário</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredSMEEscolas.map(e => {
                                return e.programasIds.map(progId => {
                                    const compProgKey = `${activeCompetenciaKey}_${progId}`;
                                    const v = verificacoes[e.id]?.[compProgKey];
                                    const prog = programas.find(p => p.id === progId);
                                    const progName = prog ? prog.name : progId;
                                    
                                    let extCC = '-';
                                    let extINV = '-';
                                    let notaFiscal = '-';
                                    let consAssessoria = '-';
                                    let declBBAgil = '-';
                                    let encampInventario = '-';
                                    let statusBadge = '<span class="badge badge-gray">Não Analisada</span>';
                                    
                                    if (v) {
                                        extCC = v.bonificacao['extCC'] || '-';
                                        extINV = v.bonificacao['extINV'] || '-';
                                        notaFiscal = v.bonificacao['notaFiscal'] || '-';
                                        consAssessoria = v.bonificacao['consAssessoria'] || '-';
                                        declBBAgil = v.bonificacao['declBBAgil'] || '-';
                                        encampInventario = v.bonificacao['encampInventario'] || '-';
                                        
                                        const analiseVals = Object.values(v.analise);
                                        const temIncorreto = analiseVals.includes('Incorreto');
                                        
                                        if (v.resultadoBonif === 'inapta' || temIncorreto) {
                                            statusBadge = '<span class="badge badge-danger">Inapta</span>';
                                        } else if (v.resultadoBonif === 'apta' || (analiseVals.every(x => x === 'Correto' || x === 'Correto (Atrasado)') && !analiseVals.includes('Não analisado'))) {
                                            statusBadge = '<span class="badge badge-success">Apta</span>';
                                        } else {
                                            statusBadge = '<span class="badge badge-warning">Em Andamento</span>';
                                        }
                                    }
                                    
                                    const formatVal = (val) => {
                                        if (val === 'Sim') return `<span style="color:var(--success); font-weight:600;">Sim</span>`;
                                        if (val === 'Não') return `<span style="color:var(--danger); font-weight:600;">Não</span>`;
                                        if (val === 'Não se aplica' || val === 'N/A') return `<span style="color:var(--text-muted);">N/A</span>`;
                                        return `<span style="color:var(--text-muted); opacity:0.5;">-</span>`;
                                    };
                                    
                                    return `
                                        <tr class="sme-detail-row" data-escola="${e.denominação.toLowerCase()} ${e.designação.toLowerCase()}">
                                            <td><strong>${e.denominação}</strong><br><small style="color:var(--text-muted)">${e.designação}</small></td>
                                            <td><span class="badge badge-info">${progName}</span></td>
                                            <td>${formatVal(extCC)}</td>
                                            <td>${formatVal(extINV)}</td>
                                            <td>${formatVal(notaFiscal)}</td>
                                            <td>${formatVal(consAssessoria)}</td>
                                            <td>${formatVal(declBBAgil)}</td>
                                            <td>${formatVal(encampInventario)}</td>
                                            <td>${statusBadge}</td>
                                        </tr>
                                    `;
                                }).join('');
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Painel da Subsecretaria (SME)</h1>
                <p>Visão Consolidada InterCRE e Definição de Parâmetros de Exercícios.</p>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <label style="font-size:0.85rem; font-weight:600; color:var(--text-main);">Mês de Referência:</label>
                <select class="form-control" style="width: 150px; font-size: 0.85rem; padding: 6px 12px; height: auto;" onchange="changeSMEMonth(this.value)">
                    ${COMPETENCIAS.map(c => `<option value="${c.key}" ${activeCompetenciaKey === c.key ? 'selected' : ''}>${c.label}</option>`).join('')}
                </select>
            </div>
        </div>

        <div class="grid-stats">
            <div class="card-stat">
                <div class="stat-icon" style="background-color: var(--success-bg); color: var(--success);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <div class="stat-label">Unidades Aptas (${activeCompetenciaKey})</div>
                <div class="stat-value">${stats.apto} Escolas</div>
            </div>
            <div class="card-stat">
                <div class="stat-icon" style="background-color: var(--danger-bg); color: var(--danger);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                </div>
                <div class="stat-label">Unidades Inaptas (${activeCompetenciaKey})</div>
                <div class="stat-value">${stats.inapto} Escolas</div>
            </div>
            <div class="card-stat">
                <div class="stat-icon" style="background-color: rgba(157, 125, 252, 0.1); color: var(--primary);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
                <div class="stat-label">Análise em Andamento</div>
                <div class="stat-value">${stats.emAndamento} Escolas</div>
            </div>
            <div class="card-stat">
                <div class="stat-icon" style="background-color: rgba(255, 255, 255, 0.06); color: var(--text-muted);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </div>
                <div class="stat-label">Não Analisadas (Não vistas)</div>
                <div class="stat-value">${stats.naoAnalisado} Unidades</div>
            </div>
        </div>

        <div class="dash-layout">
            <div class="panel-card">
                <div class="panel-header">
                    <h2>Situação Operacional por Coordenadoria (CRE)</h2>
                    <span style="font-size:0.75rem; color:var(--text-muted)">Clique na linha da CRE para abrir o detalhamento.</span>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Coordenadoria (CRE)</th>
                                <th>Total Escolas Ativas</th>
                                <th>Aptas (${activeCompetenciaKey})</th>
                                <th>Inaptas (${activeCompetenciaKey})</th>
                                <th>Em Andamento</th>
                                <th>Não Analisadas</th>
                                <th>Taxa de Cumprimento (Aptas)</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${cresStats.map(cs => {
                                const percent = cs.total > 0 ? Math.round((cs.stats.apto / cs.total) * 100) : 0;
                                const isExpanded = activeSMECreFilter === cs.name;
                                return `
                                    <tr style="cursor: pointer;" onclick="toggleSMECreFilter('${cs.name}')" class="tr-hoverABLE ${isExpanded ? 'tr-expanded-active' : ''}">
                                        <td>
                                            <div style="display:flex; align-items:center; gap:8px;">
                                                <span style="transform: rotate(${isExpanded ? '90' : '0'}deg); transition: transform 0.2s; color: var(--primary);">▶</span>
                                                <strong>${cs.name} - Coordenadoria Regional</strong>
                                            </div>
                                        </td>
                                        <td>${cs.total} unidades</td>
                                        <td><span style="color:var(--success); font-weight:600;">${cs.stats.apto}</span></td>
                                        <td><span style="color:var(--danger); font-weight:600;">${cs.stats.inapto}</span></td>
                                        <td><span style="color:var(--primary); font-weight:600;">${cs.stats.emAndamento}</span></td>
                                        <td><span style="color:var(--text-muted);">${cs.stats.naoAnalisado}</span></td>
                                        <td>
                                            <strong>${percent}%</strong>
                                        </td>
                                        <td>
                                            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); toggleSMECreFilter('${cs.name}')">
                                                ${isExpanded ? 'Recolher' : 'Detalhamento'}
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="panel-card">
                <div class="panel-header">
                    <h2>Ações Institucionais SME</h2>
                </div>
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <button class="btn btn-secondary" onclick="switchView('sme-config')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                        Parâmetros Globais e Exercícios
                    </button>
                    <button class="btn btn-secondary" onclick="exportDataExcel()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Exportar Planilha de Bonificação
                    </button>
                </div>
            </div>
        </div>

        ${consolidadoHTML}
    `;
}

function toggleSMECreFilter(creName) {
    activeSMECreFilter = (activeSMECreFilter === creName) ? null : creName;
    renderDashboard();
}

function changeSMEMonth(val) {
    activeCompetenciaKey = val;
    renderDashboard();
}

function filterSMEDetailTable(query) {
    const cleanQuery = query.toLowerCase().trim();
    document.querySelectorAll('.sme-detail-row').forEach(row => {
        const schoolText = row.getAttribute('data-escola') || '';
        if (schoolText.includes(cleanQuery)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// 7.4 Dashboard da Equipe de Inventário
function renderDashboardInventario(container) {
    const listBens = bens;
    const aguardando = listBens.filter(b => b.status === 'Encaminhada').length;
    const naoEncamp = listBens.filter(b => b.status === 'Não encaminhada').length;
    const concluido = listBens.filter(b => b.status === 'Inventariada').length;

    let filteredBens = [...listBens];
    if (activeInventarioSubFilter === 'naoEncamp') {
        filteredBens = filteredBens.filter(b => b.status === 'Não encaminhada');
    } else if (activeInventarioSubFilter === 'aguardando') {
        filteredBens = filteredBens.filter(b => b.status === 'Encaminhada');
    } else if (activeInventarioSubFilter === 'concluido') {
        filteredBens = filteredBens.filter(b => b.status === 'Inventariada');
    }

    const orderMap = { 'Não encaminhada': 1, 'Encaminhada': 2, 'Inventariada': 3 };
    const sortedBens = filteredBens.sort((a, b) => orderMap[a.status] - orderMap[b.status]);

    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Painel da Equipe de Inventário</h1>
                <p>Inventariação de bens patrimoniais permanentes adquiridos pelas escolas.</p>
            </div>
        </div>

        <div class="grid-stats">
            <div class="card-stat ${activeInventarioSubFilter === 'naoEncamp' ? 'active-naoEncamp' : ''}" style="cursor: pointer;" onclick="changeInventarioSubFilter('naoEncamp')">
                <div class="stat-icon" style="background-color: var(--danger-bg); color: var(--danger);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
                <div class="stat-label">Sem Encarte / Pendente Verbas Federais</div>
                <div class="stat-value">${naoEncamp} Bens</div>
            </div>
            <div class="card-stat ${activeInventarioSubFilter === 'aguardando' ? 'active-aguardando' : ''}" style="cursor: pointer;" onclick="changeInventarioSubFilter('aguardando')">
                <div class="stat-icon" style="background-color: var(--warning-bg); color: var(--warning);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                </div>
                <div class="stat-label">Aguardando Inventariação</div>
                <div class="stat-value">${aguardando} Bens</div>
            </div>
            <div class="card-stat ${activeInventarioSubFilter === 'concluido' ? 'active-concluido' : ''}" style="cursor: pointer;" onclick="changeInventarioSubFilter('concluido')">
                <div class="stat-icon" style="background-color: var(--success-bg); color: var(--success);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <div class="stat-label">Já Inventariados</div>
                <div class="stat-value">${concluido} Bens</div>
            </div>
            <div class="card-stat ${activeInventarioSubFilter === 'all' ? 'active-all' : ''}" style="cursor: pointer;" onclick="changeInventarioSubFilter('all')">
                <div class="stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                </div>
                <div class="stat-label">Total Cadastrado</div>
                <div class="stat-value">${listBens.length} Aquisições</div>
            </div>
        </div>

        <div class="panel-card">
            <div class="panel-header">
                <h2>Fila de Inventariação Patrimonial ${activeInventarioSubFilter !== 'all' ? `(${activeInventarioSubFilter === 'naoEncamp' ? 'Sem Encarte' : activeInventarioSubFilter === 'aguardando' ? 'Aguardando Inventariação' : 'Já Inventariados'})` : ''}</h2>
            </div>
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Unidade Escolar</th>
                            <th>Item Patrimonial</th>
                            <th>Período Referente</th>
                            <th>Valor</th>
                            <th>Nota Fiscal</th>
                            <th>Processo de Inventário</th>
                            <th>Status no Inventário</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedBens.length === 0 ? `
                            <tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:32px;">Nenhum bem permanente encontrado nesta categoria.</td></tr>
                        ` : sortedBens.map(b => {
                            const esc = escolas.find(e => e.id === b.escolaId);
                            const ctrl = esc ? controladores.find(c => c.id === esc.controladorId) : null;
                            const compLabel = COMPETENCIAS.find(c => c.key === b.competencia)?.label || b.competencia;
                            let actionBtn = '';
                            let statusBadge = '';
                            
                            if (b.status === 'Não encaminhada') {
                                statusBadge = `<span class="badge badge-danger">Pendente Verbas Federais (Falta Documentos)</span>`;
                            } else if (b.status === 'Encaminhada') {
                                statusBadge = `<span class="badge badge-warning">Aguardando Inventariação</span>`;
                                actionBtn = `<button class="btn btn-primary btn-sm" onclick="inventariarBem('${b.id}')">Marcar como Inventariado</button>`;
                            } else {
                                let details = '';
                                if (b.inventariadoPor) {
                                    details += `<br><small style="color:var(--text-muted); font-size: 0.75rem;">Por: <strong>${b.inventariadoPor}</strong>${b.inventariadoEm ? ' em ' + b.inventariadoEm : ''}</small>`;
                                }
                                if (b.observacoes) {
                                    details += `<br><small style="color:var(--text-muted); font-size: 0.75rem; font-style: italic;">Obs: ${b.observacoes}</small>`;
                                }
                                statusBadge = `<span class="badge badge-success">Inventariado</span>${details}`;
                            }
                            
                            return `
                                <tr>
                                    <td>
                                        <strong>${esc ? esc.denominação : 'N/A'}</strong><br>
                                        <small style="color:var(--text-muted)">
                                            Designação: ${esc ? esc.designação : 'N/A'} • Controlador: ${ctrl ? ctrl.name : 'Não designado'}
                                        </small>
                                    </td>
                                    <td>${b.item}</td>
                                    <td><span style="font-weight:600; color:var(--primary);">${compLabel}</span></td>
                                    <td>R$ ${b.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td>${b.notaFiscal || `<span style="color:var(--danger)">Ausente</span>`}</td>
                                    <td>${esc && esc.processoInventario ? esc.processoInventario : `<span style="color:var(--danger)">Não cadastrado</span>`}</td>
                                    <td>${statusBadge}</td>
                                    <td>${actionBtn}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function inventariarBem(bemId) {
    const b = bens.find(item => item.id === bemId);
    if (!b) return;

    const esc = escolas.find(e => e.id === b.escolaId);
    
    document.getElementById('inventario-bem-id').value = bemId;
    document.getElementById('inventario-bem-nome').innerText = b.item;
    document.getElementById('inventario-bem-escola').innerText = esc ? `Escola: ${esc.denominação} (Designação: ${esc.designação})` : '';
    
    // Popula dropdown de responsáveis com integrantes cadastrados no Inventário
    const respSelect = document.getElementById('inventario-responsavel');
    if (respSelect) {
        respSelect.innerHTML = equipeInventario.map(inv => `<option value="${inv.name}">${inv.name}</option>`).join('');
        if (equipeInventario.length > 0) {
            respSelect.value = equipeInventario[0].name;
        }
    }
    document.getElementById('inventario-observacoes').value = '';

    openModal('modal-inventario-confirm');
}

function salvarInventariacao(e) {
    e.preventDefault();
    const bemId = document.getElementById('inventario-bem-id').value;
    const resp = document.getElementById('inventario-responsavel').value;
    const obs = document.getElementById('inventario-observacoes').value;

    const b = bens.find(item => item.id === bemId);
    if (b) {
        b.status = 'Inventariada';
        b.inventariadoPor = resp;
        b.observacoes = obs;
        
        // Formata data de forma amigável
        const now = new Date();
        const formattedDate = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        b.inventariadoEm = formattedDate;

        const esc = escolas.find(e => e.id === b.escolaId);
        registerLog('Inventariação Concluída', `Bem patrimonial ${b.item} da escola ${esc ? esc.denominação : ''} foi registrado e inventariado por ${resp}.`);
        
        persist();
        closeModal('modal-inventario-confirm');
        if (currentView === 'inventario') {
            renderInventarioView();
        } else {
            renderDashboard();
        }
    }
}

function changeInventarioSubFilter(subFilter) {
    if (activeInventarioSubFilter === subFilter) {
        activeInventarioSubFilter = 'all';
    } else {
        activeInventarioSubFilter = subFilter;
    }
    if (currentView === 'inventario') {
        renderInventarioView();
    } else {
        renderDashboard();
    }
}


// ==========================================
// 8. RENDER DA TELA: ESCOLAS (CARTEIRA)
// ==========================================

function renderEscolas() {
    const container = document.getElementById('main-container');
    const targetEscolas = searchResultFiltered || escolas;

    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Escolas e Carteiras</h1>
                <p>Lista de unidades escolares sob jurisdição da Coordenadoria de Educação.</p>
            </div>
            ${currentProfile === 'assistente' ? `
                <button class="btn btn-primary" onclick="openEscolaEditModal(null)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"></path></svg>
                    Cadastrar Escola
                </button>
            ` : ''}
        </div>

        <div class="panel-card">
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Unidade Escolar</th>
                            <th>INEP</th>
                            <th>CNPJ</th>
                            <th>Diretor(a) Geral</th>
                            <th>Controlador Responsável</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${targetEscolas.map(e => {
                            const ctrl = controladores.find(c => c.id === e.controladorId);
                            return `
                                <tr>
                                    <td><strong>${e.denominação}</strong><br><small style="color:var(--text-muted)">${e.designação}</small></td>
                                    <td>${e.inep}</td>
                                    <td>${e.cnpj}</td>
                                    <td>${e.diretor}<br><small style="color:var(--text-muted)">${e.telefone}</small></td>
                                    <td>${ctrl ? ctrl.name : 'Não designado'}</td>
                                    <td>
                                        <div style="display:flex; gap:8px;">
                                            <button class="btn btn-secondary btn-sm" onclick="switchView('prontuario', '${e.id}')">Ver Unidade</button>
                                            ${currentProfile === 'assistente' || currentProfile === 'controlador' ? `
                                                <button class="btn btn-secondary btn-sm" onclick="openEscolaEditModal('${e.id}')">Editar</button>
                                            ` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}


// ==========================================
// 9. RENDER DA TELA: COMPETÊNCIAS
// ==========================================

function renderCompetencias() {
    const container = document.getElementById('main-container');

    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Visão por Competência</h1>
                <p>Verifique o fechamento e a conformidade da bonificação da competência selecionada.</p>
            </div>
            <div style="display:flex; align-items:center; gap:12px;">
                <label for="comp-select-view" style="font-weight:600; font-size:0.85rem;">Competência:</label>
                <select class="form-control" id="comp-select-view" style="width:180px;" onchange="changeCompetenciaView(this.value)">
                    ${COMPETENCIAS.filter(c => c.key <= config.competenciaFechamento).map(c => `
                        <option value="${c.key}" ${c.key === activeCompetenciaKey ? 'selected' : ''}>${c.label}</option>
                    `).join('')}
                </select>
            </div>
        </div>

        <div class="panel-card">
            <div class="panel-header">
                <h2>Lista de Entrega e Bonificação - Competência ${activeCompetenciaKey}</h2>
            </div>
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Unidade Escolar</th>
                            <th>Controlador</th>
                            <th>Bonificação status</th>
                            <th>Análise Técnica</th>
                            <th>Pendências abertas</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${escolas.map(e => {
                            const inScope = isCompetenceInScope(e.competenciaInicial, activeCompetenciaKey);
                            const ctrl = controladores.find(c => c.id === e.controladorId);
                            
                            let bonifStatusHTML = '';
                            let analiseStatusHTML = '';
                            let pendentesCount = pendencias.filter(p => p.escolaId === e.id && p.competencia === activeCompetenciaKey && p.status === 'Aberta').length;

                            if (inScope) {
                                e.programasIds.forEach(progId => {
                                    const compProgKey = `${activeCompetenciaKey}_${progId}`;
                                    const v = verificacoes[e.id]?.[compProgKey];
                                    const prog = programas.find(p => p.id === progId);
                                    const progName = prog ? prog.name : progId;
                                    
                                    let bStatus = `<span class="badge badge-warning" style="font-size:0.65rem; padding: 2px 4px; font-weight:500;">Não Verificada</span>`;
                                    let aStatus = `<span style="color:var(--text-muted); font-size:0.75rem;">Sem registro</span>`;
                                    
                                    if (v) {
                                        bStatus = v.resultadoBonif === 'apta' 
                                            ? `<span class="badge badge-success" style="font-size:0.65rem; padding: 2px 4px; font-weight:500;">Apta</span>` 
                                            : `<span class="badge badge-danger" style="font-size:0.65rem; padding: 2px 4px; font-weight:500;">Inapta</span>`;
                                        
                                        const aVals = Object.values(v.analise);
                                        if (aVals.every(x => x === 'Correto' || x === 'Correto (Atrasado)')) {
                                            aStatus = `<span style="color:var(--success); font-weight:600; font-size:0.75rem;">Correto</span>`;
                                        } else if (aVals.includes('Incorreto')) {
                                            aStatus = `<span style="color:var(--danger); font-weight:600; font-size:0.75rem;">Com Erros</span>`;
                                        } else {
                                            aStatus = `<span style="color:var(--text-muted); font-size:0.75rem;">Em Análise</span>`;
                                        }
                                    }
                                    
                                    bonifStatusHTML += `<div style="margin-bottom:4px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                                        <span style="font-size:0.75rem; color:var(--text-muted);">${progName}:</span>
                                        ${bStatus}
                                    </div>`;
                                    
                                    analiseStatusHTML += `<div style="margin-bottom:4px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                                        <span style="font-size:0.75rem; color:var(--text-muted);">${progName}:</span>
                                        ${aStatus}
                                    </div>`;
                                });
                            } else {
                                bonifStatusHTML = `<span class="badge badge-gray">Fora de Escopo</span>`;
                                analiseStatusHTML = `N/A`;
                            }

                            return `
                                <tr>
                                    <td>
                                        <strong>${e.denominação}</strong>
                                        <br><small style="color:var(--text-muted)">${e.designação}</small>
                                    </td>
                                    <td>${ctrl ? ctrl.name : 'N/A'}</td>
                                    <td>${bonifStatusHTML}</td>
                                    <td>${analiseStatusHTML}</td>
                                    <td>
                                        ${pendentesCount > 0 ? `<span class="badge badge-danger">${pendentesCount} Abertas</span>` : `<span class="badge badge-gray">Nenhuma</span>`}
                                    </td>
                                    <td>
                                        <button class="btn btn-secondary btn-sm" onclick="switchView('prontuario', '${e.id}')">Ver Unidade</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="panel-card" style="margin-top:24px;">
            <div class="panel-header">
                <h2>Passivo de Regularização (Pendências de Competências Anteriores)</h2>
            </div>
            <div id="passivo-competencias-list">
                <!-- Injetar passivo de meses anteriores -->
            </div>
        </div>
    `;

    renderPassivoAnterior();
}

function changeCompetenciaView(val) {
    activeCompetenciaKey = val;
    renderCompetencias();
}

function renderPassivoAnterior() {
    const listEl = document.getElementById('passivo-competencias-list');
    
    // Filtrar pendências abertas que sejam anteriores à competência selecionada ativa
    const passivo = pendencias.filter(p => p.status === 'Aberta' && p.competencia < activeCompetenciaKey);
    
    if (passivo.length === 0) {
        listEl.innerHTML = `<div style="padding:16px; text-align:center; color:var(--text-muted)">Excelente! Não há passivo de regularização pendente anterior a ${activeCompetenciaKey}.</div>`;
        return;
    }

    listEl.innerHTML = `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Escola</th>
                        <th>Comp. Origem</th>
                        <th>Item</th>
                        <th>Motivo</th>
                        <th>Responsável pela Ação</th>
                        <th>Abertura</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>
                    ${passivo.map(p => {
                        const esc = escolas.find(e => e.id === p.escolaId);
                        const compLabel = COMPETENCIAS.find(c => c.key === p.competencia)?.label || p.competencia;
                        return `
                            <tr>
                                <td>
                                    <strong>${esc ? esc.denominação : 'N/A'}</strong>
                                    ${esc ? `<br><small style="color:var(--text-muted)">${esc.designação}</small>` : ''}
                                </td>
                                <td><span class="badge badge-warning" style="font-weight:600;">${compLabel}</span></td>
                                <td>${p.item}</td>
                                <td><span style="color:var(--danger)">${p.motivo}</span></td>
                                <td><span class="badge badge-info">${p.responsavel}</span></td>
                                <td>${new Date(p.dataAbertura).toLocaleDateString('pt-BR')}</td>
                                <td>
                                    <button class="btn btn-secondary btn-sm" onclick="switchView('prontuario', '${p.escolaId}')">Tratar</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}


// ==========================================
// 10. RENDER DA TELA: PENDÊNCIAS (PASSIVO GERAL)
// ==========================================

function getFormattedPendencyData(p) {
    let formattedComp = p.competencia;
    if (p.competencia && p.competencia.includes('-')) {
        const parts = p.competencia.split('-');
        if (parts.length === 2) {
            formattedComp = `${parts[1]}-${parts[0]}`;
        }
    }
    
    const progMap = {
        'BASIC': 'PDDE Básico',
        'CONECTADA': 'Educação Conectada',
        'PROEC': 'PROEC',
        'ED_FAMILIA': 'Educação e Família',
        'ADOLESCENCIAS': 'Escola das Adolescências',
        'LEITURA': 'Cantinho da Leitura',
        'TEMPO_APRENDER': 'Tempo de Aprender',
        'RECURSOS': 'Sala de Recursos'
    };
    
    let formattedItem = p.item || '';
    Object.keys(progMap).forEach(key => {
        if (formattedItem.startsWith(key + ' - ')) {
            formattedItem = formattedItem.replace(key + ' - ', progMap[key] + ' - ');
        } else if (formattedItem === key) {
            formattedItem = progMap[key];
        }
    });
    
    return {
        competencia: formattedComp,
        item: formattedItem
    };
}

function renderPendencias() {
    const container = document.getElementById('main-container');
    let abertas = pendencias.filter(p => p.status === 'Aberta');
    let resolvidas = pendencias.filter(p => p.status === 'Resolvida');

    // Se perfil é controlador, ordenar as dele primeiro (e depois todas as outras)
    if (currentProfile === 'controlador') {
        const activeCtrlId = 'carlos';
        const getSortWeight = (p) => {
            const esc = escolas.find(e => e.id === p.escolaId);
            return (esc && esc.controladorId === activeCtrlId) ? 0 : 1;
        };
        abertas.sort((a, b) => {
            const wA = getSortWeight(a);
            const wB = getSortWeight(b);
            if (wA !== wB) return wA - wB;
            return b.dataAbertura.localeCompare(a.dataAbertura);
        });
        resolvidas.sort((a, b) => {
            const wA = getSortWeight(a);
            const wB = getSortWeight(b);
            if (wA !== wB) return wA - wB;
            return (b.dataResolucao || '').localeCompare(a.dataResolucao || '');
        });
    }

    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Passivo e Regularizações de Pendências</h1>
                <p>Acompanhamento centralizado e resolução das pendências documentais e de capital das unidades.</p>
            </div>
        </div>

        <div class="tab-container">
            <button class="tab-button active" onclick="switchPendenciasTab(event, 'p-abertas')">Abertas (${abertas.length})</button>
            <button class="tab-button" onclick="switchPendenciasTab(event, 'p-resolvidas')">Histórico Resolvidas (${resolvidas.length})</button>
        </div>

        <div class="tab-content-panel active" id="p-abertas">
            <div class="panel-card">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Escola</th>
                                <th>Mês de Competência</th>
                                <th>Item</th>
                                <th>Motivo da Falha</th>
                                <th>Quem deve agir?</th>
                                <th>Data Abertura</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${abertas.map(p => {
                                const esc = escolas.find(e => e.id === p.escolaId);
                                const pData = getFormattedPendencyData(p);
                                const ctrl = esc ? controladores.find(c => c.id === esc.controladorId) : null;
                                const ctrlName = ctrl ? ctrl.name : 'Não designado';
                                const desig = esc ? esc.designação : '';
                                const isMine = (currentProfile === 'controlador' && esc && esc.controladorId === 'carlos');
                                return `
                                    <tr style="${isMine ? 'background-color: rgba(157, 125, 252, 0.05);' : ''}">
                                        <td>
                                            <div style="display:flex; align-items:center; gap:8px;">
                                                <strong>${esc ? esc.denominação : 'N/A'}</strong>
                                                ${isMine ? `<span class="badge badge-primary" style="font-size: 0.65rem; padding: 2px 6px;">Sua Carteira</span>` : ''}
                                            </div>
                                            ${desig ? `<small style="color:var(--text-muted)">${desig} | Controlador: ${ctrlName}</small>` : ''}
                                        </td>
                                        <td><span style="font-weight:600; color:var(--primary);">${pData.competencia}</span></td>
                                        <td>${pData.item}</td>
                                        <td><span style="color:var(--danger)">${p.motivo}</span></td>
                                        <td><span class="badge badge-info">${p.responsavel}</span></td>
                                        <td>${new Date(p.dataAbertura).toLocaleDateString('pt-BR')}</td>
                                        <td>
                                            <div style="display:flex; gap:6px;">
                                                <button class="btn btn-secondary btn-sm" onclick="switchView('prontuario', '${p.escolaId}')">Ver Unidade</button>
                                                ${currentProfile !== 'inventario' ? `
                                                    <button class="btn btn-primary btn-sm" onclick="abrirModalResolverPendencia('${p.id}')">Resolver</button>
                                                ` : ''}
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="tab-content-panel" id="p-resolvidas">
            <div class="panel-card">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Escola</th>
                                <th>Mês de Competência</th>
                                <th>Item</th>
                                <th>Motivo da Falha</th>
                                <th>Justificativa de Resolução</th>
                                <th>Abertura</th>
                                <th>Resolvido Em</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${resolvidas.map(p => {
                                const esc = escolas.find(e => e.id === p.escolaId);
                                const pData = getFormattedPendencyData(p);
                                const ctrl = esc ? controladores.find(c => c.id === esc.controladorId) : null;
                                const ctrlName = ctrl ? ctrl.name : 'Não designado';
                                const desig = esc ? esc.designação : '';
                                const isMine = (currentProfile === 'controlador' && esc && esc.controladorId === 'carlos');
                                return `
                                    <tr style="${isMine ? 'background-color: rgba(157, 125, 252, 0.03);' : ''}">
                                        <td>
                                            <div style="display:flex; align-items:center; gap:8px;">
                                                <strong>${esc ? esc.denominação : 'N/A'}</strong>
                                                ${isMine ? `<span class="badge badge-primary" style="font-size: 0.65rem; padding: 2px 6px;">Sua Carteira</span>` : ''}
                                            </div>
                                            ${desig ? `<small style="color:var(--text-muted)">${desig} | Controlador: ${ctrlName}</small>` : ''}
                                        </td>
                                        <td>${pData.competencia}</td>
                                        <td>${pData.item}</td>
                                        <td>${p.motivo}</td>
                                        <td><span style="color:var(--success); font-size:0.8rem;">${p.justificativaResolucao || 'Resolvida'}</span></td>
                                        <td>${new Date(p.dataAbertura).toLocaleDateString('pt-BR')}</td>
                                        <td>${new Date(p.dataResolucao).toLocaleDateString('pt-BR')}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function switchPendenciasTab(e, tabId) {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    document.querySelectorAll('.tab-content-panel').forEach(pnl => pnl.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}

function abrirModalResolverPendencia(pendId) {
    const p = pendencias.find(item => item.id === pendId);
    if (!p) return;

    const esc = escolas.find(e => e.id === p.escolaId);
    if (!esc) return;

    const pData = getFormattedPendencyData(p);

    document.getElementById('resolver-pendencia-id').value = p.id;
    document.getElementById('resolver-escola-nome').innerText = esc.denominação || esc.denominaçao;
    document.getElementById('resolver-competencia-mes').innerText = pData.competencia;
    document.getElementById('resolver-item-nome').innerText = pData.item;
    document.getElementById('resolver-motivo-desc').innerText = `${p.motivo} - ${p.observacao || ''}`;
    document.getElementById('resolver-justificativa').value = '';

    openModal('modal-resolver-pendencia');
}

function confirmarResolverPendencia(e) {
    e.preventDefault();
    const pendId = document.getElementById('resolver-pendencia-id').value;
    const justificativa = document.getElementById('resolver-justificativa').value.trim();

    const p = pendencias.find(item => item.id === pendId);
    if (p) {
        p.status = 'Resolvida';
        p.dataResolucao = new Date().toISOString().split('T')[0];
        p.justificativaResolucao = justificativa;

        const esc = escolas.find(e => e.id === p.escolaId);
        registerLog('Pendência Resolvida', `Pendência de ${p.item} da escola ${esc ? esc.denominação : ''} (Origem: ${p.competencia}) resolvida. Justificativa: ${justificativa}`);
        
        persist();
        closeModal('modal-resolver-pendencia');
        updateAlertsBell();

        if (currentView === 'prontuario') {
            renderProntuario(activeSchoolId);
        } else {
            renderPendencias();
        }
    }
}


// ==========================================
// 11. RENDER DA TELA: CAPITAL & INVENTÁRIO (INTERNO)
// ==========================================

function renderInventarioView() {
    const container = document.getElementById('main-container');
    renderDashboardInventario(container);
}


// ==========================================
// 12. RENDER DA TELA: AUDITORIA
// ==========================================

function renderAuditoria() {
    const container = document.getElementById('main-container');

    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Log de Auditoria e Rastreabilidade</h1>
                <p>Histórico completo de ações de gravação e alteração realizadas na plataforma.</p>
            </div>
        </div>

        <div class="panel-card">
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Data e Hora</th>
                            <th>Usuário</th>
                            <th>Perfil</th>
                            <th>Ação realizada</th>
                            <th>Detalhes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs.map(l => `
                            <tr>
                                <td><strong>${new Date(l.dataHora).toLocaleString('pt-BR')}</strong></td>
                                <td>${l.usuario}</td>
                                <td><span class="badge badge-info">${l.perfil}</span></td>
                                <td><strong>${l.acao}</strong></td>
                                <td>${l.detalhes}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}


// ==========================================
// 13. RENDER DA TELA: CONFIGURAÇÕES SME
// ==========================================

function renderSMEConfig() {
    const container = document.getElementById('main-container');

    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Parâmetros da SME</h1>
                <p>Configuração de exercícios, prazos de bonificação e cadastro de novos programas.</p>
            </div>
        </div>

        <div class="config-section">
            <h3>Gerenciamento de Exercícios</h3>
            <div style="display:flex; gap:16px; margin-bottom:16px;">
                <div class="form-group" style="flex:1;">
                    <label for="new-exercise-input">Criar Novo Exercício (Ano)</label>
                    <input type="number" class="form-control" id="new-exercise-input" placeholder="Ex: 2027">
                </div>
                <div class="form-group" style="flex:1;">
                    <label for="new-exercise-competencia">Competência Inicial</label>
                    <select class="form-control" id="new-exercise-competencia">
                        <option value="01">Janeiro</option>
                        <option value="02">Fevereiro</option>
                        <option value="03">Março</option>
                    </select>
                </div>
                <div style="display:flex; align-items:flex-end; margin-bottom:16px;">
                    <button class="btn btn-primary" onclick="criarExercicio()">Criar</button>
                </div>
            </div>
            <div class="program-tag-list">
                ${config.exercicios.map(ex => `
                    <span class="program-tag">${ex} (Ativo)</span>
                `).join('')}
            </div>
        </div>

        <div class="config-section">
            <h3>Calendário e Prazos Operacionais</h3>
            <form onsubmit="salvarCalendarioSME(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label for="cfg-comp-fechamento">Competência Operacional Ativa</label>
                        <select class="form-control" id="cfg-comp-fechamento">
                            ${COMPETENCIAS.map(c => `
                                <option value="${c.key}" ${c.key === config.competenciaFechamento ? 'selected' : ''}>${c.label}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="cfg-prorrogado">Janela de Bonificação Prorrogada?</label>
                        <select class="form-control" id="cfg-prorrogado">
                            <option value="false" ${!config.prazoBonificacaoProrrogado ? 'selected' : ''}>Não</option>
                            <option value="true" ${config.prazoBonificacaoProrrogado ? 'selected' : ''}>Sim (Liberar preenchimento tardio)</option>
                        </select>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary">Salvar Parâmetros</button>
            </form>
        </div>

        <div class="config-section">
            <h3>Programas do Exercício</h3>
            <div style="display:flex; gap:12px; margin-bottom:20px;">
                <input type="text" class="form-control" id="new-program-name" placeholder="Nome do Programa (ex: PROEFE)">
                <input type="text" class="form-control" id="new-program-desc" placeholder="Breve descrição do programa">
                <button class="btn btn-primary" onclick="cadastrarPrograma()">Adicionar</button>
            </div>
            <div class="program-tag-list">
                ${programas.map(p => `
                    <span class="program-tag">
                        <strong>${p.name}</strong> - ${p.desc}
                        ${p.id !== 'BASIC' ? `<button onclick="removerPrograma('${p.id}')">×</button>` : ''}
                    </span>
                `).join('')}
            </div>
        </div>
    `;
}

function salvarCalendarioSME(e) {
    e.preventDefault();
    const cFechamento = document.getElementById('cfg-comp-fechamento').value;
    const prorrogado = document.getElementById('cfg-prorrogado').value === 'true';
    
    const oldFechamento = config.competenciaFechamento;
    config.competenciaFechamento = cFechamento;
    config.prazoBonificacaoProrrogado = prorrogado;
    
    registerLog('Calendário Alterado', `Competência de fechamento alterada de ${oldFechamento} para ${cFechamento}. Janela de prorrogada: ${prorrogado}.`);
    
    persist();
    activeCompetenciaKey = cFechamento;
    renderSMEConfig();
    alert('Parâmetros operacionais da SME atualizados com sucesso!');
}

function cadastrarPrograma() {
    const name = document.getElementById('new-program-name').value.trim();
    const desc = document.getElementById('new-program-desc').value.trim();
    
    if (!name) return;
    
    const newProg = {
        id: 'prog-' + Date.now(),
        name: name,
        desc: desc
    };
    
    programas.push(newProg);
    registerLog('Programa Cadastrado', `Novo programa cadastrado: ${name}.`);
    persist();
    renderSMEConfig();
}

function removerPrograma(progId) {
    programas = programas.filter(p => p.id !== progId);
    registerLog('Programa Removido', `Programa ID ${progId} foi excluído do exercício.`);
    persist();
    renderSMEConfig();
}

function getCompMonthStatus(escolaId, compKey) {
    const esc = escolas.find(e => e.id === escolaId);
    if (!esc) return 'nao-lancado';
    
    // Se possui pendências ou verificações lançadas neste mês/escola, o mês está ativo independente da data de início
    const hasPendencies = pendencias.some(p => p.escolaId === escolaId && p.competencia === compKey);
    let hasVerifications = false;
    if (verificacoes[escolaId]) {
        hasVerifications = Object.keys(verificacoes[escolaId]).some(k => k.startsWith(compKey));
    }
    const forceInScope = hasPendencies || hasVerifications;

    // 1. Fora do escopo da escola (antes da competência inicial)
    if (!forceInScope && !isCompetenceInScope(esc.competenciaInicial, compKey)) {
        return 'out-of-scope';
    }
    
    // Se for maior que o fechamento da CRE, ainda não foi iniciado/lançado
    if (!forceInScope && compKey > config.competenciaFechamento) {
        return 'out-of-scope';
    }
    
    // 2. Procurar verificações da escola para todos os seus programas nesta competência
    let totalItems = 0;
    let analisados = 0;
    let incorretos = 0;
    let aptos = 0;
    let inaptos = 0;
    let preenchidos = 0;
    
    esc.programasIds.forEach(progId => {
        const compProgKey = `${compKey}_${progId}`;
        const v = verificacoes[escolaId]?.[compProgKey];
        if (v) {
            totalItems++;
            if (v.resultadoBonif === 'apta') aptos++;
            else if (v.resultadoBonif === 'inapta') inaptos++;
            
            const analiseVals = Object.values(v.analise);
            const bonifVals = Object.values(v.bonificacao);
            
            analiseVals.forEach(val => {
                if (val && val !== 'Não analisado') {
                    analisados++;
                    if (val === 'Incorreto') incorretos++;
                }
            });
            
            bonifVals.forEach(val => {
                if (val && val !== 'Não se aplica' && val !== '') {
                    preenchidos++;
                }
            });
        }
    });
    
    // Pendências ativas vinculadas a esta competência e escola
    const pAtivasComp = pendencias.filter(p => p.escolaId === escolaId && p.competenciaOrigem === compKey && p.status === 'Aberta').length;
    
    if (inaptos > 0 || incorretos > 0 || pAtivasComp > 0) {
        return 'inapta'; // Vermelho
    }
    
    if (totalItems > 0 && aptos === totalItems) {
        return 'apta'; // Verde
    }
    
    if (analisados > 0 || preenchidos > 0) {
        return 'em-andamento'; // Laranja/Amarelo
    }
    
    return 'nao-lancado'; // Cinza
}

// ==========================================
// 14. PRONTUÁRIO OPERACIONAL DA ESCOLA
// ==========================================

function renderProntuario(escolaId) {
    const container = document.getElementById('main-container');
    const esc = escolas.find(e => e.id === escolaId);
    if (!esc) {
        container.innerHTML = `<div class="alert-empty">Escola não encontrada!</div>`;
        return;
    }
    
    // Inicializa a competência visualizada como a competência ativa atual se não estiver já setada
    if (!activeProntuarioCompetencia) {
        activeProntuarioCompetencia = activeCompetenciaKey || '2026-05';
    }

    const ctrl = controladores.find(c => c.id === esc.controladorId);
    const pAtivas = pendencias.filter(p => p.escolaId === esc.id && p.status === 'Aberta');
    const process = esc.processoInventario || 'Não registrado';

    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Unidade Escolar: ${esc.denominação} (${esc.designação})</h1>
                <p>Acompanhamento e Histórico Unificado da Unidade Escolar</p>
            </div>
            <div style="display:flex; gap:12px;">
                ${currentProfile !== 'inventario' && currentProfile !== 'sme' ? `
                    <button class="btn btn-secondary" onclick="openContatoModal('${esc.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        Registrar Contato
                    </button>
                    <button class="btn btn-secondary" onclick="openCobrancaModal('${esc.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                        Gerar Cobrança
                    </button>
                ` : ''}
                ${currentProfile === 'assistente' || currentProfile === 'controlador' ? `
                    <button class="btn btn-primary" onclick="openEscolaEditModal('${esc.id}')">Editar Dados</button>
                ` : ''}
            </div>
        </div>

        <div class="school-grid">
            <!-- Sidebar da Escola -->
            <div class="school-sidebar">
                <div class="school-info-card">
                    <div class="info-item">
                        <div class="info-label">INEP</div>
                        <div class="info-value">${esc.inep}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Designação</div>
                        <div class="info-value">${esc.designação}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">CNPJ</div>
                        <div class="info-value">${esc.cnpj}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Diretor(a)</div>
                        <div class="info-value">${esc.diretor}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Telefone</div>
                        <div class="info-value">${esc.telefone}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Coordenadoria / RA</div>
                        <div class="info-value">${esc.cre} / ${getRAFromDesignacao(esc.designação)}</div>
                    </div>

                    <div class="info-item">
                        <div class="info-label">E-mail Institucional</div>
                        <div class="info-value">${esc.email}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Controlador Responsável</div>
                        <div class="info-value">${ctrl ? ctrl.name : 'Não designado'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Processo Inventário (Exercício)</div>
                        <div class="info-value">${process}</div>
                    </div>
                </div>

                <div class="school-info-card" style="background-color:rgba(157, 125, 252, 0.03)">
                    <div class="info-label" style="margin-bottom:8px;">Programas Vinculados</div>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        ${esc.programasIds.map(progId => {
                            const p = programas.find(x => x.id === progId);
                            return p ? `<span class="badge badge-info" style="justify-content:flex-start;">${p.name}</span>` : '';
                        }).join('')}
                    </div>
                </div>
            </div>

            <!-- Corpo Principal: Abas de Trabalho -->
            <div>
                <div class="tab-container">
                    ${currentProfile === 'inventario' ? `
                        <button class="tab-button active" data-tab="capital" onclick="switchSchoolTab(event, 'tab-capital')">Registro de Capital</button>
                    ` : currentProfile === 'sme' ? `
                        <button class="tab-button active" data-tab="verificacoes" onclick="switchSchoolTab(event, 'tab-verificacoes')">Competências e Análises</button>
                    ` : `
                        <button class="tab-button active" data-tab="verificacoes" onclick="switchSchoolTab(event, 'tab-verificacoes')">Competências e Análises</button>
                        <button class="tab-button" data-tab="pendencias" onclick="switchSchoolTab(event, 'tab-pendencias')">Pendências Ativas (${pAtivas.length})</button>
                        <button class="tab-button" data-tab="contatos" onclick="switchSchoolTab(event, 'tab-contatos')">Histórico de Contatos</button>
                        <button class="tab-button" data-tab="capital" onclick="switchSchoolTab(event, 'tab-capital')">Registro de Capital</button>
                        <button class="tab-button" data-tab="auditoria" onclick="switchSchoolTab(event, 'tab-auditoria')">Auditoria</button>
                    `}
                </div>

                ${currentProfile !== 'inventario' ? `
                <!-- Aba 1: Verificações das Competências -->
                <div class="tab-content-panel active" id="tab-verificacoes">
                    <div class="panel-card">
                        <div class="panel-header" style="border-bottom: none; padding-bottom: 0;">
                            <h2>Acompanhamento Mensal - Exercício ${currentExercise}</h2>
                            <p style="font-size:0.8rem; color:var(--text-muted)">Clique nos botões de bonificação ou selecione a análise técnica de cada item.</p>
                        </div>
                        
                        <div class="comp-tabs-container" style="display: flex; gap: 8px; flex-wrap: wrap; padding: 0 24px 20px 24px; border-bottom: 1px solid var(--border-color); width: 100%;">
                            ${COMPETENCIAS.map(c => {
                                const status = getCompMonthStatus(esc.id, c.key);
                                const isActive = c.key === activeProntuarioCompetencia;
                                
                                let statusBadgeClass = 'status-dot-' + status;
                                let isDisabled = status === 'out-of-scope';
                                let clickHandler = isDisabled ? '' : `onclick="changeProntuarioCompetencia('${esc.id}', '${c.key}')"`;
                                
                                // Obter nome abreviado do mês (Ex: Janeiro -> Jan)
                                const monthAbbr = c.label.split(' ')[0].substring(0, 3);
                                
                                return `
                                    <button class="comp-sub-tab ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}" 
                                            ${clickHandler} 
                                            style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 500; cursor: ${isDisabled ? 'not-allowed' : 'pointer'};"
                                            title="${c.label} - Status: ${status === 'apta' ? 'Apta' : status === 'inapta' ? 'Inapta/Pendências' : status === 'em-andamento' ? 'Em Análise' : status === 'out-of-scope' ? 'Fora de Escopo' : 'Não Lançado'}">
                                        <span class="status-dot ${statusBadgeClass}" style="width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
                                        <span>${monthAbbr}</span>
                                    </button>
                                `;
                            }).join('')}
                        </div>
                        <div class="table-responsive">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Competência</th>
                                        <th>Item de Verificação</th>
                                        <th>Entrega Drive (Bonif)</th>
                                        <th>Análise Técnica</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody id="prontuario-verif-rows">
                                    <!-- Injetado por Render Competência da Escola -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                ` : ''}

                ${currentProfile !== 'inventario' && currentProfile !== 'sme' ? `
                <!-- Aba 2: Pendências -->
                <div class="tab-content-panel" id="tab-pendencias">
                    <div class="panel-card">
                        <div class="panel-header">
                            <h2>Pendências Operacionais Ativas</h2>
                            <button class="btn btn-secondary btn-sm" onclick="openNovaPendenciaModal('${esc.id}')">Criar Pendência Manual</button>
                        </div>
                        <div class="table-responsive">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Mês Origem</th>
                                        <th>Documento / Item</th>
                                        <th>Defeito apontado</th>
                                        <th>Quem deve resolver</th>
                                        <th>Abertura</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${pAtivas.length === 0 ? `
                                        <tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:32px;">Nenhuma pendência ativa nesta escola! Tudo regularizado.</td></tr>
                                    ` : pAtivas.map(p => {
                                        const pData = getFormattedPendencyData(p);
                                        return `
                                            <tr>
                                                <td><span style="font-weight:600; color:var(--primary);">${pData.competencia}</span></td>
                                                <td>${pData.item}</td>
                                                <td><span style="color:var(--danger)">${p.motivo}</span><br><small style="color:var(--text-muted)">${p.observacao}</small></td>
                                                <td><span class="badge badge-info">${p.responsavel}</span></td>
                                                <td>${new Date(p.dataAbertura).toLocaleDateString('pt-BR')}</td>
                                                <td>
                                                    <button class="btn btn-primary btn-sm" onclick="abrirModalResolverPendencia('${p.id}')">Marcar Resolvida</button>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Aba 3: Histórico de Contatos -->
                <div class="tab-content-panel" id="tab-contatos">
                    <div class="panel-card">
                        <div class="panel-header">
                            <h2>Histórico de Contatos e Cobranças</h2>
                        </div>
                        <div class="contact-timeline">
                            ${contatos.filter(c => c.escolaId === esc.id).length === 0 ? `
                                <div style="color:var(--text-muted); padding:24px; text-align:center;">Nenhum registro de contato lançado. Use o botão "Registrar Contato" para lançar.</div>
                            ` : contatos.filter(c => c.escolaId === esc.id).sort((a,b) => b.dataRegistro.localeCompare(a.dataRegistro)).map(c => `
                                <div class="contact-card">
                                    <div class="contact-meta">
                                        <span class="contact-type-tag">${c.tipo}</span>
                                        <span>Atendimento: ${new Date(c.dataAtendimento).toLocaleDateString('pt-BR')} (Registro: ${new Date(c.dataRegistro).toLocaleString('pt-BR')})</span>
                                    </div>
                                    <div class="contact-desc">${c.desc}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                ` : ''}

                ${currentProfile !== 'sme' ? `
                <!-- Aba 4: Capital -->
                <div class="tab-content-panel ${currentProfile === 'inventario' ? 'active' : ''}" id="tab-capital">
                        <div class="panel-card">
                        <div class="panel-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap: wrap; gap: 10px;">
                            <div>
                                <h2>Aquisição de Bens Permanentes (Natureza de Capital)</h2>
                                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Processo de Inventário 2026: <strong>${esc.processoInventario || '<span style="color:var(--danger)">Não cadastrado na escola</span>'}</strong></div>
                            </div>
                            ${currentProfile !== 'inventario' ? `
                                <button class="btn btn-secondary btn-sm" onclick="openNovoCapitalModal('${esc.id}')">Registrar Nova Compra</button>
                            ` : ''}
                        </div>
                        <div class="table-responsive">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Descrição do Bem</th>
                                        <th>Mês Compra</th>
                                        <th>Valor</th>
                                        <th>Nota Fiscal</th>
                                        <th>Patrimônio</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${bens.filter(b => b.escolaId === esc.id).length === 0 ? `
                                        <tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:32px;">Nenhuma aquisição de capital cadastrada neste exercício.</td></tr>
                                    ` : bens.filter(b => b.escolaId === esc.id).map(b => {
                                        let statusCls = b.status === 'Não encaminhada' ? 'badge-danger' : b.status === 'Encaminhada' ? 'badge-warning' : 'badge-success';
                                        return `
                                            <tr>
                                                <td><strong>${b.item}</strong></td>
                                                <td>${b.competencia}</td>
                                                <td>R$ ${b.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                <td>
                                                    <input type="text" class="form-control" style="width:110px; font-size:0.75rem; padding:4px;" value="${b.notaFiscal}" onchange="updateCapitalDoc('${b.id}', 'notaFiscal', this.value)" placeholder="NF-XXXX" ${currentProfile === 'inventario' || currentProfile === 'sme' ? 'disabled' : ''}>
                                                </td>
                                                <td>
                                                    <span class="badge ${statusCls}">${b.status}</span>
                                                    ${b.status === 'Inventariada' && b.inventariadoPor ? `
                                                        <br><small style="color:var(--text-muted); font-size:0.7rem;">Por: <strong>${b.inventariadoPor}</strong>${b.inventariadoEm ? ' em ' + b.inventariadoEm : ''}</small>
                                                    ` : ''}
                                                    ${b.status === 'Inventariada' && b.observacoes ? `
                                                        <br><small style="color:var(--text-muted); font-size:0.7rem; font-style:italic;">Obs: ${b.observacoes}</small>
                                                    ` : ''}
                                                </td>
                                                <td>
                                                    ${b.status === 'Não encaminhada' ? `
                                                        <button class="btn btn-primary btn-sm" onclick="encaminharCapital('${b.id}')" ${currentProfile === 'inventario' || currentProfile === 'sme' ? 'disabled' : ''}>Encaminhar</button>
                                                    ` : (b.status === 'Encaminhada' && currentProfile === 'inventario') ? `
                                                        <button class="btn btn-primary btn-sm" onclick="inventariarBem('${b.id}')">Inventariar</button>
                                                    ` : `<span style="font-size:0.75rem; color:var(--text-muted)">${b.status === 'Encaminhada' ? 'Encaminhado' : 'Inventariado'}</span>`}
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                ` : ''}

                ${currentProfile !== 'inventario' && currentProfile !== 'sme' ? `
                <!-- Aba 5: Auditoria Local -->
                <div class="tab-content-panel" id="tab-auditoria">
                    <div class="panel-card">
                        <div class="panel-header">
                            <h2>Histórico de Auditoria da Unidade</h2>
                        </div>
                        <div class="table-responsive">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Data/Hora</th>
                                        <th>Usuário</th>
                                        <th>Ação</th>
                                        <th>Histórico de Alterações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${logs.filter(l => l.detalhes.includes(esc.denominação) || l.detalhes.includes(esc.id)).length === 0 ? `
                                        <tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:24px;">Nenhum log para esta unidade.</td></tr>
                                    ` : logs.filter(l => l.detalhes.includes(esc.denominação) || l.detalhes.includes(esc.id)).map(l => `
                                        <tr>
                                            <td>${new Date(l.dataHora).toLocaleString('pt-BR')}</td>
                                            <td>${l.usuario} (${l.perfil})</td>
                                            <td><strong>${l.acao}</strong></td>
                                            <td>${l.detalhes}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;

    renderProntuarioVerificacoes(esc);
}

function switchSchoolTab(e, tabId) {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    document.querySelectorAll('.tab-content-panel').forEach(pnl => pnl.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}

// 14.1 Render Grade de Bonificações e Análises Técnicas Mensais
function renderProntuarioVerificacoes(esc) {
    const container = document.getElementById('prontuario-verif-rows');
    if (!container) return;
    
    // Lista de documentos operados na bonificação
    const docItems = [
        { key: 'extCC', name: 'Extrato Conta Corrente', allowNaoAplica: false },
        { key: 'extINV', name: 'Extrato Investimento', allowNaoAplica: false },
        { key: 'notaFiscal', name: 'Notas Fiscais', allowNaoAplica: true },
        { key: 'consAssessoria', name: 'Consulta Assessoria', allowNaoAplica: true },
        { key: 'declBBAgil', name: 'Declaração BB Ágil', allowNaoAplica: false },
        { key: 'encampInventario', name: 'Encaminhado para Inventariação', allowNaoAplica: true }
    ];

    let rowsHTML = '';

    const selectedComp = COMPETENCIAS.find(c => c.key === activeProntuarioCompetencia);
    if (selectedComp) {
        const c = selectedComp;
        
        // Se possui pendências ou verificações lançadas neste mês/escola, o mês está ativo independente da data de início
        const hasPendencies = pendencias.some(p => p.escolaId === esc.id && p.competencia === c.key);
        let hasVerifications = false;
        if (verificacoes[esc.id]) {
            hasVerifications = Object.keys(verificacoes[esc.id]).some(k => k.startsWith(c.key));
        }
        const forceInScope = hasPendencies || hasVerifications;

        const inScope = forceInScope || isCompetenceInScope(esc.competenciaInicial, c.key);
        if (!inScope) {
            rowsHTML += `
                <tr style="opacity: 0.6; background-color: rgba(255,255,255,0.01);">
                    <td colspan="5" style="text-align:center; color:var(--text-muted); padding:32px;">Fora do escopo de monitoramento (início em ${COMPETENCIAS.find(cm => cm.key === esc.competenciaInicial)?.label || esc.competenciaInicial})</td>
                </tr>
            `;
        } else {
            // Para cada programa ativo da escola
            esc.programasIds.forEach(progId => {
                const prog = programas.find(p => p.id === progId);
                const progName = prog ? prog.name : progId;
                const compProgKey = `${c.key}_${progId}`;

                // Recupera verificação existente ou cria estado vazio na memória local
                if (!verificacoes[esc.id]) verificacoes[esc.id] = {};
                if (!verificacoes[esc.id][compProgKey]) {
                    verificacoes[esc.id][compProgKey] = {
                        bonificacao: {},
                        analise: {},
                        resultadoBonif: ''
                    };
                    docItems.forEach(item => {
                        verificacoes[esc.id][compProgKey].bonificacao[item.key] = '';
                        verificacoes[esc.id][compProgKey].analise[item.key] = 'Não analisado';
                    });
                }

                const v = verificacoes[esc.id][compProgKey];

                // Montar a sub-linha com cada documento
                docItems.forEach((doc, idx) => {
                    const bonifValue = v.bonificacao[doc.key] || '';
                    const analiseValue = v.analise[doc.key] || 'Não analisado';
                    
                    // Determinar o resultado final da bonificação na competência (Apta/Inapta)
                    let bonifConsolidadoText = '';
                    if (idx === 0) {
                        if (v.resultadoBonif) {
                            bonifConsolidadoText = v.resultadoBonif === 'apta' 
                                ? `<div class="badge badge-success" style="font-size:0.75rem; padding:8px; margin-bottom:8px; width:100%; justify-content:center;">APTA</div>`
                                : `<div class="badge badge-danger" style="font-size:0.75rem; padding:8px; margin-bottom:8px; width:100%; justify-content:center;">INAPTA</div>`;
                        } else {
                            bonifConsolidadoText = `<div class="badge badge-warning" style="font-size:0.75rem; padding:8px; margin-bottom:8px; width:100%; justify-content:center;">Aguardando</div>`;
                        }
                    }

                    // Linkando com as pendências reais (nome combinando Programa e Documento)
                    const fullItemName = `${progName} - ${doc.name}`;
                    const activePend = pendencias.find(p => p.escolaId === esc.id && p.competencia === c.key && p.item === fullItemName && p.status === 'Aberta');
                    let pendStatusHTML = '';
                    if (activePend) {
                        pendStatusHTML = `<button class="btn btn-danger btn-sm" onclick="abrirModalResolverPendencia('${activePend.id}')" style="font-size:0.7rem; padding:2px 6px;">Resolver Pendência</button>`;
                    } else if (analiseValue === 'Incorreto') {
                        const resolvedPend = pendencias.find(p => p.escolaId === esc.id && p.competencia === c.key && p.item === fullItemName && p.status === 'Resolvida');
                        if (resolvedPend) {
                            pendStatusHTML = `<span class="badge badge-success" style="font-size:0.7rem;" title="Justificativa: ${resolvedPend.observacao}">Resolvida</span>`;
                        } else {
                            pendStatusHTML = `<button class="btn btn-secondary btn-sm" onclick="openNovaPendenciaModalWithDefaults('${esc.id}', '${c.key}', '${fullItemName}')" style="font-size:0.7rem; padding:2px 6px;">Abrir Pendência</button>`;
                        }
                    }

                    // Conteúdo extra para visualização de notas fiscais
                    let extraContentHTML = '';
                    if (doc.key === 'notaFiscal') {
                        const notes = notasRegistradas.filter(n => n.escolaId === esc.id && n.compKey === compProgKey);
                        
                        const notesBadges = notes.map(n => `
                            <span class="badge badge-info" style="display: inline-flex; align-items: center; margin-right: 4px; margin-bottom: 4px; padding: 4px 8px; font-size: 0.7rem; font-weight: 500;">
                                NF: ${n.numero} (R$ ${n.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})})
                                ${currentProfile !== 'inventario' && currentProfile !== 'sme' ? `
                                    <span style="margin-left: 6px; cursor: pointer; font-weight: bold; color: var(--warning); font-size: 0.85rem;" onclick="abrirEditarNota('${n.id}', '${esc.id}')" title="Editar Nota">✎</span>
                                    <span style="margin-left: 6px; cursor: pointer; font-weight: bold; color: var(--danger); font-size: 0.85rem;" onclick="removerNotaRegistrada('${n.id}', '${esc.id}')" title="Excluir Nota">×</span>
                                ` : ''}
                            </span>
                        `).join('');
                        
                        const addBtn = (currentProfile !== 'inventario' && currentProfile !== 'sme' && bonifValue !== 'Não se aplica' && (analiseValue === 'Correto' || analiseValue === 'Correto (Atrasado)')) ? `
                            <button class="btn btn-secondary btn-sm" style="font-size:0.65rem; padding: 2px 6px; display: inline-flex; align-items: center; margin-bottom: 4px;" onclick="openModalDadosNota('${esc.id}', '${compProgKey}')">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:2px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                Adicionar Nota
                            </button>
                        ` : '';
                        
                        if (notesBadges || addBtn) {
                            extraContentHTML = `
                                <div style="margin-top: 6px; display: flex; flex-wrap: wrap; align-items: center; gap: 4px;">
                                    ${notesBadges}
                                    ${addBtn}
                                </div>
                            `;
                        }
                    }
                    if (doc.key === 'consAssessoria') {
                        const serviceNotes = notasRegistradas.filter(n => n.escolaId === esc.id && n.compKey === compProgKey && n.tipo === 'servico');
                        if (serviceNotes.length > 0) {
                            const isChecked = v && v.bonificacao && v.bonificacao['consEnviada'];
                            extraContentHTML = `
                                <div style="margin-top: 6px; display: flex; flex-direction: column; gap: 6px;">
                                    <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 4px;">
                                        <span class="badge badge-warning" style="font-size: 0.7rem; font-weight: 500; padding: 4px 8px;">
                                            Ref. Serviço NF: ${serviceNotes.map(n => n.numero).join(', ')}
                                        </span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <label style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; cursor: pointer; margin-top: 2px;">
                                            <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleConsEnviada('${esc.id}', '${compProgKey}', this.checked)" ${isBonifLocked ? 'disabled' : ''}>
                                            <span>Consultoria realmente enviada para Assessoria</span>
                                        </label>
                                    </div>
                                </div>
                            `;
                        }
                    }

                    // Bloqueio de bonificação: se consolidada (e não for assistente) ou se perfil for inventário/SME
                    const isBonifLocked = (v.resultadoBonif && currentProfile !== 'assistente') || (currentProfile === 'inventario') || (currentProfile === 'sme');

                    // Bloqueio de análise técnica: apenas se perfil for inventário ou SME (nunca trava por consolidação para controlador/assistente)
                    const isAnaliseLocked = (currentProfile === 'inventario') || (currentProfile === 'sme');

                    rowsHTML += `
                        <tr>
                            ${idx === 0 ? `<td rowspan="${docItems.length}" style="vertical-align:top; border-right: 1px solid var(--border-color); width:180px;">
                                <strong>${c.label}</strong><br>
                                <span style="font-size:0.75rem; color:var(--primary); font-weight:600;">${progName}</span>
                                <div style="margin-top:16px;">
                                    ${bonifConsolidadoText}
                                    ${currentProfile !== 'inventario' && currentProfile !== 'sme' ? (
                                        v.resultadoBonif ? `
                                            <button class="btn btn-secondary btn-sm" style="width:100%; justify-content:center; font-size:0.75rem;" disabled>Consolidada</button>
                                        ` : `
                                            <button class="btn btn-secondary btn-sm" style="width:100%; justify-content:center; font-size:0.75rem;" onclick="calcularEFecharBonificacao('${esc.id}', '${compProgKey}')">Consolidar</button>
                                        `
                                    ) : ''}
                                </div>
                            </td>` : ''}
                            <td><span style="font-size:0.85rem; font-weight:500;">${doc.name}</span>${extraContentHTML}</td>
                            <td>
                                <div class="btn-group-toggle">
                                    <button class="btn-toggle ${bonifValue === 'Sim' ? 'active-sim' : ''}" 
                                            onclick="toggleBonif('${esc.id}', '${compProgKey}', '${doc.key}', 'Sim')" 
                                            ${isBonifLocked ? 'disabled' : ''}>Sim</button>
                                    <button class="btn-toggle ${bonifValue === 'Não' ? 'active-nao' : ''}" 
                                            onclick="toggleBonif('${esc.id}', '${compProgKey}', '${doc.key}', 'Não')" 
                                            ${isBonifLocked ? 'disabled' : ''}>Não</button>
                                    ${doc.allowNaoAplica ? `
                                        <button class="btn-toggle ${bonifValue === 'Não se aplica' ? 'active-naoseaplica' : ''}" 
                                                onclick="toggleBonif('${esc.id}', '${compProgKey}', '${doc.key}', 'Não se aplica')" 
                                                ${isBonifLocked ? 'disabled' : ''}>N/A</button>
                                    ` : ''}
                                </div>
                            </td>
                            <td>
                                <select class="select-analise select-analise-comp analise-${analiseValue.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}" 
                                        onchange="changeAnaliseTecnica('${esc.id}', '${compProgKey}', '${doc.key}', this.value)"
                                        ${isAnaliseLocked ? 'disabled' : ''}>
                                    <option value="Não analisado" ${analiseValue === 'Não analisado' ? 'selected' : ''}>Não analisado</option>
                                    <option value="Correto" ${analiseValue === 'Correto' ? 'selected' : ''}>Correto</option>
                                    <option value="Correto (Atrasado)" ${analiseValue === 'Correto (Atrasado)' ? 'selected' : ''}>Correto (Atrasado)</option>
                                    <option value="Incorreto" ${analiseValue === 'Incorreto' ? 'selected' : ''}>Incorreto</option>
                                </select>
                            </td>
                            <td>
                                ${pendStatusHTML}
                            </td>
                        </tr>
                    `;
                });
            });
        }
    }

    container.innerHTML = rowsHTML;
}

function changeProntuarioCompetencia(escolaId, compKey) {
    activeProntuarioCompetencia = compKey;
    renderProntuario(escolaId);
}

// 14.2 Operações de Clique Bonificação
function toggleBonif(escolaId, compKey, docKey, value) {
    if (currentProfile === 'inventario' || currentProfile === 'sme') return;
    
    // Regra: Não permitir alterar bonificação se o mês estiver consolidado
    const v = verificacoes[escolaId][compKey];
    if (v.resultadoBonif && currentProfile !== 'assistente') {
        alert('Esta competência já foi consolidada. Apenas o(a) Assistente de Verbas Federais pode fazer ajustes retroativos na bonificação.');
        return;
    }

    v.bonificacao[docKey] = value;
    
    // Regra Automática: Se Nota Fiscal = Não se aplica, automaticamente Encaminhado Inventário e Consulta Assessoria = Não se aplica
    if (docKey === 'notaFiscal') {
        if (value === 'Não se aplica') {
            // Remover todas as notas registradas para este compKey/escola
            const notesToDelete = notasRegistradas.filter(n => n.escolaId === escolaId && n.compKey === compKey);
            notesToDelete.forEach(nota => {
                if (nota.bemId) {
                    bens = bens.filter(b => b.id !== nota.bemId);
                    if (supabaseClient) supabaseClient.from('bens').delete().eq('id', nota.bemId).then();
                }
                if (supabaseClient) supabaseClient.from('notas_registradas').delete().eq('id', nota.id).then();
            });
            notasRegistradas = notasRegistradas.filter(n => !(n.escolaId === escolaId && n.compKey === compKey));

            v.bonificacao['encampInventario'] = 'Não se aplica';
            v.analise['encampInventario'] = 'Correto';
            v.bonificacao['consAssessoria'] = 'Não se aplica';
            v.analise['consAssessoria'] = 'Correto';
            v.analise['notaFiscal'] = 'Correto';
        } else if (value === 'Sim' || value === 'Não') {
            // Se estava como "Não se aplica" antes, reseta para exigir análise
            if (v.bonificacao['encampInventario'] === 'Não se aplica') {
                v.bonificacao['encampInventario'] = '';
                v.analise['encampInventario'] = 'Não analisado';
            }
            if (v.bonificacao['consAssessoria'] === 'Não se aplica') {
                v.bonificacao['consAssessoria'] = '';
                v.analise['consAssessoria'] = 'Não analisado';
            }
        }
    }

    persist();
    renderProntuario(escolaId);
}

// 14.3 Operações de Clique Análise Técnica
function changeAnaliseTecnica(escolaId, compKey, docKey, value) {
    if (currentProfile === 'inventario' || currentProfile === 'sme') return;
    const v = verificacoes[escolaId][compKey];
    
    // Regra Operacional: Não permitir preencher análise técnica se a entrega do drive estiver vazia (Sim, Não, N/A)
    if (value !== 'Não analisado' && (!v.bonificacao[docKey] || v.bonificacao[docKey] === '')) {
        alert('Você não pode alterar a análise técnica sem antes preencher o status de entrega no Drive (Sim, Não ou N/A).');
        renderProntuario(escolaId);
        return;
    }

    // Regra Operacional: Se a entrega do Drive for "Sim" e estiver definindo como "Correto" ou "Correto (Atrasado)" para Notas Fiscais,
    // exige que exista pelo menos uma nota fiscal cadastrada no sistema
    if (docKey === 'notaFiscal' && (value === 'Correto' || value === 'Correto (Atrasado)') && v.bonificacao['notaFiscal'] === 'Sim') {
        const count = notasRegistradas.filter(n => n.escolaId === escolaId && n.compKey === compKey).length;
        if (count === 0) {
            alert('Você declarou que há entrega de Notas Fiscais no Drive (Sim), mas não cadastrou nenhuma Nota Fiscal no sistema. Por favor, cadastre pelo menos uma Nota Fiscal antes de marcar como Correto.');
            renderProntuario(escolaId);
            return;
        }
    }

    const oldValue = v.analise[docKey];
    v.analise[docKey] = value;
    
    const docNames = {
        extCC: 'Extrato Conta Corrente',
        extINV: 'Extrato Investimento',
        notaFiscal: 'Notas Fiscais',
        consAssessoria: 'Consulta Assessoria',
        declBBAgil: 'Declaração BB Ágil',
        encampInventario: 'Encaminhado para Inventariação'
    };

    registerLog('Análise Técnica Alterada', `Análise técnica de ${docNames[docKey]} em ${compKey} da escola ID ${escolaId} alterada de "${oldValue}" para "${value}".`);

    persist();

    // Regra Crítica: Se marcar como "Incorreto", abrir modal de pendência correspondente automaticamente
    if (value === 'Incorreto') {
        openNovaPendenciaModal(escolaId, false);
        const cleanComp = compKey.split('_')[0];
        document.getElementById('pend-competencia').value = cleanComp;
        document.getElementById('pend-item').value = docNames[docKey];
        
        // Auto seleção de motivos padronizados
        const motivoSelect = document.getElementById('pend-motivo');
        if (docKey === 'declBBAgil') {
            motivoSelect.value = 'Sem assinatura'; // Valor comum para o BB Ágil
        } else if (docKey === 'encampInventario') {
            motivoSelect.value = 'Nota Fiscal pendente';
        } else {
            motivoSelect.value = 'Documento ausente';
        }
        
        const parts = compKey.split('_');
        const mesRaw = parts[0];
        const progId = parts[1];
        
        let mesFormat = mesRaw;
        if (mesRaw && mesRaw.includes('-')) {
            const mParts = mesRaw.split('-');
            if (mParts.length === 2) {
                mesFormat = `${mParts[1]}-${mParts[0]}`;
            }
        }
        
        const progMapUpper = {
            'BASIC': 'PDDE BÁSICO',
            'CONECTADA': 'EDUCAÇÃO CONECTADA',
            'PROEC': 'PROEC',
            'ED_FAMILIA': 'EDUCAÇÃO E FAMÍLIA',
            'ADOLESCENCIAS': 'ESCOLA DAS ADOLESCÊNCIAS',
            'LEITURA': 'CANTINHO DA LEITURA',
            'TEMPO_APRENDER': 'TEMPO DE APRENDER',
            'RECURSOS': 'SALA DE RECURSOS'
        };
        const progName = progMapUpper[progId] || progId;
        const compLabel = `${mesFormat} ${progName}`;
        
        document.getElementById('pend-obs').value = `Identificado erro técnico na conferência de ${docNames[docKey]} de ${compLabel}.`;
    }
    
    // Nova Regra Operacional: Se a análise técnica de Notas Fiscais for marcada como "Correto" ou "Correto (Atrasado)",
    // abre o modal para inserir os dados do gasto correspondente
    if (docKey === 'notaFiscal' && (value === 'Correto' || value === 'Correto (Atrasado)')) {
        if (v.bonificacao['notaFiscal'] !== 'Não se aplica') {
            openModalDadosNota(escolaId, compKey);
        }
    }
    
    renderProntuario(escolaId);
}

// 14.5 Operações de Registro de Dados da Nota Fiscal (Via Análise Técnica)
function openModalDadosNota(escolaId, compKey) {
    const v = verificacoes[escolaId]?.[compKey];
    if (v && v.bonificacao && v.bonificacao['notaFiscal'] === 'Não se aplica') {
        alert('Não é possível adicionar notas fiscais para competências marcadas como "Não se aplica".');
        return;
    }
    document.getElementById('nota-escola-id').value = escolaId;
    document.getElementById('nota-comp-key').value = compKey;
    document.getElementById('nota-id').value = '';
    document.getElementById('form-dados-nota').reset();
    
    // Restaurar título e botão do modal para modo padrão
    document.querySelector('#modal-dados-nota h3').innerText = 'Dados da Nota Fiscal / Despesa';
    document.querySelector('#modal-dados-nota button[type="submit"]').innerText = 'Salvar Gasto';
    
    openModal('modal-dados-nota');
}

function salvarDadosNota(e) {
    e.preventDefault();
    if (currentProfile === 'inventario' || currentProfile === 'sme') return;
    const notaId = document.getElementById('nota-id').value;
    const escolaId = document.getElementById('nota-escola-id').value;
    const compKey = document.getElementById('nota-comp-key').value; // Formato: 2026-05_BASIC ou similar

    const v = verificacoes[escolaId]?.[compKey];
    if (v && v.bonificacao && v.bonificacao['notaFiscal'] === 'Não se aplica') {
        alert('Não é possível adicionar notas fiscais para competências marcadas como "Não se aplica".');
        closeModal('modal-dados-nota');
        return;
    }
    
    const desc = document.getElementById('nota-desc').value.trim();
    const tipo = document.getElementById('nota-tipo').value;
    const numero = document.getElementById('nota-numero').value.trim();
    const valor = parseFloat(document.getElementById('nota-valor').value);
    
    const esc = escolas.find(x => x.id === escolaId);
    const splitKey = compKey.split('_');
    const mesKey = splitKey[0]; // ex: 2026-05
    const progId = splitKey[1]; // ex: BASIC
    
    const prog = programas.find(p => p.id === progId);
    const progName = prog ? prog.name : progId;

    if (notaId) {
        // MODO EDICAO
        const nota = notasRegistradas.find(n => n.id === notaId);
        if (!nota) return;

        const oldTipo = nota.tipo;
        const oldBemId = nota.bemId;

        nota.desc = desc;
        nota.tipo = tipo;
        nota.numero = numero;
        nota.valor = valor;

        if (tipo === 'permanente') {
            const hasProcesso = esc && esc.processoInventario;
            if (oldBemId) {
                // Atualizar bem existente no inventário
                const bem = bens.find(b => b.id === oldBemId);
                if (bem) {
                    bem.item = `${progName} - ${desc}`;
                    bem.valor = valor;
                    bem.notaFiscal = numero;
                    bem.status = (numero && hasProcesso) ? 'Encaminhada' : 'Não encaminhada';
                }
            } else {
                // Criar novo bem no inventário
                const newBem = {
                    id: 'bem-' + Date.now(),
                    escolaId: escolaId,
                    competencia: mesKey,
                    item: `${progName} - ${desc}`,
                    valor: valor,
                    notaFiscal: numero,
                    status: (numero && hasProcesso) ? 'Encaminhada' : 'Não encaminhada'
                };
                bens.push(newBem);
                nota.bemId = newBem.id;

                if (!hasProcesso) {
                    alert(`Aviso: O bem permanente foi registrado no inventário, mas a escola não tem Processo de Inventário cadastrado. A equipe de inventário não poderá tombá-lo até que você cadastre o processo da escola.`);
                }
            }
        } else {
            // Se mudou de permanente para outra coisa, remove do inventário
            if (oldBemId) {
                bens = bens.filter(b => b.id !== oldBemId);
                if (supabaseClient) supabaseClient.from('bens').delete().eq('id', oldBemId).then();
                nota.bemId = null;
            }
        }

        // Lógica de prestação de serviços
        if (tipo === 'servico') {
            if (oldTipo !== 'servico') {
                alert(`Aviso de Regra de Negócio: Como é prestação de serviços (custeio), é obrigatório apresentar o e-mail de consultoria da assessoria contábil no encarte mensal do PDDE.`);
            }
            // Força consAssessoria para 'Não' se estiver 'Não se aplica' ou em branco
            const v = verificacoes[escolaId]?.[compKey];
            if (v) {
                if (v.bonificacao['consAssessoria'] === 'Não se aplica' || v.bonificacao['consAssessoria'] === '') {
                    v.bonificacao['consAssessoria'] = 'Não';
                    v.analise['consAssessoria'] = 'Não analisado';
                }
            }
        } else if (oldTipo === 'servico') {
            // Se mudou de serviço para outra coisa, checa se ainda existem outros serviços
            const remainingServices = notasRegistradas.filter(n => n.escolaId === escolaId && n.compKey === compKey && n.tipo === 'servico' && n.id !== notaId);
            if (remainingServices.length === 0) {
                const v = verificacoes[escolaId]?.[compKey];
                if (v) {
                    v.bonificacao['consAssessoria'] = 'Não se aplica';
                    v.analise['consAssessoria'] = 'Correto';
                    v.bonificacao['consEnviada'] = false; // Reset checkbox
                }
            }
        }

        registerLog('Nota Editada', `Nota Fiscal ${numero} editada para ${esc ? esc.denominação : ''} no valor de R$ ${valor}.`);
    } else {
        // MODO CRIAÇÃO (código original)
        let bemId = null;

        if (tipo === 'permanente') {
            // Bem Permanente -> Criar no inventário (bens de capital)
            const hasProcesso = esc && esc.processoInventario;
            const newBem = {
                id: 'bem-' + Date.now(),
                escolaId: escolaId,
                competencia: mesKey,
                item: `${progName} - ${desc}`,
                valor: valor,
                notaFiscal: numero,
                status: (numero && hasProcesso) ? 'Encaminhada' : 'Não encaminhada'
            };
            bens.push(newBem);
            bemId = newBem.id;
            
            // Logar a ação
            registerLog('Bem Cadastrado', `Gasto de capital (permanente) de R$ ${valor} registrado via análise mensal para ${esc ? esc.denominação : ''} com NF ${numero}.`);
            
            // E se a escola tiver processo, encaminha automático, se não tiver avisa!
            if (!hasProcesso) {
                alert(`Aviso: O bem permanente foi registrado no inventário, mas a escola não tem Processo de Inventário cadastrado. A equipe de inventário não poderá tombá-lo até que você cadastre o processo da escola.`);
            }
        } else if (tipo === 'servico') {
            // Prestação de Serviço -> Avisar que precisa de consulta assessoria!
            alert(`Aviso de Regra de Negócio: Como é prestação de serviços (custeio), é obrigatório apresentar o e-mail de consultoria da assessoria contábil no encarte mensal do PDDE.`);
            
            // Se registrou serviço, a consulta da assessoria passa a ser requerida (não pode ser "Não se aplica")
            const v = verificacoes[escolaId]?.[compKey];
            if (v) {
                if (v.bonificacao['consAssessoria'] === 'Não se aplica' || v.bonificacao['consAssessoria'] === '') {
                    v.bonificacao['consAssessoria'] = 'Não'; // Força para 'Não' para requerer check explícito
                    v.analise['consAssessoria'] = 'Não analisado';
                }
            }
            
            // Logar
            registerLog('Gasto Serviço Cadastrado', `Gasto com Prestação de Serviços registrado para ${esc ? esc.denominação : ''}: ${desc} com NF ${numero} no valor de R$ ${valor}.`);
        } else {
            // Material de Consumo -> Custeio simples
            // Logar
            registerLog('Gasto Consumo Cadastrado', `Gasto com Material de Consumo registrado para ${esc ? esc.denominação : ''}: ${desc} com NF ${numero} no valor de R$ ${valor}.`);
        }

        // Registrar a Nota Fiscal na lista unificada
        const newNota = {
            id: 'nota-' + Date.now(),
            escolaId: escolaId,
            compKey: compKey, // '2026-05_BASIC'
            desc: desc,
            tipo: tipo,
            numero: numero,
            valor: valor,
            bemId: bemId,
            dataRegistro: new Date().toISOString()
        };
        notasRegistradas.push(newNota);
    }
    
    persist();
    closeModal('modal-dados-nota');
    renderProntuario(escolaId);
    updateAlertsBell();
}

function abrirEditarNota(notaId, escolaId) {
    const nota = notasRegistradas.find(n => n.id === notaId);
    if (!nota) return;

    document.getElementById('nota-escola-id').value = escolaId;
    document.getElementById('nota-comp-key').value = nota.compKey;
    document.getElementById('nota-id').value = nota.id;
    document.getElementById('nota-desc').value = nota.desc;
    document.getElementById('nota-tipo').value = nota.tipo;
    document.getElementById('nota-numero').value = nota.numero;
    document.getElementById('nota-valor').value = nota.valor;

    // Mudar o título do modal e do botão para refletir a edição
    document.querySelector('#modal-dados-nota h3').innerText = 'Editar Dados da Nota Fiscal';
    document.querySelector('#modal-dados-nota button[type="submit"]').innerText = 'Salvar Alterações';

    openModal('modal-dados-nota');
}

function toggleConsEnviada(escolaId, compKey, isChecked) {
    if (currentProfile === 'inventario' || currentProfile === 'sme') return;
    const v = verificacoes[escolaId]?.[compKey];
    if (!v) return;

    if (v.resultadoBonif && currentProfile !== 'assistente') {
        alert('Esta competência já foi consolidada. Apenas o(a) Assistente de Verbas Federais pode fazer ajustes retroativos.');
        renderProntuario(escolaId);
        return;
    }

    if (!v.bonificacao) {
        v.bonificacao = {};
    }
    v.bonificacao['consEnviada'] = isChecked;

    const esc = escolas.find(x => x.id === escolaId);
    registerLog('Consulta Assessoria Enviada Toggled', `Status de consultoria enviada para ${compKey} da escola ${esc ? esc.denominação : escolaId} definido como ${isChecked}.`);
    
    persist();
    renderProntuario(escolaId);
}

function removerNotaRegistrada(notaId, escolaId) {
    if (currentProfile === 'inventario' || currentProfile === 'sme') return;
    if (!confirm('Deseja realmente remover esta nota fiscal registrada?')) return;
    
    const idx = notasRegistradas.findIndex(n => n.id === notaId);
    if (idx !== -1) {
        const nota = notasRegistradas[idx];
        
        // Se a nota tiver bemId associado, remove do inventário (bens)
        if (nota.bemId) {
            bens = bens.filter(b => b.id !== nota.bemId);
            if (supabaseClient) supabaseClient.from('bens').delete().eq('id', nota.bemId).then();
        }
        
        // Remove da lista de notas
        const compProgKey = nota.compKey;
        notasRegistradas.splice(idx, 1);
        if (supabaseClient) supabaseClient.from('notas_registradas').delete().eq('id', notaId).then();
        
        // Se removeu a última nota de serviço, a consulta da assessoria pode voltar a ser "Não se aplica"
        const remainingServices = notasRegistradas.filter(n => n.escolaId === escolaId && n.compKey === compProgKey && n.tipo === 'servico');
        if (remainingServices.length === 0) {
            const v = verificacoes[escolaId]?.[compProgKey];
            if (v) {
                v.bonificacao['consAssessoria'] = 'Não se aplica';
                v.analise['consAssessoria'] = 'Correto';
            }
        }

        // Se removeu a última nota fiscal e a análise técnica estava como "Correto" ou "Correto (Atrasado)" sob entrega "Sim",
        // reseta a análise para "Não analisado" pois não há mais documentos cadastrados
        const remainingNotes = notasRegistradas.filter(n => n.escolaId === escolaId && n.compKey === compProgKey);
        if (remainingNotes.length === 0) {
            const v = verificacoes[escolaId]?.[compProgKey];
            if (v && v.bonificacao['notaFiscal'] === 'Sim' && (v.analise['notaFiscal'] === 'Correto' || v.analise['notaFiscal'] === 'Correto (Atrasado)')) {
                v.analise['notaFiscal'] = 'Não analisado';
                alert('Aviso: Como você removeu todas as notas fiscais cadastradas para esta competência/programa, a análise técnica foi redefinida para "Não analisado".');
            }
        }
        
        // Logar exclusão
        const esc = escolas.find(x => x.id === escolaId);
        registerLog('Nota Fiscal Removida', `Nota Fiscal ${nota.numero} de R$ ${nota.valor} foi excluída da escola ${esc ? esc.denominação : ''}.`);
        
        persist();
        renderProntuario(escolaId);
        updateAlertsBell();
    }
}

// 14.4 Regra de Consolidação de Bonificação (Apta / Inapta)
function calcularEFecharBonificacao(escolaId, compKey) {
    if (currentProfile === 'inventario' || currentProfile === 'sme') return;
    const v = verificacoes[escolaId]?.[compKey];
    if (!v || !v.bonificacao) return;

    // Regra: Para ser APTA na bonificação, as obrigações fundamentais e condicionais ativas devem estar como "Sim"
    // Extrato CC, Extrato Investimento, BB Ágil devem ser obrigatoriamente "Sim"
    // Notas fiscais, Consulta Assessoria, Encamp Inventário devem ser "Sim" se não forem "Não se aplica"
    
    let isApta = true;
    
    const CC = v.bonificacao['extCC'];
    const INV = v.bonificacao['extINV'];
    const BBA = v.bonificacao['declBBAgil'];
    const NF = v.bonificacao['notaFiscal'];
    const ASS = v.bonificacao['consAssessoria'];
    const INV_ENC = v.bonificacao['encampInventario'];
    
    // CC, INV, BBA são obrigatórios e não aceitam N/A
    if (CC !== 'Sim' || INV !== 'Sim' || BBA !== 'Sim') {
        isApta = false;
    }
    
    // Condicionais
    if (NF === 'Não' || ASS === 'Não' || INV_ENC === 'Não') {
        isApta = false;
    }
    
    // Se não preencheu algum obrigatório
    if (!CC || !INV || !BBA) {
        alert('Por favor, preencha todos os itens de bonificação antes de consolidar.');
        return;
    }

    const esc = escolas.find(e => e.id === escolaId);
    const resultado = isApta ? 'apta' : 'inapta';
    v.resultadoBonif = resultado;
    
    registerLog('Bonificação Consolidada', `A bonificação da escola ${esc ? esc.denominação : ''} para ${compKey} foi fechada como "${resultado.toUpperCase()}".`);
    
    persist();
    renderProntuario(escolaId);
    updateAlertsBell();
}



// ==========================================
// 15. REGRA OPERACIONAL: REQUISITOS DE CAPITAL
// ==========================================

function updateCapitalDoc(bemId, field, value) {
    if (currentProfile === 'inventario' || currentProfile === 'sme') return;
    const b = bens.find(item => item.id === bemId);
    if (b) {
        b[field] = value;
        persist();
    }
}

function encaminharCapital(bemId) {
    if (currentProfile === 'inventario' || currentProfile === 'sme') return;
    const b = bens.find(item => item.id === bemId);
    if (!b) return;

    const esc = escolas.find(e => e.id === b.escolaId);
    const processo = esc ? esc.processoInventario : '';

    if (!b.notaFiscal) {
        alert('Erro de Validação: Não é possível encaminhar bens patrimoniais sem preencher o Número da Nota Fiscal.');
        return;
    }
    if (!processo) {
        alert('Erro de Validação: A unidade escolar não possui um Processo de Inventário cadastrado para o exercício. Por favor, atualize os dados cadastrais da escola primeiro.');
        return;
    }

    b.status = 'Encaminhada';
    registerLog('Capital Encaminhado', `Aquisição ${b.item} da escola ${esc ? esc.denominação : ''} encaminhada ao inventariador com NF ${b.notaFiscal} no processo ${processo}.`);
    
    persist();
    renderProntuario(activeSchoolId);
    updateAlertsBell();
}


// ==========================================
// 16. MODAIS OPERACIONAIS: CRIAÇÃO E SALVAMENTO
// ==========================================

function openModal(id) {
    document.getElementById(id).classList.add('show');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

// 16.1 Salvar Contato / Atendimento
function openContatoModal(escolaId) {
    document.getElementById('contato-escola-id').value = escolaId;
    document.getElementById('contato-data-atendimento').value = new Date().toISOString().split('T')[0];
    
    // Popular pendências vinculáveis (usando == para evitar incompatibilidade entre string e número)
    const pSelect = document.getElementById('contato-pendencia');
    pSelect.innerHTML = `<option value="">Nenhuma pendência específica</option>`;
    pendencias.filter(p => p.escolaId == escolaId && p.status === 'Aberta').forEach(p => {
        const pData = getFormattedPendencyData(p);
        pSelect.innerHTML += `<option value="${p.id}">${pData.competencia} - ${pData.item} (${p.motivo})</option>`;
    });

    openModal('modal-contato');
}

function saveContato(e) {
    e.preventDefault();
    const escolaId = document.getElementById('contato-escola-id').value;
    const tipo = document.getElementById('contato-tipo').value;
    const dataAtend = document.getElementById('contato-data-atendimento').value;
    const pendId = document.getElementById('contato-pendencia').value;
    const desc = document.getElementById('contato-desc').value.trim();

    const newContato = {
        id: 'cont-' + Date.now(),
        escolaId: escolaId,
        tipo: tipo,
        dataAtendimento: dataAtend,
        dataRegistro: new Date().toISOString(),
        desc: desc,
        pendenciaId: pendId || null
    };

    contatos.push(newContato);
    
    // Se o contato atualizou uma pendência específica, registrar no log da pendência
    if (pendId) {
        registerLog('Contato Registrado', `Contato via ${tipo} associado à pendência ID ${pendId} na escola ID ${escolaId}.`);
    } else {
        registerLog('Contato Registrado', `Contato via ${tipo} registrado para a escola ID ${escolaId}.`);
    }

    persist();
    closeModal('modal-contato');
    document.getElementById('form-contato').reset();
    
    if (currentView === 'prontuario') {
        renderProntuario(escolaId);
    } else {
        renderDashboard();
    }
    updateAlertsBell();
}

// 16.2 Salvar Nova Pendência Manual
function openNovaPendenciaModal(escolaId, isManual = true) {
    document.getElementById('pendencia-escola-id').value = escolaId;
    
    // Preencher select de competências
    const compSelect = document.getElementById('pend-competencia');
    compSelect.innerHTML = COMPETENCIAS.filter(c => c.key <= config.competenciaFechamento).map(c => `
        <option value="${c.key}">${c.label}</option>
    `).join('');
    compSelect.value = activeCompetenciaKey;

    const itemSelect = document.getElementById('pend-item');
    if (isManual) {
        compSelect.disabled = false;
        itemSelect.disabled = false;
    } else {
        compSelect.disabled = true;
        itemSelect.disabled = true;
    }

    openModal('modal-nova-pendencia');
}

function openNovaPendenciaModalWithDefaults(escolaId, compKey, itemName) {
    openNovaPendenciaModal(escolaId, false);
    const cleanComp = compKey.split('_')[0];
    document.getElementById('pend-competencia').value = cleanComp;
    document.getElementById('pend-item').value = itemName;
}

function saveNovaPendencia(e) {
    e.preventDefault();
    const escolaId = document.getElementById('pendencia-escola-id').value;
    const comp = document.getElementById('pend-competencia').value;
    const item = document.getElementById('pend-item').value;
    const motivo = document.getElementById('pend-motivo').value;
    const resp = document.getElementById('pend-responsavel').value;
    const obs = document.getElementById('pend-obs').value.trim();

    const newPend = {
        id: 'pend-' + Date.now(),
        escolaId: escolaId,
        competencia: comp,
        item: item,
        motivo: motivo,
        responsavel: resp,
        status: 'Aberta',
        dataAbertura: new Date().toISOString().split('T')[0],
        dataResolucao: null,
        observacao: obs
    };

    pendencias.push(newPend);
    
    const esc = escolas.find(x => x.id === escolaId);
    registerLog('Pendência Criada', `Abertura manual de pendência de ${item} para ${esc ? esc.denominação : ''} (${comp}) - Responsável: ${resp}.`);

    persist();
    closeModal('modal-nova-pendencia');
    document.getElementById('form-nova-pendencia').reset();

    if (currentView === 'prontuario') {
        renderProntuario(escolaId);
    } else {
        renderPendencias();
    }
    updateAlertsBell();
}

// 16.3 Editar Cadastro da Escola
function openEscolaEditModal(escolaId) {
    const selectCtrl = document.getElementById('edit-controlador');
    selectCtrl.innerHTML = controladores.map(c => `
        <option value="${c.id}">${c.name}</option>
    `).join('');

    const chkContainer = document.getElementById('edit-programas-checkboxes');
    chkContainer.innerHTML = programas.map(p => `
        <label style="display:flex; align-items:center; gap:6px; font-size:0.8rem;">
            <input type="checkbox" name="edit-programs" value="${p.id}" ${p.id === 'BASIC' ? 'checked disabled' : ''}>
            ${p.name}
        </label>
    `).join('');

    if (escolaId) {
        const esc = escolas.find(e => e.id === escolaId);
        document.getElementById('edit-escola-id').value = esc.id;
        document.getElementById('edit-diretor').value = esc.diretor;
        document.getElementById('edit-telefone').value = esc.telefone;
        document.getElementById('edit-controlador').value = esc.controladorId;
        document.getElementById('edit-processo').value = esc.processoInventario;
        
        // Marcar checkboxes dos programas
        document.querySelectorAll('input[name="edit-programs"]').forEach(chk => {
            if (chk.value !== 'BASIC') {
                chk.checked = esc.programasIds.includes(chk.value);
            }
        });
    } else {
        // Modo Cadastro Novo
        document.getElementById('edit-escola-id').value = '';
        document.getElementById('form-escola-edit').reset();
    }

    openModal('modal-escola-edit');
}

function saveEscolaEdit(e) {
    e.preventDefault();
    const id = document.getElementById('edit-escola-id').value;
    const diretor = document.getElementById('edit-diretor').value.trim();
    const tel = document.getElementById('edit-telefone').value.trim();
    const ctrlId = document.getElementById('edit-controlador').value;
    const processo = document.getElementById('edit-processo').value.trim();
    
    // Obter programas selecionados
    const progIds = ['BASIC'];
    document.querySelectorAll('input[name="edit-programs"]:checked').forEach(chk => {
        if (chk.value !== 'BASIC') progIds.push(chk.value);
    });

    if (id) {
        // Atualizar
        const esc = escolas.find(item => item.id === id);
        if (esc) {
            const oldCtrl = esc.controladorId;
            esc.diretor = diretor;
            esc.telefone = tel;
            esc.controladorId = ctrlId;
            esc.processoInventario = processo;
            esc.programasIds = progIds;
            
            let logDetails = `Dados da escola ${esc.denominação} atualizados.`;
            if (oldCtrl !== ctrlId) logDetails += ` Controlador alterado para ${controladores.find(c=>c.id===ctrlId).name}.`;
            registerLog('Escola Atualizada', logDetails);
        }
    } else {
        // Novo cadastro
        const newEsc = {
            id: 'esc-' + Date.now(),
            inep: '330' + Math.floor(10000 + Math.random() * 90000),
            cnpj: '00.000.000/0001-' + Math.floor(10 + Math.random() * 89),
            denominação: 'Nova Unidade Escolar ' + Math.floor(Math.random() * 100),
            designação: '01.09.' + Math.floor(100 + Math.random() * 900),
            cre: '4ª CRE',
            ra: 'Geral',
            email: 'nova.escola@rioeduca.net',
            diretor: diretor,
            telefone: tel,
            controladorId: ctrlId,
            processoInventario: processo,
            programasIds: progIds,
            competenciaInicial: '2026-05'
        };
        escolas.push(newEsc);
        registerLog('Escola Cadastrada', `Nova escola cadastrada: ${newEsc.denominação} com controlador designado.`);
    }

    persist();
    closeModal('modal-escola-edit');
    if (currentView === 'prontuario') {
        renderProntuario(id);
    } else {
        renderEscolas();
    }
}

// 16.4 Registrar Novo Bem de Capital
function openNovoCapitalModal(escolaId) {
    if (currentProfile === 'inventario' || currentProfile === 'sme') return;
    // Para simplificar no MVP, adicionamos via formulário dinâmico simples
    const dec = prompt("Descreva o bem patrimonial comprado (ex: Computador Desktop Dell):");
    if (!dec) return;
    const valStr = prompt("Informe o valor da compra (ex: 2500):");
    const val = parseFloat(valStr);
    if (isNaN(val)) {
        alert("Valor inválido!");
        return;
    }
    const nf = prompt("Informe o número da Nota Fiscal (opcional para iniciar, ex: NF-84321):") || '';

    const esc = escolas.find(x => x.id === escolaId);
    const hasProcesso = esc && esc.processoInventario;

    const newBem = {
        id: 'bem-' + Date.now(),
        escolaId: escolaId,
        competencia: activeCompetenciaKey,
        item: dec,
        valor: val,
        notaFiscal: nf,
        status: (nf && hasProcesso) ? 'Encaminhada' : 'Não encaminhada'
    };

    bens.push(newBem);
    const escObj = escolas.find(x => x.id === escolaId);
    registerLog('Bem Cadastrado', `Gasto de capital de R$ ${val} registrado para ${escObj ? escObj.denominação : ''}: ${dec}.`);
    
    persist();
    renderProntuario(escolaId);
    updateAlertsBell();
}


// ==========================================
// 17. REGRA OPERACIONAL: GERADOR DE COBRANÇAS
// ==========================================

function openCobrancaModal(escolaId) {
    const esc = escolas.find(e => e.id == escolaId);
    if (!esc) return;

    document.getElementById('cobranca-escola-id').value = escolaId;
    
    // Regra: Filtrar e exibir apenas pendências escolares externas (excluir as de responsabilidade do Inventário/Verbas Federais)
    const pEscola = pendencias.filter(p => p.escolaId == escolaId && p.status === 'Aberta' && p.responsavel === 'Escola');
    
    const container = document.getElementById('cobranca-checkboxes-container');
    if (pEscola.length === 0) {
        container.innerHTML = `<div style="color:var(--text-muted); font-size:0.8rem">Nenhuma pendência externa sob responsabilidade da Escola.</div>`;
        document.getElementById('cobranca-preview-text').innerText = `Prezado(a) Diretor(a) de ${esc.denominação},\n\nConstatamos que não há pendências ativas de obrigações do PDDE sob responsabilidade da unidade escolar no RADAR PDDE.\n\nAtenciosamente,\nComitê PDDE / Verbas Federais`;
        openModal('modal-cobranca');
        return;
    }

    container.innerHTML = pEscola.map(p => {
        const pData = getFormattedPendencyData(p);
        return `
            <label style="display:flex; align-items:flex-start; gap:8px; margin-bottom:8px; font-size:0.8rem; cursor:pointer;">
                <input type="checkbox" class="chk-cobranca-item" value="${p.id}" checked onchange="buildCobrancaPreview('${escolaId}')">
                <div>
                    <strong>[Comp. ${pData.competencia}] ${pData.item}</strong><br>
                    Motivo: ${p.motivo} - ${p.observacao}
                </div>
            </label>
        `;
    }).join('');

    buildCobrancaPreview(escolaId);
    openModal('modal-cobranca');
}

function formatCompetenciaText(key) {
    if (!key) return '';
    const parts = key.split('_');
    const compParts = parts[0].split('-');
    const formattedComp = compParts.length === 2 ? `${compParts[1]}-${compParts[0]}` : parts[0];
    
    if (parts.length === 2) {
        const progId = parts[1];
        const prog = programas.find(p => p.id === progId);
        const progName = prog ? prog.name : progId;
        return `${formattedComp} ${progName}`;
    }
    return formattedComp;
}

function formatTextCobranca(text) {
    if (!text) return '';
    let formatted = text.replace(/(\d{4})-(\d{2})_([A-Z0-9_]+)/g, (match, year, month, progId) => {
        const prog = programas.find(p => p.id === progId);
        const name = prog ? prog.name : progId;
        return `${month}-${year} ${name}`;
    });
    formatted = formatted.replace(/(\d{4})-(\d{2})/g, '$2-$1');
    return formatted;
}

function buildCobrancaPreview(escolaId) {
    const esc = escolas.find(e => e.id === escolaId);
    const selectedIds = Array.from(document.querySelectorAll('.chk-cobranca-item:checked')).map(chk => chk.value);
    
    let msg = `Prezado(a) Diretor(a) de ${esc.denominação},\n\nIdentificamos pendências de documentação do PDDE que exigem regularização da unidade escolar:\n\n`;
    
    if (selectedIds.length === 0) {
        msg += `[Nenhum item selecionado]`;
    } else {
        selectedIds.forEach((id, idx) => {
            const p = pendencias.find(item => item.id === id);
            const pData = getFormattedPendencyData(p);
            const obsText = formatTextCobranca(p.observacao);
            msg += `${idx + 1}. [Competência: ${pData.competencia}] - Documento: ${pData.item}\n   Problema: ${p.motivo} (${obsText})\n\n`;
        });
    }

    msg += `Solicitamos que os documentos corretos sejam inseridos no Drive institucional da escola com urgência para regularizarmos a situação da prestação de contas da Unidade.\n\nAtenciosamente,\nEquipe de Verbas Federais / 4ª CRE`;
    document.getElementById('cobranca-preview-text').innerText = msg;
}

function copyCobrancaText() {
    const previewText = document.getElementById('cobranca-preview-text').innerText;
    navigator.clipboard.writeText(previewText).then(() => {
        alert('Texto de cobrança copiado para a área de transferência! Você já pode colar no e-mail ou WhatsApp.');
        
        // Regra: Registrar automaticamente o contato no histórico
        const escolaId = document.getElementById('cobranca-escola-id').value;
        const esc = escolas.find(e => e.id === escolaId);
        
        const newContato = {
            id: 'cont-' + Date.now(),
            escolaId: escolaId,
            tipo: 'E-mail',
            dataAtendimento: new Date().toISOString().split('T')[0],
            dataRegistro: new Date().toISOString(),
            desc: `Mensagem de cobrança consolidada enviada para a escola cobrando pendências selecionadas.`,
            pendenciaId: null
        };
        
        contatos.push(newContato);
        registerLog('Cobrança Enviada', `Cobrança consolidada enviada para a escola ${esc ? esc.denominação : ''}.`);
        persist();
        
        closeModal('modal-cobranca');
        if (currentView === 'prontuario') {
            renderProntuario(escolaId);
        }
    });
}


// ==========================================
// 18. GESTÃO DE EQUIPE (ASSISTENTE)
// ==========================================

function openRedistributionModal() {
    switchView('equipe');
}

function renderEquipe() {
    const container = document.getElementById('main-container');
    if (!container) return;

    // Calcular contagem de escolas por controlador
    const ctrlStats = controladores.map(c => {
        const totalEscolas = escolas.filter(e => e.controladorId === c.id).length;
        return { ...c, totalEscolas };
    });

    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Gestão de Equipe</h1>
                <p>Gerencie os Controladores da CRE, integrantes do Inventário e a alocação de carteiras.</p>
            </div>
            ${activeEquipeTab === 'controladores' ? `
                <button class="btn btn-primary" onclick="abrirEditarControlador(null)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="16" y1="11" x2="22" y2="11"></line></svg>
                    Cadastrar Controlador
                </button>
            ` : `
                <button class="btn btn-primary" onclick="abrirEditarInventariador(null)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="16" y1="11" x2="22" y2="11"></line></svg>
                    Cadastrar Integrante
                </button>
            `}
        </div>

        <div class="tab-container" style="margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
            <button class="tab-button ${activeEquipeTab === 'controladores' ? 'active' : ''}" onclick="switchEquipeTab('controladores')" style="background:none; border:none; color:${activeEquipeTab === 'controladores' ? 'var(--primary)' : 'var(--text-muted)'}; font-weight:600; padding: 8px 16px; cursor:pointer;">Controladores e Carteiras (${controladores.length})</button>
            <button class="tab-button ${activeEquipeTab === 'inventario' ? 'active' : ''}" onclick="switchEquipeTab('inventario')" style="background:none; border:none; color:${activeEquipeTab === 'inventario' ? 'var(--primary)' : 'var(--text-muted)'}; font-weight:600; padding: 8px 16px; cursor:pointer;">Equipe de Inventário (${equipeInventario.length})</button>
        </div>

        ${activeEquipeTab === 'controladores' ? `
            <!-- View de Controladores -->
            <div class="equipe-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-bottom: 30px;">
                ${ctrlStats.map(c => `
                    <div class="panel-card ctrl-card" style="position: relative; overflow: hidden; transition: var(--transition-smooth); border: 1px solid var(--border-color);">
                        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
                            <div class="avatar" style="width: 48px; height: 48px; border-radius: 50%; background: var(--primary-glow); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 600;">
                                ${c.name ? c.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??'}
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <h3 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.name}</h3>
                                <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.email}</p>
                            </div>
                        </div>
                        
                        <div style="border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span style="font-size: 0.75rem; color: var(--text-muted); display: block; text-transform: uppercase; letter-spacing: 0.5px;">Carteira</span>
                                <span style="font-size: 1.1rem; font-weight: 700; color: var(--primary);">${c.totalEscolas} ${c.totalEscolas === 1 ? 'escola' : 'escolas'}</span>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn btn-secondary btn-sm" onclick="abrirEditarControlador('${c.id}')" title="Editar dados">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="removerControlador('${c.id}')" title="Remover controlador" ${controladores.length <= 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="panel-card">
                <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h2>Alocação de Escolas (${escolas.length} Unidades)</h2>
                        <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: var(--text-muted);">Reatribua as escolas diretamente nos dropdowns para atualizar a carteira de cada controlador instantaneamente.</p>
                    </div>
                    
                    <!-- Barra de Ações em Lote -->
                    <div id="bulk-allocation-bar" style="display: none; align-items: center; gap: 12px; background: rgba(157, 125, 252, 0.08); padding: 8px 16px; border-radius: 8px; border: 1px solid var(--primary-glow); margin-left: auto;">
                        <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">
                            <span id="bulk-select-count" style="color:var(--primary); font-weight:700;">0</span> selecionadas
                        </span>
                        <select id="bulk-controlador-select" class="form-control" style="width: 200px; font-size: 0.85rem; padding: 4px 8px; height: auto; border-color: var(--border-color);">
                            <option value="" disabled selected>Atribuir ao Controlador...</option>
                            ${controladores.map(ctrl => `<option value="${ctrl.id}">${ctrl.name}</option>`).join('')}
                        </select>
                        <button class="btn btn-primary btn-sm" onclick="aplicarAtribuicaoEmLote()" style="padding: 5px 12px; font-size: 0.8rem;">Aplicar em Lote</button>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th style="width: 40px; text-align: center;"><input type="checkbox" id="select-all-escolas" onchange="toggleSelectAllEscolas(this.checked)" style="cursor:pointer;"></th>
                                <th>Unidade Escolar</th>
                                <th>INEP</th>
                                <th>CNPJ</th>
                                <th>Região (R.A.)</th>
                                <th>Controlador Responsável</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${escolas.map(e => {
                                const currentCtrlId = e.controladorId;
                                return `
                                    <tr>
                                        <td style="text-align: center;"><input type="checkbox" class="escola-bulk-checkbox" data-id="${e.id}" onchange="updateBulkBar()" style="cursor:pointer;"></td>
                                        <td>
                                            <div style="font-weight: 600; color: var(--text-main);">${e.denominação || e.denominaçao}</div>
                                            <div style="font-size: 0.75rem; color: var(--text-muted);">${e.designação || e.designaçao} | ${e.email}</div>
                                        </td>
                                        <td><code>${e.inep}</code></td>
                                        <td>${e.cnpj}</td>
                                        <td><span class="badge badge-gray">${getRAFromDesignacao(e.designação || e.designaçao)}</span></td>
                                        <td>
                                            <select class="form-control select-alocacao" style="max-width: 220px; font-weight: 500; border-color: var(--border-color);" onchange="reatribuirEscolaDirect('${e.id}', this.value)">
                                                ${controladores.map(ctrl => `
                                                    <option value="${ctrl.id}" ${ctrl.id === currentCtrlId ? 'selected' : ''}>${ctrl.name}</option>
                                                `).join('')}
                                            </select>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        ` : `
            <!-- View de Equipe de Inventário -->
            <div class="equipe-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-bottom: 30px;">
                ${equipeInventario.map(inv => `
                    <div class="panel-card ctrl-card" style="position: relative; overflow: hidden; transition: var(--transition-smooth); border: 1px solid var(--border-color);">
                        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
                            <div class="avatar" style="width: 48px; height: 48px; border-radius: 50%; background: rgba(157, 125, 252, 0.1); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 600;">
                                ${inv.name ? inv.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??'}
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <h3 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${inv.name}</h3>
                                <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${inv.email}</p>
                            </div>
                        </div>
                        
                        <div style="border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 12px; display: flex; justify-content: flex-end; align-items: center;">
                            <div style="display: flex; gap: 8px;">
                                <button class="btn btn-secondary btn-sm" onclick="abrirEditarInventariador('${inv.id}')" title="Editar dados">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="removerInventariador('${inv.id}')" title="Remover integrante" ${equipeInventario.length <= 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}

function switchEquipeTab(tab) {
    activeEquipeTab = tab;
    renderEquipe();
}

function abrirEditarInventariador(id) {
    const titleEl = document.getElementById('modal-inventariador-title');
    const idInput = document.getElementById('inventariador-id');
    const nameInput = document.getElementById('inventariador-name');
    const emailInput = document.getElementById('inventariador-email');
    
    if (!id) {
        titleEl.innerText = 'Cadastrar Integrante de Inventário';
        idInput.value = '';
        nameInput.value = '';
        emailInput.value = '';
    } else {
        const inv = equipeInventario.find(x => x.id === id);
        if (inv) {
            titleEl.innerText = 'Editar Integrante de Inventário';
            idInput.value = inv.id;
            nameInput.value = inv.name;
            emailInput.value = inv.email;
        }
    }
    openModal('modal-inventariador-edit');
}

function salvarInventariador(event) {
    event.preventDefault();
    const id = document.getElementById('inventariador-id').value;
    const name = document.getElementById('inventariador-name').value.trim();
    const email = document.getElementById('inventariador-email').value.trim();
    
    if (!name || !email) {
        alert("Preencha todos os campos!");
        return;
    }
    
    if (!id) {
        // Criar novo
        const newId = 'inv_' + Date.now();
        equipeInventario.push({ id: newId, name, email });
        registerLog('Gestão de Equipe', `Integrante do Inventário ${name} (${email}) adicionado à equipe.`);
    } else {
        // Editar existente
        const inv = equipeInventario.find(x => x.id === id);
        if (inv) {
            const oldName = inv.name;
            inv.name = name;
            inv.email = email;
            registerLog('Gestão de Equipe', `Dados do integrante do Inventário ${oldName} atualizados para: ${name} (${email}).`);
        }
    }
    
    persist();
    closeModal('modal-inventariador-edit');
    renderEquipe();
}

function removerInventariador(id) {
    if (equipeInventario.length <= 1) {
        alert("Não é possível remover o único integrante de inventário existente!");
        return;
    }
    
    const inv = equipeInventario.find(x => x.id === id);
    if (!inv) return;
    
    if (!confirm(`Deseja realmente remover o(a) integrante do inventário ${inv.name}?`)) return;
    
    // Remover
    equipeInventario = equipeInventario.filter(x => x.id !== id);
    if (supabaseClient) supabaseClient.from('equipe_inventario').delete().eq('id', id).then();
    registerLog('Gestão de Equipe', `Integrante do Inventário ${inv.name} removido.`);
    
    persist();
    renderEquipe();
}

function abrirEditarControlador(id) {
    const titleEl = document.getElementById('modal-controlador-title');
    const idInput = document.getElementById('controlador-id');
    const nameInput = document.getElementById('controlador-name');
    const emailInput = document.getElementById('controlador-email');
    
    if (!id) {
        titleEl.innerText = 'Cadastrar Controlador';
        idInput.value = '';
        nameInput.value = '';
        emailInput.value = '';
    } else {
        const ctrl = controladores.find(c => c.id === id);
        if (ctrl) {
            titleEl.innerText = 'Editar Controlador';
            idInput.value = ctrl.id;
            nameInput.value = ctrl.name;
            emailInput.value = ctrl.email;
        }
    }
    openModal('modal-controlador-edit');
}

function salvarControlador(event) {
    event.preventDefault();
    const id = document.getElementById('controlador-id').value;
    const name = document.getElementById('controlador-name').value.trim();
    const email = document.getElementById('controlador-email').value.trim();
    
    if (!name || !email) {
        alert("Preencha todos os campos!");
        return;
    }
    
    if (!id) {
        // Criar novo
        const newId = 'ctrl_' + Date.now();
        controladores.push({ id: newId, name, email });
        registerLog('Gestão de Equipe', `Controlador ${name} (${email}) adicionado à equipe.`);
    } else {
        // Editar existente
        const ctrl = controladores.find(c => c.id === id);
        if (ctrl) {
            const oldName = ctrl.name;
            ctrl.name = name;
            ctrl.email = email;
            registerLog('Gestão de Equipe', `Dados do controlador ${oldName} atualizados para: ${name} (${email}).`);
        }
    }
    
    persist();
    closeModal('modal-controlador-edit');
    renderEquipe();
}

function removerControlador(id) {
    if (controladores.length <= 1) {
        alert("Não é possível remover o único controlador existente!");
        return;
    }
    
    const ctrl = controladores.find(c => c.id === id);
    if (!ctrl) return;
    
    const totalEscolas = escolas.filter(e => e.controladorId === id).length;
    
    const confirmMsg = totalEscolas > 0 
        ? `Deseja realmente remover o(a) controlador(a) ${ctrl.name}? As ${totalEscolas} escolas sob a responsabilidade dele(a) serão reatribuídas automaticamente para o(a) controlador(a) ${controladores.find(c => c.id !== id).name}.`
        : `Deseja realmente remover o(a) controlador(a) ${ctrl.name}?`;
        
    if (!confirm(confirmMsg)) return;
    
    // Reatribuir escolas
    const fallbackCtrl = controladores.find(c => c.id !== id);
    let reassignedCount = 0;
    escolas.forEach(e => {
        if (e.controladorId === id) {
            e.controladorId = fallbackCtrl.id;
            reassignedCount++;
        }
    });
    
    // Remover
    controladores = controladores.filter(c => c.id !== id);
    if (supabaseClient) supabaseClient.from('controladores').delete().eq('id', id).then();
    
    registerLog('Gestão de Equipe', `Controlador ${ctrl.name} removido. ${reassignedCount} escolas foram transferidas para ${fallbackCtrl.name}.`);
    
    persist();
    renderEquipe();
}

function reatribuirEscolaDirect(escolaId, novoCtrlId) {
    const esc = escolas.find(e => e.id === escolaId);
    if (!esc) return;
    
    const oldCtrl = controladores.find(c => c.id === esc.controladorId);
    const novoCtrl = controladores.find(c => c.id === novoCtrlId);
    
    if (esc.controladorId === novoCtrlId) return;
    
    esc.controladorId = novoCtrlId;
    registerLog('Redistribuição de Carteira', `Escola ${esc.denominação || esc.denominaçao} redistribuída de ${oldCtrl ? oldCtrl.name : 'Ninguém'} para ${novoCtrl ? novoCtrl.name : 'Ninguém'}.`);
    
    persist();
    renderEquipe();
}

function toggleSelectAllEscolas(isChecked) {
    document.querySelectorAll('.escola-bulk-checkbox').forEach(cb => {
        cb.checked = isChecked;
    });
    updateBulkBar();
}

function updateBulkBar() {
    const checkboxes = document.querySelectorAll('.escola-bulk-checkbox');
    const checkedBoxes = Array.from(checkboxes).filter(cb => cb.checked);
    const bulkBar = document.getElementById('bulk-allocation-bar');
    const selectAllCheckbox = document.getElementById('select-all-escolas');
    
    if (checkedBoxes.length > 0) {
        const countSpan = document.getElementById('bulk-select-count');
        if (countSpan) countSpan.innerText = checkedBoxes.length;
        if (bulkBar) bulkBar.style.display = 'flex';
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = checkedBoxes.length === checkboxes.length;
        }
    } else {
        if (bulkBar) bulkBar.style.display = 'none';
        if (selectAllCheckbox) selectAllCheckbox.checked = false;
    }
}

function aplicarAtribuicaoEmLote() {
    const bulkSelect = document.getElementById('bulk-controlador-select');
    if (!bulkSelect) return;
    const novoCtrlId = bulkSelect.value;
    if (!novoCtrlId) {
        alert('Selecione um controlador na lista!');
        return;
    }
    
    const checkboxes = document.querySelectorAll('.escola-bulk-checkbox');
    const checkedBoxes = Array.from(checkboxes).filter(cb => cb.checked);
    const targetEscolasIds = checkedBoxes.map(cb => cb.getAttribute('data-id'));
    
    const novoCtrl = controladores.find(c => c.id === novoCtrlId);
    if (!novoCtrl) return;
    
    let updatedCount = 0;
    escolas.forEach(e => {
        if (targetEscolasIds.includes(e.id)) {
            if (e.controladorId !== novoCtrlId) {
                e.controladorId = novoCtrlId;
                updatedCount++;
            }
        }
    });
    
    if (updatedCount > 0) {
        registerLog('Redistribuição em Lote', `Atribuição em lote realizada: ${updatedCount} escolas redistribuídas para o controlador ${novoCtrl.name}.`);
        persist();
    }
    
    renderEquipe();
}


// ==========================================
// 19. EXPORTAÇÃO DE RELATÓRIOS (CSV)
// ==========================================

function exportDataExcel() {
    // Exporta planilha consolidada de bonificações com UTF-8 BOM para evitar problemas com acentos no Excel
    let csvContent = "INEP;Denominacao;Designacao;Competencia;Programa;CC;Investimento;NF;Assessoria;BBAgil;EncaminhadoInventario;StatusBonificacao\n";
    
    escolas.forEach(e => {
        COMPETENCIAS.forEach(c => {
            e.programasIds.forEach(progId => {
                const compProgKey = `${c.key}_${progId}`;
                const v = verificacoes[e.id]?.[compProgKey];
                if (v && v.resultadoBonif) {
                    const b = v.bonificacao;
                    const prog = programas.find(p => p.id === progId);
                    const progName = prog ? prog.name : progId;
                    const encamp = b.encampInventario || '-';
                    const compParts = c.key.split('-');
                    const compLabel = compParts.length === 2 ? `${compParts[1]}-${compParts[0]}` : c.key;
                    csvContent += `${e.inep};${e.denominação};${e.designação};${compLabel};${progName};${b.extCC};${b.extINV};${b.notaFiscal};${b.consAssessoria};${b.declBBAgil};${encamp};${v.resultadoBonif.toUpperCase()}\n`;
                }
            });
        });
    });

    const activeCompParts = activeCompetenciaKey.split('-');
    const activeCompLabel = activeCompParts.length === 2 ? `${activeCompParts[1]}-${activeCompParts[0]}` : activeCompetenciaKey;

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `RADAR_PDDE_BONIFICACAO_${activeCompLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    registerLog('Relatório Exportado', `Exportação da planilha consolidada de bonificações efetuada com sucesso.`);
}


// ==========================================
// 20. ALTERNADOR DE TEMA (CLARO/ESCURO)
// ==========================================

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('radar_pdde_theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
    registerLog('Tema Alterado', `Tema visual alterado para ${isDark ? 'Escuro' : 'Claro'}.`);
}

function updateThemeIcon(isDark) {
    const icon = document.getElementById('theme-icon');
    if (!icon) return;
    if (isDark) {
        // Ícone do Sol (para voltar para o Claro)
        icon.innerHTML = `
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        `;
        document.getElementById('theme-toggle-btn').title = "Mudar para Tema Claro";
    } else {
        // Ícone da Lua (para mudar para o Escuro)
        icon.innerHTML = `
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        `;
        document.getElementById('theme-toggle-btn').title = "Mudar para Tema Escuro";
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('radar_pdde_theme') || 'light';
    const isDark = savedTheme === 'dark';
    if (isDark) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    updateThemeIcon(isDark);
}


// ==========================================
// 21. BOOTSTRAP DA APLICAÇÃO
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    await initData();
    initTheme();
    switchProfile('controlador'); // Inicia como Controlador para simular a visão principal
});
