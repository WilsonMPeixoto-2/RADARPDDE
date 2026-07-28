Warning: truncated output (original token count: 116969)
Total output lines: 11474

// RADAR PDDE - Lógica Operacional e Gerenciamento de Estado (MVP)

// ==========================================
// 1. DADOS INICIAIS DA PLANILHA 4ª CRE

// ==========================================

const INITIAL_PROGRAMS = [
    {
        "id": "BASIC",
        "name": "PDDE Básico",
        "desc": "Recursos gerais de custeio e capital."
    },
    {
        "id": "CONECTADA",
        "name": "Educação Conectada",
        "desc": "Inovação e conectividade escolar."
    },
    {
        "id": "PROEC",
        "name": "PROEC",
        "desc": "Programa de apoio às escolas de ensino integral."
    },
    {
        "id": "ED_FAMILIA",
        "name": "Educação e Família",
        "desc": "Fomento à participação das famílias."
    },
    {
        "id": "ADOLESCENCIAS",
        "name": "Escola das Adolescências",
        "desc": "Apoio aos anos finais do ensino fundamental."
    },
    {
        "id": "LEITURA",
        "name": "Cantinho da Leitura",
        "desc": "Leitura e alfabetização."
    },
    {
        "id": "TEMPO_APRENDER",
        "name": "Tempo de Aprender",
        "desc": "Apoio pedagógico para alfabetização."
    },
    {
        "id": "RECURSOS",
        "name": "Sala de Recursos",
        "desc": "Atendimento educacional especializado."
    }
];

const INITIAL_CONTROLADORES = [
    {
        "id": "wilson_peixoto",
        "name": "Wilson Peixoto",
        "email": ""
    },
    {
        "id": "alzira_de_souza",
        "name": "Alzira de Souza",

        "email": ""
    },
    {
        "id": "erica",
        "name": "Érika Reis",
        "email": ""
    },
    {
        "id": "monica_chagas",
        "name": "Mônica Chagas",

        "email": ""
    },
    {
        "id": "tuane_coutinho",
        "name": "Tuane Coutinho",
        "email": ""
    }
];

const INITIAL_ESCOLAS = [

    {
        "id": "04.10.001",
        "denominação": "Escola Municipal Ema Negrão de Lima",
        "designação": "04.10.001",
        "telefone": "2562-3948 / 2241-1189",
        "telefoneCelularInstitucional": "21992884147",
        "email": "emema@rioeduca.net",
        "diretor": "MARIA DE LURDES PEREIRA DOS SANTOS",
        "telefoneDiretor": "96417-6296",
        "diretorAdjunto": "KATIA VELLOZO FERREIRA CAVALCANTE",
        "telefoneDiretorAdjunto": "99957-2698",
        "inep": "33069247",
        "cnpj": "04.500.463/0001-73",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11263",
        "controladorId": "erica",
        "processoInventario": "000704.004882/2026-01",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.002",
        "denominação": "Escola Municipal Albino Souza Cruz",
        "designação": "04.10.002",
        "telefone": "2218-8038 /2228-5392",
        "telefoneCelularInstitucional": "21992864637",
        "email": "emscruz@rioeduca.net",
        "diretor": "ANDRÉA DOS SANTOS SIMÕES",
        "telefoneDiretor": "99543-1893",
        "diretorAdjunto": "RENATA DIAS GARROT",
        "telefoneDiretorAdjunto": "96829-4465",
        "inep": "33069093",
        "cnpj": "04.552.825/0001-70",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11264",
        "controladorId": "erica",
        "processoInventario": "000704.005024/2026-75",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.003",
        "denominação": "Escola Municipal Ruy Barbosa",
        "designação": "04.10.003",
        "telefone": "2562-3949 e 2562-3950",
        "telefoneCelularInstitucional": "21992863594",
        "email": "emruyb@rioeduca.net",
        "diretor": "IVONE LUISA FRANCISCO FERREIRA",
        "telefoneDiretor": "99803-9352",
        "diretorAdjunto": "VIVIANE MOREIRA THOMAZ RODRIGUES",
        "telefoneDiretorAdjunto": "97016-6769",
        "inep": "33069433",
        "cnpj": "01.856.391/0001-03",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11265",
        "controladorId": "erica",
        "processoInventario": "000704.005089/2026-11",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC",
            "ED_FAMILIA",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.004",
        "denominação": "Escola Municipal Pedro Lessa",
        "designação": "04.10.004",
        "telefone": "2562-3951",
        "telefoneCelularInstitucional": "21992861095",
        "email": "empedro@rioeduca.net",
        "diretor": "ANDRÉA PAULA PAIVA NASCIMENTO",
        "telefoneDiretor": "99892-1335",
        "diretorAdjunto": "PAULO VANDER FERREIRA SANTANA",
        "telefoneDiretorAdjunto": "99965-1674",
        "inep": "33069379",
        "cnpj": "04.974.720/0001-09",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11266",
        "controladorId": "erica",
        "processoInventario": "000704.004792/2026-10",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.005",
        "denominação": "Escola Municipal João Barbalho",
        "designação": "04.10.005",
        "telefone": "2562-3955",
        "telefoneCelularInstitucional": "21992858053",
        "email": "embarbalho@rioeduca.net",
        "diretor": "ELDO MARCELINO FAGUNDES",
        "telefoneDiretor": "97018-7155",
        "diretorAdjunto": "CLAUDIO HENRIQUE SALES DE SOUZA",
        "telefoneDiretorAdjunto": "98217-4183",
        "inep": "33069271",
        "cnpj": "01.226.403/0001-16",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11267",
        "controladorId": "erica",
        "processoInventario": "000704.004922/2026-14",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.006",
        "denominação": "Escola Municipal Professor Carneiro Ribeiro",
        "designação": "04.10.006",
        "telefone": "2562-3957  /  2562-3958",
        "telefoneCelularInstitucional": "21992840623",
        "email": "emcarneiror@rioeduca.net",
        "diretor": "ELAINE TAVARES VIEIRA SOARES",
        "telefoneDiretor": "99493-1173",
        "diretorAdjunto": "SIMONE DUARTE MAIA DE LIMA DOS ANJOS",
        "telefoneDiretorAdjunto": "98034-6861",
        "inep": "33069409",
        "cnpj": "05.406.794/0001-01",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11268",
        "controladorId": "erica",
        "processoInventario": "000704.004803/2026-53",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.007",
        "denominação": "Escola Municipal Padre Manuel da Nóbrega",
        "designação": "04.10.007",
        "telefone": "2562-3933 / 2562-3935",
        "telefoneCelularInstitucional": "21992831921",
        "email": "emnobrega@rioeduca.net",
        "diretor": "CLAUDIA DA COSTA MUDESTO FERNANDES",
        "telefoneDiretor": "99811-4108",
        "diretorAdjunto": "ELENICE MARIA VIEIRA DE ARAUJO",
        "telefoneDiretorAdjunto": "99473-1590 / 99398-8045",
        "inep": "33069360",
        "cnpj": "01.451.980/0001-01",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11269",
        "controladorId": "erica",
        "processoInventario": "000704.004915/2026-12",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.008",
        "denominação": "Escola Municipal Walt Disney",
        "designação": "04.10.008",
        "telefone": "2562-3939",
        "telefoneCelularInstitucional": "21992831321",
        "email": "emdisney@rioeduca.net",
        "diretor": "VALÉRIA MARIA CARLOS SEMIDEI",
        "telefoneDiretor": "98881-0623",
        "diretorAdjunto": "SIMONE CRISTINA BORBA DE OLIVEIRA",
        "telefoneDiretorAdjunto": "99194-3691",
        "inep": "33069468",
        "cnpj": "01.197.182/0001-03",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11270",
        "controladorId": "erica",
        "processoInventario": "000704.005057/2026-15",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.009",
        "denominação": "Escola Municipal Dilermando Cruz",
        "designação": "04.10.009",
        "telefone": "2562-3943",
        "telefoneCelularInstitucional": "21992830125",
        "email": "emdcruz@rioeduca.net",
        "diretor": "THIAGO MENDONÇA DOS SANTOS",
        "telefoneDiretor": "99444-0502",
        "diretorAdjunto": "MICHELY LOPES CAMPBELL DA SILVA",
        "telefoneDiretorAdjunto": "99819-8817",
        "inep": "33069220",
        "cnpj": "01.859.799/0001-39",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11271",
        "controladorId": "erica",
        "processoInventario": "000704.004954/2026-10",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.010",
        "denominação": "Escola Municipal Nerval de Gouveia",
        "designação": "04.10.010",
        "telefone": "3885-2057",
        "telefoneCelularInstitucional": "21992821871",
        "email": "emnerval@rioeduca.net",
        "diretor": "EDSON DIAS ALECYR",
        "telefoneDiretor": "96405-9724",
        "diretorAdjunto": "JAMILLY GOMES MONTEIRO",
        "telefoneDiretorAdjunto": "97626-3003",
        "inep": "33069328",
        "cnpj": "05.485.540/0001-26",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11272",
        "controladorId": "erica",
        "processoInventario": "000704.004888/2026-70",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC",
            "ADOLESCENCIAS",
            "RECURSOS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.011",
        "denominação": "Escola Municipal Edmundo Lins",
        "designação": "04.10.011",
        "telefone": "3885-2342",
        "telefoneCelularInstitucional": "21992821614",
        "email": "emlins@rioeduca.net",
        "diretor": "ERIC MORITZ DE CAMPOS",
        "telefoneDiretor": "98128-0303",
        "diretorAdjunto": "JULIANA LOTUFO SOARES",
        "telefoneDiretorAdjunto": "99966-9615",
        "inep": "33069239",
        "cnpj": "01.320.115/0001-26",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11273",
        "controladorId": "erica",
        "processoInventario": "000704.004926/2026-94",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.013",
        "denominação": "Escola Municipal Carlos Chagas",
        "designação": "04.10.013",
        "telefone": "3885-2344 /3885-2346",
        "telefoneCelularInstitucional": "21992789254",
        "email": "emchagas@rioeduca.net",
        "diretor": "MARALILA SAMPAIO DOS SANTOS",
        "telefoneDiretor": "96466-0658",
        "diretorAdjunto": "ROBERTA AMARO RIBEIRO",
        "telefoneDiretorAdjunto": "99201-7183",
        "inep": "33069166",
        "cnpj": "03.108.351/0001-09",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11275",
        "controladorId": "erica",
        "processoInventario": "000704.004887/2026-25",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "ADOLESCENCIAS",
            "RECURSOS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.015",
        "denominação": "Escola Municipal Clóvis Beviláqua",
        "designação": "04.10.015",
        "telefone": "2573-5709 / 2573-3552",
        "telefoneCelularInstitucional": "21992785398",
        "email": "emclovis@rioeduca.net",
        "diretor": "LUCIANA DA COSTA MARQUES",
        "telefoneDiretor": "99466-4207",
        "diretorAdjunto": "ALESSANDRA DAMASCENO OLIVEIRA",
        "telefoneDiretorAdjunto": "99166-0676",
        "inep": "33069190",
        "cnpj": "02.034.159/0001-52",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11277",
        "controladorId": "erica",
        "processoInventario": "000704.004924/2026-03",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.016",
        "denominação": "Escola Municipal Chile",
        "designação": "04.10.016",
        "telefone": "3885-2181",
        "telefoneCelularInstitucional": "21992772778",
        "email": "emchile@rioeduca.net",
        "diretor": "ROSELI SOBREIRA BORREGO",
        "telefoneDiretor": "98798-1223",
        "diretorAdjunto": "LIDIANE GARCIA DE MATTOS",
        "telefoneDiretorAdjunto": "96686-5896",
        "inep": "33069174",
        "cnpj": "05.624.227/0001-21",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11278",
        "controladorId": "erica",
        "processoInventario": "000704.005020/2026-97",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.018",
        "denominação": "Escola Municipal Berlim",
        "designação": "04.10.018",
        "telefone": "3868-9821",
        "telefoneCelularInstitucional": "21992759694",
        "email": "emberlim@rioeduca.net",
        "diretor": "MARIA IGNEZ CECCOPIERI BAPTISTA",
        "telefoneDiretor": "99438-8488",
        "diretorAdjunto": "ADRIANA OLIVEIRA SANTIAGO",
        "telefoneDiretorAdjunto": "96405-3370",
        "inep": "33069140",
        "cnpj": "01.194.306/0001-99",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11280",
        "controladorId": "erica",
        "processoInventario": "000704.005047/2026-80",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.020",
        "denominação": "Escola Municipal Joracy Camargo",
        "designação": "04.10.020",
        "telefone": "3886-1825",
        "telefoneCelularInstitucional": "21992758389",
        "email": "emjoracy@rioeduca.net",
        "diretor": "TELMA DA SILVA TEIXEIRA MENDES",
        "telefoneDiretor": "98636-3663",
        "diretorAdjunto": "PRISCILA DA SILVA DORNELAS",
        "telefoneDiretorAdjunto": "99525-3634",
        "inep": "33069280",
        "cnpj": "01.197.673/0001-46",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11282",
        "controladorId": "erica",
        "processoInventario": "000704.004831/2026-71",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC",
            "ED_FAMILIA",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.021",
        "denominação": "Escola Municipal Brasil",
        "designação": "04.10.021",
        "telefone": "3885-3830",
        "telefoneCelularInstitucional": "21992748050",
        "email": "embrasil@rioeduca.net",
        "diretor": "MÁRCIA RODRIGUES DA SILVEIRA SANTOS",
        "telefoneDiretor": "98238-9465",
        "diretorAdjunto": "ANA CRISTINA CALHEIROS DE SOUZA CABRAL",
        "telefoneDiretorAdjunto": "99973-2189",
        "inep": "33069158",
        "cnpj": "01.158.075/0001-68",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11283",
        "controladorId": "erica",
        "processoInventario": "000704.004975/2026-27",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.022",
        "denominação": "Escola Municipal Odilon de Andrade",
        "designação": "04.10.022",
        "telefone": "3209-5514",
        "telefoneCelularInstitucional": "21992744782",
        "email": "emodilon@rioeduca.net",
        "diretor": "LEANDRO OLIVEIRA DE ALMEIDA",
        "telefoneDiretor": "96417-7470",
        "diretorAdjunto": "LUDWIG FERREIRA ARAUJO",
        "telefoneDiretorAdjunto": "98083-2073",
        "inep": "33069336",
        "cnpj": "01.235.532/0001-70",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11284",
        "controladorId": "erica",
        "processoInventario": "000704.004788/2026-43",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.023",
        "denominação": "Escola Municipal Luiz Cesar Sayão Garcez",
        "designação": "04.10.023",
        "telefone": "3885-3370 / 3885-3874",
        "telefoneCelularInstitucional": "21992593599",
        "email": "emgarcez@rioeduca.net",
        "diretor": "CRISTIANE DUTRA LANOR DA SILVA",
        "telefoneDiretor": "96467-7889",
        "diretorAdjunto": "LUCIANA SANTOS NUNES",
        "telefoneDiretorAdjunto": "99259-3599",
        "inep": "33069301",
        "cnpj": "04.847.415/0001-56",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11285",
        "controladorId": "erica",
        "processoInventario": "000704.004875/2026-09",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC",
            "ED_FAMILIA",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.025",
        "denominação": "Escola Municipal Anibal Freire",
        "designação": "04.10.025",
        "telefone": "3885-3578 / 3885-4561",
        "telefoneCelularInstitucional": "21992410014",
        "email": "emanibal@rioeduca.net",
        "diretor": "BERNILDA LEOBONS SILVA",
        "telefoneDiretor": "98508-2558",
        "diretorAdjunto": "JOSIMAR MENDES DA SILVA",
        "telefoneDiretorAdjunto": "99206-6095",
        "inep": "33069115",
        "cnpj": "01.376.044/0001-83",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11287",
        "controladorId": "erica",
        "processoInventario": "000704.005035/2026-55",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.026",
        "denominação": "Escola Municipal Professora Maria de Cerqueira e Silva",
        "designação": "04.10.026",
        "telefone": "99240-7498",
        "telefoneCelularInstitucional": "21992407498",
        "email": "emmariac@rioeduca.net",
        "diretor": "VANESSA RODRIGUES MORAES DO NASCIMENTO",
        "telefoneDiretor": "99490-7717",
        "diretorAdjunto": "LILIANE SADER DE SOUZA MELLO",
        "telefoneDiretorAdjunto": "99791-8731",
        "inep": "33069395",
        "cnpj": "02.820.657/0001-20",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11288",
        "controladorId": "erica",
        "processoInventario": "000704.005079/2026-85",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.202",
        "denominação": "Ciep Yuri Gagarin",
        "designação": "04.10.202",
        "telefone": "3868-0532 / 3977-8196",
        "telefoneCelularInstitucional": "21992399733",
        "email": "ciepyuri@rioeduca.net",
        "diretor": "VALÉRIA CARNEIRO FERNANDES",
        "telefoneDiretor": "96428-6687",
        "diretorAdjunto": "MARGARETH OLIVEIRA DE ALMEIDA",
        "telefoneDiretorAdjunto": "98869-9208",
        "inep": "33068755",
        "cnpj": "05.374.513/0001-86",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11567",
        "controladorId": "erica",
        "processoInventario": "000704.004957/2026-45",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC",
            "LEITURA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.501",
        "denominação": "Ciep Juscelino Kubitschek",
        "designação": "04.10.501",
        "telefone": "3885-5579 / 3885-5580",
        "telefoneCelularInstitucional": "21992390194",
        "email": "ciepjk@rioeduca.net",
        "diretor": "GUSTAVO ALBERTO OTSUKA OLIVEIRA DE MENEZES",
        "telefoneDiretor": "99964-8334",
        "diretorAdjunto": "TERESA CRISTINA AGUIAR MARQUES",
        "telefoneDiretorAdjunto": "99624-6550",
        "inep": "33068798",
        "cnpj": "02.894.802/0001-18",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11564",
        "controladorId": "erica",
        "processoInventario": "000704.004974/2026-82",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.502",
        "denominação": "Ciep Maestro Francisco Mignone",
        "designação": "04.10.502",
        "telefone": "3209-5536 / 99238-9499",
        "telefoneCelularInstitucional": "21992389499",
        "email": "ciepmignone@rioeduca.net",
        "diretor": "ADRIANA CASTRO SILVA KOENIGKAM",
        "telefoneDiretor": "98420-1205",
        "diretorAdjunto": "SHEILA BENÍCIO ROCHA DE SOUZA",
        "telefoneDiretorAdjunto": "96752-6989",
        "inep": "33068763",
        "cnpj": "02.784.061/0001-12",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11289",
        "controladorId": "erica",
        "processoInventario": "000704.005032/2026-11",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.601",
        "denominação": "Creche Municipal Manguinhos",
        "designação": "04.10.601",
        "telefone": "3886-0293",
        "telefoneCelularInstitucional": "21992387367",
        "email": "cmmanguinhos@rioeduca.net",
        "diretor": "LUCIANA CERQUEIRA DOS SANTOS",
        "telefoneDiretor": "99667-1548",
        "diretorAdjunto": "LUCIANE PORTES DE LACERDA PAULA",
        "telefoneDiretorAdjunto": "99224-7246",
        "inep": "33136947",
        "cnpj": "12.558.497/0001-47",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "18620",
        "controladorId": "erica",
        "processoInventario": "000704.005053/2026-37",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.602",
        "denominação": "Creche Municipal Dr. Juvenil de Souza Lopes",
        "designação": "04.10.602",
        "telefone": "3977-5748 / 99238-3984",
        "telefoneCelularInstitucional": "21992383984",
        "email": "cmdlopes@rioeduca.net",
        "diretor": "SANDRA OLIVIA REIS DE SOUZA",
        "telefoneDiretor": "99491-9934",
        "diretorAdjunto": "ROSANI MACHADO NUNES",
        "telefoneDiretorAdjunto": "96430-3176",
        "inep": "33096511",
        "cnpj": "12.672.659/0001-73",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "18680",
        "controladorId": "erica",
        "processoInventario": "000704.005003/2026-50",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.603",
        "denominação": "Creche Municipal Chico Bento",
        "designação": "04.10.603",
        "telefone": "3886-8952 / 99238-0993",
        "telefoneCelularInstitucional": "21992380993",
        "email": "cmcbento@rioeduca.net",
        "diretor": "BIANCA MEDRADO MONTEIRO DO NASCIMENTO",
        "telefoneDiretor": "96840-0378",
        "diretorAdjunto": "IRANI OLIVEIRA DA SILVA",
        "telefoneDiretorAdjunto": "99644-0195",
        "inep": "33096538",
        "cnpj": "12.128.507/0001-04",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "18666",
        "controladorId": "erica",
        "processoInventario": "000704.004783/2026-11",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.701",
        "denominação": "Centro de Educação de Jovens e Adultos CEJA - Avenida Brasil",
        "designação": "04.10.701",
        "telefone": "2573-6566 / 3867-3179 / 99280-6278",
        "telefoneCelularInstitucional": "21992806278",
        "email": "cejabrasil@rioeduca.net",
        "diretor": "ROSANGELA OLIVEIRA DA SILVA",
        "telefoneDiretor": "97601-1348",
        "diretorAdjunto": "",
        "telefoneDiretorAdjunto": "",
        "inep": "33069182",
        "cnpj": "02.808.542/0001-10",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11274",
        "controladorId": "erica",
        "processoInventario": "000704.005138/2026-15",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.801",
        "denominação": "EDI Doutor Domingos Arthur Machado Filho",
        "designação": "04.10.801",
        "telefone": "3878-0442",
        "telefoneCelularInstitucional": "21992369101",
        "email": "edimachadofilho@rioeduca.net",
        "diretor": "ANA LÚCIA SALVADORA GRISOLIA",
        "telefoneDiretor": "99922-8366",
        "diretorAdjunto": "PARAGUASSU BAPTISTA",
        "telefoneDiretorAdjunto": "97161-1561",
        "inep": "33523258",
        "cnpj": "18.959.919/0001-72",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "43114",
        "controladorId": "erica",
        "processoInventario": "000704.005036/2026-08",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.802",
        "denominação": "EDI Doutor Antônio Fernandes Figueira",
        "designação": "04.10.802",
        "telefone": "3887-4595",
        "telefoneCelularInstitucional": "21992364524",
        "email": "ediantoniofernandes@rioeduca.net",
        "diretor": "MARCELO VILA NOVA DE LIMA",
        "telefoneDiretor": "99417-5006",
        "diretorAdjunto": "ELIZABETH ROMUALDO DOS SANTOS",
        "telefoneDiretorAdjunto": "97940-0841",
        "inep": "33160902",
        "cnpj": "17.571.841/0001-51",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "43916",
        "controladorId": "erica",
        "processoInventario": "000704.004983/2026-73",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.803",
        "denominação": "EDI Joaquim Venâncio",
        "designação": "04.10.803",
        "telefone": "3887-4500",
        "telefoneCelularInstitucional": "21992364099",
        "email": "edijvenancio@rioeduca.net",
        "diretor": "IAGO DE ARAUJO SILVA",
        "telefoneDiretor": "97919-6730",
        "diretorAdjunto": "SHEILA CRISTINA PEREIRA DOS SANTOS",
        "telefoneDiretorAdjunto": "99019-6555",
        "inep": "33160910",
        "cnpj": "17.561.015/0001-21",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "43915",
        "controladorId": "erica",
        "processoInventario": "000704.004818/2026-11",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.804",
        "denominação": "EDI Sargento Jorge Faleiro Souza",
        "designação": "04.10.804",
        "telefone": "2573-6275",
        "telefoneCelularInstitucional": "21992356685",
        "email": "edifaleiro@rioeduca.net",
        "diretor": "MARGARETH DE SOUZA TEODORO",
        "telefoneDiretor": "97990-7152",
        "diretorAdjunto": "KEITY CRISTINA COSTA DA SILVA",
        "telefoneDiretorAdjunto": "97614-9617",
        "inep": "33163979",
        "cnpj": "17.318.714/0001-45",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "44459",
        "controladorId": "erica",
        "processoInventario": "000704.004858/2026-63",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.805",
        "denominação": "EDI Compositor Neoci Dias de Andrade",
        "designação": "04.10.805",
        "telefone": "3223-4996 / 2573-6858",
        "telefoneCelularInstitucional": "21992354136",
        "email": "edineoci@rioeduca.net",
        "diretor": "SUELI DE LEMOS MORSCH",
        "telefoneDiretor": "98364-0393",
        "diretorAdjunto": "JULIETH DE SOUZA RIBEIRO DA SILVA",
        "telefoneDiretorAdjunto": "98764-1995",
        "inep": "33163987",
        "cnpj": "17.553.027/0001-04",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "44458",
        "controladorId": "erica",
        "processoInventario": "000704.004834/2026-12",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.806",
        "denominação": "EDI Pierre Janet",
        "designação": "04.10.806",
        "telefone": "3885-2347",
        "telefoneCelularInstitucional": "21992343298",
        "email": "edijanet@rioeduca.net",
        "diretor": "EDIJANES DA SILVA BITTENCOURT DE CARVALHO",
        "telefoneDiretor": "99620-5991",
        "diretorAdjunto": "ELISABETH FERREIRA PRONESTINO",
        "telefoneDiretorAdjunto": "98725-4098",
        "inep": "33069387",
        "cnpj": "13.898.976/0001-75",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11276",
        "controladorId": "erica",
        "processoInventario": "000704.005055/2026-26",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.807",
        "denominação": "EDI Professora Tania da Rocha Correa",
        "designação": "04.10.807",
        "telefone": "3886-0054",
        "telefoneCelularInstitucional": "21992340324",
        "email": "editaniacorrea@rioeduca.net",
        "diretor": "PATRICIA DANIELE ALVARENGA DE MELO",
        "telefoneDiretor": "96416-3940",
        "diretorAdjunto": "GISELE SILVA MOREIRA GUIMARÃES RÉGULO",
        "telefoneDiretorAdjunto": "99221-5252",
        "inep": "33171092",
        "cnpj": "20.549.732/0001-42",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "45420",
        "controladorId": "erica",
        "processoInventario": "000704.004851/2026-41",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.808",
        "denominação": "EDI Almir Leite Ribeiro",
        "designação": "04.10.808",
        "telefone": "3886-0943 / 99233-8855",
        "telefoneCelularInstitucional": "21992338855",
        "email": "ediaribeiro@rioeduca.net",
        "diretor": "GABRIEL OLIVEIRA DE CARVALHO",
        "telefoneDiretor": "97403-0853",
        "diretorAdjunto": "VALDELICE DE OLIVEIRA CIPRIANO",
        "telefoneDiretorAdjunto": "97563-0916",
        "inep": "33171106",
        "cnpj": "21.470.618/0001-95",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "45571",
        "controladorId": "erica",
        "processoInventario": "000704.004932/2026-41",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.810",
        "denominação": "EDI Miguel Couto",
        "designação": "04.10.810",
        "telefone": "3885-3079 / 3885-3901",
        "telefoneCelularInstitucional": "21992334191",
        "email": "emcouto@rioeduca.net",
        "diretor": "MAGALY DINIZ DE SOUZA MOURA",
        "telefoneDiretor": "98582-1985",
        "diretorAdjunto": "CLAUDIA DE AZEVEDO LIMA",
        "telefoneDiretorAdjunto": "97216-8499",
        "inep": "33070679",
        "cnpj": "01.155.025/0001-27",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11286",
        "controladorId": "erica",
        "processoInventario": "000704.004878/2026-34",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.811",
        "denominação": "EDI Lais Netto dos Reis",
        "designação": "04.10.811",
        "telefone": "3885-2866",
        "telefoneCelularInstitucional": "21992332962",
        "email": "emlais@rioeduca.net",
        "diretor": "MARIA APARECIDA DANTAS RODRIGUES",
        "telefoneDiretor": "96429-0308",
        "diretorAdjunto": "WALESKA DANTAS DAMASCENO NASCIMENTO",
        "telefoneDiretorAdjunto": "96422-4204",
        "inep": "33069298",
        "cnpj": "01.226.405/0001-05",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11279",
        "controladorId": "erica",
        "processoInventario": "000704.004861/2026-87",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.10.812",
        "denominação": "EDI Coronel Assunção",
        "designação": "04.10.812",
        "telefone": "3885-2946 / 99233-1633",
        "telefoneCelularInstitucional": "21992331633",
        "email": "ediassuncao@rioeduca.net",
        "diretor": "RENATA BORGES PESSANHA",
        "telefoneDiretor": "98380-3366",
        "diretorAdjunto": "LEILA CRISTINA CORREA DE LIMA ARIZÔT ARAGÃO",
        "telefoneDiretorAdjunto": "98656-6673",
        "inep": "33069204",
        "cnpj": "01.325.768/0001-06",
        "cre": "4ª CRE",
        "ra": "10ª R.A.",
        "sici": "11281",
        "controladorId": "erica",
        "processoInventario": "000704.005018/2026-18",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.001",
        "denominação": "Escola Municipal Monsenhor Rocha",
        "designação": "04.11.001",
        "telefone": "99232-1366",
        "telefoneCelularInstitucional": "21992321366",
        "email": "emmrocha@rioeduca.net",
        "diretor": "PRISCILA CAMILA CARDOSO RODRIGUES",
        "telefoneDiretor": "99423-3665",
        "diretorAdjunto": "RITA DE CÁSSIA SOARES MIRANDA",
        "telefoneDiretorAdjunto": "99264-0207",
        "inep": "33070725",
        "cnpj": "03.530.444/0001-27",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11478",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004914/2026-60",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC",
            "ED_FAMILIA",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.002",
        "denominação": "Escola Municipal Bernardo de Vasconcellos",
        "designação": "04.11.002",
        "telefone": "99231-2473",
        "telefoneCelularInstitucional": "21992312473",
        "email": "embernardo@rioeduca.net",
        "diretor": "RENATO LIMA SAMPAIO",
        "telefoneDiretor": "98199-6704",
        "diretorAdjunto": "LAZIANE LOURENÇO DE ANDRADE",
        "telefoneDiretorAdjunto": "98170-0462",
        "inep": "33070458",
        "cnpj": "01.235.528/0001-02",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11372",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004939/2026-63",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.004",
        "denominação": "Escola Municipal Leonor Coelho Pereira",
        "designação": "04.11.004",
        "telefone": "98909-3108",
        "telefoneCelularInstitucional": "21992302702",
        "email": "emleonor@rioeduca.net",
        "diretor": "VERA LUCIA DE SOUZA CALDAS",
        "telefoneDiretor": "99632-6335",
        "diretorAdjunto": "",
        "telefoneDiretorAdjunto": "",
        "inep": "33070660",
        "cnpj": "03.172.518/0001-09",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11370",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.005012/2026-41",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.005",
        "denominação": "Escola Municipal Presidente Eurico Dutra",
        "designação": "04.11.005",
        "telefone": "2573-4149 / 3867-5586",
        "telefoneCelularInstitucional": "21992294923",
        "email": "emeurico@rioeduca.net",
        "diretor": "VÂNIA DE MATTOS AZEVEDO",
        "telefoneDiretor": "98715-6290",
        "diretorAdjunto": "SIMONE CRUZ DA SILVA",
        "telefoneDiretorAdjunto": "97599-5916",
        "inep": "33070768",
        "cnpj": "01.872.287/0001-02",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11369",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004969/2026-70",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC",
            "RECURSOS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.006",
        "denominação": "Escola Municipal Conde de Agrolongo",
        "designação": "04.11.006",
        "telefone": "3884-8623 / 3884-0256",
        "telefoneCelularInstitucional": "21992411175",
        "email": "emcagrolongo@rioeduca.net",
        "diretor": "RAFAELA BRAVO",
        "telefoneDiretor": "99314-0014",
        "diretorAdjunto": "ALINNE D'ARC RAMOS BASTOS",
        "telefoneDiretorAdjunto": "98741-1951",
        "inep": "33070512",
        "cnpj": "01.197.181/0001-50",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11368",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004785/2026-18",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.007",
        "denominação": "Escola Municipal Ariosto Espinheira",
        "designação": "04.11.007",
        "telefone": "2573-8535 / 2573-5675",
        "telefoneCelularInstitucional": "21992584364",
        "email": "emariosto@rioeduca.net",
        "diretor": "BIANCA DANTAS RODRIGUES",
        "telefoneDiretor": "96421-8228",
        "diretorAdjunto": "MARTHA VIRGÍNIIA DAS MERCÊS LOPES",
        "telefoneDiretorAdjunto": "98790-8608",
        "inep": "33070423",
        "cnpj": "04.511.496/0001-19",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11367",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004799/2026-23",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.008",
        "denominação": "Escola Municipal Professor Souza Carneiro",
        "designação": "04.11.008",
        "telefone": "3885-9354 / 99229-7358",
        "telefoneCelularInstitucional": "21992297358",
        "email": "emsouzac04@rioeduca.net",
        "diretor": "ELEN CRISTINA GUIOMAR DE OLIVEIRA",
        "telefoneDiretor": "99470-0411",
        "diretorAdjunto": "ELISABETH GARCIA BRAGANÇA DOS SANTOS",
        "telefoneDiretorAdjunto": "99311-2065",
        "inep": "33070814",
        "cnpj": "01.406.223/0001-16",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11366",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004955/2026-56",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.009",
        "denominação": "Escola Municipal Cientista Mário Kroeff",
        "designação": "04.11.009",
        "telefone": "3885-9360",
        "telefoneCelularInstitucional": "21992580390",
        "email": "emkroeff@rioeduca.net",
        "diretor": "MARCIA CRISTINA GARRIDO SOUZA",
        "telefoneDiretor": "97121-1506",
        "diretorAdjunto": "CAROLINA CARDOSO VIANA",
        "telefoneDiretorAdjunto": "99271-5310",
        "inep": "33070334",
        "cnpj": "01.197.186/0001-83",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11365",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.005080/2026-18",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "ADOLESCENCIAS",
            "LEITURA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.010",
        "denominação": "Escola Municipal Brant Horta",
        "designação": "04.11.010",
        "telefone": "2573-5758",
        "telefoneCelularInstitucional": "2199256-8897",
        "email": "embrant@rioeduca.net",
        "diretor": "MARJORIE MENDONÇA DA SILVA GUIMARÃES",
        "telefoneDiretor": "99755-5918",
        "diretorAdjunto": "THIAGO GOMES DE CARVALHO",
        "telefoneDiretorAdjunto": "98303-1267",
        "inep": "33070466",
        "cnpj": "01.918.335/0001-56",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11364",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.005076/2026-41",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.011",
        "denominação": "Escola Municipal Professor Augusto Motta",
        "designação": "04.11.011",
        "telefone": "2573-5045",
        "telefoneCelularInstitucional": "21992562629",
        "email": "emmotta@rioeduca.net",
        "diretor": "THAÍS FERNANDES PEREIRA DE OLIVEIRA",
        "telefoneDiretor": "99145-9589",
        "diretorAdjunto": "MARCELO HENRIQUE PEREIRA SOARES",
        "telefoneDiretorAdjunto": "99978-4974",
        "inep": "33070792",
        "cnpj": "01.194.881/0001-91",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11363",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004798/2026-89",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.012",
        "denominação": "Escola Municipal João Marques dos Reis",
        "designação": "04.11.012",
        "telefone": "3424-0166",
        "telefoneCelularInstitucional": "21992555015",
        "email": "emreis@rioeduca.net",
        "diretor": "KELLY CRISTINE VIEIRA REIS",
        "telefoneDiretor": "96940-0536",
        "diretorAdjunto": "LETÍCIA SANTIAGO DE OLIVEIRA",
        "telefoneDiretorAdjunto": "99846-2026",
        "inep": "33070636",
        "cnpj": "01.266.143/0001-02",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11362",
        "controladorId": "tuane_coutinho",
        "processoInventario": "",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.013",
        "denominação": "Escola Municipal Fernando Tude de Souza",
        "designação": "04.11.013",
        "telefone": "3137-8407",
        "telefoneCelularInstitucional": "21992549664",
        "email": "emtude@rioeduca.net",
        "diretor": "ANDERSON FELIX FERNANDES",
        "telefoneDiretor": "99487-1188",
        "diretorAdjunto": "LUANA GRAÇA NEVES",
        "telefoneDiretorAdjunto": "98538-8942",
        "inep": "33070580",
        "cnpj": "01.205.726/0001-23",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11479",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004980/2026-30",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC",
            "ADOLESCENCIAS",
            "RECURSOS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.014",
        "denominação": "Escola Municipal João de Deus",
        "designação": "04.11.014",
        "telefone": "3885-9481",
        "telefoneCelularInstitucional": "21992544217",
        "email": "emjdeus@rioeduca.net",
        "diretor": "VÂNIA FREITAS DE BRITO",
        "telefoneDiretor": "97480-8879",
        "diretorAdjunto": "CÍNTIA FERNANDES DE SOUZA",
        "telefoneDiretorAdjunto": "99196-1149",
        "inep": "33070628",
        "cnpj": "05.492.717/0001-11",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11361",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004909/2026-57",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.015",
        "denominação": "Escola Municipal Suíça",
        "designação": "04.11.015",
        "telefone": "3885-9485",
        "telefoneCelularInstitucional": "21992540850",
        "email": "emsuica@rioeduca.net",
        "diretor": "EDNA DE SOUZA FERREIRA",
        "telefoneDiretor": "97972-9402",
        "diretorAdjunto": "ROSÂNGELA ELIZABETH DANTAS ARON DE CASTRO",
        "telefoneDiretorAdjunto": "99371-7317",
        "inep": "33070881",
        "cnpj": "01.709.902/0001-64",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11360",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.005010/2026-51",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.017",
        "denominação": "Escola Municipal Ministro Afrânio Costa",
        "designação": "04.11.017",
        "telefone": "3885-9510 / 3882-8752",
        "telefoneCelularInstitucional": "21992523435",
        "email": "emafranio@rioeduca.net",
        "diretor": "FERNANDA LORENZO PAMPILLO MORAIS",
        "telefoneDiretor": "98324-8121",
        "diretorAdjunto": "REJANE GONÇALVES RODRIGUES",
        "telefoneDiretorAdjunto": "97276-8956",
        "inep": "33070709",
        "cnpj": "04.130.541/0001-95",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11358",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004918/2026-48",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.018",
        "denominação": "Escola Municipal Professor Ary Quintella",
        "designação": "04.11.018",
        "telefone": "3252-0014  /3424-3613",
        "telefoneCelularInstitucional": "21992518102",
        "email": "emquintella@rioeduca.net",
        "diretor": "ANDRÉA BRAGA PINTO VIANNA",
        "telefoneDiretor": "99491-1009",
        "diretorAdjunto": "DENIZE RICARDO PEREIRA",
        "telefoneDiretorAdjunto": "99457-8828",
        "inep": "33070784",
        "cnpj": "05.011.104/0001-15",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11357",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004791/2026-67",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.020",
        "denominação": "Escola Municipal Grécia",
        "designação": "04.11.020",
        "telefone": "2472-3777 / 3457-1442",
        "telefoneCelularInstitucional": "21992505549",
        "email": "emgrecia@rioeduca.net",
        "diretor": "MARIA DA GLORIA FERREIRA DA COSTA",
        "telefoneDiretor": "98282-1371",
        "diretorAdjunto": "MARCILENE FERREIRA MATHEUS",
        "telefoneDiretorAdjunto": "98254-0433",
        "inep": "33070113",
        "cnpj": "01.432.937/0001-07",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11355",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.005085/2026-32",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.021",
        "denominação": "Escola Municipal Miguel Ângelo",
        "designação": "04.11.021",
        "telefone": "3458-0645",
        "telefoneCelularInstitucional": "21992493909",
        "email": "emangelo@rioeduca.net",
        "diretor": "SUMAIRA LAMAR CALIL",
        "telefoneDiretor": "96413-8193",
        "diretorAdjunto": "ADRIANA CARDOSO MOREIRA",
        "telefoneDiretorAdjunto": "99796-7833",
        "inep": "33074593",
        "cnpj": "02.516.909/0001-22",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11354",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004795/2026-45",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.022",
        "denominação": "Escola Municipal Marcílio Dias",
        "designação": "04.11.022",
        "telefone": "2482-9777 / 2482-3311",
        "telefoneCelularInstitucional": "21992486346",
        "email": "emmarcilio@rioeduca.net",
        "diretor": "MARTA CARVALHO DE OLIVEIRA GOMES",
        "telefoneDiretor": "96450-6422",
        "diretorAdjunto": "TÂNIA CONCEIÇÃO DA SILVEIRA BORGES",
        "telefoneDiretorAdjunto": "99768-1953",
        "inep": "33074542",
        "cnpj": "01.549.332/0001-92",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11353",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004977/2026-16",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.023",
        "denominação": "Escola Municipal Ministro Plínio Casado",
        "designação": "04.11.023",
        "telefone": "2485-4305",
        "telefoneCelularInstitucional": "21992482520",
        "email": "emcasado@rioeduca.net",
        "diretor": "PAULA DIOGO DE SOUZA",
        "telefoneDiretor": "98102-7292",
        "diretorAdjunto": "ANDERSON CARLOS ALCÂNTARA DA SILVA",
        "telefoneDiretorAdjunto": "99431-9740",
        "inep": "33070717",
        "cnpj": "01.392.813/0001-37",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11352",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004823/2026-24",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.028",
        "denominação": "Escola Municipal São Paulo",
        "designação": "04.11.028",
        "telefone": "2485-5145 / 2485-3288 / 99246-5291",
        "telefoneCelularInstitucional": "21992465291",
        "email": "emsaopaulo@rioeduca.net",
        "diretor": "LEANDRO DO NASCIMENTO FARIAS",
        "telefoneDiretor": "99496-8882",
        "diretorAdjunto": "MICHELLE RAPOSO DA SILVA",
        "telefoneDiretorAdjunto": "97619-5166",
        "inep": "33070865",
        "cnpj": "01.285.788/0001-92",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11347",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004871/2026-12",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.036",
        "denominação": "Escola Municipal F. J. Oliveira Viana",
        "designação": "04.11.036",
        "telefone": "2485-2872",
        "telefoneCelularInstitucional": "21992464426",
        "email": "emfviana@rioeduca.net",
        "diretor": "ANA CAROLINA DOS SANTOS SEGAL GONÇALVES",
        "telefoneDiretor": "99531-3353  / 96436-4049 - ZAP",
        "diretorAdjunto": "JORDAN WALLACE ANJOS DA SILVA",
        "telefoneDiretorAdjunto": "99669-8853",
        "inep": "33070571",
        "cnpj": "01.243.944/0001-52",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11339",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.005078/2026-31",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.049",
        "denominação": "Escola Municipal Cantor e Compositor Gonzaguinha",
        "designação": "04.11.049",
        "telefone": "",
        "telefoneCelularInstitucional": "21992463050",
        "email": "emgonzagui@rioeduca.net",
        "diretor": "YARA RAMOS ANTUNES DA SILVA",
        "telefoneDiretor": "97567-0641",
        "diretorAdjunto": "ANDRESA DE ARAUJO MORAIS",
        "telefoneDiretorAdjunto": "98595-4996",
        "inep": "33070482",
        "cnpj": "01.464.150/0001-19",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11326",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.005087/2026-21",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "RECURSOS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.202",
        "denominação": "Ciep Gregório Bezerra",
        "designação": "04.11.202",
        "telefone": "99246-2040",
        "telefoneCelularInstitucional": "21992462040",
        "email": "ciepbezerra@rioeduca.net",
        "diretor": "PATRICIA DA SILVA PITTA DE MATTOS",
        "telefoneDiretor": "98479-8363",
        "diretorAdjunto": "ELIANE SIMÕES MENDES",
        "telefoneDiretorAdjunto": "98801-5027",
        "inep": "33069808",
        "cnpj": "02.034.313/0001-96",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11924",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004879/2026-89",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.502",
        "denominação": "Ciep Deputado José Carlos Brandão Monteiro",
        "designação": "04.11.502",
        "telefone": "98909-3104",
        "telefoneCelularInstitucional": "21992447911",
        "email": "ciepcarlosb@rioeduca.net",
        "diretor": "RACHEL NIGRE DE LIMA",
        "telefoneDiretor": "99810-5939",
        "diretorAdjunto": "BIANCA DUARTE E SILVA DE MORAES",
        "telefoneDiretorAdjunto": "99821-1680",
        "inep": "33069816",
        "cnpj": "01.260.828/0001-41",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11570",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.005039/2026-33",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.601",
        "denominação": "Creche Municipal Carlos Drummond de Andrade",
        "designação": "04.11.601",
        "telefone": "99244-1830",
        "telefoneCelularInstitucional": "21992441830",
        "email": "cmcandrade@rioeduca.net",
        "diretor": "CRISTINA SALVADORA FERREIRA",
        "telefoneDiretor": "99768-1277",
        "diretorAdjunto": "SILVIA DA LUZ OLIVEIRA FELIX",
        "telefoneDiretorAdjunto": "96419-1707",
        "inep": "33122822",
        "cnpj": "21.554.317/0001-40",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "18621",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004862/2026-21",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.602",
        "denominação": "Creche Municipal Tempo de Aprender",
        "designação": "04.11.602",
        "telefone": "3887-7742",
        "telefoneCelularInstitucional": "21992431678",
        "email": "cmtaprender@rioeduca.net",
        "diretor": "FLAVIA NUNES DA SILVA",
        "telefoneDiretor": "97119-9916",
        "diretorAdjunto": "RENATA CRISTINA PEREIRA TORDOYA",
        "telefoneDiretorAdjunto": "96918-8841",
        "inep": "33144672",
        "cnpj": "12.301.433/0001-66",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "18622",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004951/2026-78",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.603",
        "denominação": "Creche Municipal Morro da Paz",
        "designação": "04.11.603",
        "telefone": "99242-2066",
        "telefoneCelularInstitucional": "21992422066",
        "email": "cmmpaz@rioeduca.net",
        "diretor": "DANIELLE VIEIRA LINS FELIZARDO DE AZEVEDO",
        "telefoneDiretor": "99203-2887",
        "diretorAdjunto": "VIVIANE DE BRITO GOMES",
        "telefoneDiretorAdjunto": "96460-4448",
        "inep": "33147337",
        "cnpj": "12.285.566/0001-96",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "18623",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.005065/2026-61",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.604",
        "denominação": "Creche Municipal Betinho",
        "designação": "04.11.604",
        "telefone": "3886-1775",
        "telefoneCelularInstitucional": "21992418898",
        "email": "cmbetinho@rioeduca.net",
        "diretor": "ESTELA APARECIDA MARTINS",
        "telefoneDiretor": "98505-9159",
        "diretorAdjunto": "CARINE DA SILVA MACHADO",
        "telefoneDiretorAdjunto": "96479-8300",
        "inep": "33123063",
        "cnpj": "12.346.678/0001-00",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "18645",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004865/2026-65",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.605",
        "denominação": "Creche Municipal Caracol",
        "designação": "04.11.605",
        "telefone": "3886-1862",
        "telefoneCelularInstitucional": "21992411673",
        "email": "cmcaracol@rioeduca.net",
        "diretor": "EVANDRO MADRUGA DE OLIVEIRA",
        "telefoneDiretor": "96448-4002",
        "diretorAdjunto": "ANA LÚCIA LESSA DA FONSECA",
        "telefoneDiretorAdjunto": "96479-7769",
        "inep": "33096554",
        "cnpj": "12.518.272/0001-67",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "18661",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004856/2026-74",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.607",
        "denominação": "Creche Municipal Maria Altamira C. Olegário",
        "designação": "04.11.607",
        "telefone": "3457-0560",
        "telefoneCelularInstitucional": "21993392779",
        "email": "cmmolegario@rioeduca.net",
        "diretor": "ALESSANDRA DE SOUZA DASSIÉ",
        "telefoneDiretor": "98868-0077",
        "diretorAdjunto": "MARISE FERREIRA DE OLIVEIRA",
        "telefoneDiretorAdjunto": "98677-3394",
        "inep": "33122768",
        "cnpj": "12.246.672/0001-60",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "18720",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.005066/2026-14",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.609",
        "denominação": "Creche Municipal Tia Ruth Costa dos Santos",
        "designação": "04.11.609",
        "telefone": "3868-0003",
        "telefoneCelularInstitucional": "21993379902",
        "email": "cmtrsantos@rioeduca.net",
        "diretor": "MARIA CLAUDIA BALBINO CAMARGO MIRANDA",
        "telefoneDiretor": "99276-6428",
        "diretorAdjunto": "PATRICIA MARIA VENTURA BOMFIM",
        "telefoneDiretorAdjunto": "98541-1330",
        "inep": "33096368",
        "cnpj": "12.445.093/0001-47",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "18776",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.005033/2026-66",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.610",
        "denominação": "Creche Municipal Mussum - O Trapalhão",
        "designação": "04.11.610",
        "telefone": "99336-7175",
        "telefoneCelularInstitucional": "21993367175",
        "email": "cmmussum@rioeduca.net",
        "diretor": "ANDRÉA SILVA DE OLIVEIRA",
        "telefoneDiretor": "96463-3148",
        "diretorAdjunto": "MARÍLIA FERREIRA BARBOSA",
        "telefoneDiretorAdjunto": "97976-0469",
        "inep": "33144680",
        "cnpj": "12.290.969/0001-23",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "18729",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004916/2026-59",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.801",
        "denominação": "EDI Mariana Rocha de Souza",
        "designação": "04.11.801",
        "telefone": "3104-6454",
        "telefoneCelularInstitucional": "21993357618",
        "email": "edimariana@rioeduca.net",
        "diretor": "ALESSANDRA BRAGA BRITO ROCHA",
        "telefoneDiretor": "99451-7268",
        "diretorAdjunto": "PRISCILA REIS PEREIRA",
        "telefoneDiretorAdjunto": "98087-8090",
        "inep": "33164070",
        "cnpj": "17.112.690/0001-73",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "44185",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004982/2026-29",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.802",
        "denominação": "EDI Joel Luiz de Azevedo Bastos",
        "designação": "04.11.802",
        "telefone": "2482-3596",
        "telefoneCelularInstitucional": "21993349679",
        "email": "edijbastos@rioeduca.net",
        "diretor": "GLEICE KÉTERI QUEIROZ DA SILVA",
        "telefoneDiretor": "98056-7274",
        "diretorAdjunto": "JULIANA DE CARVALHO",
        "telefoneDiretorAdjunto": "97285-2785",
        "inep": "33164096",
        "cnpj": "17.042.644/0001-45",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "44417",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004880/2026-11",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.803",
        "denominação": "EDI Maria de Lourdes Ferreira",
        "designação": "04.11.803",
        "telefone": "3885-5202",
        "telefoneCelularInstitucional": "21993342445",
        "email": "edimariaferreira@rioeduca.net",
        "diretor": "ELINE MOREIRA FERREIRA DE OLIVEIRA",
        "telefoneDiretor": "98241-9105",
        "diretorAdjunto": "ELAINE COPELO DA SILVA",
        "telefoneDiretorAdjunto": "96421-2789",
        "inep": "33167877",
        "cnpj": "21.037.828/0001-94",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "45237",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004890/2026-49",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.804",
        "denominação": "EDI Morro da Fé",
        "designação": "04.11.804",
        "telefone": "3458-1406",
        "telefoneCelularInstitucional": "21993324639",
        "email": "edimfe@rioeduca.net",
        "diretor": "FERNANDA SILVA DE BARRETO",
        "telefoneDiretor": "98029-2898",
        "diretorAdjunto": "LUCIANA BRANDÃO GENTIL",
        "telefoneDiretorAdjunto": "96516-3722",
        "inep": "33095825",
        "cnpj": "12.369.459/0001-46",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "18728",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004913/2026-15",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "LEITURA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.805",
        "denominação": "EDI Edmundo da Luz Pinto",
        "designação": "04.11.805",
        "telefone": "3882-1089/3885-9497",
        "telefoneCelularInstitucional": "21993315199",
        "email": "ediluzpinto@rioeduca.net",
        "diretor": "VIVIANE MONDAINI RIZZO E SILVA",
        "telefoneDiretor": "96445-7296",
        "diretorAdjunto": "TAÍS FABIANE BORGES BARRETO",
        "telefoneDiretorAdjunto": "98864-3332",
        "inep": "33070547",
        "cnpj": "02.024.924/0001-53",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11359",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004988/2026-04",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.806",
        "denominação": "EDI Göethe",
        "designação": "04.11.806",
        "telefone": "2485-1888",
        "telefoneCelularInstitucional": "21993311865",
        "email": "edigoethe@rioeduca.net",
        "diretor": "MARIA CREUSA CORRÊA SANTOS",
        "telefoneDiretor": "99559-3467",
        "diretorAdjunto": "DANIELA ANDRADE FIGUEIREDO OLIVEIRA",
        "telefoneDiretorAdjunto": "99548-2731",
        "inep": "33070598",
        "cnpj": "03.188.922/0001-62",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11348",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004942/2026-87",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.808",
        "denominação": "EDI Pioneiras Sociais Nº 12",
        "designação": "04.11.808",
        "telefone": "3885-9166",
        "telefoneCelularInstitucional": "21993307208",
        "email": "edipioneiras@rioeduca.net",
        "diretor": "TAINÁ CINTIA OLIVEIRA DE MEDEIROS",
        "telefoneDiretor": "99800-5626",
        "diretorAdjunto": "EVELYN CHAVES GUIMARÃES FERNANDES",
        "telefoneDiretorAdjunto": "96442-1633",
        "inep": "33070750",
        "cnpj": "02.485.279/0001-76",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11356",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.005015/2026-84",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.11.809",
        "denominação": "EDI São Vicente",
        "designação": "04.11.809",
        "telefone": "3886-1767",
        "telefoneCelularInstitucional": "21993304798",
        "email": "emvicente@rioeduca.net",
        "diretor": "SILVANIA MORAES DIAS",
        "telefoneDiretor": "97173-2098",
        "diretorAdjunto": "FÁTIMA DOS SANTOS DO NASCIMENTO",
        "telefoneDiretorAdjunto": "99830-5247",
        "inep": "33070873",
        "cnpj": "01.530.851/0001-09",
        "cre": "4ª CRE",
        "ra": "11ª R.A.",
        "sici": "11371",
        "controladorId": "tuane_coutinho",
        "processoInventario": "000704.004786/2026-54",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.001",
        "denominação": "Escola Municipal Professor Josué de Castro",
        "designação": "04.30.001",
        "telefone": "3104-7747",
        "telefoneCelularInstitucional": "21993298643",
        "email": "emjosue@rioeduca.net",
        "diretor": "CHRISTIANE LAGARTO FONTOURA",
        "telefoneDiretor": "98708-3042",
        "diretorAdjunto": "AYRTON PEREIRA DA SILVA JUNIOR",
        "telefoneDiretorAdjunto": "99621-3892",
        "inep": "33069417",
        "cnpj": "02.900.428/0001-16",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "11591",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004806/2026-97",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.002",
        "denominação": "Escola Municipal Teotonio Vilela",
        "designação": "04.30.002",
        "telefone": "3104-8550 / 3104-7346",
        "telefoneCelularInstitucional": "21993297484",
        "email": "emvillela@rioeduca.net",
        "diretor": "SIMONE ARANHA DA SILVA PIMENTEL",
        "telefoneDiretor": "98272-1466",
        "diretorAdjunto": "TEREZA CRISTINA MATTOS DE CASTRO",
        "telefoneDiretorAdjunto": "97228-5558",
        "inep": "33069450",
        "cnpj": "07.361.588/0001-58",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "11590",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.005034/2026-19",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.003",
        "denominação": "Escola Municipal Bahia",
        "designação": "04.30.003",
        "telefone": "3104-6680 / 99329-5104",
        "telefoneCelularInstitucional": "21993295104",
        "email": "embahia@rioeduca.net",
        "diretor": "FLAVIO MARCIO SILVA ARAGÃO",
        "telefoneDiretor": "97409-2354",
        "diretorAdjunto": "THIAGO DOS SANTOS MARTINS",
        "telefoneDiretorAdjunto": "97027-5149",
        "inep": "33069131",
        "cnpj": "02.439.519/0001-04",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "11589",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.005054/2026-81",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.004",
        "denominação": "Escola Municipal IV Centenário",
        "designação": "04.30.004",
        "telefone": "3868-0010",
        "telefoneCelularInstitucional": "21993288168",
        "email": "emcentenario@rioeduca.net",
        "diretor": "ALESSANDRA DA CUNHA AGUIAR FONSECA",
        "telefoneDiretor": "98334-2080",
        "diretorAdjunto": "ELAINE CRISTINA SABINO NEVES VIEIRA",
        "telefoneDiretorAdjunto": "99888-3022",
        "inep": "33069263",
        "cnpj": "01.868.604/0001-17",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "11588",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004903/2026-80",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.005",
        "denominação": "Escola Municipal Tenente General Napion",
        "designação": "04.30.005",
        "telefone": "3105-8766 / 3105-8851",
        "telefoneCelularInstitucional": "21993283036",
        "email": "emnapion@rioeduca.net",
        "diretor": "ADRIANA GERALDO DA SILVA",
        "telefoneDiretor": "97676-5858",
        "diretorAdjunto": "NATHÁLIA SANTOS DE AGUIAR NUNES",
        "telefoneDiretorAdjunto": "99356-0375",
        "inep": "33069441",
        "cnpj": "04.017.619/0001-60",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "11587",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004800/2026-10",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.007",
        "denominação": "Escola Municipal Nova Holanda",
        "designação": "04.30.007",
        "telefone": "99326-5870",
        "telefoneCelularInstitucional": "21993265870",
        "email": "emnovah@rioeduca.net",
        "diretor": "JUREMA NASCIMENTO BRANDÃO",
        "telefoneDiretor": "96415-8752",
        "diretorAdjunto": "SUELEN DE SOUZA ALBUQUERQUE",
        "telefoneDiretorAdjunto": "97902-6685",
        "inep": "33069514",
        "cnpj": "05.614.260/0001-70",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "11585",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004780/2026-87",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.009",
        "denominação": "Escola Municipal Professor Paulo Freire",
        "designação": "04.30.009",
        "telefone": "3104-9502",
        "telefoneCelularInstitucional": "21993255113",
        "email": "empfreire@rioeduca.net",
        "diretor": "GISELE DE SOUZA PINTO",
        "telefoneDiretor": "99711-9189",
        "diretorAdjunto": "SEBASTIANA MARIA PEREIRA GUSMÃO GONÇALVES",
        "telefoneDiretorAdjunto": "98458-2308",
        "inep": "33146071",
        "cnpj": "05.967.616/0001-50",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "18968",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.005060/2026-39",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.010",
        "denominação": "Escola Municipal Escritor Bartolomeu Campos de Queirós",
        "designação": "04.30.010",
        "telefone": "2482-3787",
        "telefoneCelularInstitucional": "21993245279",
        "email": "emqueiros@rioeduca.net",
        "diretor": "JULIANA VIEIRA FERRÃO",
        "telefoneDiretor": "98917-6710",
        "diretorAdjunto": "RAQUEL PEREIRA DE OLIVEIRA",
        "telefoneDiretorAdjunto": "98997-0020",
        "inep": "33167478",
        "cnpj": "21.362.407/0001-39",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "44828",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004860/2026-32",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.011",
        "denominação": "Escola Municipal Escritor Lêdo Ivo",
        "designação": "04.30.011",
        "telefone": "2485-5736 / 99323-4606",
        "telefoneCelularInstitucional": "21993234606",
        "email": "emledoivo@rioeduca.net",
        "diretor": "MARISA BARROS DE PINHO",
        "telefoneDiretor": "97906-3381",
        "diretorAdjunto": "ANTONIO CLAUDIO ARCHANJO ROZA",
        "telefoneDiretorAdjunto": "99467-2877",
        "inep": "33169500",
        "cnpj": "23.013.482/0001-10",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "45383",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004802/2026-17",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.012",
        "denominação": "Escola Municipal Genival Pereira de Albuquerque",
        "designação": "04.30.012",
        "telefone": "3161-4574",
        "telefoneCelularInstitucional": "21993225964",
        "email": "emgalbuquerque@rioeduca.net",
        "diretor": "JULIANNA DE SOUZA NOGUEIRA",
        "telefoneDiretor": "98690-7667",
        "diretorAdjunto": "PAMELA DE SOUZA RODRIGUES MONTEIRO",
        "telefoneDiretorAdjunto": "96446-6327",
        "inep": "33176892",
        "cnpj": "27.289.067/0001-44",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "46632",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004870/2026-78",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.013",
        "denominação": "Escola Municipal Osmar Paiva Camelo",
        "designação": "04.30.013",
        "telefone": "3161-0221",
        "telefoneCelularInstitucional": "21993223467",
        "email": "emocamelo@rioeduca.net",
        "diretor": "CRISTINA OLIVEIRA CARNEIRO",
        "telefoneDiretor": "96574-2114",
        "diretorAdjunto": "PATRICIA RAPOSO NOVAES",
        "telefoneDiretorAdjunto": "97192-0477",
        "inep": "33176884",
        "cnpj": "26.469.796/0001-10",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "46631",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004793/2026-56",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.014",
        "denominação": "Escola Municipal Lino Martins da Silva",
        "designação": "04.30.014",
        "telefone": "3438-6723",
        "telefoneCelularInstitucional": "21993221292",
        "email": "emlsilva@rioeduca.net",
        "diretor": "ROSILENE DE OLIVEIRA",
        "telefoneDiretor": "98315-2638",
        "diretorAdjunto": "MONIQUE CORREIA DA SILVA",
        "telefoneDiretorAdjunto": "99813-8482",
        "inep": "33175950",
        "cnpj": "26.204.472/0001-50",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "46626",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004867/2026-54",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.015",
        "denominação": "Escola Municipal Erpídio Cabral de Souza( Índio da Maré)",
        "designação": "04.30.015",
        "telefone": "99320-5846",
        "telefoneCelularInstitucional": "21993205846",
        "email": "emindiodamare@rioeduca.net",
        "diretor": "LILIAN REGINA MARTINS MELO",
        "telefoneDiretor": "99913-0914",
        "diretorAdjunto": "MÁRCIA VERÔNICA GONÇALVES COELHO",
        "telefoneDiretorAdjunto": "99716-0281",
        "inep": "33176051",
        "cnpj": "26.231.528/0001-65",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "46628",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004923/2026-51",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.016",
        "denominação": "Escola Municipal Olimpíadas Rio 2016",
        "designação": "04.30.016",
        "telefone": "3438-4863",
        "telefoneCelularInstitucional": "21993416655",
        "email": "emrio2016@rioeduca.net",
        "diretor": "SEBASTIÃO RODRIGUES ANDRADE",
        "telefoneDiretor": "96423-5002",
        "diretorAdjunto": "ROSILENE ELIZA DOS SANTOS",
        "telefoneDiretorAdjunto": "99392-7441",
        "inep": "33176060",
        "cnpj": "27.438.664/0001-93",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "46630",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004959/2026-34",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "ADOLESCENCIAS",
            "RECURSOS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.018",
        "denominação": "Escola Municipal Medalhista Olímpico Lucas Saatkamp",
        "designação": "04.30.018",
        "telefone": "2086-3341",
        "telefoneCelularInstitucional": "21993553666",
        "email": "emsaatkamp@rioeduca.net",
        "diretor": "NÚBIA CARVALHO DO NASCIMENTO",
        "telefoneDiretor": "99789-8580",
        "diretorAdjunto": "ELISA MARIA LOPES FERREIRA SATURNINO",
        "telefoneDiretorAdjunto": "98069-0222",
        "inep": "33179450",
        "cnpj": "31.538.188/0001-50",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "46764",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004787/2026-07",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.019",
        "denominação": "Escola Municipal Escritor Millôr Fernandes",
        "designação": "04.30.019",
        "telefone": "99355-2439",
        "telefoneCelularInstitucional": "21993552439",
        "email": "emefernandes@rioeduca.net",
        "diretor": "GISELLE NUNES BAPTISTA AMORIM",
        "telefoneDiretor": "98739-8684",
        "diretorAdjunto": "FLÁVIA LUCIANA ANDRADE DE MELO SALGADO",
        "telefoneDiretorAdjunto": "97596-6067",
        "inep": "33179395",
        "cnpj": "31.099.076/0001-40",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "46763",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.005048/2026-24",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.020",
        "denominação": "Escola Municipal Vereadora Marielle Franco",
        "designação": "04.30.020",
        "telefone": "99336-9562",
        "telefoneCelularInstitucional": "21993536976",
        "email": "emmariellefranco@rioeduca.net",
        "diretor": "ALEX SILVA DE SOUZA",
        "telefoneDiretor": "97579-4316",
        "diretorAdjunto": "RENATA CHRISTINA PINHEIRO COUTINHO MELLO DA SILVA",
        "telefoneDiretorAdjunto": "99710-0778",
        "inep": "33183813",
        "cnpj": "32.065.019/0001-02",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "46761",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.005075/2026-05",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.201",
        "denominação": "Ciep Ministro Gustavo Capanema",
        "designação": "04.30.201",
        "telefone": "3104-9576",
        "telefoneCelularInstitucional": "21993526102",
        "email": "ciepgustavo@rioeduca.net",
        "diretor": "LORENA FERREIRA RODRIGUES",
        "telefoneDiretor": "99687-5453",
        "diretorAdjunto": "BRENDA DE SOUZA RAMALHO",
        "telefoneDiretorAdjunto": "96503-2869",
        "inep": "33068771",
        "cnpj": "03.170.355/0001-17",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "11579",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.005170/2026-09",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.204",
        "denominação": "Ciep Operário Vicente Mariano",
        "designação": "04.30.204",
        "telefone": "3977-5609",
        "telefoneCelularInstitucional": "21993524857",
        "email": "ciepmariano@rioeduca.net",
        "diretor": "ELIANA RODRIGUES DE OLIVEIRA PEREIRA",
        "telefoneDiretor": "98355-6056",
        "diretorAdjunto": "PRISCILA LEÃO MIRANDA",
        "telefoneDiretorAdjunto": "96427-2773",
        "inep": "33068780",
        "cnpj": "02.702.349/0001-09",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "11583",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.005050/2026-01",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.206",
        "denominação": "Ciep Hélio Smidt",
        "designação": "04.30.206",
        "telefone": "99352-1121",
        "telefoneCelularInstitucional": "21993521121",
        "email": "ciepsmidt@rioeduca.net",
        "diretor": "ADRIANO ROSA DE SOUZA",
        "telefoneDiretor": "97656-0024",
        "diretorAdjunto": "ALEXANDRA CORRÊA DA ROCHA PINHEIRO",
        "telefoneDiretorAdjunto": "99717-7617",
        "inep": "33068747",
        "cnpj": "02.016.546/0001-66",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "11598",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004807/2026-31",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.501",
        "denominação": "Ciep Presidente Samora Machel",
        "designação": "04.30.501",
        "telefone": "99351-4734",
        "telefoneCelularInstitucional": "21993514734",
        "email": "ciepmachel@rioeduca.net",
        "diretor": "TATIANE SANTOS PEIXOTO",
        "telefoneDiretor": "98623-2059",
        "diretorAdjunto": "MÁRCIA SAMPAIO BAMBERG DE OLIVEIRA",
        "telefoneDiretorAdjunto": "99531-8669",
        "inep": "33068801",
        "cnpj": "01.950.897/0001-87",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "11578",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004984/2026-18",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.502",
        "denominação": "Ciep Elis Regina",
        "designação": "04.30.502",
        "telefone": "99351-0329",
        "telefoneCelularInstitucional": "21993510329",
        "email": "ciepelis@rioeduca.net",
        "diretor": "ANDRÉA DA SILVA FONSECA",
        "telefoneDiretor": "98613-0497",
        "diretorAdjunto": "DENISE GOMES DE OLIVEIRA BATISTA",
        "telefoneDiretorAdjunto": "98243-1414",
        "inep": "33068739",
        "cnpj": "01.175.154/0001-87",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "11580",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.005040/2026-68",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.503",
        "denominação": "Ciep Leonel de Moura Brizola",
        "designação": "04.30.503",
        "telefone": "3105-9934",
        "telefoneCelularInstitucional": "21993493195",
        "email": "ciepbrizola@rioeduca.net",
        "diretor": "GABRIELLE PEIXOTO TARANTO",
        "telefoneDiretor": "99849-7156",
        "diretorAdjunto": "CAIO CESAR DA SILVEIRA CAVALCANTE SILVA",
        "telefoneDiretorAdjunto": "99726-0638",
        "inep": "33068720",
        "cnpj": "03.178.700/0001-69",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "11573",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004962/2026-58",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.601",
        "denominação": "Creche Municipal Menino Maluquinho",
        "designação": "04.30.601",
        "telefone": "",
        "telefoneCelularInstitucional": "21993490754",
        "email": "cmmaluquinho@rioeduca.net",
        "diretor": "KATIA PIAES BENCARDINO",
        "telefoneDiretor": "98493-4482",
        "diretorAdjunto": "FLAVIA BORBOREMA",
        "telefoneDiretorAdjunto": "98734-4771",
        "inep": "33144702",
        "cnpj": "12.353.633/0001-62",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "18781",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004995/2026-06",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.602",
        "denominação": "Creche Municipal Vila Pinheiro",
        "designação": "04.30.602",
        "telefone": "3104-9665 / 99348-9804",
        "telefoneCelularInstitucional": "21993489804",
        "email": "cmvpinheiro@rioeduca.net",
        "diretor": "GLADYS FERRAZ SARAIVA",
        "telefoneDiretor": "98895-1665",
        "diretorAdjunto": "JOSEFA NATALIA DA COSTA FARIAS",
        "telefoneDiretorAdjunto": "98051-0883",
        "inep": "33147264",
        "cnpj": "12.558.016/0001-01",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "18782",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004866/2026-18",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.603",
        "denominação": "Creche Municipal Tio Mário",
        "designação": "04.30.603",
        "telefone": "3104-7367",
        "telefoneCelularInstitucional": "21993489781",
        "email": "cmtmario@rioeduca.net",
        "diretor": "REGINA CÉLIA FIRMINO DA CONCEIÇÃO",
        "telefoneDiretor": "97426-5290",
        "diretorAdjunto": "CARMEN DOLORES DA SILVA",
        "telefoneDiretorAdjunto": "96527-4390",
        "inep": "33096465",
        "cnpj": "12.396.418/0001-49",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "18778",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.005077/2026-96",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.604",
        "denominação": "Creche Municipal Monteiro Lobato",
        "designação": "04.30.604",
        "telefone": "99348-8381",
        "telefoneCelularInstitucional": "21993488381",
        "email": "cmmlobato@rioeduca.net",
        "diretor": "ANA MARIA DOS SANTOS IGNACIO",
        "telefoneDiretor": "99918-1984",
        "diretorAdjunto": "DEBORA CRISTINA BERNARDO DA SILVA BASTOS RUIVO",
        "telefoneDiretorAdjunto": "99826-1304",
        "inep": "33095833",
        "cnpj": "12.586.443/0001-95",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "18727",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004872/2026-67",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.605",
        "denominação": "Creche Municipal Nova Holanda",
        "designação": "04.30.605",
        "telefone": "3868-0296",
        "telefoneCelularInstitucional": "21993485894",
        "email": "cmnholanda@rioeduca.net",
        "diretor": "MARCIA HELENA MORAIS DE AZEVEDO",
        "telefoneDiretor": "97197 4686",
        "diretorAdjunto": "CRISTIANE FERREIRA CHILETTO DA SILVA",
        "telefoneDiretorAdjunto": "99606-8425",
        "inep": "33095752",
        "cnpj": "12.449.488/0001-18",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "18737",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004979/2026-13",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.607",
        "denominação": "Creche Municipal Professor Paulo Freire",
        "designação": "04.30.607",
        "telefone": "3105-5019 / 99347-4038",
        "telefoneCelularInstitucional": "21993474038",
        "email": "cmpfreire@rioeduca.net",
        "diretor": "LILIANA VILA CORRÊA",
        "telefoneDiretor": "98284-1555",
        "diretorAdjunto": "MARIZELIA FRANÇA DE PAULA",
        "telefoneDiretorAdjunto": "96953-7012",
        "inep": "33122539",
        "cnpj": "23.731.402/0001-61",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "18744",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004789/2026-98",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.701",
        "denominação": "Centro de Educação de Jovens e Adultos CEJA - Maré",
        "designação": "04.30.701",
        "telefone": "",
        "telefoneCelularInstitucional": "21993461663",
        "email": "cejamare@rioeduca.net",
        "diretor": "JOÃO PAULO SOBRAL DIAS NETTO",
        "telefoneDiretor": "99809-0408",
        "diretorAdjunto": "EDUARDO GOMES DE OLIVEIRA",
        "telefoneDiretorAdjunto": "97691-4705",
        "inep": "33167486",
        "cnpj": "20.061.862/0001-31",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "45034",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004825/2026-13",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.801",
        "denominação": "EDI Pescador Isidoro Duarte - \"Doro\"",
        "designação": "04.30.801",
        "telefone": "3457-1157",
        "telefoneCelularInstitucional": "21993442702",
        "email": "edipisidoro@rioeduca.net",
        "diretor": "ANGELA BARROS FRUITOS MOTTA",
        "telefoneDiretor": "98192-1371",
        "diretorAdjunto": "ADRIANA ROSA DE SOUZA",
        "telefoneDiretorAdjunto": "99265-7408",
        "inep": "33160929",
        "cnpj": "17.102.964/0001-43",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "43966",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004943/2026-21",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.802",
        "denominação": "EDI Professora Kelita Faria de Paula",
        "designação": "04.30.802",
        "telefone": "3353-0456",
        "telefoneCelularInstitucional": "21993474580",
        "email": "edikelita@rioeduca.net",
        "diretor": "ROSÂNGELA BARBOSA ALVES",
        "telefoneDiretor": "99313-5405",
        "diretorAdjunto": "CRISTIANE CAMPOS DA SILVA",
        "telefoneDiretorAdjunto": "98890-2626",
        "inep": "33164118",
        "cnpj": "16.838.101/0001-76",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "44416",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004973/2026-38",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.803",
        "denominação": "EDI Professor Moacyr de Góes",
        "designação": "04.30.803",
        "telefone": "3885-2349 / 99343-5054",
        "telefoneCelularInstitucional": "21993435054",
        "email": "edimgoes@rioeduca.net",
        "diretor": "SAMANTHA FERRAZ LOBO CAVALCANTI",
        "telefoneDiretor": "97934-1873",
        "diretorAdjunto": "INGRID DE JESUS WHITE MASCARENHAS",
        "telefoneDiretorAdjunto": "96435-4518",
        "inep": "33167885",
        "cnpj": "19.725.741/0001-68",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "44820",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.005062/2026-28",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "TEMPO_APRENDER"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.804",
        "denominação": "EDI Cremilda da Silva dos Santos",
        "designação": "04.30.804",
        "telefone": "",
        "telefoneCelularInstitucional": "21993430893",
        "email": "edicremilda@rioeduca.net",
        "diretor": "DIONE VASCONCELOS ALVES BRITTO",
        "telefoneDiretor": "99439-2407",
        "diretorAdjunto": "SARITA CLEMENTE DE MORAES",
        "telefoneDiretorAdjunto": "98424-0459",
        "inep": "33167362",
        "cnpj": "18.329.758/0001-33",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "44829",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004937/2026-74",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.805",
        "denominação": "EDI Professora Solange Conceição Tricarico",
        "designação": "04.30.805",
        "telefone": "3884-5678",
        "telefoneCelularInstitucional": "21993430278",
        "email": "edistricarico@rioeduca.net",
        "diretor": "THUANNY CRUZ DA SILVA PASCARELLI",
        "telefoneDiretor": "97134-0679",
        "diretorAdjunto": "ANA PAULA DE SOUZA SOARES DE OLIVEIRA",
        "telefoneDiretorAdjunto": "98538-9219",
        "inep": "33167893",
        "cnpj": "21.510.074/0001-48",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "45238",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004933/2026-96",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.806",
        "denominação": "EDI Cleia Santos de Oliveira",
        "designação": "04.30.806",
        "telefone": "3105-4001",
        "telefoneCelularInstitucional": "21993422660",
        "email": "edicleiasantos@rioeduca.net",
        "diretor": "ADRIANA SOARES PONTES",
        "telefoneDiretor": "99718-3774",
        "diretorAdjunto": "FATIMA SILVA BORGES CARVALHO",
        "telefoneDiretorAdjunto": "97506-9054",
        "inep": "33170983",
        "cnpj": "22.787.794/0001-18",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "45570",
        "controladorId"…66969 tokens truncated…btn-primary'} btn-sm"
                                                                    data-action="register-corrective-submission"
                                                                    data-pendency-ref="${escapeHtml(encodePendencyIdReference(p.id))}"
                                                                    onclick="abrirModalRegistrarNovoEnvio(this)"
                                                                >${escapeHtml(submissionActionLabel)}</button>
                                                            ` : ''}
                                                        </div>
                                                    ` : '<span style="color:var(--text-muted);">Sem ação de envio</span>'}
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
                                        <span class="contact-type-tag">${escapeHtml(c.tipo)}</span>
                                        <span>Atendimento: ${new Date(c.dataAtendimento).toLocaleDateString('pt-BR')} (Registro: ${new Date(c.dataRegistro).toLocaleString('pt-BR')})</span>
                                    </div>
                                    <div class="contact-desc">${escapeHtml(c.desc)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                ` : ''}

                ${accessProfile !== 'sme' ? `
                <!-- Aba 4: Capital -->
                <div class="tab-content-panel ${accessProfile === 'inventario' ? 'active' : ''}" id="tab-capital">
                        <div class="panel-card">
                        <div class="panel-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap: wrap; gap: 10px;">
                            <div>
                                <h2>Aquisição de Bens Permanentes (Natureza de Capital)</h2>
                                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Processo de Inventário 2026: <strong>${esc.processoInventario ? escapeHtml(esc.processoInventario) : '<span style="color:var(--danger)">Não cadastrado na escola</span>'}</strong></div>
                            </div>
                            ${accessProfile !== 'inventario' ? `
                                <button class="btn btn-secondary btn-sm" onclick="openNovoCapitalModal('${escapeHtml(esc.id)}')">Registrar Nova Compra</button>
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
                                                <td><strong>${escapeHtml(b.item)}</strong></td>
                                                <td>${escapeHtml(formatCompetenciaText(b.competencia))}</td>
                                                <td>R$ ${b.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                <td>
                                                    <input type="text" class="form-control" style="width:110px; font-size:0.75rem; padding:4px;" value="${escapeHtml(b.notaFiscal)}" onchange="updateCapitalDoc('${escapeHtml(b.id)}', 'notaFiscal', this.value)" placeholder="NF-XXXX" ${accessProfile === 'inventario' || accessProfile === 'sme' ? 'disabled' : ''}>
                                                </td>
                                                <td>
                                                    <span class="badge ${statusCls}">${escapeHtml(b.status)}</span>
                                                    ${b.status === 'Inventariada' && b.inventariadoPor ? `
                                                        <br><small style="color:var(--text-muted); font-size:0.7rem;">Por: <strong>${escapeHtml(b.inventariadoPor)}</strong>${b.inventariadoEm ? ' em ' + escapeHtml(b.inventariadoEm) : ''}</small>
                                                    ` : ''}
                                                    ${b.status === 'Inventariada' && b.observacoes ? `
                                                        <br><small style="color:var(--text-muted); font-size:0.7rem; font-style:italic;">Obs: ${escapeHtml(b.observacoes)}</small>
                                                    ` : ''}
                                                </td>
                                                <td>
                                                    ${b.status === 'Não encaminhada' ? `
                                                        <button class="btn btn-primary btn-sm" onclick="encaminharCapital('${escapeHtml(b.id)}')" ${accessProfile === 'inventario' || accessProfile === 'sme' ? 'disabled' : ''}>Encaminhar</button>
                                                    ` : (b.status === 'Encaminhada' && accessProfile === 'inventario') ? `
                                                        <button class="btn btn-primary btn-sm" onclick="inventariarBem('${escapeHtml(b.id)}')">Inventariar</button>
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

                ${accessProfile !== 'inventario' && accessProfile !== 'sme' ? `
                <!-- Aba 5: Auditoria Local -->
                <div class="tab-content-panel" id="tab-auditoria">
                    <div class="panel-card">
                        <div class="panel-header">
                            <h2>Histórico de Registros Internos da Unidade</h2>
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
                                            <td>${escapeHtml(l.usuario)} (${escapeHtml(l.perfil)})</td>
                                            <td><strong>${escapeHtml(l.acao)}</strong></td>
                                            <td>${escapeHtml(l.detalhes)}</td>
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

function activateProntuarioTab(tabId) {
    const allowedTabIds = new Set([
        'tab-verificacoes',
        'tab-pendencias',
        'tab-contatos',
        'tab-capital',
        'tab-auditoria'
    ]);
    if (currentView !== 'prontuario' || !allowedTabIds.has(tabId)) return false;

    const prontuarioRoot = document.querySelector('#main-container .school-grid');
    const targetPanel = prontuarioRoot ? prontuarioRoot.querySelector(`#${tabId}`) : null;
    const targetButton = prontuarioRoot
        ? prontuarioRoot.querySelector(`[data-tab="${tabId.slice(4)}"]`)
        : null;
    if (!targetPanel || !targetButton) return false;

    const tabContainer = targetButton.closest('.tab-container');
    if (!tabContainer || targetPanel.parentElement !== tabContainer.parentElement) return false;

    Array.from(tabContainer.children).forEach(element => {
        if (element.classList.contains('tab-button')) element.classList.remove('active');
    });
    Array.from(targetPanel.parentElement.children).forEach(element => {
        if (element.classList.contains('tab-content-panel')) element.classList.remove('active');
    });
    targetButton.classList.add('active');
    targetPanel.classList.add('active');
    return true;
}

function switchSchoolTab(event, tabId) {
    activateProntuarioTab(tabId);
}

// 14.1 Render Grade de Bonificações e Análises Técnicas Mensais
function renderProntuarioVerificacoes(esc) {
    const container = document.getElementById('prontuario-verif-rows');
    if (!container) return;
    const accessProfile = getRadarAccessProfile();
    const canViewTechnicalAnalysis = hasRadarCapability(
        window.RadarAccessPolicy.CAPABILITIES.VIEW_TECHNICAL_ANALYSIS
    );
    const canOpenPendency = hasRadarCapability(
        window.RadarAccessPolicy.CAPABILITIES.OPEN_PENDENCY
    );
    const canRegisterCorrectiveSubmission = hasRadarCapability(
        window.RadarAccessPolicy.CAPABILITIES.REGISTER_CORRECTIVE_SUBMISSION
    );
    const canReanalyzePendency = hasRadarCapability(
        window.RadarAccessPolicy.CAPABILITIES.REANALYZE_PENDENCY
    );
    const canUseVerificationActions = canOpenPendency
        || canRegisterCorrectiveSubmission
        || canReanalyzePendency;
    const visibleColumnCount = 3
        + (canViewTechnicalAnalysis ? 1 : 0)
        + (canUseVerificationActions ? 1 : 0);
    const documentaryPendencies = pendencias.filter(pendency => (
        window.RadarPendencias.isDocumentaryPendency(pendency)
    ));
    
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
        const hasPendencies = pendencias.some(p => (
            p.escolaId === esc.id
            && (p.competenciaOrigem === c.key || p.competencia === c.key)
        ));
        let hasVerifications = false;
        if (verificacoes[esc.id]) {
            hasVerifications = Object.keys(verificacoes[esc.id]).some(k => k.startsWith(c.key));
        }
        const forceInScope = hasPendencies || hasVerifications;

        const inScope = forceInScope || isCompetenceInScope(esc.competenciaInicial, c.key);
        if (!inScope) {
            rowsHTML += `
                <tr style="opacity: 0.6; background-color: rgba(255,255,255,0.01);">
                    <td colspan="${visibleColumnCount}" style="text-align:center; color:var(--text-muted); padding:32px;">Fora do escopo de monitoramento (início em ${COMPETENCIAS.find(cm => cm.key === esc.competenciaInicial)?.label || esc.competenciaInicial})</td>
                </tr>
            `;
        } else {
            // Para cada programa ativo da escola
            esc.programasIds.forEach(progId => {
                const prog = programas.find(p => p.id === progId);
                const progName = prog ? prog.name : progId;
                const compProgKey = `${c.key}_${progId}`;

                // A grade usa um estado vazio transitório; só um comando do usuário cria a verificação.
                const v = buildVerificationSnapshot(verificacoes[esc.id]?.[compProgKey]);
                const bonusStatus = getProgramBonificationStatus(esc.id, c.key, progId);
                const bonusMeta = getProgramBonificationMeta(bonusStatus);
                const technicalStatus = getProgramTechnicalStatus(esc.id, c.key, progId);
                const technicalMeta = getProgramTechnicalMeta(technicalStatus);
                const programStatusSummary = `
                    <div class="program-status-summary" data-program-status-summary="${escapeHtml(progId)}">
                        <div>
                            <span>Bonificação</span>
                            <span class="badge ${bonusMeta.badgeClass}" data-status-dimension="bonificacao">${bonusMeta.label}</span>
                        </div>
                        ${canViewTechnicalAnalysis ? `
                            <div>
                                <span>Análise técnica</span>
                                <span class="badge ${technicalMeta.badgeClass}" data-status-dimension="analise">${technicalMeta.label}</span>
                            </div>
                        ` : ''}
                    </div>
                `;

                // Montar a sub-linha com cada documento
                docItems.forEach((doc, idx) => {
                    const bonifValue = v.bonificacao[doc.key] || '';
                    const analiseValue = v.analise[doc.key] || 'Não analisado';
                    const isBonifLocked = (v.resultadoBonif && accessProfile !== 'assistente')
                        || accessProfile === 'inventario'
                        || accessProfile === 'sme';
                    
                    const pendencyContext = window.RadarFluxoOperacional.buildPendencyContext({
                        compProgKey,
                        programaNome: progName,
                        documentoKey: doc.key,
                        documentoNome: doc.name
                    });
                    const exactPendencyContext = {
                        ...pendencyContext,
                        escolaId: esc.id,
                        competenciaOrigem: c.key
                    };
                    const exactPendencyKey = window.RadarPendencias.buildDocumentContextKey(
                        exactPendencyContext
                    );
                    const activePend = window.RadarPendencias.findActivePendency(
                        documentaryPendencies,
                        exactPendencyContext
                    );
                    const resolvedPend = documentaryPendencies.find(pendency => (
                        pendency.status === 'Resolvida'
                        && window.RadarPendencias.buildDocumentContextKey(pendency)
                            === exactPendencyKey
                    ));
                    const isAnaliseLocked = accessProfile === 'inventario'
                        || accessProfile === 'sme'
                        || Boolean(activePend);
                    const analysisLockId = `analysis-lock-${progId}-${doc.key}`;
                    let pendStatusHTML = '';
                    if (canUseVerificationActions && activePend) {
                        const submissionActionLabel = getCorrectiveSubmissionActionLabel(activePend);
                        const canReanalyse = canReanalysePendency(activePend);
                        const instruction = activePend.status === 'Aguardando reanálise'
                            ? 'Análise bloqueada enquanto aguarda reanálise. Use Reanalisar para registrar o resultado.'
                            : 'Análise bloqueada enquanto a pendência estiver Aberta. Registre um novo envio para prosseguir.';
                        pendStatusHTML = `
                            <div style="display:flex; flex-wrap:wrap; gap:4px;">
                                ${canReanalyse ? `
                                    <button
                                        class="btn btn-primary btn-sm"
                                        data-action="reanalyse-pendency"
                                        data-pendency-ref="${escapeHtml(encodePendencyIdReference(activePend.id))}"
                                        onclick="abrirModalReanalisarPendencia(this)"
                                        style="font-size:0.7rem; padding:2px 6px;"
                                    >Reanalisar</button>
                                ` : ''}
                                ${submissionActionLabel && canRegisterCorrectiveSubmission ? `
                                    <button
                                        class="btn ${canReanalyse ? 'btn-secondary' : 'btn-primary'} btn-sm"
                                        data-action="register-corrective-submission"
                                        data-pendency-ref="${escapeHtml(encodePendencyIdReference(activePend.id))}"
                                        onclick="abrirModalRegistrarNovoEnvio(this)"
                                        style="font-size:0.7rem; padding:2px 6px;"
                                    >${escapeHtml(submissionActionLabel)}</button>
                                ` : ''}
                            </div>
                            <p id="${escapeHtml(analysisLockId)}" style="font-size:0.7rem; color:var(--text-muted); margin-top:6px;">${escapeHtml(instruction)}</p>
                        `;
                    } else if (canUseVerificationActions && resolvedPend && analiseValue === 'Não analisado') {
                        pendStatusHTML = `<span class="badge badge-success" style="font-size:0.7rem;" title="Justificativa: ${escapeHtml(resolvedPend.justificativaResolucao || resolvedPend.observacao || '')}">Resolvida - reanalisar</span>`;
                    } else if (canOpenPendency && analiseValue === 'Incorreto') {
                        pendStatusHTML = `<button class="btn btn-secondary btn-sm" data-action="open-document-pendency" onclick="openNovaPendenciaModalWithDefaults('${escapeHtml(esc.id)}', '${escapeHtml(compProgKey)}', '${escapeHtml(progName)}', '${escapeHtml(doc.key)}', '${escapeHtml(doc.name)}')" style="font-size:0.7rem; padding:2px 6px;">Abrir Pendência</button>`;
                    }

                    // Conteúdo extra para visualização de notas fiscais
                    let extraContentHTML = '';
                    if (doc.key === 'notaFiscal') {
                        const notes = notasRegistradas.filter(n => n.escolaId === esc.id && n.compKey === compProgKey);
                        
                        const notesBadges = notes.map(n => `
                            <span class="badge badge-info" style="display: inline-flex; align-items: center; margin-right: 4px; margin-bottom: 4px; padding: 4px 8px; font-size: 0.7rem; font-weight: 500;">
                                NF: ${escapeHtml(n.numero)} (R$ ${n.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})})
                                ${accessProfile !== 'inventario' && accessProfile !== 'sme' && !isBonifLocked ? `
                                    <span style="margin-left: 6px; cursor: pointer; font-weight: bold; color: var(--warning); font-size: 0.85rem;" onclick="abrirEditarNota('${escapeHtml(n.id)}', '${escapeHtml(esc.id)}')" title="Editar Nota">✎</span>
                                    <span style="margin-left: 6px; cursor: pointer; font-weight: bold; color: var(--danger); font-size: 0.85rem;" onclick="removerNotaRegistrada('${escapeHtml(n.id)}', '${escapeHtml(esc.id)}')" title="Excluir Nota">×</span>
                                ` : ''}
                            </span>
                        `).join('');
                        
                        const addBtn = window.RadarFluxoOperacional.canRegisterFiscalNote(accessProfile, bonifValue) && !isBonifLocked ? `
                            <button class="btn btn-secondary btn-sm" style="font-size:0.65rem; padding: 2px 6px; display: inline-flex; align-items: center; margin-bottom: 4px;" onclick="openModalDadosNota('${escapeHtml(esc.id)}', '${escapeHtml(compProgKey)}')">
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
                                            Ref. Serviço NF: ${escapeHtml(serviceNotes.map(n => n.numero).join(', '))}
                                        </span>
                                    </div>
                                    ${accessProfile === 'sme' ? `
                                        <span class="badge ${isChecked ? 'badge-success' : 'badge-gray'}" data-bonification-detail="consEnviada">
                                            Consultoria enviada: ${isChecked ? 'Sim' : 'Não'}
                                        </span>
                                    ` : `
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <label style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; cursor: pointer; margin-top: 2px;">
                                                <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleConsEnviada('${escapeHtml(esc.id)}', '${escapeHtml(compProgKey)}', this.checked)" ${isBonifLocked ? 'disabled' : ''}>
                                                <span>Consultoria realmente enviada para Assessoria</span>
                                            </label>
                                        </div>
                                    `}
                                </div>
                            `;
                        }
                    }

                    rowsHTML += `
                        <tr
                            data-program-id="${escapeHtml(progId)}"
                            data-document-key="${escapeHtml(doc.key)}"
                            ${activePend || resolvedPend ? `data-pendency-ref="${escapeHtml(encodePendencyIdReference((activePend || resolvedPend).id))}" tabindex="-1"` : ''}
                        >
                            ${idx === 0 ? `<td rowspan="${docItems.length}" style="vertical-align:top; border-right: 1px solid var(--border-color); width:180px;">
                                <strong>${escapeHtml(c.label)}</strong><br>
                                <span style="font-size:0.75rem; color:var(--primary); font-weight:600;">${escapeHtml(progName)}</span>
                                <div style="margin-top:16px;">
                                    ${programStatusSummary}
                                    ${accessProfile !== 'inventario' && accessProfile !== 'sme' ? (
                                        v.resultadoBonif ? `
                                            <button class="btn btn-secondary btn-sm" style="width:100%; justify-content:center; font-size:0.75rem;" disabled>Consolidada</button>
                                        ` : `
                                            <button class="btn btn-secondary btn-sm" style="width:100%; justify-content:center; font-size:0.75rem;" onclick="calcularEFecharBonificacao('${escapeHtml(esc.id)}', '${escapeHtml(compProgKey)}')">Consolidar</button>
                                        `
                                    ) : ''}
                                </div>
                            </td>` : ''}
                            <td><span style="font-size:0.85rem; font-weight:500;">${escapeHtml(doc.name)}</span>${extraContentHTML}</td>
                            <td>
                                ${accessProfile === 'sme' ? `
                                    <span
                                        class="badge ${bonifValue === 'Sim'
                                            ? 'badge-success'
                                            : bonifValue === 'Não'
                                                ? 'badge-danger'
                                                : 'badge-gray'}"
                                        data-bonification-value="${escapeHtml(bonifValue || '')}"
                                    >${escapeHtml(bonifValue || 'Não informado')}</span>
                                ` : `
                                    <div class="btn-group-toggle">
                                        <button class="btn-toggle ${bonifValue === 'Sim' ? 'active-sim' : ''}"
                                                onclick="toggleBonif('${escapeHtml(esc.id)}', '${escapeHtml(compProgKey)}', '${escapeHtml(doc.key)}', 'Sim')"
                                                ${isBonifLocked ? 'disabled' : ''}>Sim</button>
                                        <button class="btn-toggle ${bonifValue === 'Não' ? 'active-nao' : ''}"
                                                onclick="toggleBonif('${escapeHtml(esc.id)}', '${escapeHtml(compProgKey)}', '${escapeHtml(doc.key)}', 'Não')"
                                                ${isBonifLocked ? 'disabled' : ''}>Não</button>
                                        ${doc.allowNaoAplica ? `
                                            <button class="btn-toggle ${bonifValue === 'Não se aplica' ? 'active-naoseaplica' : ''}"
                                                    onclick="toggleBonif('${escapeHtml(esc.id)}', '${escapeHtml(compProgKey)}', '${escapeHtml(doc.key)}', 'Não se aplica')"
                                                    ${isBonifLocked ? 'disabled' : ''}>N/A</button>
                                        ` : ''}
                                    </div>
                                `}
                            </td>
                            ${canViewTechnicalAnalysis ? `
                                <td>
                                    <select class="select-analise select-analise-comp analise-${analiseValue.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}"
                                            onchange="changeAnaliseTecnica('${escapeHtml(esc.id)}', '${escapeHtml(compProgKey)}', '${escapeHtml(doc.key)}', this.value, this)"
                                            ${activePend ? `aria-describedby="${escapeHtml(analysisLockId)}"` : ''}
                                            ${isAnaliseLocked ? 'disabled' : ''}>
                                        <option value="Não analisado" ${analiseValue === 'Não analisado' ? 'selected' : ''}>Não analisado</option>
                                        <option value="Correto" ${analiseValue === 'Correto' ? 'selected' : ''}>Correto</option>
                                        <option value="Correto (Atrasado)" ${analiseValue === 'Correto (Atrasado)' ? 'selected' : ''}>Correto (Atrasado)</option>
                                        <option value="Incorreto" ${analiseValue === 'Incorreto' ? 'selected' : ''}>Incorreto</option>
                                    </select>
                                </td>
                            ` : ''}
                            ${canUseVerificationActions ? `<td>${pendStatusHTML}</td>` : ''}
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
async function toggleBonif(escolaId, compKey, docKey, value) {
    const accessProfile = getRadarAccessProfile();
    if (accessProfile === 'inventario' || accessProfile === 'sme') return;
    try {
        await radarVerificationService.setBonification({
            schoolId: escolaId,
            compKey,
            documentKey: docKey,
            value,
            profile: accessProfile
        });
    } catch (error) {
        reportRadarActionError(error, 'Não foi possível alterar a bonificação.');
        renderProntuario(escolaId);
        return false;
    }
    renderProntuario(escolaId);
    return true;
}

function findActivePendencyForTechnicalAnalysis(escolaId, compProgKey, documentoKey) {
    const splitContext = window.RadarCompetencia.splitCompetenciaContext(compProgKey);
    const programaId = splitContext.contextId;
    const programa = programas.find(item => item.id === programaId);
    const programaNome = programa ? programa.name : programaId;
    const documentoNome = VERIFICATION_DOCUMENT_LABELS[documentoKey] || documentoKey;
    const context = window.RadarFluxoOperacional.buildPendencyContext({
        compProgKey,
        programaNome,
        documentoKey,
        documentoNome
    });
    const documentaryPendencies = pendencias.filter(pendency => (
        window.RadarPendencias.isDocumentaryPendency(pendency)
    ));

    return window.RadarPendencias.findActivePendency(documentaryPendencies, {
        ...context,
        escolaId,
        competenciaOrigem: context.competencia
    });
}

// 14.3 Operações de Clique Análise Técnica
async function changeAnaliseTecnica(escolaId, compKey, docKey, value, selectElement = null) {
    const accessProfile = getRadarAccessProfile();
    if (accessProfile === 'inventario' || accessProfile === 'sme') return false;

    const activePendency = findActivePendencyForTechnicalAnalysis(
        escolaId,
        compKey,
        docKey
    );
    if (activePendency) {
        const previousValue = verificacoes[escolaId]?.[compKey]?.analise?.[docKey]
            || 'Não analisado';
        if (selectElement && typeof selectElement === 'object') {
            selectElement.value = previousValue;
        }
        const instruction = activePendency.status === 'Aguardando reanálise'
            ? 'Esta análise aguarda reanálise. Use Reanalisar para registrar o resultado.'
            : 'Esta análise possui pendência aberta. Use Registrar novo envio para prosseguir.';
        alert(instruction);
        renderProntuario(escolaId);
        return false;
    }

    const docNames = {
        extCC: 'Extrato Conta Corrente',
        extINV: 'Extrato Investimento',
        notaFiscal: 'Notas Fiscais',
        consAssessoria: 'Consulta Assessoria',
        declBBAgil: 'Declaração BB Ágil',
        encampInventario: 'Encaminhado para Inventariação'
    };
    const previousValue = verificacoes[escolaId]?.[compKey]?.analise?.[docKey]
        || 'Não analisado';
    let shouldOpenPendency = false;
    try {
        const response = await radarVerificationService.setTechnicalAnalysis({
            schoolId: escolaId,
            compKey,
            documentKey: docKey,
            value,
            profile: accessProfile,
            activePendency
        });
        shouldOpenPendency = response.value.shouldOpenPendency;
    } catch (error) {
        if (selectElement && typeof selectElement === 'object') {
            selectElement.value = previousValue;
        }
        reportRadarActionError(error, 'Não foi possível alterar a análise técnica.');
        renderProntuario(escolaId);
        if (error?.code === 'FISCAL_NOTE_REQUIRED') {
            openModalDadosNota(escolaId, compKey);
        }
        return false;
    }

    // Regra Crítica: Se marcar como "Incorreto", abrir modal de pendência correspondente automaticamente
    if (shouldOpenPendency) {
        const splitContext = window.RadarCompetencia.splitCompetenciaContext(compKey);
        const mesRaw = splitContext.competenciaKey;
        const progId = splitContext.contextId;
        const prog = programas.find(item => item.id === progId);
        const programaNome = prog ? prog.name : progId;
        openNovaPendenciaModalWithDefaults(
            escolaId,
            compKey,
            programaNome,
            docKey,
            docNames[docKey]
        );
        
        // Ao abrir a pendência a partir de uma análise "Incorreto",
        // nenhum erro é presumido: o Controlador registra apenas as falhas efetivamente observadas.
        
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
    
    renderProntuario(escolaId);
    return true;
}

// 14.5 Operações de Registro de Dados da Nota Fiscal (Via Análise Técnica)
function openModalDadosNota(escolaId, compKey) {
    const accessProfile = getRadarAccessProfile();
    if (accessProfile === 'inventario' || accessProfile === 'sme') return false;
    if (blockConsolidatedFiscalNoteMutation(escolaId, compKey)) {
        return false;
    }

    const v = verificacoes[escolaId]?.[compKey];
    if (v && v.bonificacao && v.bonificacao['notaFiscal'] === 'Não se aplica') {
        alert('Não é possível adicionar notas fiscais para competências marcadas como "Não se aplica".');
        return false;
    }
    document.getElementById('form-dados-nota').reset();
    document.getElementById('nota-escola-id').value = escolaId;
    document.getElementById('nota-comp-key').value = compKey;
    document.getElementById('nota-id').value = '';
    
    // Restaurar título e botão do modal para modo padrão
    document.querySelector('#modal-dados-nota h3').innerText = 'Dados da Nota Fiscal / Despesa';
    document.querySelector('#modal-dados-nota button[type="submit"]').innerText = 'Salvar Gasto';
    
    openModal('modal-dados-nota');
    return true;
}

async function salvarDadosNota(e) {
    e.preventDefault();
    const accessProfile = getRadarAccessProfile();
    if (accessProfile === 'inventario' || accessProfile === 'sme') return false;
    const notaId = document.getElementById('nota-id').value;
    const escolaId = document.getElementById('nota-escola-id').value;
    const compKey = document.getElementById('nota-comp-key').value;
    const desc = document.getElementById('nota-desc').value.trim();
    const tipo = document.getElementById('nota-tipo').value;
    const numero = document.getElementById('nota-numero').value.trim();
    const valor = parseFloat(document.getElementById('nota-valor').value);

    try {
        const result = await radarInvoiceService.save({
            id: notaId || null,
            schoolId: escolaId,
            compKey,
            description: desc,
            expenseType: tipo,
            invoiceNumber: numero,
            amount: valor,
            profile: accessProfile
        });
        rebuildOperationalIndexes();
        if (result.value.warnings.includes('SERVICE_ADVISORY_REQUIRED')) {
            alert('Aviso de Regra de Negócio: Como é prestação de serviços (custeio), é obrigatório apresentar o e-mail de consultoria da assessoria contábil no encarte mensal do PDDE.');
        }
        if (result.value.warnings.includes('MISSING_INVENTORY_PROCESS')) {
            alert('Aviso: O bem permanente foi registrado no inventário, mas a escola não tem Processo de Inventário cadastrado. A equipe de inventário não poderá tombá-lo até que você cadastre o processo da escola.');
        }
        closeModal('modal-dados-nota');
        renderProntuario(escolaId);
        updateAlertsBell();
    } catch (error) {
        reportRadarActionError(error, 'Não foi possível salvar a nota fiscal.');
    }
}


function abrirEditarNota(notaId, escolaId) {
    const accessProfile = getRadarAccessProfile();
    if (accessProfile === 'inventario' || accessProfile === 'sme') return false;
    const nota = notasRegistradas.find(n => n.id === notaId);
    if (!nota) return false;
    if (blockConsolidatedFiscalNoteMutation(escolaId, nota.compKey)) return false;

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
    return true;
}

async function toggleConsEnviada(escolaId, compKey, isChecked) {
    const accessProfile = getRadarAccessProfile();
    if (accessProfile === 'inventario' || accessProfile === 'sme') return false;
    try {
        await radarVerificationService.setBonification({
            schoolId: escolaId,
            compKey,
            documentKey: 'consEnviada',
            value: Boolean(isChecked),
            profile: accessProfile
        });
    } catch (error) {
        reportRadarActionError(error, 'Não foi possível alterar o status da consulta à Assessoria.');
        renderProntuario(escolaId);
        return false;
    }
    renderProntuario(escolaId);
    return true;
}

async function removerNotaRegistrada(notaId, escolaId) {
    const accessProfile = getRadarAccessProfile();
    if (accessProfile === 'inventario' || accessProfile === 'sme') return false;
    const nota = notasRegistradas.find(item => item.id === notaId);
    if (!nota) return;
    if (blockConsolidatedFiscalNoteMutation(escolaId, nota.compKey)) return;
    if (!confirm('Deseja realmente remover esta nota fiscal registrada?')) return;

    try {
        const result = await radarInvoiceService.remove({
            id: notaId,
            schoolId: escolaId,
            profile: accessProfile
        });
        rebuildOperationalIndexes();
        if (result.value.resetFiscalAnalysis) {
            alert('Aviso: Como você removeu todas as notas fiscais cadastradas para esta competência/programa, a análise técnica foi redefinida para "Não analisado".');
        }
        renderProntuario(escolaId);
        updateAlertsBell();
    } catch (error) {
        reportRadarActionError(error, 'Não foi possível remover a nota fiscal.');
    }
}


// 14.4 Regra de Consolidação de Bonificação (Apta / Inapta)
async function calcularEFecharBonificacao(escolaId, compKey) {
    const accessProfile = getRadarAccessProfile();
    if (accessProfile === 'inventario' || accessProfile === 'sme') return false;
    try {
        await radarVerificationService.closeBonification({
            schoolId: escolaId,
            compKey,
            profile: accessProfile
        });
    } catch (error) {
        reportRadarActionError(error, 'Não foi possível consolidar a bonificação.');
        renderProntuario(escolaId);
        return false;
    }
    renderProntuario(escolaId);
    updateAlertsBell();
    return true;
}



// ==========================================
// 15. REGRA OPERACIONAL: REQUISITOS DE CAPITAL
// ==========================================

async function updateCapitalDoc(bemId, field, value) {
    const accessProfile = getRadarAccessProfile();
    if (accessProfile === 'inventario' || accessProfile === 'sme') return false;
    try {
        await radarInventoryService.updateAsset({
            assetId: bemId,
            field,
            value,
            profile: accessProfile
        });
        rebuildOperationalIndexes();
    } catch (error) {
        reportRadarActionError(error, 'Não foi possível atualizar o bem patrimonial.');
        if (activeSchoolId) renderProntuario(activeSchoolId);
    }
}

async function encaminharCapital(bemId) {
    const accessProfile = getRadarAccessProfile();
    if (accessProfile === 'inventario' || accessProfile === 'sme') return false;
    try {
        await radarInventoryService.forward({
            assetId: bemId,
            profile: accessProfile
        });
        rebuildOperationalIndexes();
        renderProntuario(activeSchoolId);
        updateAlertsBell();
    } catch (error) {
        reportRadarActionError(error, 'Não foi possível encaminhar o bem patrimonial.');
    }
}




// ==========================================
// 16. MODAIS OPERACIONAIS: CRIAÇÃO E SALVAMENTO
// ==========================================

function openModal(id) {
    document.getElementById(id).classList.add('show');
}

function closeModal(id) {
    if (id === 'modal-registrar-envio') {
        closeRegistrarNovoEnvioModal();
        return;
    }
    if (id === 'modal-reanalisar-pendencia') {
        closeReanalysisModal();
        return;
    }
    document.getElementById(id).classList.remove('show');
    if (id === 'modal-nova-pendencia') {
        clearPendencyNotice();
    }
}

// 16.1 Salvar Contato / Atendimento
function openContatoModal(escolaId) {
    if (!hasRadarCapability(
        window.RadarAccessPolicy.CAPABILITIES.REGISTER_PENDENCY_CONTACT
    )) return false;
    document.getElementById('contato-escola-id').value = escolaId;
    document.getElementById('contato-data-atendimento').value = new Date().toISOString().split('T')[0];
    
    // Popular pendências vinculáveis (usando == para evitar incompatibilidade entre string e número)
    const pSelect = document.getElementById('contato-pendencia');
    pSelect.innerHTML = `<option value="">Nenhuma pendência específica</option>`;
    pendencias.filter(p => p.escolaId == escolaId && p.status === 'Aberta').forEach(p => {
        const pData = getFormattedPendencyData(p);
        pSelect.innerHTML += `<option value="${escapeHtml(p.id)}">${escapeHtml(pData.competencia)} - ${escapeHtml(pData.item)} (${escapeHtml(p.motivo)})</option>`;
    });

    openModal('modal-contato');
}

async function saveContato(e) {
    e.preventDefault();
    if (!hasRadarCapability(
        window.RadarAccessPolicy.CAPABILITIES.REGISTER_PENDENCY_CONTACT
    )) return false;
    const escolaId = document.getElementById('contato-escola-id').value;
    const tipo = document.getElementById('contato-tipo').value;
    const dataAtend = document.getElementById('contato-data-atendimento').value;
    const pendId = document.getElementById('contato-pendencia').value;
    const desc = document.getElementById('contato-desc').value.trim();

    try {
        await radarPendencyService.registerContact({
            schoolId: escolaId,
            pendencyId: pendId || null,
            channel: tipo,
            serviceDate: dataAtend,
            description: desc
        });
    } catch (error) {
        reportRadarActionError(error, 'Não foi possível registrar o contato.');
        return false;
    }
    closeModal('modal-contato');
    document.getElementById('form-contato').reset();
    
    if (currentView === 'prontuario') {
        renderProntuario(escolaId);
    } else {
        renderDashboard();
    }
    updateAlertsBell();
    return true;
}

// 16.2 Salvar Nova Pendência Manual ou Documental
function showPendencyNotice(message, variant = 'info') {
    const notice = document.getElementById('pendency-notice');
    if (!notice) return;

    notice.textContent = message || '';
    notice.dataset.variant = variant;
    notice.hidden = !message;
}

function clearPendencyNotice() {
    showPendencyNotice('');
}

function createPendencyClientId(prefix) {
    const uniquePart = window.crypto && typeof window.crypto.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `${prefix}-${uniquePart}`;
}

function renderPendencyErrorOptions() {
    const container = document.getElementById('pend-erros-documentais');
    if (!container) return;

    container.innerHTML = window.RadarPendencias.DOCUMENT_ERROR_TYPES.map(error => `
        <label class="pendency-error-option">
            <input
                type="checkbox"
                name="pend-erros"
                value="${escapeHtml(error)}"
                onchange="syncAbsentErrorExclusivity(this)"
            >
            <span>${escapeHtml(error)}</span>
        </label>
    `).join('');
}

function getSelectedPendencyErrors() {
    const selectedErrors = Array.from(
        document.querySelectorAll('#pend-erros-documentais input[name="pend-erros"]:checked')
    ).map(input => input.value);
    return window.RadarPendencias.validateDocumentErrors(selectedErrors);
}

function syncAbsentErrorExclusivity(changedInput) {
    const inputs = Array.from(
        document.querySelectorAll('#pend-erros-documentais input[name="pend-erros"]')
    );
    enforceAbsentDocumentExclusivity(inputs, changedInput);
}

function configurePendencyFormMode(isDocumentary) {
    const documentaryGroup = document.getElementById('pend-erros-documentais-group');
    const legacyGroup = document.getElementById('pend-motivo-legacy-group');
    const responsibleGroup = document.getElementById('pend-responsavel-group');
    const motiveSelect = document.getElementById('pend-motivo');
    const responsibleSelect = document.getElementById('pend-responsavel');
    const competenceSelect = document.getElementById('pend-competencia');
    const itemSelect = document.getElementById('pend-item');
    const title = document.querySelector('#modal-nova-pendencia .modal-header h3');

    documentaryGroup.hidden = !isDocumentary;
    legacyGroup.hidden = isDocumentary;
    responsibleGroup.hidden = isDocumentary;
    motiveSelect.required = !isDocumentary;
    motiveSelect.disabled = isDocumentary;
    responsibleSelect.required = !isDocumentary;
    responsibleSelect.disabled = isDocumentary;
    competenceSelect.required = !isDocumentary;
    competenceSelect.disabled = isDocumentary;
    itemSelect.required = !isDocumentary;
    itemSelect.disabled = isDocumentary;
    title.textContent = isDocumentary
        ? 'Abrir Pendência Documental'
        : 'Abrir Pendência Manual';
}

function resetNovaPendenciaForm() {
    const form = document.getElementById('form-nova-pendencia');
    form.reset();
    document.getElementById('pend-item')
        .querySelectorAll('option[data-contextual="true"]')
        .forEach(option => option.remove());
    document.getElementById('pendencia-escola-id').value = '';
    document.getElementById('pend-programa-id').value = '';
    document.getElementById('pend-documento-key').value = '';
    renderPendencyErrorOptions();
    configurePendencyFormMode(false);
}

function openNovaPendenciaModal(escolaId, isManual = true) {
    if (!hasRadarCapability(
        window.RadarAccessPolicy.CAPABILITIES.OPEN_PENDENCY
    )) return false;
    resetNovaPendenciaForm();
    clearPendencyNotice();
    document.getElementById('pendencia-escola-id').value = escolaId;
    
    // Preencher select de competências
    const compSelect = document.getElementById('pend-competencia');
    compSelect.innerHTML = COMPETENCIAS.filter(c => c.key <= config.competenciaFechamento).map(c => `
        <option value="${c.key}">${c.label}</option>
    `).join('');
    compSelect.value = activeCompetenciaKey;
    configurePendencyFormMode(!isManual);

    openModal('modal-nova-pendencia');
    return true;
}

function openNovaPendenciaModalWithDefaults(
    escolaId,
    compProgKey,
    programaNome,
    documentoKey,
    documentoNome
) {
    const context = window.RadarFluxoOperacional.buildPendencyContext({
        compProgKey,
        programaNome,
        documentoKey,
        documentoNome
    });
    if (!openNovaPendenciaModal(escolaId, false)) return false;
    document.getElementById('pend-competencia').value = context.competencia;
    document.getElementById('pend-programa-id').value = context.programaId;
    document.getElementById('pend-documento-key').value = context.documentoKey;

    const itemSelect = document.getElementById('pend-item');
    const contextualOption = document.createElement('option');
    contextualOption.value = context.item;
    contextualOption.textContent = context.item;
    contextualOption.dataset.contextual = 'true';
    itemSelect.appendChild(contextualOption);
    itemSelect.value = context.item;
    return true;
}

async function saveNovaPendencia(e) {
    e.preventDefault();
    if (!hasRadarCapability(
        window.RadarAccessPolicy.CAPABILITIES.OPEN_PENDENCY
    )) return false;
    const sourceView = currentView;
    const escolaId = document.getElementById('pendencia-escola-id').value;
    const comp = document.getElementById('pend-competencia').value;
    const programaId = document.getElementById('pend-programa-id').value;
    const documentoKey = document.getElementById('pend-documento-key').value;
    const item = document.getElementById('pend-item').value;
    const motivo = document.getElementById('pend-motivo').value;
    const resp = document.getElementById('pend-responsavel').value;
    const obs = document.getElementById('pend-obs').value.trim();
    const isDocumentary = Boolean(programaId && documentoKey);

    if (!obs) {
        showPendencyNotice('Informe as observações da pendência.', 'error');
        document.getElementById('pend-obs').focus();
        return;
    }

    let newPend;

    try {
        let errors = [];
        if (isDocumentary) {
            errors = getSelectedPendencyErrors();
        }
        const result = await radarPendencyService.open({
            schoolId: escolaId,
            competence: comp,
            programId: isDocumentary ? programaId : null,
            documentKey: isDocumentary ? documentoKey : null,
            item,
            errors,
            reason: motivo,
            responsible: resp,
            observation: obs
        });
        newPend = result.value.pendency;
    } catch (error) {
        if (error?.code === 'DUPLICATE_PENDENCY' && error.details?.existingPendencyId) {
            closeModal('modal-nova-pendencia');
            resetNovaPendenciaForm();
            openPendencyDetail(error.details.existingPendencyId);
            showPendencyNotice('Já existe uma pendência ativa para este documento.', 'duplicate');
            return false;
        }
        reportRadarPersistenceError(error);
        showPendencyNotice(error && error.message
            ? error.message
            : 'Não foi possível validar a pendência.', 'error');
        if (isDocumentary) {
            const firstErrorInput = document.querySelector('input[name="pend-erros"]');
            if (firstErrorInput) firstErrorInput.focus();
        }
        return;
    }

    rebuildOperationalIndexes();
    closeModal('modal-nova-pendencia');
    resetNovaPendenciaForm();

    if (sourceView === 'prontuario') {
        renderProntuario(escolaId);
    } else {
        renderPendencias();
    }
    updateAlertsBell();
    return Boolean(newPend);
}

// 16.3 Editar Cadastro da Escola
function openEscolaEditModal(escolaId) {
    if (!['assistente', 'controlador'].includes(getRadarAccessProfile())) return false;
    const selectCtrl = document.getElementById('edit-controlador');
    selectCtrl.innerHTML = getActiveControllers().map(c => `
        <option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>
    `).join('');

    const chkContainer = document.getElementById('edit-programas-checkboxes');
    chkContainer.innerHTML = getActivePrograms().map(p => `
        <label style="display:flex; align-items:center; gap:6px; font-size:0.8rem;">
            <input type="checkbox" name="edit-programs" value="${escapeHtml(p.id)}" ${p.id === 'BASIC' ? 'checked disabled' : ''}>
            ${escapeHtml(p.name)}
        </label>
    `).join('');

    if (escolaId) {

        const esc = escolas.find(e => e.id === escolaId);

        document.getElementById('edit-escola-id').value = esc.id;

        document.getElementById('edit-sici').value = esc.sici || '';

        document.getElementById('edit-email').value = esc.email || '';

        document.getElementById('edit-diretor').value = esc.diretor;

        document.getElementById('edit-telefone-diretor').value = esc.telefoneDiretor || '';

        document.getElementById('edit-diretor-adjunto').value = esc.diretorAdjunto || '';

        document.getElementById('edit-telefone-adjunto').value = esc.telefoneDiretorAdjunto || '';

        document.getElementById('edit-telefone').value = esc.telefone;

        document.getElementById('edit-celular-institucional').value = esc.telefoneCelularInstitucional || '';

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
    return true;
}

async function saveEscolaEdit(e) {
    e.preventDefault();
    if (!['assistente', 'controlador'].includes(getRadarAccessProfile())) return false;
    const id = document.getElementById('edit-escola-id').value;
    const sici = document.getElementById('edit-sici').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    const diretor = document.getElementById('edit-diretor').value.trim();
    const telefoneDiretor = document.getElementById('edit-telefone-diretor').value.trim();
    const diretorAdjunto = document.getElementById('edit-diretor-adjunto').value.trim();
    const telefoneDiretorAdjunto = document.getElementById('edit-telefone-adjunto').value.trim();
    const tel = document.getElementById('edit-telefone').value.trim();
    const celularInstitucional = document.getElementById('edit-celular-institucional').value.trim();
    const ctrlId = document.getElementById('edit-controlador').value;
    const processo = document.getElementById('edit-processo').value.trim();
    const progIds = ['BASIC'];
    document.querySelectorAll('input[name="edit-programs"]:checked').forEach(chk => {
        if (chk.value !== 'BASIC') progIds.push(chk.value);
    });
    try {
        const result = await radarSchoolService.saveSchool({
            id: id || undefined,
            sici,
            email,
            director: diretor,
            directorPhone: telefoneDiretor,
            deputyDirector: diretorAdjunto,
            deputyDirectorPhone: telefoneDiretorAdjunto,
            phone: tel,
            institutionalMobile: celularInstitucional,
            controllerId: ctrlId,
            inventoryProcess: processo,
            programIds: progIds,
            initialCompetence: activeCompetenciaKey || '2026-05'
        });
        const savedId = result.value.school.id;
        closeModal('modal-escola-edit');
        if (currentView === 'prontuario') {
            renderProntuario(savedId);
        } else {
            renderEscolas();
        }
    } catch (error) {
        reportRadarActionError(error, 'Não foi possível salvar a escola.');
    }
}

// 16.4 Registrar Novo Bem de Capital
async function openNovoCapitalModal(escolaId) {
    const accessProfile = getRadarAccessProfile();
    if (accessProfile === 'inventario' || accessProfile === 'sme') return false;
    const dec = prompt('Descreva o bem patrimonial comprado (ex: Computador Desktop Dell):');
    if (!dec) return;
    const valStr = prompt('Informe o valor da compra (ex: 2500):');
    const val = parseFloat(valStr);
    if (Number.isNaN(val)) {
        alert('Valor inválido!');
        return;
    }
    const nf = prompt('Informe o número da Nota Fiscal (opcional para iniciar, ex: NF-84321):') || '';

    try {
        await radarInventoryService.createAsset({
            schoolId: escolaId,
            competence: activeCompetenciaKey,
            description: dec,
            amount: val,
            invoiceNumber: nf,
            profile: accessProfile
        });
        rebuildOperationalIndexes();
        renderProntuario(escolaId);
        updateAlertsBell();
    } catch (error) {
        reportRadarActionError(error, 'Não foi possível registrar o bem patrimonial.');
    }
}




// ==========================================
// 17. REGRA OPERACIONAL: GERADOR DE COBRANÇAS
// ==========================================

function openCobrancaModal(escolaId) {
    if (!hasRadarCapability(
        window.RadarAccessPolicy.CAPABILITIES.REGISTER_PENDENCY_CONTACT
    )) return false;
    const esc = escolas.find(e => e.id == escolaId);
    if (!esc) return false;

    document.getElementById('cobranca-escola-id').value = escolaId;
    
    // Regra: Filtrar e exibir apenas pendências escolares externas (excluir as de responsabilidade do Inventário/Verbas Federais)
    const pEscola = pendencias.filter(p => p.escolaId == escolaId && p.status === 'Aberta' && p.responsavel === 'Escola');
    
    const container = document.getElementById('cobranca-checkboxes-container');
    if (pEscola.length === 0) {
        container.innerHTML = `<div style="color:var(--text-muted); font-size:0.8rem">Nenhuma pendência externa sob responsabilidade da Escola.</div>`;
        document.getElementById('cobranca-preview-text').innerText = `Prezado(a) Diretor(a) de ${esc.denominação},\n\nConstatamos que não há pendências ativas de obrigações do PDDE sob responsabilidade da unidade escolar no RADAR PDDE.\n\nAtenciosamente,\nComitê PDDE / Verbas Federais`;
        openModal('modal-cobranca');
        return true;
    }

    container.innerHTML = pEscola.map(p => {
        const pData = getFormattedPendencyData(p);
        return `
            <label style="display:flex; align-items:flex-start; gap:8px; margin-bottom:8px; font-size:0.8rem; cursor:pointer;">
                <input type="checkbox" class="chk-cobranca-item" value="${escapeHtml(p.id)}" checked onchange="buildCobrancaPreview('${escapeHtml(escolaId)}')">
                <div>
                    <strong>[Comp. ${escapeHtml(pData.competencia)}] ${escapeHtml(pData.item)}</strong><br>
                    Motivo: ${escapeHtml(p.motivo)} - ${escapeHtml(p.observacao)}
                </div>
            </label>
        `;
    }).join('');

    buildCobrancaPreview(escolaId);
    openModal('modal-cobranca');
    return true;
}

function formatCompetenciaText(key) {
    if (!key) return '';
    const splitContext = window.RadarCompetencia.splitCompetenciaContext(key);
    const baseKey = splitContext.competenciaKey;
    const comp = COMPETENCIAS.find(c => c.key === baseKey);
    const label = comp ? comp.label.replace(' ', '/') : baseKey;
    
    if (splitContext.contextId) {
        const progId = splitContext.contextId;
        const prog = programas.find(p => p.id === progId);
        const progName = prog ? prog.name : progId;
        return `${label} - ${progName}`;
    }
    return label;
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
    if (!hasRadarCapability(
        window.RadarAccessPolicy.CAPABILITIES.REGISTER_PENDENCY_CONTACT
    )) return false;
    const previewText = document.getElementById('cobranca-preview-text').innerText;
    return navigator.clipboard.writeText(previewText).then(async () => {
        alert('Texto de cobrança copiado para a área de transferência! Você já pode colar no e-mail ou WhatsApp.');
        const escolaId = document.getElementById('cobranca-escola-id').value;
        try {
            await radarPendencyService.registerContact({
                id: `cont-${Date.now()}`,
                schoolId: escolaId,
                channel: 'E-mail',
                serviceDate: new Date().toISOString().slice(0, 10),
                description: 'Mensagem de cobrança consolidada enviada para a escola cobrando pendências selecionadas.',
                operationId: `cobranca:${escolaId}:${Date.now()}`
            });
        } catch (error) {
            reportRadarActionError(error, 'O texto foi copiado, mas o contato não pôde ser registrado.');
            return;
        }
        closeModal('modal-cobranca');
        if (currentView === 'prontuario') renderProntuario(escolaId);
    }).catch(error => reportRadarActionError(error, 'Não foi possível copiar o texto da cobrança.'));
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
    const activeControllers = getActiveControllers();
    const activeInventoryMembers = getActiveInventoryMembers();

    // Calcular contagem de escolas por controlador
    const ctrlStats = activeControllers.map(c => {
        const totalEscolas = escolas.filter(e => e.controladorId === c.id).length;
        return { ...c, totalEscolas };
    });

    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1 id="team-page-title" tabindex="-1">Gestão de Equipe</h1>
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
            <button class="tab-button ${activeEquipeTab === 'controladores' ? 'active' : ''}" onclick="switchEquipeTab('controladores')" style="background:none; border:none; color:${activeEquipeTab === 'controladores' ? 'var(--primary)' : 'var(--text-muted)'}; font-weight:600; padding: 8px 16px; cursor:pointer;">Controladores e Carteiras (${activeControllers.length})</button>
            <button class="tab-button ${activeEquipeTab === 'inventario' ? 'active' : ''}" onclick="switchEquipeTab('inventario')" style="background:none; border:none; color:${activeEquipeTab === 'inventario' ? 'var(--primary)' : 'var(--text-muted)'}; font-weight:600; padding: 8px 16px; cursor:pointer;">Equipe de Inventário (${activeInventoryMembers.length})</button>
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
                                <h3 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(c.name)}</h3>
                                <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(c.email)}</p>
                            </div>
                        </div>
                        
                        <div style="border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span style="font-size: 0.75rem; color: var(--text-muted); display: block; text-transform: uppercase; letter-spacing: 0.5px;">Carteira</span>
                                <span style="font-size: 1.1rem; font-weight: 700; color: var(--primary);">${c.totalEscolas} ${c.totalEscolas === 1 ? 'escola' : 'escolas'}</span>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn btn-secondary btn-sm" onclick="abrirEditarControlador('${escapeHtml(c.id)}')" title="Editar dados">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="removerControlador('${escapeHtml(c.id)}', this)" title="Remover controlador" ${activeControllers.length <= 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
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
                            ${activeControllers.map(ctrl => `<option value="${escapeHtml(ctrl.id)}">${escapeHtml(ctrl.name)}</option>`).join('')}
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
                                        <td style="text-align: center;"><input type="checkbox" class="escola-bulk-checkbox" data-id="${escapeHtml(e.id)}" onchange="updateBulkBar()" style="cursor:pointer;"></td>
                                        <td>
                                            <div style="font-weight: 600; color: var(--text-main);">${escapeHtml(e.denominação || e.denominaçao)}</div>
                                            <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(e.designação || e.designaçao)} | ${escapeHtml(e.email)}</div>
                                        </td>
                                        <td><code>${escapeHtml(e.inep)}</code></td>
                                        <td>${escapeHtml(e.cnpj)}</td>
                                        <td><span class="badge badge-gray">${escapeHtml(getRAFromDesignacao(e.designação || e.designaçao))}</span></td>
                                        <td>
                                            <select class="form-control select-alocacao" style="max-width: 220px; font-weight: 500; border-color: var(--border-color);" onchange="reatribuirEscolaDirect('${escapeHtml(e.id)}', this.value)">
                                                ${activeControllers.map(ctrl => `
                                                    <option value="${escapeHtml(ctrl.id)}" ${ctrl.id === currentCtrlId ? 'selected' : ''}>${escapeHtml(ctrl.name)}</option>
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
                ${activeInventoryMembers.map(inv => `
                    <div class="panel-card ctrl-card" style="position: relative; overflow: hidden; transition: var(--transition-smooth); border: 1px solid var(--border-color);">
                        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
                            <div class="avatar" style="width: 48px; height: 48px; border-radius: 50%; background: rgba(157, 125, 252, 0.1); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 600;">
                                ${inv.name ? inv.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??'}
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <h3 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(inv.name)}</h3>
                                <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(inv.email)}</p>
                            </div>
                        </div>
                        
                        <div style="border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 12px; display: flex; justify-content: flex-end; align-items: center;">
                            <div style="display: flex; gap: 8px;">
                                <button class="btn btn-secondary btn-sm" onclick="abrirEditarInventariador('${escapeHtml(inv.id)}')" title="Editar dados">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="removerInventariador('${escapeHtml(inv.id)}')" title="Remover integrante" ${activeInventoryMembers.length <= 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
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

async function salvarInventariador(event) {
    event.preventDefault();
    const id = document.getElementById('inventariador-id').value;
    const name = document.getElementById('inventariador-name').value.trim();
    const email = document.getElementById('inventariador-email').value.trim();
    try {
        await radarDirectoryService.saveInventoryMember({ id: id || undefined, name, email });
        closeModal('modal-inventariador-edit');
        renderEquipe();
    } catch (error) {
        reportRadarActionError(error, 'Não foi possível salvar o integrante do inventário.');
    }
}

async function removerInventariador(id) {
    if (getActiveInventoryMembers().length <= 1) {
        alert("Não é possível remover o único integrante de inventário existente!");
        return;
    }
    
    const inv = equipeInventario.find(x => x.id === id);
    if (!inv) return;
    
    if (!confirm(`Deseja realmente remover o(a) integrante do inventário ${inv.name}?`)) return;
    
    try {
        await radarDirectoryService.deactivateInventoryMember({ memberId: id });
        renderEquipe();
    } catch (error) {
        reportRadarActionError(error, 'Não foi possível desativar o integrante do inventário.');
    }
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

async function salvarControlador(event) {
    event.preventDefault();
    const id = document.getElementById('controlador-id').value;
    const name = document.getElementById('controlador-name').value.trim();
    const email = document.getElementById('controlador-email').value.trim();
    try {
        await radarDirectoryService.saveController({ id: id || undefined, name, email });
        closeModal('modal-controlador-edit');
        renderEquipe();
    } catch (error) {
        reportRadarActionError(error, 'Não foi possível salvar o controlador.');
    }
}

async function removerControlador(id, trigger = document.activeElement) {
    const activeControllers = getActiveControllers();
    if (activeControllers.length <= 1) {
        window.RadarSharedInteractions?.notify({
            type: 'error',
            message: 'Não é possível desativar a única pessoa responsável pelas carteiras.'
        });
        return;
    }
    
    const ctrl = controladores.find(c => c.id === id);
    if (!ctrl) return;
    
    const totalEscolas = escolas.filter(e => e.controladorId === id).length;
    
    try {
        if (!window.RadarSharedInteractions?.requestControllerDeactivation) {
            throw new Error('A confirmação acessível ainda não foi carregada. Recarregue a página.');
        }
        const outcome = await window.RadarSharedInteractions.requestControllerDeactivation({
            controller: ctrl,
            controllers: activeControllers,
            schoolCount: totalEscolas,
            trigger,
            onConfirm: async (recipientId, recipient) => {
                try {
                    const operation = await radarDirectoryService.deactivateController({
                        controllerId: id,
                        fallbackControllerId: recipientId
                    });
                    return {
                        ...operation.value,
                        recipientName: recipient?.name || ''
                    };
                } catch (error) {
                    throw reportRadarPersistenceError(error);
                }
            }
        });
        if (!outcome) return;
        renderEquipe();
        window.RadarSharedInteractions.notify({
            type: 'success',
            message: window.RadarSharedInteractions.formatControllerDeactivationSuccess({
                controllerName: ctrl.name,
                recipientName: outcome.result?.recipientName,
                schoolCount: outcome.result?.reassignedCount
            })
        });
        requestAnimationFrame(() => document.getElementById('team-page-title')?.focus({ preventScroll: true }));
    } catch (error) {
        window.RadarSharedInteractions?.notify({
            type: 'error',
            message: error?.message || 'Não foi possível abrir a confirmação de desativação.'
        });
    }
}

async function reatribuirEscolaDirect(escolaId, novoCtrlId) {
    try {
        const result = await radarSchoolService.assignController({
            schoolId: escolaId,
            controllerId: novoCtrlId
        });
        if (result.value.changed) renderEquipe();
    } catch (error) {
        reportRadarActionError(error, 'Não foi possível reatribuir a escola.');
        renderEquipe();
    }
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

async function aplicarAtribuicaoEmLote() {
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
    
    try {
        await radarSchoolService.bulkAssignController({
            schoolIds: targetEscolasIds,
            controllerId: novoCtrlId
        });
        renderEquipe();
    } catch (error) {
        reportRadarActionError(error, 'Não foi possível concluir a atribuição em lote.');
    }
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
    
    radarAuditService.record({
        action: 'Relatório Exportado',
        details: 'Exportação da planilha consolidada de bonificações efetuada com sucesso.'
    }).catch(error => reportRadarPersistenceError(error, { operation: 'audit:report-export' }));
}


// ==========================================
// 20. ALTERNADOR DE TEMA (CLARO/ESCURO)
// ==========================================

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('radar_pdde_theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
    radarAuditService.record({
        action: 'Tema Alterado',
        details: `Tema visual alterado para ${isDark ? 'Escuro' : 'Claro'}.`
    }).catch(error => reportRadarPersistenceError(error, { operation: 'audit:theme-change' }));
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


function runRadarStatusDiagnostics() {
    console.group('%c[RADAR PDDE] Status and Competence Diagnostics', 'color: #7c3aed; font-weight: bold; font-size: 1.1em;');
    
    let totalChecks = 0;
    let passedChecks = 0;
    let failedChecks = 0;
    const failures = [];

    function assert(condition, message, context = {}) {
        totalChecks++;
        if (condition) {
            passedChecks++;
        } else {
            failedChecks++;
            failures.push({ message, context });
            console.error(`Assert Failed: ${message}`, context);
        }
    }

    // Scenario 1: validate the two independent program dimensions.
    escolas.forEach(e => {
        e.programasIds.forEach(progId => {
            const compKey = activeCompetenciaKey;
            const bonusStatus = getProgramBonificationStatus(e.id, compKey, progId);
            const technicalStatus = getProgramTechnicalStatus(e.id, compKey, progId);

            assert(
                ['apta', 'inapta', 'em-apuracao', 'nao-lancada'].includes(bonusStatus),
                `Invalid bonus status "${bonusStatus}" for school ${e.id}, program ${progId}`,
                { schoolId: e.id, bonusStatus }
            );
            assert(
                ['correto', 'correto-atrasado', 'incorreto', 'em-analise', 'nao-analisado']
                    .includes(technicalStatus),
                `Invalid technical status "${technicalStatus}" for school ${e.id}, program ${progId}`,
                { schoolId: e.id, technicalStatus }
            );

            const compProgKey = `${compKey}_${progId}`;
            const verification = verificacoes[e.id]?.[compProgKey];
            if (!verification) return;

            if (['apta', 'inapta'].includes(verification.resultadoBonif)) {
                assert(
                    bonusStatus === verification.resultadoBonif,
                    `Bonus status must preserve the consolidated result for school ${e.id}, program ${progId}.`,
                    { verification, bonusStatus }
                );
            }
            if (Object.values(verification.analise || {}).includes('Incorreto')) {
                assert(
                    technicalStatus === 'incorreto',
                    `Incorrect analysis must affect only the technical dimension for school ${e.id}, program ${progId}.`,
                    { verification, bonusStatus, technicalStatus }
                );
            }
        });
    });

    // Scenario 2: bonus statistics must match the independent bonus status.
    const stats = getEscolasStats(escolas, activeCompetenciaKey);
    let calculatedApto = 0;
    let calculatedInapto = 0;
    let calculatedEmAndamento = 0;
    let calculatedNaoAnalisado = 0;
    let calculatedForaEscopo = 0;

    escolas.forEach(e => {
        let hasVerifications = false;
        if (verificacoes[e.id]) {
            hasVerifications = Object.keys(verificacoes[e.id]).some(k => (
                k.startsWith(activeCompetenciaKey)
            ));
        }

        if (!hasVerifications && !isCompetenceInScope(e.competenciaInicial, activeCompetenciaKey)) {
            calculatedForaEscopo++;
            return;
        }

        e.programasIds.forEach(progId => {
            const bonusStatus = getProgramBonificationStatus(
                e.id,
                activeCompetenciaKey,
                progId
            );
            if (bonusStatus === 'inapta') calculatedInapto++;
            else if (bonusStatus === 'apta') calculatedApto++;
            else if (bonusStatus === 'em-apuracao') calculatedEmAndamento++;
            else calculatedNaoAnalisado++;
        });
    });

    assert(stats.apto === calculatedApto, `Apto count mismatch: Stats has ${stats.apto}, calculated ${calculatedApto}`);
    assert(stats.inapto === calculatedInapto, `Inapto count mismatch: Stats has ${stats.inapto}, calculated ${calculatedInapto}`);
    assert(stats.emAndamento === calculatedEmAndamento, `EmAndamento count mismatch: Stats has ${stats.emAndamento}, calculated ${calculatedEmAndamento}`);
    assert(stats.naoAnalisado === calculatedNaoAnalisado, `NaoAnalisado count mismatch: Stats has ${stats.naoAnalisado}, calculated ${calculatedNaoAnalisado}`);
    assert(stats.foraEscopo === calculatedForaEscopo, `ForaEscopo count mismatch: Stats has ${stats.foraEscopo}, calculated ${calculatedForaEscopo}`);

    console.log(`%cChecks run: ${totalChecks} | Passed: ${passedChecks} | Failed: ${failedChecks}`, 
        failedChecks > 0 ? 'color: #ef4444; font-weight: bold;' : 'color: #10b981; font-weight: bold;');
    
    if (failedChecks > 0) {
        console.table(failures);
    }
    console.groupEnd();
    return { totalChecks, passedChecks, failedChecks, failures };
}
window.runRadarStatusDiagnostics = runRadarStatusDiagnostics;


const RADAR_DEBUG_MODE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// ==========================================
// 21. BOOTSTRAP DA APLICAÇÃO
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    const registrarNovoEnvioModal = document.getElementById('modal-registrar-envio');
    registrarNovoEnvioModal.addEventListener('keydown', handleRegistrarNovoEnvioKeydown);
    const reanalysisModal = document.getElementById('modal-reanalisar-pendencia');
    const reanalysisResult = document.getElementById('reanalisar-resultado');
    reanalysisModal.addEventListener('keydown', handleReanalysisKeydown);
    reanalysisResult.addEventListener('change', updateReanalysisErrorVisibility);
    const dataContext = await initializeRadarData();
    initTheme();
    if (runtimeConfig.supabase?.connectionEnabled === true) {
        window.RadarAuthGate.applyAuthorization(dataContext.authentication);
    } else {
        switchProfile('controlador'); // Mantém a simulação de perfis exclusivamente no modo local.
    }
    
    // Executa diagnósticos de status apenas se em modo debug
    if (RADAR_DEBUG_MODE) {
        runRadarStatusDiagnostics();
    }
});
