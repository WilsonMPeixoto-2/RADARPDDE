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
        "name": "Érica",
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
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004911/2026-26",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "TEMPO_APRENDER"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.807",
        "denominação": "EDI Maria Amélia Castro e Silva Belfort",
        "designação": "04.30.807",
        "telefone": "99341-7774",
        "telefoneCelularInstitucional": "21993417774",
        "email": "edimbelfort@rioeduca.net",
        "diretor": "ANDREZZA HUBEANE NÓBREGA DIAS",
        "telefoneDiretor": "97902-9777",
        "diretorAdjunto": "CAMILA DAS GRAÇAS VIEIRA MAIA RODRIGUES",
        "telefoneDiretorAdjunto": "98256-8424",
        "inep": "33176043",
        "cnpj": "28.626.726/0001-53",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "46629",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.005073/2026-16",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.808",
        "denominação": "EDI Azoilda Trindade (Zô)",
        "designação": "04.30.808",
        "telefone": "2081-0835",
        "telefoneCelularInstitucional": "21993193698",
        "email": "ediatrindade@rioeduca.net",
        "diretor": "ARIENE VITALINO DA SILVA",
        "telefoneDiretor": "99935-4556",
        "diretorAdjunto": "LUANA RAQUEL DA SILVA REZENDE",
        "telefoneDiretorAdjunto": "97947-0526",
        "inep": "33175942",
        "cnpj": "28.027.038/0001-77",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "46627",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.005095/2026-78",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.809",
        "denominação": "EDI Medalhista Olímpico Luiz Felipe Marques Fonteles",
        "designação": "04.30.809",
        "telefone": "2086-4678",
        "telefoneCelularInstitucional": "21993013914",
        "email": "edimfontelles@rioeduca.net",
        "diretor": "KATIA GOMES DA SILVA",
        "telefoneDiretor": "98516-2762",
        "diretorAdjunto": "ANA PAULA DE LANNA",
        "telefoneDiretorAdjunto": "97001-0156",
        "inep": "33179514",
        "cnpj": "31.059.011/0001-70",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "46760",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004981/2026-84",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.810",
        "denominação": "EDI Medalhista Olímpico Evandro Motta Marcondes Guerra",
        "designação": "04.30.810",
        "telefone": "2086-4681",
        "telefoneCelularInstitucional": "21993013019",
        "email": "edimguerra@rioeduca.net",
        "diretor": "VALESKA BARBOTEU PENHA",
        "telefoneDiretor": "96938-9820",
        "diretorAdjunto": "ANA ALINE GOMES SEABRA",
        "telefoneDiretorAdjunto": "98770-8345",
        "inep": "33179573",
        "cnpj": "31.538.152/0001-76",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "46759",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.005049/2026-79",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.811",
        "denominação": "EDI Medalhista Olímpico William Peixoto Arjona",
        "designação": "04.30.811",
        "telefone": "2086-3835",
        "telefoneCelularInstitucional": "21993005782",
        "email": "edimarjona@rioeduca.net",
        "diretor": "FERNANADA MEDEIROS RIBEIRO",
        "telefoneDiretor": "98383-3555",
        "diretorAdjunto": "NINA CRISTINA VIDA FELINTO",
        "telefoneDiretorAdjunto": "96483-3895",
        "inep": "33179549",
        "cnpj": "31.291.413/0001-04",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "46758",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.005028/2026-53",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.812",
        "denominação": "EDI Medalhista Olímpico Eder Francis Carbonera",
        "designação": "04.30.812",
        "telefone": "2086-2852",
        "telefoneCelularInstitucional": "21993005161",
        "email": "edimcarbonera@rioeduca.net",
        "diretor": "TAÍNA DOS REIS DO CARMO",
        "telefoneDiretor": "97967-9252",
        "diretorAdjunto": "DÉBORA CRISTINA RODRIGUES ESTEVES",
        "telefoneDiretorAdjunto": "99185-8801",
        "inep": "33179581",
        "cnpj": "31.471.375/0001-63",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "46845",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004868/2026-07",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.813",
        "denominação": "EDI Armando de Salles Oliveira",
        "designação": "04.30.813",
        "telefone": "99300-1569",
        "telefoneCelularInstitucional": "21993001569",
        "email": "emsalles@rioeduca.net",
        "diretor": "DANIELE LUCIANA CHAVES DE OLIVEIRA PONTES",
        "telefoneDiretor": "96650-3767",
        "diretorAdjunto": "JACQUELLINE RODRIGUES ALVES DOS SANTOS",
        "telefoneDiretorAdjunto": "98157-0936",
        "inep": "33069123",
        "cnpj": "01.875.458/0001-57",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "11586",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004944/2026-76",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.814",
        "denominação": "EDI João Crisóstomo",
        "designação": "04.30.814",
        "telefone": "99299-7860",
        "telefoneCelularInstitucional": "21992997860",
        "email": "edicrisostomo@rioeduca.net",
        "diretor": "MÔNICA ALVES SERAPIÃO DA SILVA",
        "telefoneDiretor": "98141-2117",
        "diretorAdjunto": "ANDRESSA MEDEIROS DA SILVA",
        "telefoneDiretorAdjunto": "99392-2228",
        "inep": "33179565",
        "cnpj": "31.563.583/0001-92",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "46765",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.004985/2026-62",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.30.815",
        "denominação": "EDI Pescador Albano Rosa",
        "designação": "04.30.815",
        "telefone": "99348-1028",
        "telefoneCelularInstitucional": "21993481028",
        "email": "ediprosa@rioeduca.net",
        "diretor": "THIAGO GENEROSO BARROS",
        "telefoneDiretor": "99399-3527",
        "diretorAdjunto": "MARIA ANDRÉA GOMES ALBA BRITTO",
        "telefoneDiretorAdjunto": "98104-1443",
        "inep": "33122776",
        "cnpj": "12.743.515/0001-60",
        "cre": "4ª CRE",
        "ra": "30ª R.A.",
        "sici": "18742",
        "controladorId": "monica_chagas",
        "processoInventario": "000704.005081/2026-54",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.001",
        "denominação": "Escola Municipal Ary Barroso",
        "designação": "04.31.001",
        "telefone": "99298-7018",
        "telefoneCelularInstitucional": "21992987018",
        "email": "emary@rioeduca.net",
        "diretor": "LUCIANE DE ASSIS ALMEIDA",
        "telefoneDiretor": "99495-3366",
        "diretorAdjunto": "EDUARDO MEIRELLES AZZAM",
        "telefoneDiretorAdjunto": "99715-3691",
        "inep": "33070440",
        "cnpj": "03.056.773/0001-88",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11351",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.004810/2026-55",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.002",
        "denominação": "Escola Municipal David Perez",
        "designação": "04.31.002",
        "telefone": "2482-3830 / 99298-6475",
        "telefoneCelularInstitucional": "21992986475",
        "email": "emperez@rioeduca.net",
        "diretor": "SHAYENNE AZEVEDO DA SILVEIRA MOREIRA",
        "telefoneDiretor": "96453-8653",
        "diretorAdjunto": "MARILANE CARDOZO DA SILVA CAVALCANTI",
        "telefoneDiretorAdjunto": "98892-3274",
        "inep": "33070539",
        "cnpj": "01.878.401/0001-01",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11350",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.004912/2026-71",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.003",
        "denominação": "Escola Municipal Miguel Gustavo",
        "designação": "04.31.003",
        "telefone": "2482-3986",
        "telefoneCelularInstitucional": "21992977460",
        "email": "emgustavo@rioeduca.net",
        "diretor": "ERIKA SILVA DE FREITAS",
        "telefoneDiretor": "97035-5622",
        "diretorAdjunto": "THAINÁ DA MATA RODRIGUES",
        "telefoneDiretorAdjunto": "99259-9573",
        "inep": "33070687",
        "cnpj": "02.347.032/0001-93",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11349",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.004929/2026-28",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.004",
        "denominação": "Escola Municipal Alfredo Gomes",
        "designação": "04.31.004",
        "telefone": "3137-7550 / 3137-7566",
        "telefoneCelularInstitucional": "21992977093",
        "email": "emalfredog@rioeduca.net",
        "diretor": "TALITA FLÁVIA SODRÉ DA SILVA",
        "telefoneDiretor": "97649-7732",
        "diretorAdjunto": "",
        "telefoneDiretorAdjunto": "",
        "inep": "33070393",
        "cnpj": "01.275.362/0001-58",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11346",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.004859/2026-16",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.006",
        "denominação": "Escola Municipal São João Batista",
        "designação": "04.31.006",
        "telefone": "2482-7312",
        "telefoneCelularInstitucional": "21992973114",
        "email": "emsaojoao@rioeduca.net",
        "diretor": "CINTHIA VIANA TAVARES DA SILVA",
        "telefoneDiretor": "98687-4575",
        "diretorAdjunto": "ELEZIANI VIEIRA AMORIM SOUZA",
        "telefoneDiretorAdjunto": "98644-6274",
        "inep": "33070857",
        "cnpj": "02.690.400/0001-00",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11344",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.005082/2026-07",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC",
            "ADOLESCENCIAS",
            "LEITURA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.007",
        "denominação": "Escola Municipal Embaixador Barros Hurtado",
        "designação": "04.31.007",
        "telefone": "2482-7736 / 2482-7955",
        "telefoneCelularInstitucional": "21992963180",
        "email": "emhurtado@rioeduca.net",
        "diretor": "MARIA CAROLINA SILVEIRA SYLVESTRE",
        "telefoneDiretor": "98337-2389",
        "diretorAdjunto": "KAREN DO NASCIMENTO MORENO",
        "telefoneDiretorAdjunto": "96586-8505",
        "inep": "33070555",
        "cnpj": "01.509.987/0001-37",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11343",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.005031/2026-77",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.008",
        "denominação": "Escola Municipal Odilon Braga",
        "designação": "04.31.008",
        "telefone": "2482-4609",
        "telefoneCelularInstitucional": "21992960557",
        "email": "embraga@rioeduca.net",
        "diretor": "ELENITA FONSECA DA SILVA",
        "telefoneDiretor": "99914-8321",
        "diretorAdjunto": "ALEXANDRE FAGUNDES ABRANTES",
        "telefoneDiretorAdjunto": "98088-5553",
        "inep": "33070741",
        "cnpj": "01.211.046/0001-12",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11342",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.004960/2026-69",
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
        "id": "04.31.009",
        "denominação": "Escola Municipal Roraima",
        "designação": "04.31.009",
        "telefone": "2485-1140 / 2485-1150",
        "telefoneCelularInstitucional": "21992955910",
        "email": "emroraima@rioeduca.net",
        "diretor": "ALINE FERREIRA RIBEIRO",
        "telefoneDiretor": "98623- 7113",
        "diretorAdjunto": "KASSIA CRISTINA DE ALMEIDA OLIVEIRA DOS SANTOS",
        "telefoneDiretorAdjunto": "98722-0949",
        "inep": "33070849",
        "cnpj": "01.529.826/0001-05",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11341",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.005029/2026-06",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.010",
        "denominação": "Escola Municipal Armando Fajardo",
        "designação": "04.31.010",
        "telefone": "2485-1422 / 99295-2993",
        "telefoneCelularInstitucional": "21992952993",
        "email": "emfajardo@rioeduca.net",
        "diretor": "MICHAEL CHRISTIAN AGUIAR MADEIRA",
        "telefoneDiretor": "98337-9924",
        "diretorAdjunto": "MARCELO PASSOS CARREGOSA",
        "telefoneDiretorAdjunto": "99093-5736",
        "inep": "33070431",
        "cnpj": "01.268.540/0001-13",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11340",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.004898/2026-13",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.011",
        "denominação": "Escola Municipal Raul Pederneiras",
        "designação": "04.31.011",
        "telefone": "2485-1433",
        "telefoneCelularInstitucional": "21992951542",
        "email": "emraul@rioeduca.net",
        "diretor": "LUCIANA OLIVEIRA NASCIMENTO DOS SANTOS",
        "telefoneDiretor": "96456-8359",
        "diretorAdjunto": "ROSE SAMARA CAVALCANTI SOUZA",
        "telefoneDiretorAdjunto": "96935-6810",
        "inep": "33070822",
        "cnpj": "01.956.704/0001-03",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11338",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.004976/2026-71",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.013",
        "denominação": "Escola Municipal Montese",
        "designação": "04.31.013",
        "telefone": "2485-2200 / 2485-2087",
        "telefoneCelularInstitucional": "21992943931",
        "email": "emmontese@rioeduca.net",
        "diretor": "VALÉRIA DOS ANJOS GUEDES",
        "telefoneDiretor": "97541-2761",
        "diretorAdjunto": "ANA PAULA BAPTISTA DE FREITAS ROSA",
        "telefoneDiretorAdjunto": "98638-3582",
        "inep": "33070733",
        "cnpj": "01.187.790/0001-29",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11336",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.005001/2026-61",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.014",
        "denominação": "Escola Municipal Ministro Lafayette de Andrada",
        "designação": "04.31.014",
        "telefone": "2485-1377",
        "telefoneCelularInstitucional": "21992938870",
        "email": "emlandrade@rioeduca.net",
        "diretor": "REJANE PERES NETO COSTA",
        "telefoneDiretor": "98103-2701",
        "diretorAdjunto": "EDUARDO DOS SANTOS COUTINHO",
        "telefoneDiretorAdjunto": "98615-9093",
        "inep": "33070695",
        "cnpj": "05.392.564/0001-30",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11335",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.004864/2026-11",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.015",
        "denominação": "Escola Municipal Joseph Bloch",
        "designação": "04.31.015",
        "telefone": "3458-1373",
        "telefoneCelularInstitucional": "21992935646",
        "email": "embloch@rioeduca.net",
        "diretor": "LUCIANA PIMENTEL VIEIRA",
        "telefoneDiretor": "98580-1343",
        "diretorAdjunto": "VALERIA PEREIRA BARRETO",
        "telefoneDiretorAdjunto": "98341-2481",
        "inep": "33070652",
        "cnpj": "01.187.789/0001-02",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11334",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.004883/2026-47",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.016",
        "denominação": "Escola Municipal Cruzada São Sebastião",
        "designação": "04.31.016",
        "telefone": "2485-3999",
        "telefoneCelularInstitucional": "21992934781",
        "email": "emcruzada@rioeduca.net",
        "diretor": "ELIANA ALMEIDA DO NASCIMENTO",
        "telefoneDiretor": "99479-3067",
        "diretorAdjunto": "ANDRE  LUIS SILVA",
        "telefoneDiretorAdjunto": "98293-2043",
        "inep": "33070474",
        "cnpj": "02.849.204/0001-27",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11333",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.004904/2026-24",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.017",
        "denominação": "Escola Municipal Cardeal Câmara",
        "designação": "04.31.017",
        "telefone": "3452-0179",
        "telefoneCelularInstitucional": "21992920079",
        "email": "emcardealc@rioeduca.net",
        "diretor": "ISAQUE DA SILVA TAVARES",
        "telefoneDiretor": "96453-9645",
        "diretorAdjunto": "JULIANA ORNELLAS MOREIRA SANTOS DE OLIVEIRA",
        "telefoneDiretorAdjunto": "98548-2900",
        "inep": "33070490",
        "cnpj": "02.998.816/0001-81",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11332",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.004986/2026-15",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.018",
        "denominação": "Escola Municipal República do Líbano",
        "designação": "04.31.018",
        "telefone": "2475-9200 / 99291-1044",
        "telefoneCelularInstitucional": "21992911044",
        "email": "emlibano@rioeduca.net",
        "diretor": "CARLOS HENRIQUE MATOS DA SILVA",
        "telefoneDiretor": "97018-1653",
        "diretorAdjunto": "CARLA LEITE FERNANDES BARROS",
        "telefoneDiretorAdjunto": "98225-6910",
        "inep": "33070830",
        "cnpj": "01.213.617/0001-58",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11331",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.005044/2026-46",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.019",
        "denominação": "Escola Municipal Jorge de Gouveia",
        "designação": "04.31.019",
        "telefone": "2475-9202 / 2475-9204",
        "telefoneCelularInstitucional": "21992910211",
        "email": "emgouvea@rioeduca.net",
        "diretor": "VALÉRIA CRISTINA CARMO DE AQUINO MASSA",
        "telefoneDiretor": "98878-6291",
        "diretorAdjunto": "PATRICIA DO NASCIMENTO PAULO",
        "telefoneDiretorAdjunto": "99881-6758",
        "inep": "33070644",
        "cnpj": "01.859.807/0001-47",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11330",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.005107/2026-64",
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
        "id": "04.31.021",
        "denominação": "Escola Municipal Heitor Beltrão",
        "designação": "04.31.021",
        "telefone": "2475-9207 / 2475-9208'",
        "telefoneCelularInstitucional": "21992905794",
        "email": "embeltrao@rioeduca.net",
        "diretor": "VANESSA SANTOS DE MORAES",
        "telefoneDiretor": "98320-4010",
        "diretorAdjunto": "CARLA DE OLIVEIRA BOURA",
        "telefoneDiretorAdjunto": "97915-1616",
        "inep": "33070601",
        "cnpj": "04.494.649/0001-67",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11328",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.004784/2026-65",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.022",
        "denominação": "Escola Municipal Eneyda Rabello de Andrade",
        "designação": "04.31.022",
        "telefone": "2475-9210",
        "telefoneCelularInstitucional": "21993016649",
        "email": "emeneyda@rioeduca.net",
        "diretor": "MARIA CRISTINA DOS SANTOS CAMPOS",
        "telefoneDiretor": "99340-8173",
        "diretorAdjunto": "CARLA ELISA DIAS DE OLIVEIRA",
        "telefoneDiretorAdjunto": "96499-3204",
        "inep": "33070563",
        "cnpj": "01.878.402/0001-56",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11327",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.004934/2026-31",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.023",
        "denominação": "Escola Municipal Presidente Gronchi",
        "designação": "04.31.023",
        "telefone": "3855-7107 / 3855-7010",
        "telefoneCelularInstitucional": "21993186929",
        "email": "emgronchi@rioeduca.net",
        "diretor": "ILMA FÁTIMA CONSTANTINO VALVERDE",
        "telefoneDiretor": "98149-9745",
        "diretorAdjunto": "ANA CAROLINA TEIXEIRA BATISTA DE MIRANDA",
        "telefoneDiretorAdjunto": "97064-9817",
        "inep": "33070776",
        "cnpj": "03.016.915/0001-83",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11868",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.004797/2026-34",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.024",
        "denominação": "Escola Municipal Andrade Neves",
        "designação": "04.31.024",
        "telefone": "99318-4439 / 2475-7262 / 3372-5902",
        "telefoneCelularInstitucional": "21993184439",
        "email": "emaneves@rioeduca.net",
        "diretor": "ADRIANE FERREIRA REIS MORAES",
        "telefoneDiretor": "99202-5575",
        "diretorAdjunto": "ANA CARLA DA SILVA BRANCO",
        "telefoneDiretorAdjunto": "99473-7133",
        "inep": "33070415",
        "cnpj": "01.959.159/0001-09",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11869",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.005084/2026-98",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC",
            "LEITURA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.026",
        "denominação": "Escola Municipal Herbert Moses",
        "designação": "04.31.026",
        "telefone": "3855-9566",
        "telefoneCelularInstitucional": "21993182608",
        "email": "emmoses@rioeduca.net",
        "diretor": "RAFAEL LUIZ PINTO PERES",
        "telefoneDiretor": "97140-1844",
        "diretorAdjunto": "VÂNIA CRISTINA FRAGA DE FARIA PICULO",
        "telefoneDiretorAdjunto": "99861-8583",
        "inep": "33070610",
        "cnpj": "02.293.014/0001-76",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11568",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.004978/2026-61",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.027",
        "denominação": "Escola Municipal Zélia Braune",
        "designação": "04.31.027",
        "telefone": "3855-9220",
        "telefoneCelularInstitucional": "21993179184",
        "email": "embraune@rioeduca.net",
        "diretor": "WLADIMIR MENDONÇA DA SILVA",
        "telefoneDiretor": "99578-9247",
        "diretorAdjunto": "JULIA BEATRIZ GOMES CARVALHO DA SILVA",
        "telefoneDiretorAdjunto": "98663-8126",
        "inep": "33070890",
        "cnpj": "03.827.454/0001-29",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11569",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.005063/2026-72",
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
        "id": "04.31.501",
        "denominação": "Ciep Mestre Cartola (Agenor de Oliveira)",
        "designação": "04.31.501",
        "telefone": "3453-6464",
        "telefoneCelularInstitucional": "21993178149",
        "email": "ciepcartola@rioeduca.net",
        "diretor": "MARCI DIAS PIRES",
        "telefoneDiretor": "99793-1538",
        "diretorAdjunto": "ELIANE BOMBINO DO AMARAL",
        "telefoneDiretorAdjunto": "99392-3539",
        "inep": "33069824",
        "cnpj": "01.878.626/0001-68",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11919",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.005064/2026-17",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.502",
        "denominação": "Ciep Graciliano Ramos",
        "designação": "04.31.502",
        "telefone": "3083-7595 / 99316-8830",
        "telefoneCelularInstitucional": "21993168830",
        "email": "ciepgramos@rioeduca.net",
        "diretor": "LUCIANA DA SILVA NASCIMENTO",
        "telefoneDiretor": "97272-1717",
        "diretorAdjunto": "ISABEL FELIPE MOREIRA",
        "telefoneDiretorAdjunto": "98915-0171",
        "inep": "33073988",
        "cnpj": "01.124.831/0001-38",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11325",
        "controladorId": "wilson_peixoto",
        "processoInventario": "000704.004940/2026-98",
        "programasIds": [
            "BASIC",
            "CONECTADA",
            "PROEC",
            "ADOLESCENCIAS"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.601",
        "denominação": "Creche Municipal Luís Carlos de Oliveira Câmara",
        "designação": "04.31.601",
        "telefone": "3455-5372",
        "telefoneCelularInstitucional": "21993161033",
        "email": "cmlcamara@rioeduca.net",
        "diretor": "ANDRÉA BELARMINO DE CARVALHO ABEL PINTO",
        "telefoneDiretor": "97693-7001",
        "diretorAdjunto": "KEZIA GOMES DA SILVA",
        "telefoneDiretorAdjunto": "99201-4629",
        "inep": "33144699",
        "cnpj": "12.329.092/0001-37",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "18710",
        "controladorId": "alzira_de_souza",
        "processoInventario": "000704.004928/2026-83",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.602",
        "denominação": "Creche Municipal Barbosa Lima Sobrinho",
        "designação": "04.31.602",
        "telefone": "99315-4511",
        "telefoneCelularInstitucional": "21993154511",
        "email": "cmbsobrinho@rioeduca.net",
        "diretor": "MAYARA SOARES BASILIO",
        "telefoneDiretor": "97964-8500",
        "diretorAdjunto": "MARCOS PAULO REGIS FARIA",
        "telefoneDiretorAdjunto": "97556-4740",
        "inep": "33137331",
        "cnpj": "12.582.479/0001-09",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "18643",
        "controladorId": "alzira_de_souza",
        "processoInventario": "000704.004905/2026-79",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.603",
        "denominação": "Creche Municipal Chico Mendes",
        "designação": "04.31.603",
        "telefone": "99312-4302 / 3424-6677",
        "telefoneCelularInstitucional": "21993124302",
        "email": "cmcmendes@rioeduca.net",
        "diretor": "MARIA CRISTINA FALBO MARTINS",
        "telefoneDiretor": "98543-0591",
        "diretorAdjunto": "MARIA DAS DORES SILVA",
        "telefoneDiretorAdjunto": "99420-6327",
        "inep": "33096503",
        "cnpj": "12.493.499/0001-03",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "18667",
        "controladorId": "alzira_de_souza",
        "processoInventario": "000704.005052/2026-92",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.604",
        "denominação": "Creche Municipal Coração de Geneve",
        "designação": "04.31.604",
        "telefone": "2475-9211",
        "telefoneCelularInstitucional": "21993119466",
        "email": "cmcgeneve@rioeduca.net",
        "diretor": "KELLEN DO NASCIMENTO MORENO",
        "telefoneDiretor": "97366-0594",
        "diretorAdjunto": "VANICE DA SILVA ELIAS",
        "telefoneDiretorAdjunto": "96412-1404",
        "inep": "33096546",
        "cnpj": "12.470.388/0001-73",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "18670",
        "controladorId": "alzira_de_souza",
        "processoInventario": "000704.004889/2026-14",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.605",
        "denominação": "Creche Municipal Sempre Vida Dique",
        "designação": "04.31.605",
        "telefone": "3855-9483",
        "telefoneCelularInstitucional": "21993111783",
        "email": "cmdique@rioeduca.net",
        "diretor": "ANA LUCIA DE SOUSA SANTOS",
        "telefoneDiretor": "99198-1467",
        "diretorAdjunto": "FABIANA CASSIMIRO GUERRA DE PAULA",
        "telefoneDiretorAdjunto": "99157-1759",
        "inep": "33096520",
        "cnpj": "12.649.139/0001-40",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "18755",
        "controladorId": "alzira_de_souza",
        "processoInventario": "000704.004989/2026-41",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.606",
        "denominação": "Creche Municipal Visconde de Sabugosa",
        "designação": "04.31.606",
        "telefone": "3373-5288",
        "telefoneCelularInstitucional": "21993106032",
        "email": "cmvsabugosa@rioeduca.net",
        "diretor": "ROSANGELA CAMPOS DE PAULA FERNANDES",
        "telefoneDiretor": "97020-9572",
        "diretorAdjunto": "DOLORES DA SILVA NORTE",
        "telefoneDiretorAdjunto": "97985-0226",
        "inep": "33095892",
        "cnpj": "16.729.081/0001-03",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "18784",
        "controladorId": "alzira_de_souza",
        "processoInventario": "000704.004876/2026-45",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.607",
        "denominação": "Creche Municipal Acauã",
        "designação": "04.31.607",
        "telefone": "3448-0670",
        "telefoneCelularInstitucional": "21993091397",
        "email": "cmacaua@rioeduca.net",
        "diretor": "ALEXSANDRA BEZERRA DA SILVA",
        "telefoneDiretor": "97482-6141",
        "diretorAdjunto": "DANIELE DE OLIVEIRA DE FIGUEIREDO",
        "telefoneDiretorAdjunto": "99257-8318",
        "inep": "33147248",
        "cnpj": "12.468.491/0001-89",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "39102",
        "controladorId": "alzira_de_souza",
        "processoInventario": "000704.005244/2026-07",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.608",
        "denominação": "Creche Municipal Ari Pimentel",
        "designação": "04.31.608",
        "telefone": "2080-8074",
        "telefoneCelularInstitucional": "21993089542",
        "email": "cmapimentel@rioeduca.net",
        "diretor": "MARCELA SILVA DO NASCIMENTO DE CAMPOS",
        "telefoneDiretor": "97287-6541",
        "diretorAdjunto": "LEANDRA SANTOS DA SILVA SCHEMIKO",
        "telefoneDiretorAdjunto": "97279-7550",
        "inep": "33144710",
        "cnpj": "12.219.144/0001-12",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "39764",
        "controladorId": "alzira_de_souza",
        "processoInventario": "000704.004953/2026-67",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.801",
        "denominação": "EDI Carvalho Mourão",
        "designação": "04.31.801",
        "telefone": "2485-2269",
        "telefoneCelularInstitucional": "21993081503",
        "email": "edicmourao@rioeduca.net",
        "diretor": "ADRIANA DE ANDRADE DE OLIVEIRA",
        "telefoneDiretor": "98706-3422",
        "diretorAdjunto": "JULIANA RAMOS AMARAL VAILLANT",
        "telefoneDiretorAdjunto": "99652-4445",
        "inep": "33070504",
        "cnpj": "01.859.441/0001-06",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11337",
        "controladorId": "alzira_de_souza",
        "processoInventario": "000704.004941/2026-32",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.802",
        "denominação": "EDI Professor Carlos Falseth",
        "designação": "04.31.802",
        "telefone": "99308-0298",
        "telefoneCelularInstitucional": "21993080298",
        "email": "edicfalseth@rioeduca.net",
        "diretor": "SHAYANA BRAGA FELIX",
        "telefoneDiretor": "98870-5380",
        "diretorAdjunto": "SUANE DE LIMA RIBEIRO",
        "telefoneDiretorAdjunto": "97169-5012",
        "inep": "33170991",
        "cnpj": "23.402.143/0001-25",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "45569",
        "controladorId": "alzira_de_souza",
        "processoInventario": "000704.004873/2026-10",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.803",
        "denominação": "EDI Professor Emmanuel Pereira Filho",
        "designação": "04.31.803",
        "telefone": "2482-7202",
        "telefoneCelularInstitucional": "21993057687",
        "email": "edipfilho@rioeduca.net",
        "diretor": "ISABELA VIEIRA DA SILVA",
        "telefoneDiretor": "99249-1834",
        "diretorAdjunto": "LUANA DOS SANTOS TRINDADE",
        "telefoneDiretorAdjunto": "99362-2978",
        "inep": "33070806",
        "cnpj": "01.268.536/0001-55",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11345",
        "controladorId": "alzira_de_souza",
        "processoInventario": "000704.004971/2026-49",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.804",
        "denominação": "EDI Alfredo Valladão",
        "designação": "04.31.804",
        "telefone": "2475-9205/ 2475-9206",
        "telefoneCelularInstitucional": "21993051737",
        "email": "edivalladao@rioeduca.net",
        "diretor": "KELLY HELLEN CHAVES MANSO",
        "telefoneDiretor": "98700-3157",
        "diretorAdjunto": "FERNANDA TELES DE OLIVEIRA",
        "telefoneDiretorAdjunto": "97107-7222",
        "inep": "33070407",
        "cnpj": "01.412.221/0001-30",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11329",
        "controladorId": "alzira_de_souza",
        "processoInventario": "000704.004901/2026-91",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    },
    {
        "id": "04.31.805",
        "denominação": "EDI Cônego Fernandes Pinheiro",
        "designação": "04.31.805",
        "telefone": "3372-5070 / 99304-1562",
        "telefoneCelularInstitucional": "21993041562",
        "email": "emconego@rioeduca.net",
        "diretor": "ODETTE DOS SANTOS SACRAMENTO TERREZO FARDILHA",
        "telefoneDiretor": "98876-6559",
        "diretorAdjunto": "MARIA DO CARMO SERENO CHALO",
        "telefoneDiretorAdjunto": "98561-5300",
        "inep": "33070520",
        "cnpj": "01.294.812/0001-50",
        "cre": "4ª CRE",
        "ra": "31ª R.A.",
        "sici": "11870",
        "controladorId": "alzira_de_souza",
        "processoInventario": "000704.004782/2026-76",
        "programasIds": [
            "BASIC",
            "CONECTADA"
        ],
        "competenciaInicial": "2026-01"
    }

];


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



const INITIAL_VERIFICACOES = {};



const INITIAL_PENDENCIAS = [];

const INITIAL_CONTATOS = [];

const INITIAL_LOGS = [];

// Bens de Capital das escolas (para a equipe de Inventário)
const INITIAL_BENS = [];

const INITIAL_EQUIPE_INVENTARIO = [
    {
        "id": "aylane",
        "name": "Aylane",
        "email": ""
    },
    {
        "id": "juliana",
        "name": "Juliana",
        "email": ""
    },
    {
        "id": "odair",
        "name": "Odair",
        "email": ""
    }
];

const INITIAL_DATA_VERSION = '2026-07-08-real-cre4-v2';
const PENDENCY_SCHEMA_STORAGE_KEY = 'radar_pdde_pendency_schema_version';

// Calendário Global configurado pela SME
const INITIAL_CONFIG = {
    "exercicios": [
        "2026"
    ],
    "competenciaFechamento": "2026-05",
    "prazoBonificacaoProrrogado": false
};


// ==========================================
// 2. CONTROLE DE ESTADO E INICIALIZAÇÃO LOCAL
// ==========================================

let escolas = [];
let pendencias = [];
let contatos = [];
let logs = [];
let bens = [];

// Pre-indexed lookups — rebuilt whenever pendencias or bens change
let _pendenciasByEscolaId = new Map();
let _bensByEscolaId = new Map();

function rebuildOperationalIndexes() {
    _pendenciasByEscolaId = new Map();
    pendencias.forEach(p => {
        if (!_pendenciasByEscolaId.has(p.escolaId)) _pendenciasByEscolaId.set(p.escolaId, []);
        _pendenciasByEscolaId.get(p.escolaId).push(p);
    });
    _bensByEscolaId = new Map();
    bens.forEach(b => {
        if (!_bensByEscolaId.has(b.escolaId)) _bensByEscolaId.set(b.escolaId, []);
        _bensByEscolaId.get(b.escolaId).push(b);
    });
}
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
let activePendencyDetailId = null; // Pendência destacada na navegação mínima de detalhe

let activeCompetenciaKey = '2026-05'; // Competência selecionada na visão por competência

let searchResultFiltered = null; // Mantido por compatibilidade; a carteira usa escolaSearchQuery + activeEscolaFilters

let escolaSearchQuery = '';

const DEFAULT_ESCOLA_FILTERS = Object.freeze({

    controlador: 'all',

    programa: 'all',

    situacao: 'all',

    pendencias: 'all',

    inventario: 'all',

    ra: 'all'

});

let activeEscolaFilters = { ...DEFAULT_ESCOLA_FILTERS };

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



const DEFAULT_CONTROLADOR_ID = 'wilson_peixoto';

const DEFAULT_PROFILE_USERS = {

    assistente: { name: 'Luísa Ferreira', role: 'Assistente CRE' },

    sme: { name: 'Valéria dos Anjos', role: 'Gerente 4ª CRE' }

};

const RADAR_STORAGE_KEYS = [

    'radar_pdde_escolas',

    'radar_pdde_pendencias',

    'radar_pdde_contatos',

    'radar_pdde_logs',

    'radar_pdde_bens',

    'radar_pdde_verificacoes',

    'radar_pdde_config',

    'radar_pdde_programas',

    'radar_pdde_controladores',

    'radar_pdde_equipe_inventario',

    'radar_pdde_notas_registradas'

];



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


function seedLocalDataFromInitials() {

    localStorage.setItem('radar_pdde_escolas', JSON.stringify(INITIAL_ESCOLAS));

    localStorage.setItem('radar_pdde_pendencias', JSON.stringify(INITIAL_PENDENCIAS));

    localStorage.setItem('radar_pdde_contatos', JSON.stringify(INITIAL_CONTATOS));

    localStorage.setItem('radar_pdde_logs', JSON.stringify(INITIAL_LOGS));

    localStorage.setItem('radar_pdde_bens', JSON.stringify(INITIAL_BENS));

    localStorage.setItem('radar_pdde_verificacoes', JSON.stringify(INITIAL_VERIFICACOES));

    localStorage.setItem('radar_pdde_config', JSON.stringify(INITIAL_CONFIG));

    localStorage.setItem('radar_pdde_programas', JSON.stringify(INITIAL_PROGRAMS));

    localStorage.setItem('radar_pdde_controladores', JSON.stringify(INITIAL_CONTROLADORES));

    localStorage.setItem('radar_pdde_equipe_inventario', JSON.stringify(INITIAL_EQUIPE_INVENTARIO));

    localStorage.setItem('radar_pdde_notas_registradas', JSON.stringify([]));

    localStorage.setItem('radar_pdde_data_version', INITIAL_DATA_VERSION);

}



function getDefaultControladorId() {

    const exists = (controladores.length ? controladores : INITIAL_CONTROLADORES).some(c => c.id === DEFAULT_CONTROLADOR_ID);

    return exists ? DEFAULT_CONTROLADOR_ID : ((controladores[0] || INITIAL_CONTROLADORES[0] || {}).id || '');

}



function getDefaultControlador() {

    const id = getDefaultControladorId();

    return (controladores.length ? controladores : INITIAL_CONTROLADORES).find(c => c.id === id) || null;

}



function getCurrentUser() {

    if (currentProfile === 'controlador') {

        const controlador = getDefaultControlador();

        return { name: controlador ? controlador.name : 'Controlador', role: 'Controlador' };

    }

    if (currentProfile === 'inventario') {

        const inventariador = equipeInventario[0] || INITIAL_EQUIPE_INVENTARIO[0];

        return { name: inventariador ? inventariador.name : 'Equipe de Inventário', role: 'Equipe de Inventário' };

    }

    return DEFAULT_PROFILE_USERS[currentProfile] || { name: 'Usuário', role: 'Operação' };

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
        rebuildOperationalIndexes();
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

function getPendencyAnalysisValue(pendency) {
    if (!pendency || !pendency.programaId || !pendency.documentoKey) return null;
    const competencia = pendency.competenciaOrigem || pendency.competencia;
    const compProgKey = `${competencia}_${pendency.programaId}`;
    return verificacoes?.[pendency.escolaId]?.[compProgKey]?.analise?.[pendency.documentoKey] || null;
}

function migrateLoadedPendencies() {
    const migrationAt = new Date().toISOString();
    pendencias = window.RadarPendencias.migratePendencyCollection(pendencias, {
        migrationAt,
        getAnalysisValue: getPendencyAnalysisValue
    });

    localStorage.setItem('radar_pdde_pendencias', JSON.stringify(pendencias));
    localStorage.setItem(
        PENDENCY_SCHEMA_STORAGE_KEY,
        String(window.RadarPendencias.PENDENCY_SCHEMA_VERSION)
    );
}

function loadLocalFallback() {

    const storedVersion = localStorage.getItem('radar_pdde_data_version');

    if (storedVersion !== INITIAL_DATA_VERSION || !localStorage.getItem('radar_pdde_escolas')) {

        RADAR_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));

        seedLocalDataFromInitials();

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
    migrateLoadedPendencies();
    rebuildOperationalIndexes();
    
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

    localStorage.setItem('radar_pdde_data_version', INITIAL_DATA_VERSION);


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
                    const splitContext = window.RadarCompetencia.splitCompetenciaContext(compKey);
                    const competencia = splitContext.competenciaKey;
                    const programaId = splitContext.contextId || 'BASIC';
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

    const user = getCurrentUser();

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
    
    // Alerta 1: Pendências ativas há mais de 10 dias
    pendencias.forEach(p => {
        if (window.RadarPendencias.isActivePendency(p)) {
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
                const nextActor = p.responsavel
                    || window.RadarPendencias.getNextActor(p)
                    || 'Não definido';
                const timeLabel = pContatos.length > 0 
                    ? `Último contato em ${lastDate.toLocaleDateString('pt-BR')}` 
                    : `Registrada em ${new Date(p.dataAbertura).toLocaleDateString('pt-BR')}`;
                alerts.push({
                    alertKind: 'stale-pendency',
                    schoolId: p.escolaId,
                    pendencyRef: encodePendencyIdReference(p.id),
                    type: 'danger',
                    text: `Pendência (${pData.item}) de ${esc ? esc.denominação : 'Escola'} (${desigText} | Resp: ${ctrlText}). Estado: ${p.status}. Próximo ator: ${nextActor}. Ativa há ${diffDays} dias.`,
                    time: timeLabel,
                    action: () => openPendencyDetail(p.id)
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
                    alertKind: 'capital',
                    schoolId: b.escolaId,
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
        const targetControlador = currentProfile === 'controlador' ? getDefaultControladorId() : null;

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
                                alertKind: 'missing-bonification',
                                schoolId: esc.id,
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

function getAlertActionDataAttributes(alert) {
    if (alert && alert.pendencyRef) {
        return `data-alert-kind="${escapeHtml(alert.alertKind)}" data-pendency-ref="${escapeHtml(alert.pendencyRef)}"`;
    }
    return `data-alert-id="${escapeHtml(alert && alert.id)}"`;
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
        <div class="alert-item alert-${a.type}" ${getAlertActionDataAttributes(a)} onclick="handleAlertClick(this)">
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
                <div class="alert-text">${escapeHtml(a.text)}</div>
                <div class="alert-time">${escapeHtml(a.time)}</div>
            </div>
        </div>
    `).join('');
}

function findAlertFromActionSource(alerts, alertSource) {
    const actionElement = alertSource && alertSource.currentTarget
        ? alertSource.currentTarget
        : alertSource;
    if (actionElement && actionElement.dataset) {
        if (actionElement.dataset.pendencyRef) {
            let pendencyId;
            try {
                pendencyId = decodePendencyIdReference(actionElement.dataset.pendencyRef);
            } catch (error) {
                console.error('Não foi possível interpretar a referência do alerta.', error);
                return null;
            }
            return alerts.find(alert => {
                if (!alert.pendencyRef) return false;
                try {
                    return decodePendencyIdReference(alert.pendencyRef) === pendencyId;
                } catch (error) {
                    return false;
                }
            }) || null;
        }
        return alerts.find(alert => alert.id === actionElement.dataset.alertId) || null;
    }
    return alerts.find(alert => alert.id === alertSource) || null;
}

function handleAlertClick(alertSource) {
    const alerts = getAlerts();
    const alert = findAlertFromActionSource(alerts, alertSource);
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
        activateProntuarioTab('tab-contatos');
    }, 100);
}

function openSchoolCapital(schoolId, compKey = null) {
    activeSchoolId = schoolId;
    if (compKey) {
        activeProntuarioCompetencia = compKey;
    }
    switchView('prontuario');
    setTimeout(() => {
        activateProntuarioTab('tab-capital');
    }, 100);
}

function openSchoolVerification(schoolId, compKey = null) {
    activeSchoolId = schoolId;
    if (compKey) {
        activeProntuarioCompetencia = compKey;
    }
    switchView('prontuario');
    setTimeout(() => {
        activateProntuarioTab('tab-verificacoes');
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
    
    const user = getCurrentUser();

    nameEl.innerText = user.name;

    roleEl.innerText = user.role;

    avatarEl.innerText = user.name.charAt(0).toUpperCase();


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
    
    // Atualiza o indicador de competência global
    updateGlobalCompetenceIndicator();
    
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

function isBonificacaoValueStarted(value) {
    return value !== undefined && value !== null && value !== '' && value !== false;
}

function isAnaliseValueStarted(value) {
    return Boolean(value && value !== 'Não analisado');
}

const VERIFICATION_DOCUMENT_LABELS = Object.freeze({
    extCC: 'Extrato Conta Corrente',
    extINV: 'Extrato Investimento',
    notaFiscal: 'Notas Fiscais',
    consAssessoria: 'Consulta Assessoria',
    declBBAgil: 'Declaração BB Ágil',
    encampInventario: 'Encaminhado para Inventariação'
});

function buildVerificationSnapshot(verification) {
    const emptyVerification = window.RadarFluxoOperacional.createEmptyVerification();

    if (!verification) {
        return emptyVerification;
    }

    return {
        ...emptyVerification,
        ...verification,
        bonificacao: {
            ...emptyVerification.bonificacao,
            ...(verification.bonificacao || {})
        },
        analise: {
            ...emptyVerification.analise,
            ...(verification.analise || {})
        },
        resultadoBonif: verification.resultadoBonif || ''
    };
}

function ensureProgramVerification(escolaId, compProgKey) {
    if (!verificacoes[escolaId]) {
        verificacoes[escolaId] = {};
    }

    const verification = buildVerificationSnapshot(verificacoes[escolaId][compProgKey]);
    verificacoes[escolaId][compProgKey] = verification;
    return verification;
}

function reopenConsolidationForAssistant(escolaId, compProgKey, verification, hasChanged) {
    if (!hasChanged || currentProfile !== 'assistente' || !verification.resultadoBonif) {
        return;
    }

    const previousResult = verification.resultadoBonif;
    verification.resultadoBonif = '';
    const esc = escolas.find(item => item.id === escolaId);
    registerLog(
        'Consolidação Reaberta',
        `A consolidação ${previousResult.toUpperCase()} da escola ${esc ? esc.denominação : escolaId} para ${compProgKey} foi reaberta após alteração da bonificação.`
    );
}

function hasBonificationChanged(before, after) {
    const keys = new Set([
        ...Object.keys(before || {}),
        ...Object.keys(after || {})
    ]);

    return Array.from(keys).some(key => !Object.is(before?.[key], after?.[key]));
}

function blockConsolidatedFiscalNoteMutation(escolaId, compProgKey) {
    const verification = verificacoes[escolaId]?.[compProgKey];

    if (!verification?.resultadoBonif || currentProfile === 'assistente') {
        return false;
    }

    alert('Esta competência está consolidada. Apenas o(a) Assistente de Verbas Federais pode incluir, editar ou excluir Notas Fiscais.');
    renderProntuario(escolaId);
    return true;
}

function getProgramVerificationStatus(escolaId, compKey, progId) {
    const compProgKey = `${compKey}_${progId}`;
    return window.RadarFluxoOperacional.getProgramOperationalStatus(
        verificacoes[escolaId]?.[compProgKey]
    );
}

function getProgramStatusMeta(status) {
    const metas = {
        apta: { label: 'Apta', badgeClass: 'badge-success' },
        inapta: { label: 'Inapta', badgeClass: 'badge-danger' },
        'em-andamento': { label: 'Em andamento', badgeClass: 'badge-warning' },
        'nao-lancado': { label: 'Não analisada', badgeClass: 'badge-gray' }
    };

    return metas[status] || metas['nao-lancado'];
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
            const progStatus = getProgramVerificationStatus(e.id, compKey, progId);
            
            // Referência dinâmica contendo dados da escola e o programa associado
            const schoolProgRef = {
                ...e,
                programaId: progId,
                compProgKey: compProgKey
            };

            if (progStatus === 'inapta') {
                inapto++;
                inaptoList.push(schoolProgRef);
            } else if (progStatus === 'apta') {
                apto++;
                aptoList.push(schoolProgRef);
            } else if (progStatus === 'em-andamento') {
                emAndamento++;
                emAndamentoList.push(schoolProgRef);
            } else {
                naoAnalisado++;
                naoAnalisadoList.push(schoolProgRef);
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



function normalizeSearchText(value) {

    return String(value || '')

        .toLowerCase()

        .normalize("NFD")

        .replace(/[\u0300-\u036f]/g, "")

        .trim();

}



function onlyDigits(value) {

    return String(value || '').replace(/\D/g, '');

}



function escapeHtml(value) {

    return String(value || '')

        .replace(/&/g, '&amp;')

        .replace(/</g, '&lt;')

        .replace(/>/g, '&gt;')

        .replace(/"/g, '&quot;')

        .replace(/'/g, '&#039;');

}



function selectedAttr(current, expected) {

    return current === expected ? 'selected' : '';

}



function getControladorName(controladorId) {

    const ctrl = controladores.find(c => c.id === controladorId);

    return ctrl ? ctrl.name : 'Não designado';

}



function getEscolaProgramNames(esc) {

    return (esc.programasIds || []).map(progId => {

        const programa = programas.find(p => p.id === progId);

        return programa ? programa.name : progId;

    }).filter(Boolean);

}



// NOTE: relies on _pendenciasByEscolaId and _bensByEscolaId indexes.
// Call rebuildOperationalIndexes() after any mutation to pendencias or bens.
function getEscolaOperationalData(esc) {
    const escolaPendencias = _pendenciasByEscolaId.get(esc.id) || [];
    const pendenciasAbertas = escolaPendencias.filter(p => (
        window.RadarPendencias.isActivePendency(p)
    ));
    const escolaBens = _bensByEscolaId.get(esc.id) || [];
    const bensNaoEncaminhados = escolaBens.filter(b => b.status === 'Não encaminhada').length;
    const bensEncaminhados = escolaBens.filter(b => b.status === 'Encaminhada').length;
    const bensInventariados = escolaBens.filter(b => b.status === 'Inventariada').length;
    const processoInventario = (esc.processoInventario || '').trim();


    return {

        controladorName: getControladorName(esc.controladorId),

        programas: getEscolaProgramNames(esc),

        ra: esc.ra || getRAFromDesignacao(esc.designação),

        situacao: getSchoolAggregateStatus(esc, activeCompetenciaKey),

        pendenciasAbertas,

        hasPendencias: pendenciasAbertas.length > 0,

        hasInventarioProcess: Boolean(processoInventario),

        processoInventario,

        bensTotal: escolaBens.length,

        bensNaoEncaminhados,

        bensEncaminhados,

        bensInventariados

    };

}



function schoolMatchesSearch(esc, rawQuery) {

    const cleanQuery = normalizeSearchText(rawQuery);

    if (!cleanQuery) return true;



    const textCorpus = normalizeSearchText([

        esc.denominação,

        esc.designação

    ].filter(Boolean).join(' '));

    const designationDigits = onlyDigits(esc.designação);

    const tokens = cleanQuery

        .replace(/[^a-z0-9]+/g, ' ')

        .split(/\s+/)

        .filter(Boolean);



    if (tokens.length === 0) return true;



    return tokens.every(token => {

        const tokenDigits = onlyDigits(token);

        return textCorpus.includes(token) || (tokenDigits.length > 0 && designationDigits.includes(tokenDigits));

    });

}



function getEscolaStatusLabel(status) {

    const labels = {

        apto: 'Apta',

        inapto: 'Inapta',

        emAndamento: 'Em andamento',

        naoAnalisado: 'Não analisada',

        foraEscopo: 'Fora do escopo'

    };

    return labels[status] || 'Não analisada';

}



function getEscolaStatusBadgeClass(status) {

    const classes = {

        apto: 'badge-success',

        inapto: 'badge-danger',

        emAndamento: 'badge-warning',

        naoAnalisado: 'badge-gray',

        foraEscopo: 'badge-info'

    };

    return classes[status] || 'badge-gray';

}



function syncGlobalSearchInput() {

    const input = document.getElementById('global-search');

    if (input && input.value !== escolaSearchQuery) {

        input.value = escolaSearchQuery;

    }
}

function updateGlobalCompetenceIndicator() {
    const el = document.getElementById('global-competence-label');
    if (el) {
        const comp = COMPETENCIAS.find(c => c.key === activeCompetenciaKey);
        const label = comp ? comp.label : activeCompetenciaKey;
        el.textContent = label;
    }
}

function restoreEscolaSearchFocus(selectionStart = null, selectionEnd = selectionStart) {

    const input = document.getElementById('escola-search-input');

    if (!input) return;



    input.focus({ preventScroll: true });



    if (typeof input.setSelectionRange === 'function') {

        const valueLength = input.value.length;

        const start = Number.isInteger(selectionStart) ? Math.min(selectionStart, valueLength) : valueLength;

        const end = Number.isInteger(selectionEnd) ? Math.min(selectionEnd, valueLength) : start;

        input.setSelectionRange(start, end);

    }

}

function handleGlobalSearch(e) {

    escolaSearchQuery = e.target.value || '';

    searchResultFiltered = null;

    activeEscolaFilters = { ...DEFAULT_ESCOLA_FILTERS };


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

    const activeControlador = getDefaultControlador();

    const activeControladorId = getDefaultControladorId();

    const activeControladorName = activeControlador ? activeControlador.name : 'Controlador';

    const activeCompetencia = COMPETENCIAS.find(c => c.key === activeCompetenciaKey);

    const activeCompetenciaLabel = activeCompetencia ? activeCompetencia.label : activeCompetenciaKey;

    let targetEscolas = [];

    

    if (filterRa === 'carteira') {

        targetEscolas = escolas.filter(e => e.controladorId === activeControladorId);

    } else if (filterRa === 'todas') {
        targetEscolas = escolas;
    } else {
        targetEscolas = escolas.filter(e => {
            const partes = e.designação.split('.');
            return partes.length >= 2 && partes[1] === filterRa;
        });
    }

    const carteiraRAs = [...new Set(escolas

        .filter(e => e.controladorId === activeControladorId)

        .map(e => getRAFromDesignacao(e.designação)))];

    const carteiraRAText = carteiraRAs.length ? carteiraRAs.join(', ') : 'sem R.A. vinculada';


    const targetIds = targetEscolas.map(e => e.id);
    
    // Contagem de pendências ativas das escolas do filtro
    const pAtivas = pendencias.filter(p => (
        targetIds.includes(p.escolaId)
        && window.RadarPendencias.isActivePendency(p)
    ));
    
    // Contagem de bens não encaminhados
    const bPendentes = bens.filter(b => targetIds.includes(b.escolaId) && b.status === 'Não encaminhada');
    
    // Listas filtradas auxiliares para sub-filtros
    const escolasNaoAnalisadas = targetEscolas.filter(e => {
        if (!isCompetenceInScope(e.competenciaInicial, activeCompetenciaKey)) return false;
        return e.programasIds.some(progId => {
            return getProgramVerificationStatus(e.id, activeCompetenciaKey, progId) === 'nao-lancado';
        });
    });

    const escolasComPendencias = targetEscolas.filter(e => {
        return pendencias.some(p => (
            p.escolaId === e.id
            && window.RadarPendencias.isActivePendency(p)
        ));
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
        subFilterLabel = ' (Filtrado: Com pendências ativas)';
    } else if (activeControladorSubFilter === 'bens') {
        renderedEscolas = escolasComBensPendentes;
        subFilterLabel = ' (Filtrado: Com Bens Não Encaminhados)';
    }

    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Painel do Controlador</h1>
                <p>Carteira ativa: <strong>${activeControladorName}</strong>. R.A. vinculada: <strong>${carteiraRAText}</strong>. Você pode navegar por outras R.As ou pesquisar na CRE.</p>

            </div>
            <div class="badge badge-info">Mês Ativo: ${COMPETENCIAS.find(c => c.key === activeCompetenciaKey).label}</div>
        </div>

        <div class="tab-container" style="margin-bottom: 20px;">
            <button class="tab-button ${filterRa === 'carteira' ? 'active' : ''}" onclick="changeControladorRAFilter('carteira')">Minha Carteira (${activeControladorName.split(' ')[0]})</button>

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

                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>

                </div>

                <div class="stat-label">Não Analisadas (${formatCompetenciaText(activeCompetenciaKey)})</div>

                <div class="stat-value">${escolasNaoAnalisadas.length} Escolas</div>

            </div>
            <div class="card-stat ${activeControladorSubFilter === 'pendencias' ? 'active-pendencias' : ''}" style="cursor: pointer;" onclick="changeControladorSubFilter('pendencias')">
                <div class="stat-icon" style="background-color: var(--danger-bg); color: var(--danger);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>
                </div>
                <div class="stat-label">Pendências ativas</div>
                <div class="stat-value">${escolasComPendencias.length} Escolas</div>
            </div>
            <div class="card-stat ${activeControladorSubFilter === 'bens' ? 'active-bens' : ''}" style="cursor: pointer;" onclick="changeControladorSubFilter('bens')">
                <div class="stat-icon" style="background-color: var(--info-bg); color: var(--info);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
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
                        <h2 class="dashboard-list-heading">
                            <span>Lista de Escolas - Visualização: ${filterRa === 'carteira' ? 'Minha Carteira' : filterRa === 'todas' ? 'Todas da CRE' : `${filterRa}ª R.A.`}${subFilterLabel}</span>
                            <span class="dashboard-competencia-pill">Competência vista: ${escapeHtml(formatCompetenciaText(activeCompetenciaKey))}</span>
                        </h2>
                    </div>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Unidade Escolar</th>
                                    <th>INEP</th>
                                    <th>Contatos</th>
                                    <th class="bonificacao-competencia-col">Bonificação <span>(${escapeHtml(formatCompetenciaText(activeCompetenciaKey))})</span></th>
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
                                        const prog = programas.find(p => p.id === progId);
                                        const progName = prog ? prog.name : progId;
                                        const progStatus = getProgramVerificationStatus(e.id, activeCompetenciaKey, progId);
                                        const statusMeta = getProgramStatusMeta(progStatus);
                                        const progBadge = `<span class="badge ${statusMeta.badgeClass} dashboard-status-badge">${statusMeta.label}</span>`;

                                        statusHTML += `<div style="margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                                            <span style="font-size:0.75rem; font-weight:500; color:var(--text-muted);">${escapeHtml(progName)}:</span>
                                            ${progBadge}
                                        </div>`;
                                    });
                                    
                                    const cCount = contatos.filter(c => c.escolaId === e.id).length;
                                    const ctrl = controladores.find(c => c.id === e.controladorId);
                                    
                                    const ctrlLabel = e.controladorId === activeControladorId

                                        ? `<span class="badge badge-info" style="font-size:0.65rem; padding: 2px 4px; font-weight:500;">Sua Carteira</span>`
                                        : `<span style="font-size:0.75rem; color:var(--text-muted);">Controlador: ${escapeHtml(ctrl ? ctrl.name : 'Sem designação')}</span>`;

                                    return `
                                        <tr>
                                            <td>
                                                <strong>${escapeHtml(e.denominação)}</strong><br>
                                                <small style="color:var(--text-muted)">${escapeHtml(e.designação)} • ${escapeHtml(getRAFromDesignacao(e.designação))}</small><br>
                                                ${ctrlLabel}
                                            </td>
                                            <td>${escapeHtml(e.inep)}</td>
                                            <td><span class="badge badge-info">${cCount} Contatos</span></td>
                                            <td class="bonificacao-competencia-cell">${statusHTML}</td>
                                            <td>
                                                <button class="btn btn-secondary btn-sm" onclick="switchView('prontuario', '${escapeHtml(e.id)}')">Ver Unidade</button>
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
    const localAlertKinds = new Set([
        'stale-pendency',
        'missing-bonification',
        'capital'
    ]);
    const localAlerts = getAlerts().filter(a => (
        targetIds.includes(a.schoolId)
        && localAlertKinds.has(a.alertKind)
    ));
    
    if (localAlerts.length === 0) {
        gargalosEl.innerHTML = `<div style="text-align:center; padding: 24px; color:var(--text-muted)">Sem pendências críticas neste filtro! Bom trabalho.</div>`;
    } else {
        gargalosEl.innerHTML = localAlerts.map(a => `
            <div class="contact-card" style="border-left: 3px solid var(--${a.type === 'danger' ? 'danger' : a.type === 'warning' ? 'warning' : 'info'}); margin-bottom: 12px; cursor:pointer;" ${getAlertActionDataAttributes(a)} onclick="handleAlertClick(this)">
                <div class="contact-meta">
                    <span style="font-weight:700; color:var(--${a.type === 'danger' ? 'danger' : a.type === 'warning' ? 'warning' : 'info'})">${a.type.toUpperCase()}</span>
                    <span>${escapeHtml(a.time)}</span>
                </div>
                <div class="contact-desc" style="font-size:0.8rem">${escapeHtml(a.text)}</div>
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

function calculateSMESchoolStats(escolasList, compKey) {
    const schoolRecords = escolasList.map(escola => ({
        escola,
        status: getSchoolAggregateStatus(escola, compKey)
    }));

    return RadarEstatisticas.calculateSchoolStats(schoolRecords);
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
                <tr class="assistente-escola-row" data-escola="${escapeHtml(e.denominação.toLowerCase())}">
                    <td><strong>${escapeHtml(e.denominação)}</strong></td>
                    <td>${escapeHtml(e.designação)} (${escapeHtml(getRAFromDesignacao(e.designação))})</td>
                    <td>${escapeHtml(ctrl ? ctrl.name : 'Não designado')}</td>
                    <td><span class="badge ${badgeCls}">${statusText}</span></td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="switchView('prontuario', '${escapeHtml(e.id)}')">Ver Unidade</button>
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
                <div class="stat-label">Unidades Aptas (${formatCompetenciaText(activeCompetenciaKey)})</div>
                <div class="stat-value">${stats.apto} Escolas</div>
            </div>
            <div class="card-stat ${activeAssistenteSubFilter === 'inapto' ? 'active-pendencias' : ''}" style="cursor: pointer;" onclick="changeAssistenteSubFilter('inapto')">
                <div class="stat-icon" style="background-color: var(--danger-bg); color: var(--danger);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                </div>
                <div class="stat-label">Unidades Inaptas (${formatCompetenciaText(activeCompetenciaKey)})</div>
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
                                    <th>Progresso das Análises (${formatCompetenciaText(activeCompetenciaKey)})</th>
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
                                        <tr style="cursor: pointer;" onclick="toggleControllerDetail('${escapeHtml(c.id)}')" class="tr-hoverABLE ${isExpanded ? 'tr-expanded-active' : ''}">
                                            <td>
                                                <div style="display:flex; align-items:center; gap:8px;">
                                                    <span style="transform: rotate(${isExpanded ? '90' : '0'}deg); transition: transform 0.2s; color: var(--primary);">▶</span>
                                                    <strong>${escapeHtml(c.name)}</strong>
                                                </div>
                                                <small style="color:var(--text-muted); margin-left: 18px;">${escapeHtml(c.email)}</small>
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
                                                <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); toggleControllerDetail('${escapeHtml(c.id)}')">
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
                                                                        <div class="hover-filter-row" style="cursor: pointer; padding: 4px 8px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;" onclick="event.stopPropagation(); filterAssistenteByStatusAndController('apto', '${escapeHtml(c.id)}')">
                                                                            <span>• Aptas</span>
                                                                            <span class="badge badge-success" style="font-size: 0.7rem; padding: 2px 6px;">${c.stats.apto}</span>
                                                                        </div>
                                                                        <div class="hover-filter-row" style="cursor: pointer; padding: 4px 8px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;" onclick="event.stopPropagation(); filterAssistenteByStatusAndController('inapto', '${escapeHtml(c.id)}')">
                                                                            <span>• Inaptas</span>
                                                                            <span class="badge badge-danger" style="font-size: 0.7rem; padding: 2px 6px;">${c.stats.inapto}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div style="display:flex; justify-content:space-between; font-size: 0.85rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top:8px; margin-top:4px;">
                                                                        <span><strong>Falta Analisar</strong></span>
                                                                        <strong>${c.faltam} de ${c.totalValidos} (${c.totalValidos > 0 ? Math.round((c.faltam / c.totalValidos) * 100) : 0}%)</strong>
                                                                    </div>
                                                                    <div style="display:flex; flex-direction:column; gap:6px; margin-left:12px; font-size:0.8rem; color:var(--text-muted)">
                                                                        <div class="hover-filter-row" style="cursor: pointer; padding: 4px 8px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;" onclick="event.stopPropagation(); filterAssistenteByStatusAndController('emAndamento', '${escapeHtml(c.id)}')">
                                                                            <span>• Análise em Andamento</span>
                                                                            <span class="badge badge-primary" style="font-size: 0.7rem; padding: 2px 6px;">${c.stats.emAndamento}</span>
                                                                        </div>
                                                                        <div class="hover-filter-row" style="cursor: pointer; padding: 4px 8px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;" onclick="event.stopPropagation(); filterAssistenteByStatusAndController('naoAnalisado', '${escapeHtml(c.id)}')">
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
                                                                                        <div style="font-size: 0.8rem; font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 240px;" title="${escapeHtml(esc.denominação)}">${escapeHtml(esc.denominação)}</div>
                                                                                        <div style="font-size: 0.7rem; color: var(--text-muted);">${escapeHtml(esc.designação)} (${escapeHtml(raName)}) | Resp: ${escapeHtml(c.name)}</div>
                                                                                    </div>
                                                                                    <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                                                                                        ${escStatus}
                                                                                        <button class="btn btn-secondary btn-sm" style="padding: 2px 8px; font-size: 0.7rem;" onclick="event.stopPropagation(); switchView('prontuario', '${escapeHtml(esc.id)}')">Ver Unidade</button>
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
    const staleAlerts = getAlerts().filter(a => (
        a.alertKind === 'stale-pendency' || a.alertKind === 'capital'
    ));
    if (staleAlerts.length === 0) {
        gargalosEl.innerHTML = `<div style="text-align:center; padding: 24px; color:var(--text-muted)">Sem gargalos de pendências ativas nas carteiras!</div>`;
    } else {
        gargalosEl.innerHTML = staleAlerts.map(a => `
            <div class="contact-card" style="border-left: 3px solid var(--${a.type === 'danger' ? 'danger' : 'warning'}); margin-bottom:12px; cursor:pointer;" ${getAlertActionDataAttributes(a)} onclick="handleAlertClick(this)">
                <div class="contact-meta">
                    <span style="font-weight:700; color:var(--${a.type === 'danger' ? 'danger' : 'warning'})">${a.type.toUpperCase()}</span>
                    <span>${escapeHtml(a.time)}</span>
                </div>
                <div class="contact-desc" style="font-size:0.8rem">${escapeHtml(a.text)}</div>
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
    const stats = calculateSMESchoolStats(escolas, activeCompetenciaKey);
    const totalEscolasValidas = stats.activeTotal;

    // Obter lista de CREs únicas nas escolas cadastradas
    const activeSMECreList = [...new Set(escolas.map(e => e.cre || '4ª CRE'))];
    
    // Computar estatísticas por CRE
    const cresStats = activeSMECreList.map(creName => {
        const carteira = escolas.filter(e => e.cre === creName);
        const cStats = calculateSMESchoolStats(carteira, activeCompetenciaKey);
        const total = cStats.activeTotal;
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
                                    const progStatus = getProgramVerificationStatus(e.id, activeCompetenciaKey, progId);
                                    const statusMeta = getProgramStatusMeta(progStatus);
                                    let statusBadge = `<span class="badge ${statusMeta.badgeClass}">${statusMeta.label}</span>`;
                                    
                                    if (v) {
                                        extCC = v.bonificacao?.['extCC'] || '-';
                                        extINV = v.bonificacao?.['extINV'] || '-';
                                        notaFiscal = v.bonificacao?.['notaFiscal'] || '-';
                                        consAssessoria = v.bonificacao?.['consAssessoria'] || '-';
                                        declBBAgil = v.bonificacao?.['declBBAgil'] || '-';
                                        encampInventario = v.bonificacao?.['encampInventario'] || '-';
                                    }
                                    
                                    const formatVal = (val) => {
                                        if (val === 'Sim') return `<span style="color:var(--success); font-weight:600;">Sim</span>`;
                                        if (val === 'Não') return `<span style="color:var(--danger); font-weight:600;">Não</span>`;
                                        if (val === 'Não se aplica' || val === 'N/A') return `<span style="color:var(--text-muted);">N/A</span>`;
                                        return `<span style="color:var(--text-muted); opacity:0.5;">-</span>`;
                                    };
                                    
                                    return `
                                        <tr class="sme-detail-row" data-escola="${escapeHtml(e.denominação.toLowerCase())} ${escapeHtml(e.designação.toLowerCase())}">
                                            <td><strong>${escapeHtml(e.denominação)}</strong><br><small style="color:var(--text-muted)">${escapeHtml(e.designação)}</small></td>
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
                <div class="stat-label">Unidades Aptas (${formatCompetenciaText(activeCompetenciaKey)})</div>
                <div class="stat-value">${stats.apta} Escolas</div>
            </div>
            <div class="card-stat">
                <div class="stat-icon" style="background-color: var(--danger-bg); color: var(--danger);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                </div>
                <div class="stat-label">Unidades Inaptas (${formatCompetenciaText(activeCompetenciaKey)})</div>
                <div class="stat-value">${stats.inapta} Escolas</div>
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
                <div class="stat-value">${stats.naoAnalisada} Unidades</div>
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
                                <th>Aptas (${formatCompetenciaText(activeCompetenciaKey)})</th>
                                <th>Inaptas (${formatCompetenciaText(activeCompetenciaKey)})</th>
                                <th>Em Andamento</th>
                                <th>Não Analisadas</th>
                                <th>Taxa de Cumprimento (Aptas)</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${cresStats.map(cs => {
                                const percent = Math.round(cs.stats.rates.apta);
                                const isExpanded = activeSMECreFilter === cs.name;
                                return `
                                    <tr style="cursor: pointer;" onclick="toggleSMECreFilter('${escapeHtml(cs.name)}')" class="tr-hoverABLE ${isExpanded ? 'tr-expanded-active' : ''}">
                                        <td>
                                            <div style="display:flex; align-items:center; gap:8px;">
                                                <span style="transform: rotate(${isExpanded ? '90' : '0'}deg); transition: transform 0.2s; color: var(--primary);">▶</span>
                                                <strong>${escapeHtml(cs.name)} - Coordenadoria Regional</strong>
                                            </div>
                                        </td>
                                        <td>${cs.total} unidades</td>
                                        <td><span style="color:var(--success); font-weight:600;">${cs.stats.apta}</span></td>
                                        <td><span style="color:var(--danger); font-weight:600;">${cs.stats.inapta}</span></td>
                                        <td><span style="color:var(--primary); font-weight:600;">${cs.stats.emAndamento}</span></td>
                                        <td><span style="color:var(--text-muted);">${cs.stats.naoAnalisada}</span></td>
                                        <td>
                                            <strong>${percent}%</strong>
                                        </td>
                                        <td>
                                            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); toggleSMECreFilter('${escapeHtml(cs.name)}')">
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

    const hasBensData = listBens.length > 0;

    const aguardandoBens = listBens.filter(b => b.status === 'Encaminhada').length;

    const naoEncampBens = listBens.filter(b => b.status === 'Não encaminhada').length;

    const concluidoBens = listBens.filter(b => b.status === 'Inventariada').length;

    const escolasComProcesso = escolas.filter(e => e.processoInventario);

    const escolasSemProcesso = escolas.filter(e => !e.processoInventario);

    const escolasInventario = [...escolas].sort((a, b) => a.designação.localeCompare(b.designação));

    const statUnitSingular = hasBensData ? 'Bem' : 'Escola';

    const statUnitPlural = hasBensData ? 'Bens' : 'Escolas';

    const formatStat = count => `${count} ${count === 1 ? statUnitSingular : statUnitPlural}`;

    const formatSchoolStat = count => `${count} ${count === 1 ? 'Escola' : 'Escolas'}`;

    const naoEncamp = hasBensData ? naoEncampBens : escolasSemProcesso.length;

    const aguardando = hasBensData ? aguardandoBens : escolasComProcesso.length;

    const concluido = hasBensData ? concluidoBens : 0;



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

    let filteredEscolasInventario = [...escolasInventario];

    if (activeInventarioSubFilter === 'naoEncamp') {

        filteredEscolasInventario = escolasSemProcesso;

    } else if (activeInventarioSubFilter === 'aguardando') {

        filteredEscolasInventario = escolasComProcesso;

    } else if (activeInventarioSubFilter === 'concluido') {

        filteredEscolasInventario = [];

    }



    const filterLabel = activeInventarioSubFilter === 'naoEncamp'

        ? 'Sem Encarte / Pendente Verbas Federais'

        : activeInventarioSubFilter === 'aguardando'

            ? 'Aguardando Inventariação'

            : activeInventarioSubFilter === 'concluido'

                ? 'Já Inventariados'

                : '';

    const filaTitle = hasBensData ? 'Fila de Inventariação Patrimonial' : 'Acompanhamento de Processos de Inventário';

    const bensTable = `

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

                        actionBtn = `<button class="btn btn-primary btn-sm" onclick="inventariarBem('${escapeHtml(b.id)}')">Marcar como Inventariado</button>`;

                    } else {

                        let details = '';

                        if (b.inventariadoPor) {

                            details += `<br><small style="color:var(--text-muted); font-size: 0.75rem;">Por: <strong>${escapeHtml(b.inventariadoPor)}</strong>${b.inventariadoEm ? ' em ' + escapeHtml(b.inventariadoEm) : ''}</small>`;
                        }

                        if (b.observacoes) {

                            details += `<br><small style="color:var(--text-muted); font-size: 0.75rem; font-style: italic;">Obs: ${escapeHtml(b.observacoes)}</small>`;
                        }

                        statusBadge = `<span class="badge badge-success">Inventariado</span>${details}`;

                    }



                    return `

                        <tr>

                            <td>

                                <strong>${escapeHtml(esc ? esc.denominação : 'N/A')}</strong><br>
                                <small style="color:var(--text-muted)">

                                    Designação: ${escapeHtml(esc ? esc.designação : 'N/A')} • Controlador: ${escapeHtml(ctrl ? ctrl.name : 'Não designado')}
                                </small>

                            </td>

                            <td>${escapeHtml(b.item)}</td>
                            <td><span style="font-weight:600; color:var(--primary);">${escapeHtml(compLabel)}</span></td>

                            <td>R$ ${b.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>

                            <td>${b.notaFiscal ? escapeHtml(b.notaFiscal) : `<span style="color:var(--danger)">Ausente</span>`}</td>
                            <td>${esc && esc.processoInventario ? escapeHtml(esc.processoInventario) : `<span style="color:var(--danger)">Não cadastrado</span>`}</td>
                            <td>${statusBadge}</td>

                            <td>${actionBtn}</td>

                        </tr>

                    `;

                }).join('')}

            </tbody>

        </table>

    `;

    const processosTable = `

        <table class="data-table">

            <thead>

                <tr>

                    <th>Unidade Escolar</th>

                    <th>Designação</th>

                    <th>SICI</th>

                    <th>Controlador</th>

                    <th>Processo de Inventário</th>

                    <th>Status no Inventário</th>

                    <th>Programas</th>

                </tr>

            </thead>

            <tbody>

                ${filteredEscolasInventario.length === 0 ? `

                    <tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:32px;">Nenhuma escola encontrada nesta categoria.</td></tr>

                ` : filteredEscolasInventario.map(esc => {

                    const ctrl = controladores.find(c => c.id === esc.controladorId);

                    const progNames = (esc.programasIds || []).map(pid => {

                        const prog = programas.find(p => p.id === pid);

                        return prog ? prog.name : pid;

                    }).join(', ');

                    const statusBadge = esc.processoInventario

                        ? `<span class="badge badge-warning">Aguardando Inventariação</span>`

                        : `<span class="badge badge-danger">Pendente Verbas Federais / Sem Processo</span>`;



                    return `

                        <tr>

                            <td><strong>${escapeHtml(esc.denominação)}</strong></td>
                            <td>${escapeHtml(esc.designação)}</td>
                            <td>${esc.sici ? escapeHtml(esc.sici) : '<span style="color:var(--text-muted)">Não informado</span>'}</td>
                            <td>${ctrl ? escapeHtml(ctrl.name) : '<span style="color:var(--text-muted)">Não designado</span>'}</td>
                            <td>${esc.processoInventario ? escapeHtml(esc.processoInventario) : '<span style="color:var(--danger)">Não cadastrado</span>'}</td>
                            <td>${statusBadge}</td>

                            <td>${escapeHtml(progNames)}</td>
                        </tr>

                    `;

                }).join('')}

            </tbody>

        </table>

    `;



    container.innerHTML = `

        <div class="page-header">

            <div class="page-title">

                <h1>Painel da Equipe de Inventário</h1>

                <p>${hasBensData ? 'Inventariação de bens patrimoniais permanentes adquiridos pelas escolas.' : 'Acompanhamento dos processos anuais de inventário das unidades escolares.'}</p>

            </div>

        </div>



        <div class="grid-stats">
            <div class="card-stat ${activeInventarioSubFilter === 'naoEncamp' ? 'active-naoEncamp' : ''}" style="cursor: pointer;" onclick="changeInventarioSubFilter('naoEncamp')">

                <div class="stat-icon" style="background-color: var(--danger-bg); color: var(--danger);">

                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="9" y1="15" x2="15" y2="15"></line></svg>

                </div>

                <div class="stat-label">Sem Encarte / Pendente Verbas Federais</div>

                <div class="stat-value">${formatStat(naoEncamp)}</div>

            </div>

            <div class="card-stat ${activeInventarioSubFilter === 'aguardando' ? 'active-aguardando' : ''}" style="cursor: pointer;" onclick="changeInventarioSubFilter('aguardando')">

                <div class="stat-icon" style="background-color: var(--warning-bg); color: var(--warning);">

                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>

                </div>

                <div class="stat-label">Aguardando Inventariação</div>

                <div class="stat-value">${formatStat(aguardando)}</div>

            </div>

            <div class="card-stat ${activeInventarioSubFilter === 'concluido' ? 'active-concluido' : ''}" style="cursor: pointer;" onclick="changeInventarioSubFilter('concluido')">

                <div class="stat-icon" style="background-color: var(--success-bg); color: var(--success);">

                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>

                </div>

                <div class="stat-label">Já Inventariados</div>

                <div class="stat-value">${formatStat(concluido)}</div>

            </div>

            <div class="card-stat ${activeInventarioSubFilter === 'all' ? 'active-all' : ''}" style="cursor: pointer;" onclick="changeInventarioSubFilter('all')">

                <div class="stat-icon">

                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>

                </div>

                <div class="stat-label">Processos de Inventário</div>

                <div class="stat-value">${formatSchoolStat(escolasComProcesso.length)}</div>

            </div>

        </div>


        <div class="panel-card">

            <div class="panel-header">

                <h2>${filaTitle} ${filterLabel ? `(${filterLabel})` : ''}</h2>

            </div>

            <div class="table-responsive">

                ${hasBensData ? bensTable : processosTable}

            </div>

        </div>



        <div class="panel-card" style="margin-top: 20px;">

            <div class="panel-header">

                <h2>Processos de Inventário 2026 por Unidade</h2>

                <span class="badge ${escolasSemProcesso.length === 0 ? 'badge-success' : 'badge-warning'}">${escolasComProcesso.length} com processo / ${escolasSemProcesso.length} pendentes</span>

            </div>

            <div class="table-responsive">

                <table class="data-table school-carteira-table">

                    <thead>

                        <tr>

                            <th>Unidade Escolar</th>

                            <th>Designação</th>

                            <th>SICI</th>

                            <th>Controlador</th>

                            <th>Processo Anual</th>

                            <th>Programas</th>

                        </tr>

                    </thead>

                    <tbody>

                        ${escolasInventario.map(esc => {

                            const ctrl = controladores.find(c => c.id === esc.controladorId);

                            const progNames = (esc.programasIds || []).map(pid => {

                                const prog = programas.find(p => p.id === pid);

                                return prog ? prog.name : pid;

                            }).join(', ');

                            return `

                                <tr>

                                    <td><strong>${escapeHtml(esc.denominação)}</strong></td>
                                    <td>${escapeHtml(esc.designação)}</td>
                                    <td>${esc.sici ? escapeHtml(esc.sici) : '<span style="color:var(--text-muted)">Não informado</span>'}</td>
                                    <td>${ctrl ? escapeHtml(ctrl.name) : '<span style="color:var(--text-muted)">Não designado</span>'}</td>
                                    <td>${esc.processoInventario ? escapeHtml(esc.processoInventario) : '<span style="color:var(--danger)">Não cadastrado</span>'}</td>
                                    <td>${escapeHtml(progNames)}</td>
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
        respSelect.innerHTML = equipeInventario.map(inv => `<option value="${escapeHtml(inv.name)}">${escapeHtml(inv.name)}</option>`).join('');
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
        
        rebuildOperationalIndexes();
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



function updateEscolasSearch(value, selectionStart = null, selectionEnd = selectionStart) {

    const activeInput = document.getElementById('escola-search-input');

    const shouldRestoreFocus = document.activeElement === activeInput;

    escolaSearchQuery = value || '';

    searchResultFiltered = null;

    syncGlobalSearchInput();

    renderEscolas();

    if (shouldRestoreFocus) {

        restoreEscolaSearchFocus(selectionStart, selectionEnd);

    }

}



function changeEscolaFilter(filterName, value) {

    activeEscolaFilters = {

        ...activeEscolaFilters,

        [filterName]: value

    };

    renderEscolas();

}

function changeCarteiraCompetencia(value) {

    activeCompetenciaKey = value;

    updateGlobalCompetenceIndicator();

    renderEscolas();

}



function clearEscolaFilters() {

    escolaSearchQuery = '';

    searchResultFiltered = null;

    activeEscolaFilters = { ...DEFAULT_ESCOLA_FILTERS };

    syncGlobalSearchInput();

    renderEscolas();

}



function getFilteredEscolas() {

    return escolas.filter(esc => {

        const op = getEscolaOperationalData(esc);



        if (!schoolMatchesSearch(esc, escolaSearchQuery)) return false;

        if (activeEscolaFilters.controlador !== 'all' && esc.controladorId !== activeEscolaFilters.controlador) return false;

        if (activeEscolaFilters.programa !== 'all' && !(esc.programasIds || []).includes(activeEscolaFilters.programa)) return false;

        if (activeEscolaFilters.situacao !== 'all' && op.situacao !== activeEscolaFilters.situacao) return false;

        if (activeEscolaFilters.pendencias === 'com' && !op.hasPendencias) return false;

        if (activeEscolaFilters.pendencias === 'sem' && op.hasPendencias) return false;

        if (activeEscolaFilters.inventario === 'com' && !op.hasInventarioProcess) return false;

        if (activeEscolaFilters.inventario === 'sem' && op.hasInventarioProcess) return false;

        if (activeEscolaFilters.ra !== 'all' && op.ra !== activeEscolaFilters.ra) return false;



        return true;

    });

}



function renderEscolaFilterOptions(options, activeValue) {

    return options.map(option => `

        <option value="${escapeHtml(option.value)}" ${selectedAttr(activeValue, option.value)}>${escapeHtml(option.label)}</option>

    `).join('');

}



function renderEscolas() {

    const container = document.getElementById('main-container');

    const targetEscolas = getFilteredEscolas();

    const raOptions = [...new Set(escolas.map(e => e.ra || getRAFromDesignacao(e.designação)).filter(Boolean))].sort();

    const competenciaOptions = COMPETENCIAS.filter(c => c.key <= config.competenciaFechamento);

    const pendenciasCount = targetEscolas.filter(e => getEscolaOperationalData(e).hasPendencias).length;

    const inventarioCount = targetEscolas.filter(e => getEscolaOperationalData(e).hasInventarioProcess).length;

    const activeSearchTerm = escolaSearchQuery.trim();

    const activeFilterOnlyCount = Object.keys(activeEscolaFilters).filter(key => activeEscolaFilters[key] !== DEFAULT_ESCOLA_FILTERS[key]).length;

    const activeFiltersCount = activeFilterOnlyCount + (activeSearchTerm ? 1 : 0);



    container.innerHTML = `

        <div class="page-header">

            <div class="page-title">

                <h1>Escolas e Carteiras</h1>

                <p>Lista pesquisável de unidades escolares sob jurisdição da Coordenadoria de Educação.</p>

            </div>

            ${currentProfile === 'assistente' ? `

                <button class="btn btn-primary" onclick="openEscolaEditModal(null)">

                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"></path></svg>

                    Cadastrar Escola

                </button>
            ` : ''}

        </div>



        <div class="panel-card school-filter-panel">

            <div class="school-filter-header">

                <div>

                    <h2>Busca e filtros da carteira</h2>

                    <p>Pesquise pelo nome da unidade escolar ou pela designação.</p>

                </div>

                <button class="btn btn-secondary btn-sm" onclick="clearEscolaFilters()" ${activeFiltersCount === 0 ? 'disabled' : ''}>Limpar filtros</button>

            </div>



            <div class="school-filter-grid">

                <div class="filter-field filter-field-wide">

                    <label for="escola-search-input">Busca</label>

                    <input type="text" id="escola-search-input" class="form-control" value="${escapeHtml(escolaSearchQuery)}" placeholder="Ex.: EM Roraima, Roraima, 04.10.001 ou 0410001" oninput="updateEscolasSearch(this.value, this.selectionStart, this.selectionEnd)">

                </div>



                <div class="filter-field">

                    <label for="filter-escola-controlador">Controlador</label>

                    <select id="filter-escola-controlador" class="form-control" onchange="changeEscolaFilter('controlador', this.value)">

                        <option value="all" ${selectedAttr(activeEscolaFilters.controlador, 'all')}>Todos</option>

                        ${controladores.map(c => `<option value="${escapeHtml(c.id)}" ${selectedAttr(activeEscolaFilters.controlador, c.id)}>${escapeHtml(c.name)}</option>`).join('')}

                    </select>

                </div>



                <div class="filter-field">

                    <label for="filter-escola-programa">Programa</label>

                    <select id="filter-escola-programa" class="form-control" onchange="changeEscolaFilter('programa', this.value)">

                        <option value="all" ${selectedAttr(activeEscolaFilters.programa, 'all')}>Todos</option>

                        ${programas.map(p => `<option value="${escapeHtml(p.id)}" ${selectedAttr(activeEscolaFilters.programa, p.id)}>${escapeHtml(p.name)}</option>`).join('')}

                    </select>

                </div>



                <div class="filter-field">

                    <label for="filter-escola-situacao">Situação</label>

                    <select id="filter-escola-situacao" class="form-control" onchange="changeEscolaFilter('situacao', this.value)">

                        ${renderEscolaFilterOptions([

                            { value: 'all', label: 'Todas' },

                            { value: 'apto', label: 'Aptas' },

                            { value: 'inapto', label: 'Inaptas' },

                            { value: 'emAndamento', label: 'Em andamento' },

                            { value: 'naoAnalisado', label: 'Não analisadas' },

                            { value: 'foraEscopo', label: 'Fora do escopo' }

                        ], activeEscolaFilters.situacao)}

                    </select>

                </div>



                <div class="filter-field">

                    <label for="filter-escola-pendencias">Pendências</label>

                    <select id="filter-escola-pendencias" class="form-control" onchange="changeEscolaFilter('pendencias', this.value)">

                        ${renderEscolaFilterOptions([

                            { value: 'all', label: 'Todas' },

                            { value: 'com', label: 'Com pendências ativas' },

                            { value: 'sem', label: 'Sem pendências ativas' }

                        ], activeEscolaFilters.pendencias)}

                    </select>

                </div>



                <div class="filter-field">

                    <label for="filter-escola-inventario">Inventário</label>

                    <select id="filter-escola-inventario" class="form-control" onchange="changeEscolaFilter('inventario', this.value)">

                        ${renderEscolaFilterOptions([

                            { value: 'all', label: 'Todos' },

                            { value: 'com', label: 'Com processo' },

                            { value: 'sem', label: 'Sem processo' }

                        ], activeEscolaFilters.inventario)}

                    </select>

                </div>



                <div class="filter-field">

                    <label for="filter-escola-ra">R.A.</label>

                    <select id="filter-escola-ra" class="form-control" onchange="changeEscolaFilter('ra', this.value)">

                        <option value="all" ${selectedAttr(activeEscolaFilters.ra, 'all')}>Todas</option>

                        ${raOptions.map(ra => `<option value="${escapeHtml(ra)}" ${selectedAttr(activeEscolaFilters.ra, ra)}>${escapeHtml(ra)}</option>`).join('')}

                    </select>

                </div>

            </div>



            <div class="school-filter-summary">

                <span><strong>${targetEscolas.length}</strong> de ${escolas.length} escolas exibidas</span>

                ${activeSearchTerm ? `<span>Busca ativa: "${escapeHtml(activeSearchTerm)}"</span>` : ''}

                <span>${pendenciasCount} com pendências ativas</span>

                <span>${inventarioCount} com processo de inventário</span>

            </div>

        </div>



        <div class="panel-card">

            <div class="panel-header">

                <div>

                    <h2>Resultado da carteira</h2>

                    <p>${activeFiltersCount > 0 ? 'Lista filtrada conforme os critérios selecionados.' : 'Lista completa de escolas cadastradas.'}</p>

                </div>

                <div class="carteira-competencia-control" aria-label="Competência da carteira">

                    <span>Competência</span>

                    <select id="carteira-competencia-select" onchange="changeCarteiraCompetencia(this.value)" title="Selecionar competência da carteira">

                        ${competenciaOptions.map(c => `

                            <option value="${escapeHtml(c.key)}" ${selectedAttr(activeCompetenciaKey, c.key)}>${escapeHtml(c.label)}</option>

                        `).join('')}

                    </select>

                </div>

            </div>

            <div class="table-responsive">

                <table class="data-table">

                    <thead>

                        <tr>

                            <th>Unidade Escolar</th>

                            <th>Identificação</th>

                            <th>Diretor(a) Geral</th>

                            <th>Controlador Responsável</th>

                            <th>Situação</th>

                            <th>Ações</th>

                        </tr>

                    </thead>

                    <tbody>

                        ${targetEscolas.length === 0 ? `

                            <tr>

                                <td colspan="6">

                                    <div class="empty-state compact">

                                        <div class="empty-state-icon">⌕</div>

                                        <strong>${activeSearchTerm ? `Nenhuma escola encontrada para "${escapeHtml(activeSearchTerm)}"` : 'Nenhuma escola encontrada'}</strong>

                                        <span>${activeSearchTerm && activeFilterOnlyCount === 0 ? 'Busque pelo nome da unidade escolar ou pela designação.' : 'Ajuste a busca ou limpe os filtros para ampliar o resultado.'}</span>

                                    </div>

                                </td>

                            </tr>

                        ` : targetEscolas.map(e => {

                            const op = getEscolaOperationalData(e);

                            const statusBadge = getEscolaStatusBadgeClass(op.situacao);

                            const statusLabel = getEscolaStatusLabel(op.situacao);

                            return `

                                <tr>

                                    <td>

                                        <strong>${escapeHtml(e.denominação)}</strong>
                                        <br><small style="color:var(--text-muted)">${escapeHtml(e.designação)} • ${escapeHtml(op.ra)}</small>
                                        <div class="school-program-inline">

                                            ${op.programas.slice(0, 3).map(p => `<span>${escapeHtml(p)}</span>`).join('')}

                                            ${op.programas.length > 3 ? `<span>+${op.programas.length - 3}</span>` : ''}

                                        </div>
                                    </td>
                                    <td>

                                        <strong>INEP:</strong> ${escapeHtml(e.inep)}<br>
                                        <small><strong>CNPJ:</strong> ${escapeHtml(e.cnpj)}</small><br>
                                        <small><strong>SICI:</strong> ${escapeHtml(e.sici || 'Não informado')}</small>
                                    </td>

                                    <td>${escapeHtml(e.diretor)}<br><small style="color:var(--text-muted)">${escapeHtml(e.telefone)}</small></td>
                                    <td>${escapeHtml(op.controladorName)}</td>
                                    <td><span class="badge ${statusBadge}">${statusLabel}</span></td>

                                    <td>

                                        <div class="school-actions-stack">

                                            <button class="btn btn-secondary btn-sm school-action-view" onclick="switchView('prontuario', '${escapeHtml(e.id)}')">Ver Unidade</button>
                                            ${currentProfile === 'assistente' || currentProfile === 'controlador' ? `

                                                <button class="btn btn-secondary btn-sm school-action-edit" onclick="openEscolaEditModal('${escapeHtml(e.id)}')">Editar</button>
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


    syncGlobalSearchInput();

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
                <h2>Lista de Entrega e Bonificação - Competência ${formatCompetenciaText(activeCompetenciaKey)}</h2>
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
                                    const progStatus = getProgramVerificationStatus(e.id, activeCompetenciaKey, progId);
                                    const statusMeta = getProgramStatusMeta(progStatus);
                                    
                                    let bStatus = `<span class="badge ${statusMeta.badgeClass}" style="font-size:0.65rem; padding: 2px 4px; font-weight:500;">${statusMeta.label}</span>`;
                                    let aStatus = `<span style="color:var(--text-muted); font-size:0.75rem;">Sem registro</span>`;
                                    
                                    if (v) {
                                        const aVals = Object.values(v.analise || {});
                                        const hasStarted = aVals.some(isAnaliseValueStarted)
                                            || Object.values(v.bonificacao || {}).some(isBonificacaoValueStarted);

                                        if (aVals.length > 0 && aVals.every(x => x === 'Correto' || x === 'Correto (Atrasado)')) {
                                            aStatus = `<span style="color:var(--success); font-weight:600; font-size:0.75rem;">Correto</span>`;
                                        } else if (aVals.includes('Incorreto')) {
                                            aStatus = `<span style="color:var(--danger); font-weight:600; font-size:0.75rem;">Com Erros</span>`;
                                        } else if (hasStarted) {
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
                                        <strong>${escapeHtml(e.denominação)}</strong>
                                        <br><small style="color:var(--text-muted)">${escapeHtml(e.designação)}</small>
                                    </td>
                                    <td>${escapeHtml(ctrl ? ctrl.name : 'N/A')}</td>
                                    <td>${bonifStatusHTML}</td>
                                    <td>${analiseStatusHTML}</td>
                                    <td>
                                        ${pendentesCount > 0 ? `<span class="badge badge-danger">${pendentesCount} Abertas</span>` : `<span class="badge badge-gray">Nenhuma</span>`}
                                    </td>
                                    <td>
                                        <button class="btn btn-secondary btn-sm" onclick="switchView('prontuario', '${escapeHtml(e.id)}')">Ver Unidade</button>
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
    updateGlobalCompetenceIndicator();
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
                                    <strong>${escapeHtml(esc ? esc.denominação : 'N/A')}</strong>
                                    ${esc ? `<br><small style="color:var(--text-muted)">${escapeHtml(esc.designação)}</small>` : ''}
                                </td>
                                <td><span class="badge badge-warning" style="font-weight:600;">${escapeHtml(compLabel)}</span></td>
                                <td>${escapeHtml(p.item)}</td>
                                <td><span style="color:var(--danger)">${escapeHtml(p.motivo)}</span></td>
                                <td><span class="badge badge-info">${escapeHtml(p.responsavel)}</span></td>
                                <td>${new Date(p.dataAbertura).toLocaleDateString('pt-BR')}</td>
                                <td>
                                    <button class="btn btn-secondary btn-sm" onclick="switchView('prontuario', '${escapeHtml(p.escolaId)}')">Tratar</button>
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
    let formattedComp = formatCompetenciaText(p.competencia);
    
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

function getCorrectiveSubmissionActionLabel(pendency) {
    if (!window.RadarPendencias.isDocumentaryPendency(pendency)) return '';
    if (pendency.status === 'Aberta') return 'Registrar novo envio';
    if (pendency.status === 'Aguardando reanálise') {
        return 'Registrar substituição mais recente';
    }
    return '';
}

function canReanalysePendency(pendency) {
    return currentProfile === 'controlador'
        && pendency
        && pendency.status === 'Aguardando reanálise'
        && window.RadarPendencias.isDocumentaryPendency(pendency);
}

function encodePendencyIdReference(pendencyId) {
    const type = typeof pendencyId;
    const validString = type === 'string' && pendencyId.length > 0;
    const validNumber = type === 'number' && Number.isFinite(pendencyId);
    if (!validString && !validNumber) {
        throw new Error('Referência de pendência inválida.');
    }

    return JSON.stringify({ type, value: pendencyId });
}

function decodePendencyIdReference(serializedReference) {
    if (typeof serializedReference !== 'string' || !serializedReference) {
        throw new Error('Referência de pendência ausente.');
    }

    let reference;
    try {
        reference = JSON.parse(serializedReference);
    } catch (error) {
        throw new Error('Referência de pendência malformada.');
    }

    const isObject = reference && typeof reference === 'object' && !Array.isArray(reference);
    const hasType = isObject && Object.prototype.hasOwnProperty.call(reference, 'type');
    const hasValue = isObject && Object.prototype.hasOwnProperty.call(reference, 'value');
    const validString = hasType
        && reference.type === 'string'
        && hasValue
        && typeof reference.value === 'string'
        && reference.value.length > 0;
    const validNumber = hasType
        && reference.type === 'number'
        && hasValue
        && typeof reference.value === 'number'
        && Number.isFinite(reference.value);

    if (!validString && !validNumber) {
        throw new Error('Referência de pendência inválida.');
    }
    return reference.value;
}

function resolvePendencyIdReference(source) {
    const actionElement = source && source.currentTarget
        ? source.currentTarget
        : source;
    if (actionElement && actionElement.dataset && actionElement.dataset.pendencyRef) {
        return decodePendencyIdReference(actionElement.dataset.pendencyRef);
    }

    return decodePendencyIdReference(encodePendencyIdReference(source));
}

function findPendencyById(pendencyId) {
    return pendencias.find(item => item.id === pendencyId);
}

function elementMatchesPendencyIdReference(element, pendencyId) {
    if (!element || !element.dataset || !element.dataset.pendencyRef) return false;
    try {
        return decodePendencyIdReference(element.dataset.pendencyRef) === pendencyId;
    } catch (error) {
        return false;
    }
}

function findPendencyElement(selector, pendencyId) {
    return Array.from(document.querySelectorAll(selector))
        .find(element => elementMatchesPendencyIdReference(element, pendencyId)) || null;
}

function renderPendencias() {
    const container = document.getElementById('main-container');
    let ativas = pendencias.filter(p => window.RadarPendencias.isActivePendency(p));
    let resolvidas = pendencias.filter(p => p.status === 'Resolvida');
    const selectedPendency = pendencias.find(p => p.id === activePendencyDetailId);
    const showResolvedTab = selectedPendency && selectedPendency.status === 'Resolvida';

    // Se perfil é controlador, ordenar as dele primeiro (e depois todas as outras)
    if (currentProfile === 'controlador') {
        const activeCtrlId = getDefaultControladorId();

        const getSortWeight = (p) => {
            const esc = escolas.find(e => e.id === p.escolaId);
            return (esc && esc.controladorId === activeCtrlId) ? 0 : 1;
        };
        ativas.sort((a, b) => {
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
            <button class="tab-button ${showResolvedTab ? '' : 'active'}" onclick="switchPendenciasTab(event, 'p-abertas')">Ativas (${ativas.length})</button>
            <button class="tab-button ${showResolvedTab ? 'active' : ''}" onclick="switchPendenciasTab(event, 'p-resolvidas')">Histórico Resolvidas (${resolvidas.length})</button>
        </div>

        <div class="tab-content-panel ${showResolvedTab ? '' : 'active'}" id="p-abertas">
            <div class="panel-card">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Escola</th>
                                <th>Mês de Competência</th>
                                <th>Item</th>
                                <th>Motivo da Falha</th>
                                <th>Situação</th>
                                <th>Quem deve agir?</th>
                                <th>Data Abertura</th>
                                <th>Ações</th>
                            </tr>
                        </thead>

                        <tbody>

                            ${ativas.length === 0 ? `

                                <tr>

                                    <td colspan="8">

                                        Nenhuma pendência ativa no momento. Quando uma inconsistência for registrada, ela aparecerá nesta lista.

                                    </td>

                                </tr>

                            ` : ativas.map(p => {

                                const esc = escolas.find(e => e.id === p.escolaId);

                                const pData = getFormattedPendencyData(p);

                                const ctrl = esc ? controladores.find(c => c.id === esc.controladorId) : null;

                                const ctrlName = ctrl ? ctrl.name : 'Não designado';
                                const desig = esc ? esc.designação : '';
                                const isMine = (currentProfile === 'controlador' && esc && esc.controladorId === getDefaultControladorId());
                                const isSelected = p.id === activePendencyDetailId;
                                const submissionActionLabel = getCorrectiveSubmissionActionLabel(p);
                                const canReanalyse = canReanalysePendency(p);

                                return `
                                    <tr
                                        data-pendency-ref="${escapeHtml(encodePendencyIdReference(p.id))}"
                                        data-pendency-status="${escapeHtml(p.status)}"
                                        class="${isSelected ? 'pendency-row-selected' : ''}"
                                        tabindex="-1"
                                        aria-current="${isSelected ? 'true' : 'false'}"
                                        style="${isMine ? 'background-color: rgba(157, 125, 252, 0.05);' : ''}"
                                    >
                                        <td>
                                            <div style="display:flex; align-items:center; gap:8px;">
                                                <strong>${escapeHtml(esc ? esc.denominação : 'N/A')}</strong>
                                                ${isMine ? `<span class="badge badge-primary" style="font-size: 0.65rem; padding: 2px 6px;">Sua Carteira</span>` : ''}
                                            </div>
                                            ${desig ? `<small style="color:var(--text-muted)">${escapeHtml(desig)} | Controlador: ${escapeHtml(ctrlName)}</small>` : ''}
                                            ${isSelected ? '<span class="pendency-detail-marker">Pendência selecionada</span>' : ''}
                                        </td>
                                        <td><span style="font-weight:600; color:var(--primary);">${escapeHtml(pData.competencia)}</span></td>
                                        <td>${escapeHtml(pData.item)}</td>
                                        <td><span style="color:var(--danger)">${escapeHtml(p.motivo)}</span></td>
                                        <td><span class="badge ${p.status === 'Aguardando reanálise' ? 'badge-warning' : 'badge-danger'}">${escapeHtml(p.status)}</span></td>
                                        <td><span class="badge badge-info">${escapeHtml(p.responsavel)}</span></td>
                                        <td>${new Date(p.dataAbertura).toLocaleDateString('pt-BR')}</td>
                                        <td>
                                            <div style="display:flex; gap:6px;">
                                                <button class="btn btn-secondary btn-sm" onclick="switchView('prontuario', '${escapeHtml(p.escolaId)}')">Ver Unidade</button>
                                                ${canReanalyse ? `
                                                    <button
                                                        class="btn btn-primary btn-sm"
                                                        data-action="reanalyse-pendency"
                                                        data-pendency-ref="${escapeHtml(encodePendencyIdReference(p.id))}"
                                                        onclick="abrirModalReanalisarPendencia(this)"
                                                    >Reanalisar</button>
                                                ` : ''}
                                                ${submissionActionLabel && currentProfile !== 'inventario' ? `
                                                    <button
                                                        class="btn ${canReanalyse ? 'btn-secondary' : 'btn-primary'} btn-sm"
                                                        data-action="register-corrective-submission"
                                                        data-pendency-ref="${escapeHtml(encodePendencyIdReference(p.id))}"
                                                        onclick="abrirModalRegistrarNovoEnvio(this)"
                                                    >${escapeHtml(submissionActionLabel)}</button>
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

        <div class="tab-content-panel ${showResolvedTab ? 'active' : ''}" id="p-resolvidas">
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

                            ${resolvidas.length === 0 ? `

                                <tr>

                                    <td colspan="7">

                                        Nenhuma pendência resolvida registrada ainda. O histórico será preenchido conforme as regularizações forem concluídas.

                                    </td>

                                </tr>

                            ` : resolvidas.map(p => {

                                const esc = escolas.find(e => e.id === p.escolaId);

                                const pData = getFormattedPendencyData(p);

                                const ctrl = esc ? controladores.find(c => c.id === esc.controladorId) : null;

                                const ctrlName = ctrl ? ctrl.name : 'Não designado';
                                const desig = esc ? esc.designação : '';
                                const isMine = (currentProfile === 'controlador' && esc && esc.controladorId === getDefaultControladorId());
                                const isSelected = p.id === activePendencyDetailId;

                                return `
                                    <tr
                                        data-pendency-ref="${escapeHtml(encodePendencyIdReference(p.id))}"
                                        class="${isSelected ? 'pendency-row-selected' : ''}"
                                        tabindex="-1"
                                        aria-current="${isSelected ? 'true' : 'false'}"
                                        style="${isMine ? 'background-color: rgba(157, 125, 252, 0.03);' : ''}"
                                    >
                                        <td>
                                            <div style="display:flex; align-items:center; gap:8px;">
                                                <strong>${escapeHtml(esc ? esc.denominação : 'N/A')}</strong>
                                                ${isMine ? `<span class="badge badge-primary" style="font-size: 0.65rem; padding: 2px 6px;">Sua Carteira</span>` : ''}
                                            </div>
                                            ${desig ? `<small style="color:var(--text-muted)">${escapeHtml(desig)} | Controlador: ${escapeHtml(ctrlName)}</small>` : ''}
                                            ${isSelected ? '<span class="pendency-detail-marker">Pendência selecionada</span>' : ''}
                                        </td>
                                        <td>${escapeHtml(pData.competencia)}</td>
                                        <td>${escapeHtml(pData.item)}</td>
                                        <td>${escapeHtml(p.motivo)}</td>
                                        <td><span style="color:var(--success); font-size:0.8rem;">${escapeHtml(p.justificativaResolucao || 'Resolvida')}</span></td>
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

function openPendencyDetail(pendencyId) {
    const pendency = findPendencyById(pendencyId);
    if (!pendency) return false;

    activePendencyDetailId = pendency.id;
    switchView('pendencias');

    const focusSelectedPendency = () => {
        const row = findPendencyElement('tr[data-pendency-ref]', pendency.id);
        if (!row) return;

        row.scrollIntoView({ block: 'center', behavior: 'auto' });
        row.focus({ preventScroll: true });
    };

    if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(focusSelectedPendency);
    } else {
        setTimeout(focusSelectedPendency, 0);
    }
    return true;
}

function switchPendenciasTab(e, tabId) {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    document.querySelectorAll('.tab-content-panel').forEach(pnl => pnl.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}

function updatePendencyById(pendencyId, nextPendency) {
    const index = pendencias.findIndex(item => item.id === pendencyId);
    if (index === -1) throw new Error('Pendência não encontrada.');
    pendencias[index] = nextPendency;
}

let registrarNovoEnvioTrigger = null;
let registrarNovoEnvioSourceContext = null;
let reanalisarPendenciaTrigger = null;
let reanalisarPendenciaSourceContext = null;

const CORRECTIVE_SUBMISSION_PRONTUARIO_TABS = new Set([
    'tab-pendencias',
    'tab-verificacoes'
]);

const ACCESSIBLE_MODAL_FOCUSABLE_SELECTOR = [
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])'
].join(',');

function setAccessibleModalOpen(modalId, initialFocus) {
    const modal = document.getElementById(modalId);
    if (!modal) return false;

    modal.removeAttribute('inert');
    modal.setAttribute('aria-hidden', 'false');
    openModal(modalId);
    if (initialFocus && typeof initialFocus.focus === 'function') {
        initialFocus.focus();
    }
    return true;
}

function setAccessibleModalClosed(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return false;

    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('inert', '');
    return true;
}

function trapAccessibleModalFocus(event, modal, closeHandler) {
    if (!modal || modal.getAttribute('aria-hidden') === 'true') return false;

    if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeHandler();
        return true;
    }

    if (event.key !== 'Tab') return false;
    const focusable = Array.from(modal.querySelectorAll(
        ACCESSIBLE_MODAL_FOCUSABLE_SELECTOR
    ));
    if (focusable.length === 0) {
        event.preventDefault();
        return true;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
    return true;
}

function resetRegistrarNovoEnvioForm() {
    const form = document.getElementById('form-registrar-envio');
    if (!form) return;

    form.reset();
    document.getElementById('envio-pendencia-id').value = '';
    document.getElementById('envio-contexto').replaceChildren();
}

function showRegistrarNovoEnvioError(message) {
    const context = document.getElementById('envio-contexto');
    if (!context) return;

    let errorMessage = context.querySelector('[data-envio-error]');
    if (!errorMessage) {
        errorMessage = document.createElement('p');
        errorMessage.dataset.envioError = 'true';
        errorMessage.setAttribute('role', 'alert');
        context.prepend(errorMessage);
    }
    errorMessage.textContent = message;
}

function cloneSubmissionInvariant(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
}

function cloneOperationalIndex(index) {
    return new Map(Array.from(index.entries()).map(([key, values]) => [
        key,
        cloneSubmissionInvariant(values)
    ]));
}

function captureCorrectiveSubmissionLocalStorage() {
    const keys = [...RADAR_STORAGE_KEYS, 'radar_pdde_data_version'];
    return keys.map(key => {
        const value = localStorage.getItem(key);
        return { key, present: value !== null, value };
    });
}

function restoreCorrectiveSubmissionLocalStorage(snapshot) {
    const errors = [];
    snapshot.forEach(entry => {
        try {
            if (entry.present) {
                localStorage.setItem(entry.key, entry.value);
            } else {
                localStorage.removeItem(entry.key);
            }
        } catch (error) {
            errors.push({ key: entry.key, error });
        }
    });

    if (errors.length > 0) {
        const restoreError = new Error(
            `Não foi possível restaurar ${errors.length} chave(s) do armazenamento local.`
        );
        restoreError.storageErrors = errors;
        throw restoreError;
    }
}

function captureCorrectiveSubmissionRollback(current, verification, compProgKey) {
    return {
        pendencyId: current.id,
        pendency: cloneSubmissionInvariant(current),
        escolaId: current.escolaId,
        compProgKey,
        verification: cloneSubmissionInvariant(verification),
        logs: cloneSubmissionInvariant(logs),
        pendenciasIndex: cloneOperationalIndex(_pendenciasByEscolaId),
        bensIndex: cloneOperationalIndex(_bensByEscolaId),
        localStorage: captureCorrectiveSubmissionLocalStorage()
    };
}

function restoreCorrectiveSubmissionRollback(snapshot) {
    const rollbackErrors = [];

    try {
        updatePendencyById(snapshot.pendencyId, cloneSubmissionInvariant(snapshot.pendency));
    } catch (error) {
        rollbackErrors.push({ step: 'pendência', error });
    }

    try {
        if (!verificacoes[snapshot.escolaId]) {
            throw new Error('Coleção de verificações da escola não encontrada.');
        }
        verificacoes[snapshot.escolaId][snapshot.compProgKey] = cloneSubmissionInvariant(
            snapshot.verification
        );
    } catch (error) {
        rollbackErrors.push({ step: 'verificação', error });
    }

    try {
        logs = cloneSubmissionInvariant(snapshot.logs);
    } catch (error) {
        rollbackErrors.push({ step: 'logs', error });
    }

    try {
        rebuildOperationalIndexes();
    } catch (error) {
        try {
            _pendenciasByEscolaId = cloneOperationalIndex(snapshot.pendenciasIndex);
            _bensByEscolaId = cloneOperationalIndex(snapshot.bensIndex);
        } catch (indexRestoreError) {
            rollbackErrors.push({ step: 'índices', error: indexRestoreError });
        }
    }

    try {
        restoreCorrectiveSubmissionLocalStorage(snapshot.localStorage);
    } catch (error) {
        rollbackErrors.push({ step: 'armazenamento local', error });
    }

    return rollbackErrors;
}

function getCorrectiveSubmissionFailureMessage(primaryError, rollbackErrors) {
    const primaryMessage = primaryError && primaryError.message
        ? primaryError.message
        : 'Não foi possível registrar o novo envio.';
    console.error('Falha ao registrar o novo envio.', primaryError);

    if (rollbackErrors.length === 0) return primaryMessage;

    console.error('Falha parcial ao restaurar o novo envio.', rollbackErrors);
    return `${primaryMessage} A restauração local não pôde ser concluída integralmente; recarregue a página antes de tentar novamente.`;
}

function verifySubmissionBonificationInvariant(verification, bonificationSnapshot, resultSnapshot) {
    const bonificationChanged = JSON.stringify(verification.bonificacao)
        !== JSON.stringify(bonificationSnapshot);
    const resultChanged = JSON.stringify(verification.resultadoBonif)
        !== JSON.stringify(resultSnapshot);

    if (bonificationChanged || resultChanged) {
        throw new Error('O novo envio não pode alterar a bonificação ou o resultado consolidado.');
    }
}

function getPendencyActionTrigger(source) {
    const candidate = source && source.currentTarget
        ? source.currentTarget
        : source;
    if (candidate && candidate.dataset && candidate.dataset.pendencyRef) {
        return candidate;
    }

    const activeElement = document.activeElement;
    return activeElement && typeof activeElement.focus === 'function'
        ? activeElement
        : null;
}

function getPendencyActionProntuarioTab(trigger) {
    if (currentView !== 'prontuario') return null;

    const triggerPanel = trigger && typeof trigger.closest === 'function'
        ? trigger.closest('.tab-content-panel')
        : null;
    if (triggerPanel && CORRECTIVE_SUBMISSION_PRONTUARIO_TABS.has(triggerPanel.id)) {
        return triggerPanel.id;
    }

    const activePanel = Array.from(document.querySelectorAll(
        '#main-container .tab-content-panel.active'
    )).find(panel => CORRECTIVE_SUBMISSION_PRONTUARIO_TABS.has(panel.id));
    return activePanel ? activePanel.id : null;
}

function capturePendencyActionSourceContext(pendency, trigger) {
    const competence = pendency.competenciaOrigem || pendency.competencia;
    return Object.freeze({
        currentView,
        escolaId: pendency.escolaId,
        competencia: competence,
        prontuarioTabId: getPendencyActionProntuarioTab(trigger)
    });
}

function openRegistrarNovoEnvioModal(trigger, sourceContext) {
    registrarNovoEnvioTrigger = trigger;
    registrarNovoEnvioSourceContext = sourceContext;
    setAccessibleModalOpen(
        'modal-registrar-envio',
        document.getElementById('envio-data-disponibilizacao')
    );
}

function closeRegistrarNovoEnvioModal({ restoreFocus = true } = {}) {
    const trigger = registrarNovoEnvioTrigger;
    setAccessibleModalClosed('modal-registrar-envio');
    registrarNovoEnvioTrigger = null;
    registrarNovoEnvioSourceContext = null;

    if (restoreFocus && trigger && trigger.isConnected && typeof trigger.focus === 'function') {
        trigger.focus({ preventScroll: true });
    }
}

function handleRegistrarNovoEnvioKeydown(event) {
    const modal = document.getElementById('modal-registrar-envio');
    trapAccessibleModalFocus(event, modal, closeRegistrarNovoEnvioModal);
}

function getPendencyActionFocusScope(sourceContext) {
    if (sourceContext.currentView === 'prontuario') {
        const sourcePanel = CORRECTIVE_SUBMISSION_PRONTUARIO_TABS.has(
            sourceContext.prontuarioTabId
        )
            ? document.getElementById(sourceContext.prontuarioTabId)
            : null;
        if (sourcePanel && sourcePanel.classList.contains('active')) return sourcePanel;

        return Array.from(document.querySelectorAll(
            '#main-container .tab-content-panel.active'
        )).find(panel => CORRECTIVE_SUBMISSION_PRONTUARIO_TABS.has(panel.id)) || null;
    }

    return ['p-abertas', 'p-resolvidas']
        .map(panelId => document.getElementById(panelId))
        .find(panel => panel && panel.classList.contains('active')) || null;
}

function preparePendencyActionFallbackFocus(scope, pendencyId, sourceContext) {
    const pendency = findPendencyById(pendencyId);
    const school = pendency
        ? escolas.find(item => item.id === pendency.escolaId)
        : null;
    const schoolName = school
        ? (school.denominação || school.denominacao || school.denominaçao || school.id)
        : sourceContext.escolaId;
    const documentName = pendency
        ? (VERIFICATION_DOCUMENT_LABELS[pendency.documentoKey] || pendency.documentoKey)
        : 'pendência documental';
    const contextualContainer = scope
        ? (scope.querySelector('.panel-card') || scope)
        : document.getElementById('main-container');
    if (!contextualContainer) return null;

    contextualContainer.setAttribute('tabindex', '-1');
    contextualContainer.setAttribute('role', 'region');
    contextualContainer.setAttribute(
        'aria-label',
        `Contexto da pendência atualizada: ${documentName}, ${schoolName}, competência ${sourceContext.competencia}.`
    );
    return contextualContainer;
}

function focusPendencyActionAfterRender(pendencyId, sourceContext, actionName) {
    const focusEquivalentAction = () => {
        const scope = getPendencyActionFocusScope(sourceContext);
        const actions = scope ? Array.from(scope.querySelectorAll(
            `[data-action="${actionName}"][data-pendency-ref]`
        )) : [];
        const action = actions.find(candidate => (
            elementMatchesPendencyIdReference(candidate, pendencyId)
            && candidate.getClientRects().length > 0
        ));
        const rows = scope ? Array.from(scope.querySelectorAll('tr[data-pendency-ref]')) : [];
        const row = rows.find(candidate => (
            elementMatchesPendencyIdReference(candidate, pendencyId)
            && candidate.getClientRects().length > 0
        ));
        const target = action
            || row
            || preparePendencyActionFallbackFocus(scope, pendencyId, sourceContext);
        if (!target) return;

        if (typeof target.scrollIntoView === 'function') {
            target.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        }
        target.focus({ preventScroll: true });
    };

    if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(focusEquivalentAction);
    } else {
        setTimeout(focusEquivalentAction, 0);
    }
}

function abrirModalRegistrarNovoEnvio(pendencySource) {
    let pendencyId;
    try {
        pendencyId = resolvePendencyIdReference(pendencySource);
    } catch (error) {
        console.error('Não foi possível interpretar a referência da pendência.', error);
        return false;
    }

    const pendency = findPendencyById(pendencyId);
    const school = pendency
        ? escolas.find(item => item.id === pendency.escolaId)
        : null;
    const allowedStatus = pendency
        && ['Aberta', 'Aguardando reanálise'].includes(pendency.status);

    if (!pendency
        || !school
        || !allowedStatus
        || !window.RadarPendencias.isDocumentaryPendency(pendency)) {
        return false;
    }

    const competence = pendency.competenciaOrigem || pendency.competencia;
    const competenceLabel = formatCompetenciaText(competence);
    const program = programas.find(item => item.id === pendency.programaId);
    const programName = program ? program.name : pendency.programaId;
    const documentName = VERIFICATION_DOCUMENT_LABELS[pendency.documentoKey]
        || pendency.documentoKey;
    const schoolName = school.denominação || school.denominacao || school.denominaçao || '';
    const trigger = getPendencyActionTrigger(pendencySource);
    const sourceContext = capturePendencyActionSourceContext(pendency, trigger);

    resetRegistrarNovoEnvioForm();
    document.getElementById('envio-pendencia-id').value = encodePendencyIdReference(pendency.id);
    document.getElementById('envio-contexto').innerHTML = `
        <dl aria-label="Contexto da pendência">
            <div>
                <dt>Escola</dt>
                <dd>${escapeHtml(schoolName)}</dd>
            </div>
            <div>
                <dt>Competência</dt>
                <dd>${escapeHtml(competenceLabel)} (${escapeHtml(competence)})</dd>
            </div>
            <div>
                <dt>Programa / documento</dt>
                <dd>${escapeHtml(programName)} — ${escapeHtml(documentName)}</dd>
            </div>
        </dl>
    `;

    openRegistrarNovoEnvioModal(trigger, sourceContext);
    return true;
}

function confirmarRegistrarNovoEnvio(event) {
    event.preventDefault();
    const form = document.getElementById('form-registrar-envio');
    const serializedPendencyId = document.getElementById('envio-pendencia-id').value;
    const availabilityDateInput = document.getElementById('envio-data-disponibilizacao');
    const observationInput = document.getElementById('envio-observacao');
    const linkInput = document.getElementById('envio-link');
    const availabilityDate = availabilityDateInput.value;
    const observation = observationInput.value.trim();
    const link = linkInput.value.trim();

    if (!form.checkValidity()) {
        form.reportValidity();
        return false;
    }
    if (!availabilityDate) {
        availabilityDateInput.focus();
        return false;
    }
    if (!observation) {
        observationInput.focus();
        return false;
    }

    let pendencyId;
    try {
        pendencyId = decodePendencyIdReference(serializedPendencyId);
    } catch (error) {
        showRegistrarNovoEnvioError(error.message);
        return false;
    }

    const current = findPendencyById(pendencyId);
    const school = current
        ? escolas.find(item => item.id === current.escolaId)
        : null;
    const allowedStatus = current
        && ['Aberta', 'Aguardando reanálise'].includes(current.status);

    if (!current
        || !school
        || !allowedStatus
        || !window.RadarPendencias.isDocumentaryPendency(current)) {
        showRegistrarNovoEnvioError('A pendência documental não está disponível para um novo envio.');
        return false;
    }

    const sourceContext = registrarNovoEnvioSourceContext
        || capturePendencyActionSourceContext(current, registrarNovoEnvioTrigger);

    const competence = current.competenciaOrigem || current.competencia;
    const compProgKey = `${competence}_${current.programaId}`;
    const verification = verificacoes[current.escolaId]?.[compProgKey];
    const hasLinkedAnalysis = verification
        && verification.analise
        && Object.prototype.hasOwnProperty.call(verification.analise, current.documentoKey);

    if (!hasLinkedAnalysis) {
        showRegistrarNovoEnvioError('A análise técnica vinculada não foi encontrada. Nenhum dado foi alterado.');
        return false;
    }

    let rollbackSnapshot;
    try {
        rollbackSnapshot = captureCorrectiveSubmissionRollback(
            current,
            verification,
            compProgKey
        );
    } catch (error) {
        showRegistrarNovoEnvioError(error && error.message
            ? error.message
            : 'Não foi possível preparar o registro do novo envio.');
        return false;
    }

    const nowIso = new Date().toISOString();
    const user = getCurrentUser();
    const bonificationSnapshot = cloneSubmissionInvariant(
        rollbackSnapshot.verification.bonificacao
    );
    const resultSnapshot = cloneSubmissionInvariant(
        rollbackSnapshot.verification.resultadoBonif
    );
    const program = programas.find(item => item.id === current.programaId);
    const programName = program ? program.name : current.programaId;
    const documentName = VERIFICATION_DOCUMENT_LABELS[current.documentoKey]
        || current.documentoKey;
    const schoolName = school.denominação || school.denominacao || school.denominaçao || '';

    try {
        const nextPendency = window.RadarPendencias.registerCorrectiveSubmission(current, {
            id: createPendencyClientId('tentativa'),
            dataDisponibilizacao: availabilityDate,
            observacao: observation,
            link
        }, {
            eventId: createPendencyClientId('evento'),
            at: nowIso,
            usuario: user.name,
            perfil: user.role
        });
        verification.analise[current.documentoKey] = 'Não analisado';
        updatePendencyById(current.id, nextPendency);
        verifySubmissionBonificationInvariant(
            verification,
            bonificationSnapshot,
            resultSnapshot
        );
        rebuildOperationalIndexes();
        registerLog(
            'Novo envio registrado',
            `Novo envio de ${documentName} (${current.documentoKey}) no programa ${programName} (${current.programaId}) para ${schoolName}, competência ${competence}, disponibilizado em ${availabilityDate}.`
        );
    } catch (primaryError) {
        const rollbackErrors = restoreCorrectiveSubmissionRollback(rollbackSnapshot);
        showRegistrarNovoEnvioError(
            getCorrectiveSubmissionFailureMessage(primaryError, rollbackErrors)
        );
        return false;
    }

    closeRegistrarNovoEnvioModal({ restoreFocus: false });
    resetRegistrarNovoEnvioForm();
    updateAlertsBell();

    if (sourceContext.currentView === 'prontuario') {
        activeSchoolId = sourceContext.escolaId;
        activeProntuarioCompetencia = sourceContext.competencia;
        renderProntuario(sourceContext.escolaId);
        activateProntuarioTab(
            CORRECTIVE_SUBMISSION_PRONTUARIO_TABS.has(sourceContext.prontuarioTabId)
                ? sourceContext.prontuarioTabId
                : 'tab-verificacoes'
        );
    } else {
        activePendencyDetailId = current.id;
        renderPendencias();
    }
    focusPendencyActionAfterRender(
        current.id,
        sourceContext,
        'register-corrective-submission'
    );
    return true;
}

function getCorrectAnalysisLabel(competencia, dataDisponibilizacao) {
    const prazo = COMPETENCIAS.find(item => item.key === competencia)?.bonifPrazo;
    if (!prazo || !dataDisponibilizacao) return 'Correto';
    return dataDisponibilizacao > prazo ? 'Correto (Atrasado)' : 'Correto';
}

function assertBonificationUnchanged(
    verification,
    documentoKey,
    previousBonification,
    previousProgramResult
) {
    const currentBonification = verification && verification.bonificacao;
    const sourceDocumentChanged = !Object.is(
        currentBonification && currentBonification[documentoKey],
        previousBonification && previousBonification[documentoKey]
    );
    const wholeBonificationChanged = JSON.stringify(currentBonification)
        !== JSON.stringify(previousBonification);
    const programResultChanged = JSON.stringify(verification && verification.resultadoBonif)
        !== JSON.stringify(previousProgramResult);

    if (sourceDocumentChanged || wholeBonificationChanged || programResultChanged) {
        throw new Error(
            'A reanálise não pode alterar a bonificação nem o resultado consolidado.'
        );
    }
}

function getLatestAwaitingPendencyAttempt(pendency) {
    const attempts = Array.isArray(pendency && pendency.tentativas)
        ? pendency.tentativas
        : [];
    return [...attempts].reverse().find(attempt => (
        attempt && attempt.status === 'aguardando'
    )) || null;
}

function enforceAbsentDocumentExclusivity(inputs, changedInput) {
    const absentInput = inputs.find(input => input.value === 'Documento ausente');
    if (!absentInput || !changedInput) return;

    if (changedInput !== absentInput && changedInput.checked) {
        absentInput.checked = false;
    }

    const absentIsExclusive = changedInput === absentInput && absentInput.checked;
    inputs.forEach(input => {
        if (input === absentInput) return;
        input.disabled = absentIsExclusive;
        if (absentIsExclusive) input.checked = false;
    });

    if (!absentIsExclusive) {
        inputs.forEach(input => {
            if (input !== absentInput) input.disabled = false;
        });
    }
}

function renderReanalysisErrorOptions() {
    const container = document.getElementById('reanalisar-erros');
    if (!container) return;

    container.replaceChildren();
    window.RadarPendencias.DOCUMENT_ERROR_TYPES.forEach(error => {
        const label = document.createElement('label');
        label.className = 'pendency-error-option';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.name = 'reanalisar-erros';
        input.value = error;
        input.addEventListener('change', () => {
            syncReanalysisAbsentErrorExclusivity(input);
        });
        const text = document.createElement('span');
        text.textContent = error;
        label.append(input, text);
        container.append(label);
    });
}

function syncReanalysisAbsentErrorExclusivity(changedInput) {
    const inputs = Array.from(
        document.querySelectorAll('#reanalisar-erros input[name="reanalisar-erros"]')
    );
    enforceAbsentDocumentExclusivity(inputs, changedInput);
}

function updateReanalysisErrorVisibility() {
    const result = document.getElementById('reanalisar-resultado');
    const group = document.getElementById('reanalisar-erros-group');
    const fieldset = document.getElementById('reanalisar-erros-fieldset');
    if (!result || !group || !fieldset) return;

    const showErrors = result.value === 'incorreto';
    group.hidden = !showErrors;
    fieldset.disabled = !showErrors;
    const inputs = Array.from(fieldset.querySelectorAll('input[name="reanalisar-erros"]'));
    inputs.forEach(input => {
        input.disabled = !showErrors;
        if (!showErrors) input.checked = false;
    });
}

function collectReanalysisErrors(result) {
    if (result !== 'incorreto') return [];
    const selectedErrors = Array.from(
        document.querySelectorAll('#reanalisar-erros input[name="reanalisar-erros"]:checked')
    ).map(input => input.value);
    return window.RadarPendencias.validateDocumentErrors(selectedErrors);
}

function resetReanalysisForm() {
    const form = document.getElementById('form-reanalisar-pendencia');
    if (!form) return;

    form.reset();
    document.getElementById('reanalisar-pendencia-id').value = '';
    document.getElementById('reanalisar-tentativa-atual').replaceChildren();
    renderReanalysisErrorOptions();
    updateReanalysisErrorVisibility();
}

function showReanalysisError(message) {
    const summary = document.getElementById('reanalisar-tentativa-atual');
    if (!summary) return;

    let errorMessage = summary.querySelector('[data-reanalysis-error]');
    if (!errorMessage) {
        errorMessage = document.createElement('p');
        errorMessage.dataset.reanalysisError = 'true';
        errorMessage.setAttribute('role', 'alert');
        summary.prepend(errorMessage);
    }
    errorMessage.textContent = message;
}

function appendReanalysisSummaryItem(list, label, value) {
    const row = document.createElement('div');
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    if (value instanceof Node) {
        description.append(value);
    } else {
        description.textContent = value || 'Não informado';
    }
    row.append(term, description);
    list.append(row);
}

function getSafeReanalysisLink(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
        const parsed = new URL(value.trim());
        return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : null;
    } catch (error) {
        return null;
    }
}

function renderReanalysisAttemptSummary(pendency, attempt, school) {
    const summary = document.getElementById('reanalisar-tentativa-atual');
    const list = document.createElement('dl');
    const competence = pendency.competenciaOrigem || pendency.competencia;
    const program = programas.find(item => item.id === pendency.programaId);
    const documentName = VERIFICATION_DOCUMENT_LABELS[pendency.documentoKey]
        || pendency.documentoKey;
    const schoolName = school.denominação || school.denominacao || school.id;
    const nextActor = pendency.responsavel
        || window.RadarPendencias.getNextActor(pendency)
        || 'Não definido';
    const currentErrors = Array.isArray(pendency.errosAtuais)
        ? pendency.errosAtuais.filter(Boolean)
        : [];
    appendReanalysisSummaryItem(list, 'Estado atual', pendency.status);
    appendReanalysisSummaryItem(list, 'Próximo ator', nextActor);
    appendReanalysisSummaryItem(
        list,
        'Erros atuais',
        currentErrors.length > 0 ? currentErrors.join(' • ') : 'Nenhum erro registrado'
    );
    appendReanalysisSummaryItem(list, 'Escola', schoolName);
    appendReanalysisSummaryItem(
        list,
        'Competência',
        formatCompetenciaText(competence) + ' (' + competence + ')'
    );
    appendReanalysisSummaryItem(
        list,
        'Programa / documento',
        (program ? program.name : pendency.programaId) + ' — ' + documentName
    );
    appendReanalysisSummaryItem(
        list,
        'Disponibilizado no Drive em',
        attempt.dataDisponibilizacao
    );
    appendReanalysisSummaryItem(list, 'Observação do envio', attempt.observacao);

    const safeLink = getSafeReanalysisLink(attempt.link);
    if (safeLink) {
        const link = document.createElement('a');
        link.href = safeLink;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Abrir arquivo no Drive';
        appendReanalysisSummaryItem(list, 'Arquivo', link);
    }
    summary.replaceChildren(list);
}

function openReanalysisModal(trigger, sourceContext) {
    reanalisarPendenciaTrigger = trigger;
    reanalisarPendenciaSourceContext = sourceContext;
    setAccessibleModalOpen(
        'modal-reanalisar-pendencia',
        document.getElementById('reanalisar-resultado')
    );
}

function closeReanalysisModal({ restoreFocus = true } = {}) {
    const trigger = reanalisarPendenciaTrigger;
    setAccessibleModalClosed('modal-reanalisar-pendencia');
    reanalisarPendenciaTrigger = null;
    reanalisarPendenciaSourceContext = null;

    if (restoreFocus && trigger && trigger.isConnected && typeof trigger.focus === 'function') {
        trigger.focus({ preventScroll: true });
    }
}

function handleReanalysisKeydown(event) {
    const modal = document.getElementById('modal-reanalisar-pendencia');
    trapAccessibleModalFocus(event, modal, closeReanalysisModal);
}

function abrirModalReanalisarPendencia(pendencySource) {
    if (currentProfile !== 'controlador') return false;

    let pendencyId;
    try {
        pendencyId = resolvePendencyIdReference(pendencySource);
    } catch (error) {
        console.error('Não foi possível interpretar a referência da pendência.', error);
        return false;
    }

    const pendency = findPendencyById(pendencyId);
    const school = pendency
        ? escolas.find(item => item.id === pendency.escolaId)
        : null;
    const attempt = getLatestAwaitingPendencyAttempt(pendency);
    if (!pendency
        || !school
        || pendency.status !== 'Aguardando reanálise'
        || !window.RadarPendencias.isDocumentaryPendency(pendency)
        || !attempt) {
        return false;
    }

    const trigger = getPendencyActionTrigger(pendencySource);
    const sourceContext = capturePendencyActionSourceContext(pendency, trigger);
    resetReanalysisForm();
    document.getElementById('reanalisar-pendencia-id').value = encodePendencyIdReference(
        pendency.id
    );
    renderReanalysisAttemptSummary(pendency, attempt, school);
    openReanalysisModal(trigger, sourceContext);
    return true;
}

function getReanalysisFailureMessage(primaryError, rollbackErrors) {
    const primaryMessage = primaryError && primaryError.message
        ? primaryError.message
        : 'Não foi possível registrar a reanálise.';
    console.error('Falha ao registrar a reanálise.', primaryError);

    if (rollbackErrors.length === 0) return primaryMessage;
    console.error('Falha parcial ao restaurar a reanálise.', rollbackErrors);
    return primaryMessage
        + ' A restauração local não pôde ser concluída integralmente; recarregue a página antes de tentar novamente.';
}

function confirmarReanalisePendencia(event) {
    event.preventDefault();
    const form = document.getElementById('form-reanalisar-pendencia');
    const resultInput = document.getElementById('reanalisar-resultado');
    const observationInput = document.getElementById('reanalisar-observacao');
    const serializedPendencyId = document.getElementById('reanalisar-pendencia-id').value;
    const result = resultInput.value;
    const observation = observationInput.value.trim();

    if (!form.checkValidity()) {
        form.reportValidity();
        return false;
    }
    if (currentProfile !== 'controlador') {
        showReanalysisError('Reanálise permitida somente ao perfil Controlador.');
        return false;
    }

    let errors;
    try {
        errors = collectReanalysisErrors(result);
    } catch (error) {
        showReanalysisError(error.message);
        const firstError = document.querySelector(
            '#reanalisar-erros input[name="reanalisar-erros"]'
        );
        if (firstError) firstError.focus();
        return false;
    }

    let pendencyId;
    try {
        pendencyId = decodePendencyIdReference(serializedPendencyId);
    } catch (error) {
        showReanalysisError(error.message);
        return false;
    }

    const current = findPendencyById(pendencyId);
    const school = current
        ? escolas.find(item => item.id === current.escolaId)
        : null;
    if (!current
        || !school
        || current.status !== 'Aguardando reanálise'
        || !window.RadarPendencias.isDocumentaryPendency(current)) {
        showReanalysisError(
            'A pendência documental não está disponível para reanálise.'
        );
        return false;
    }

    const competence = current.competenciaOrigem || current.competencia;
    const exactActive = window.RadarPendencias.findActivePendency(
        pendencias.filter(pendency => window.RadarPendencias.isDocumentaryPendency(pendency)),
        {
            escolaId: current.escolaId,
            competenciaOrigem: competence,
            programaId: current.programaId,
            documentoKey: current.documentoKey,
            item: current.item
        }
    );
    const awaitingAttempt = getLatestAwaitingPendencyAttempt(current);
    const compProgKey = competence + '_' + current.programaId;
    const verification = verificacoes[current.escolaId]?.[compProgKey];
    const hasLinkedAnalysis = verification
        && verification.analise
        && Object.prototype.hasOwnProperty.call(verification.analise, current.documentoKey);
    if (!exactActive
        || exactActive.id !== current.id
        || !awaitingAttempt
        || !hasLinkedAnalysis) {
        showReanalysisError(
            'A tentativa ou a análise técnica vinculada não foi encontrada. Nenhum dado foi alterado.'
        );
        return false;
    }

    let rollbackSnapshot;
    try {
        rollbackSnapshot = captureCorrectiveSubmissionRollback(
            current,
            verification,
            compProgKey
        );
    } catch (error) {
        showReanalysisError(error && error.message
            ? error.message
            : 'Não foi possível preparar o registro da reanálise.');
        return false;
    }

    const sourceContext = reanalisarPendenciaSourceContext
        || capturePendencyActionSourceContext(current, reanalisarPendenciaTrigger);
    const previousBonification = cloneSubmissionInvariant(
        rollbackSnapshot.verification.bonificacao
    );
    const previousProgramResult = cloneSubmissionInvariant(
        rollbackSnapshot.verification.resultadoBonif
    );
    const nowIso = new Date().toISOString();
    const user = getCurrentUser();
    const program = programas.find(item => item.id === current.programaId);
    const programName = program ? program.name : current.programaId;
    const documentName = VERIFICATION_DOCUMENT_LABELS[current.documentoKey]
        || current.documentoKey;
    const schoolName = school.denominação || school.denominacao || school.id;
    let nextPendency;

    try {
        nextPendency = window.RadarPendencias.recordReanalysis(current, {
            resultado: result,
            erros: errors,
            observacao: observation
        }, {
            eventId: createPendencyClientId('evento'),
            at: nowIso,
            usuario: user.name,
            perfil: user.role
        });
        const analysisLabel = result === 'correto'
            ? getCorrectAnalysisLabel(competence, awaitingAttempt.dataDisponibilizacao)
            : 'Incorreto';
        updatePendencyById(current.id, nextPendency);
        verification.analise = {
            ...verification.analise,
            [current.documentoKey]: analysisLabel
        };
        assertBonificationUnchanged(
            verification,
            current.documentoKey,
            previousBonification,
            previousProgramResult
        );
        rebuildOperationalIndexes();
        registerLog(
            'Reanálise registrada',
            'Reanálise de ' + documentName + ' (' + current.documentoKey + ') no programa '
                + programName + ' (' + current.programaId + ') para ' + schoolName
                + ', competência ' + competence + ', tentativa ' + awaitingAttempt.id
                + ', resultado ' + result + '.'
        );
    } catch (primaryError) {
        const rollbackErrors = restoreCorrectiveSubmissionRollback(rollbackSnapshot);
        showReanalysisError(getReanalysisFailureMessage(primaryError, rollbackErrors));
        return false;
    }

    closeReanalysisModal({ restoreFocus: false });
    resetReanalysisForm();
    updateAlertsBell();

    if (sourceContext.currentView === 'prontuario') {
        activeSchoolId = sourceContext.escolaId;
        activeProntuarioCompetencia = sourceContext.competencia;
        renderProntuario(sourceContext.escolaId);
        activateProntuarioTab(
            CORRECTIVE_SUBMISSION_PRONTUARIO_TABS.has(sourceContext.prontuarioTabId)
                ? sourceContext.prontuarioTabId
                : 'tab-verificacoes'
        );
    } else {
        activePendencyDetailId = current.id;
        renderPendencias();
    }
    focusPendencyActionAfterRender(
        current.id,
        sourceContext,
        nextPendency.status === 'Aberta'
            ? 'register-corrective-submission'
            : 'reanalyse-pendency'
    );
    return true;
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
                                <td>${escapeHtml(l.usuario)}</td>
                                <td><span class="badge badge-info">${escapeHtml(l.perfil)}</span></td>
                                <td><strong>${escapeHtml(l.acao)}</strong></td>
                                <td>${escapeHtml(l.detalhes)}</td>
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
                        <strong>${escapeHtml(p.name)}</strong> - ${escapeHtml(p.desc)}
                        ${p.id !== 'BASIC' ? `<button onclick="removerPrograma('${escapeHtml(p.id)}')">×</button>` : ''}
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
    const programStatuses = esc.programasIds.map(progId => getProgramVerificationStatus(escolaId, compKey, progId));
    
    // Pendências ativas vinculadas a esta competência e escola
    const pAtivasComp = pendencias.filter(p =>
        p.escolaId === escolaId
        && (p.competenciaOrigem === compKey || p.competencia === compKey)
        && window.RadarPendencias.isActivePendency(p)
    ).length;
    
    if (programStatuses.includes('inapta') || pAtivasComp > 0) {
        return 'inapta'; // Vermelho
    }
    
    if (programStatuses.length > 0 && programStatuses.every(status => status === 'apta')) {
        return 'apta'; // Verde
    }
    
    if (programStatuses.some(status => status === 'em-andamento' || status === 'apta')) {
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
    const pAtivas = pendencias.filter(p => (
        p.escolaId === esc.id
        && window.RadarPendencias.isActivePendency(p)
    ));
    const process = esc.processoInventario || 'Não registrado';

    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Unidade Escolar: ${escapeHtml(esc.denominação)} (${escapeHtml(esc.designação)})</h1>
                <p>Acompanhamento e Histórico Unificado da Unidade Escolar</p>
            </div>
            <div style="display:flex; gap:12px;">
                ${currentProfile !== 'inventario' && currentProfile !== 'sme' ? `
                    <button class="btn btn-secondary" onclick="openContatoModal('${escapeHtml(esc.id)}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        Registrar Contato
                    </button>
                    <button class="btn btn-secondary" onclick="openCobrancaModal('${escapeHtml(esc.id)}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                        Gerar Cobrança
                    </button>
                ` : ''}
                ${currentProfile === 'assistente' || currentProfile === 'controlador' ? `
                    <button class="btn btn-primary" onclick="openEscolaEditModal('${escapeHtml(esc.id)}')">Editar Dados</button>
                ` : ''}
            </div>
        </div>

        <div class="school-grid">
            <!-- Sidebar da Escola -->
            <div class="school-sidebar">
                <div class="school-info-card">
                    <div class="info-item">
                        <div class="info-label">INEP</div>
                        <div class="info-value">${escapeHtml(esc.inep)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Designação</div>

                        <div class="info-value">${escapeHtml(esc.designação)}</div>
                    </div>

                    <div class="info-item">

                        <div class="info-label">SICI</div>

                        <div class="info-value">${escapeHtml(esc.sici || 'Não informado')}</div>
                    </div>

                    <div class="info-item">

                        <div class="info-label">CNPJ</div>

                        <div class="info-value">${escapeHtml(esc.cnpj)}</div>
                    </div>

                    <div class="info-item">

                        <div class="info-label">Diretor(a)</div>

                        <div class="info-value">${escapeHtml(esc.diretor)}</div>
                    </div>

                    <div class="info-item">

                        <div class="info-label">Telefone do Diretor(a)</div>

                        <div class="info-value">${escapeHtml(esc.telefoneDiretor || 'Não informado')}</div>
                    </div>

                    <div class="info-item">

                        <div class="info-label">Diretor(a) Adjunto(a)</div>

                        <div class="info-value">${escapeHtml(esc.diretorAdjunto || 'Não informado')}</div>
                    </div>

                    <div class="info-item">

                        <div class="info-label">Telefone do Adjunto(a)</div>

                        <div class="info-value">${escapeHtml(esc.telefoneDiretorAdjunto || 'Não informado')}</div>
                    </div>

                    <div class="info-item">

                        <div class="info-label">Telefone da Unidade</div>

                        <div class="info-value">${escapeHtml(esc.telefone)}</div>
                    </div>

                    <div class="info-item">

                        <div class="info-label">Celular Institucional</div>

                        <div class="info-value">${escapeHtml(esc.telefoneCelularInstitucional || 'Não informado')}</div>
                    </div>

                    <div class="info-item">

                        <div class="info-label">Coordenadoria / RA</div>
                        <div class="info-value">${escapeHtml(esc.cre)} / ${escapeHtml(getRAFromDesignacao(esc.designação))}</div>
                    </div>

                    <div class="info-item">
                        <div class="info-label">E-mail Institucional</div>
                        <div class="info-value">${escapeHtml(esc.email)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Controlador Responsável</div>
                        <div class="info-value">${escapeHtml(ctrl ? ctrl.name : 'Não designado')}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Processo Inventário (Exercício)</div>
                        <div class="info-value">${escapeHtml(process)}</div>
                    </div>
                </div>

                <div class="school-info-card" style="background-color:rgba(157, 125, 252, 0.03)">
                    <div class="info-label" style="margin-bottom:8px;">Programas Vinculados</div>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        ${esc.programasIds.map(progId => {
                            const p = programas.find(x => x.id === progId);
                            return p ? `<span class="badge badge-info" style="justify-content:flex-start;">${escapeHtml(p.name)}</span>` : '';
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
                        <button class="tab-button" data-tab="auditoria" onclick="switchSchoolTab(event, 'tab-auditoria')">Registros Internos</button>
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
                                let clickHandler = isDisabled ? '' : `onclick="changeProntuarioCompetencia('${escapeHtml(esc.id)}', '${escapeHtml(c.key)}')"`;
                                
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
                            <button class="btn btn-secondary btn-sm" onclick="openNovaPendenciaModal('${escapeHtml(esc.id)}')">Criar Pendência Manual</button>
                        </div>
                        <div class="table-responsive">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Mês Origem</th>
                                        <th>Documento / Item</th>
                                        <th>Defeito apontado</th>
                                        <th>Quem deve agir?</th>
                                        <th>Abertura</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${pAtivas.length === 0 ? `
                                        <tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:32px;">Nenhuma pendência ativa nesta escola! Tudo regularizado.</td></tr>
                                    ` : pAtivas.map(p => {
                                        const pData = getFormattedPendencyData(p);
                                        const submissionActionLabel = getCorrectiveSubmissionActionLabel(p);
                                        const canReanalyse = canReanalysePendency(p);
                                        return `
                                            <tr
                                                data-pendency-ref="${escapeHtml(encodePendencyIdReference(p.id))}"
                                                data-pendency-status="${escapeHtml(p.status)}"
                                                tabindex="-1"
                                            >
                                                <td><span style="font-weight:600; color:var(--primary);">${escapeHtml(pData.competencia)}</span></td>
                                                <td>${escapeHtml(pData.item)}</td>
                                                <td><span style="color:var(--danger)">${escapeHtml(p.motivo)}</span><br><small style="color:var(--text-muted)">${escapeHtml(p.observacao)}</small></td>
                                                <td><span class="badge badge-info">${escapeHtml(p.responsavel)}</span></td>
                                                <td>${new Date(p.dataAbertura).toLocaleDateString('pt-BR')}</td>
                                                <td>
                                                    ${canReanalyse || submissionActionLabel ? `
                                                        <div class="pendency-actions">
                                                            ${canReanalyse ? `
                                                                <button
                                                                    type="button"
                                                                    class="btn btn-primary btn-sm"
                                                                    data-action="reanalyse-pendency"
                                                                    data-pendency-ref="${escapeHtml(encodePendencyIdReference(p.id))}"
                                                                    onclick="abrirModalReanalisarPendencia(this)"
                                                                >Reanalisar</button>
                                                            ` : ''}
                                                            ${submissionActionLabel ? `
                                                                <button
                                                                    type="button"
                                                                    class="btn ${canReanalyse ? 'btn-secondary' : 'btn-primary'} btn-sm"
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

                ${currentProfile !== 'sme' ? `
                <!-- Aba 4: Capital -->
                <div class="tab-content-panel ${currentProfile === 'inventario' ? 'active' : ''}" id="tab-capital">
                        <div class="panel-card">
                        <div class="panel-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap: wrap; gap: 10px;">
                            <div>
                                <h2>Aquisição de Bens Permanentes (Natureza de Capital)</h2>
                                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Processo de Inventário 2026: <strong>${esc.processoInventario ? escapeHtml(esc.processoInventario) : '<span style="color:var(--danger)">Não cadastrado na escola</span>'}</strong></div>
                            </div>
                            ${currentProfile !== 'inventario' ? `
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
                                                    <input type="text" class="form-control" style="width:110px; font-size:0.75rem; padding:4px;" value="${escapeHtml(b.notaFiscal)}" onchange="updateCapitalDoc('${escapeHtml(b.id)}', 'notaFiscal', this.value)" placeholder="NF-XXXX" ${currentProfile === 'inventario' || currentProfile === 'sme' ? 'disabled' : ''}>
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
                                                        <button class="btn btn-primary btn-sm" onclick="encaminharCapital('${escapeHtml(b.id)}')" ${currentProfile === 'inventario' || currentProfile === 'sme' ? 'disabled' : ''}>Encaminhar</button>
                                                    ` : (b.status === 'Encaminhada' && currentProfile === 'inventario') ? `
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

                ${currentProfile !== 'inventario' && currentProfile !== 'sme' ? `
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

                // A grade usa um estado vazio transitório; só um comando do usuário cria a verificação.
                const v = buildVerificationSnapshot(verificacoes[esc.id]?.[compProgKey]);

                // Montar a sub-linha com cada documento
                docItems.forEach((doc, idx) => {
                    const bonifValue = v.bonificacao[doc.key] || '';
                    const analiseValue = v.analise[doc.key] || 'Não analisado';
                    const isBonifLocked = (v.resultadoBonif && currentProfile !== 'assistente')
                        || currentProfile === 'inventario'
                        || currentProfile === 'sme';
                    
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
                    const isAnaliseLocked = currentProfile === 'inventario'
                        || currentProfile === 'sme'
                        || Boolean(activePend);
                    const analysisLockId = `analysis-lock-${progId}-${doc.key}`;
                    let pendStatusHTML = '';
                    if (activePend) {
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
                                ${submissionActionLabel && currentProfile !== 'inventario' ? `
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
                    } else if (resolvedPend && analiseValue === 'Não analisado') {
                        pendStatusHTML = `<span class="badge badge-success" style="font-size:0.7rem;" title="Justificativa: ${escapeHtml(resolvedPend.justificativaResolucao || resolvedPend.observacao || '')}">Resolvida - reanalisar</span>`;
                    } else if (analiseValue === 'Incorreto') {
                        pendStatusHTML = `<button class="btn btn-secondary btn-sm" data-action="open-document-pendency" onclick="openNovaPendenciaModalWithDefaults('${escapeHtml(esc.id)}', '${escapeHtml(compProgKey)}', '${escapeHtml(progName)}', '${escapeHtml(doc.key)}', '${escapeHtml(doc.name)}')" style="font-size:0.7rem; padding:2px 6px;">Abrir Pendência</button>`;
                    }

                    // Conteúdo extra para visualização de notas fiscais
                    let extraContentHTML = '';
                    if (doc.key === 'notaFiscal') {
                        const notes = notasRegistradas.filter(n => n.escolaId === esc.id && n.compKey === compProgKey);
                        
                        const notesBadges = notes.map(n => `
                            <span class="badge badge-info" style="display: inline-flex; align-items: center; margin-right: 4px; margin-bottom: 4px; padding: 4px 8px; font-size: 0.7rem; font-weight: 500;">
                                NF: ${escapeHtml(n.numero)} (R$ ${n.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})})
                                ${currentProfile !== 'inventario' && currentProfile !== 'sme' && !isBonifLocked ? `
                                    <span style="margin-left: 6px; cursor: pointer; font-weight: bold; color: var(--warning); font-size: 0.85rem;" onclick="abrirEditarNota('${escapeHtml(n.id)}', '${escapeHtml(esc.id)}')" title="Editar Nota">✎</span>
                                    <span style="margin-left: 6px; cursor: pointer; font-weight: bold; color: var(--danger); font-size: 0.85rem;" onclick="removerNotaRegistrada('${escapeHtml(n.id)}', '${escapeHtml(esc.id)}')" title="Excluir Nota">×</span>
                                ` : ''}
                            </span>
                        `).join('');
                        
                        const addBtn = window.RadarFluxoOperacional.canRegisterFiscalNote(currentProfile, bonifValue) && !isBonifLocked ? `
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
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <label style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; cursor: pointer; margin-top: 2px;">
                                            <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleConsEnviada('${escapeHtml(esc.id)}', '${escapeHtml(compProgKey)}', this.checked)" ${isBonifLocked ? 'disabled' : ''}>
                                            <span>Consultoria realmente enviada para Assessoria</span>
                                        </label>
                                    </div>
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
                                    ${bonifConsolidadoText}
                                    ${currentProfile !== 'inventario' && currentProfile !== 'sme' ? (
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
                            </td>
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

    const v = ensureProgramVerification(escolaId, compKey);

    // Regra: Não permitir alterar bonificação se o mês estiver consolidado
    if (v.resultadoBonif && currentProfile !== 'assistente') {
        alert('Esta competência já foi consolidada. Apenas o(a) Assistente de Verbas Federais pode fazer ajustes retroativos na bonificação.');
        return;
    }

    const registeredNotes = notasRegistradas.filter(nota => (
        nota.escolaId === escolaId && nota.compKey === compKey
    ));
    if (docKey === 'notaFiscal' && value === 'Não se aplica' && registeredNotes.length > 0) {
        const noteNumbers = registeredNotes.map(nota => nota.numero).join(', ');
        persist();
        alert(`Existem notas fiscais cadastradas (${noteNumbers}). Para marcar N/A, faça a exclusão individual de cada nota antes. Nenhuma nota ou bem foi excluído.`);
        renderProntuario(escolaId);
        return;
    }

    const bonificationBefore = { ...v.bonificacao };
    v.bonificacao[docKey] = value;

    // Regra Automática: Se Nota Fiscal = Não se aplica, automaticamente Encaminhado Inventário e Consulta Assessoria = Não se aplica
    if (docKey === 'notaFiscal') {
        if (value === 'Não se aplica') {
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

    reopenConsolidationForAssistant(
        escolaId,
        compKey,
        v,
        hasBonificationChanged(bonificationBefore, v.bonificacao)
    );
    persist();
    renderProntuario(escolaId);
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
function changeAnaliseTecnica(escolaId, compKey, docKey, value, selectElement = null) {
    if (currentProfile === 'inventario' || currentProfile === 'sme') return false;

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

    const v = ensureProgramVerification(escolaId, compKey);
    
    // Regra Operacional: Não permitir preencher análise técnica se a entrega do drive estiver vazia (Sim, Não, N/A)
    if (value !== 'Não analisado' && (!v.bonificacao[docKey] || v.bonificacao[docKey] === '')) {
        persist();
        alert('Você não pode alterar a análise técnica sem antes preencher o status de entrega no Drive (Sim, Não ou N/A).');
        renderProntuario(escolaId);
        return;
    }

    const fiscalNotes = notasRegistradas.filter(nota => (
        nota.escolaId === escolaId && nota.compKey === compKey
    ));
    if (docKey === 'notaFiscal' && window.RadarFluxoOperacional.shouldRequireFiscalNote({
        bonificacaoNotaFiscal: v.bonificacao.notaFiscal,
        analiseValue: value,
        fiscalNotes
    })) {
        persist();
        alert('Você declarou que há entrega de Notas Fiscais no Drive (Sim), mas não cadastrou nenhuma Nota Fiscal no sistema. Por favor, cadastre pelo menos uma Nota Fiscal antes de marcar como Correto.');
        renderProntuario(escolaId);
        openModalDadosNota(escolaId, compKey);
        return;
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
        
        // Auto seleção de um erro documental compatível com o contexto detectado.
        const defaultError = docKey === 'declBBAgil'
            ? 'Sem assinatura'
            : 'Documento ausente';
        const defaultErrorInput = Array.from(document.querySelectorAll('input[name="pend-erros"]'))
            .find(input => input.value === defaultError);
        if (defaultErrorInput) {
            defaultErrorInput.checked = true;
            syncAbsentErrorExclusivity(defaultErrorInput);
        }
        
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
    if (blockConsolidatedFiscalNoteMutation(escolaId, compKey)) {
        return;
    }

    const v = verificacoes[escolaId]?.[compKey];
    if (v && v.bonificacao && v.bonificacao['notaFiscal'] === 'Não se aplica') {
        alert('Não é possível adicionar notas fiscais para competências marcadas como "Não se aplica".');
        return;
    }
    document.getElementById('form-dados-nota').reset();
    document.getElementById('nota-escola-id').value = escolaId;
    document.getElementById('nota-comp-key').value = compKey;
    document.getElementById('nota-id').value = '';
    
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
    if (blockConsolidatedFiscalNoteMutation(escolaId, compKey)) {
        closeModal('modal-dados-nota');
        return;
    }
    if (v && v.bonificacao && v.bonificacao['notaFiscal'] === 'Não se aplica') {
        alert('Não é possível adicionar notas fiscais para competências marcadas como "Não se aplica".');
        closeModal('modal-dados-nota');
        return;
    }

    const existingNote = notaId
        ? notasRegistradas.find(nota => nota.id === notaId)
        : null;
    if (notaId && !existingNote) return;

    if (v) {
        reopenConsolidationForAssistant(escolaId, compKey, v, true);
    }
    
    const desc = document.getElementById('nota-desc').value.trim();
    const tipo = document.getElementById('nota-tipo').value;
    const numero = document.getElementById('nota-numero').value.trim();
    const valor = parseFloat(document.getElementById('nota-valor').value);
    
    const esc = escolas.find(x => x.id === escolaId);
    const splitContext = window.RadarCompetencia.splitCompetenciaContext(compKey);
    const mesKey = splitContext.competenciaKey;
    const progId = splitContext.contextId;
    
    const prog = programas.find(p => p.id === progId);
    const progName = prog ? prog.name : progId;

    if (notaId) {
        // MODO EDICAO
        const nota = existingNote;

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
                    rebuildOperationalIndexes();
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
                rebuildOperationalIndexes();
                nota.bemId = newBem.id;

                if (!hasProcesso) {
                    alert(`Aviso: O bem permanente foi registrado no inventário, mas a escola não tem Processo de Inventário cadastrado. A equipe de inventário não poderá tombá-lo até que você cadastre o processo da escola.`);
                }
            }
        } else {
            // Se mudou de permanente para outra coisa, remove do inventário
            if (oldBemId) {
                bens = bens.filter(b => b.id !== oldBemId);
                rebuildOperationalIndexes();
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
            rebuildOperationalIndexes();
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
    if (blockConsolidatedFiscalNoteMutation(escolaId, nota.compKey)) return;

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
    const v = ensureProgramVerification(escolaId, compKey);

    if (v.resultadoBonif && currentProfile !== 'assistente') {
        alert('Esta competência já foi consolidada. Apenas o(a) Assistente de Verbas Federais pode fazer ajustes retroativos.');
        renderProntuario(escolaId);
        return;
    }

    if (!v.bonificacao) {
        v.bonificacao = {};
    }
    const hasChanged = Boolean(v.bonificacao.consEnviada) !== Boolean(isChecked);
    v.bonificacao['consEnviada'] = isChecked;
    reopenConsolidationForAssistant(escolaId, compKey, v, hasChanged);

    const esc = escolas.find(x => x.id === escolaId);
    registerLog('Consulta Assessoria Enviada Toggled', `Status de consultoria enviada para ${compKey} da escola ${esc ? esc.denominação : escolaId} definido como ${isChecked}.`);
    
    persist();
    renderProntuario(escolaId);
}

function removerNotaRegistrada(notaId, escolaId) {
    if (currentProfile === 'inventario' || currentProfile === 'sme') return;
    const idx = notasRegistradas.findIndex(n => n.id === notaId);
    if (idx === -1) return;

    const nota = notasRegistradas[idx];
    if (blockConsolidatedFiscalNoteMutation(escolaId, nota.compKey)) return;
    if (!confirm('Deseja realmente remover esta nota fiscal registrada?')) return;

    if (idx !== -1) {
        const verification = verificacoes[escolaId]?.[nota.compKey];
        if (verification) {
            reopenConsolidationForAssistant(escolaId, nota.compKey, verification, true);
        }
        
        // Se a nota tiver bemId associado, remove do inventário (bens)
        if (nota.bemId) {
            bens = bens.filter(b => b.id !== nota.bemId);
            rebuildOperationalIndexes();
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
    const v = ensureProgramVerification(escolaId, compKey);
    const evaluation = window.RadarFluxoOperacional.evaluateBonification(v.bonificacao);

    if (!evaluation.canConsolidate) {
        const missingLabels = evaluation.missingFields
            .map(key => VERIFICATION_DOCUMENT_LABELS[key] || key)
            .join(', ');
        persist();
        alert(`Preencha todos os itens de bonificação antes de consolidar. Campos ausentes ou inválidos: ${missingLabels}.`);
        renderProntuario(escolaId);
        return;
    }

    const esc = escolas.find(e => e.id === escolaId);
    v.resultadoBonif = evaluation.status;
    
    registerLog('Bonificação Consolidada', `A bonificação da escola ${esc ? esc.denominação : ''} para ${compKey} foi fechada como "${evaluation.status.toUpperCase()}".`);
    
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
    
    rebuildOperationalIndexes();
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
    openNovaPendenciaModal(escolaId, false);
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
}

function saveNovaPendencia(e) {
    e.preventDefault();
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

    const now = new Date();
    const nowIso = now.toISOString();
    const user = getCurrentUser();
    let newPend;
    let logDetails;

    try {
        if (isDocumentary) {
            const errors = getSelectedPendencyErrors();
            const context = {
                escolaId,
                competenciaOrigem: comp,
                programaId,
                documentoKey,
                item
            };
            const existing = window.RadarPendencias.findActivePendency(pendencias, context);

            if (existing) {
                closeModal('modal-nova-pendencia');
                resetNovaPendenciaForm();
                openPendencyDetail(existing.id);
                showPendencyNotice('Já existe uma pendência ativa para este documento.', 'duplicate');
                return;
            }

            newPend = window.RadarPendencias.createDocumentPendency({
                id: createPendencyClientId('pend'),
                escolaId,
                competenciaOrigem: comp,
                programaId,
                documentoKey,
                item,
                errosAtuais: errors,
                observacao: obs,
                dataAbertura: nowIso.split('T')[0]
            }, {
                eventId: createPendencyClientId('evento'),
                at: nowIso,
                usuario: user.name,
                perfil: user.role
            });
            logDetails = `Pendência documental de ${item} para a escola ID ${escolaId} (${comp}, programa ${programaId}, documento ${documentoKey}). Erros: ${errors.join(', ')}.`;
        } else {
            newPend = window.RadarPendencias.normalizePendencyRecord({
                id: createPendencyClientId('pend'),
                escolaId,
                competencia: comp,
                item,
                motivo,
                responsavel: resp,
                status: 'Aberta',
                dataAbertura: nowIso.split('T')[0],
                dataResolucao: null,
                observacao: obs
            });
            const esc = escolas.find(x => x.id === escolaId);
            logDetails = `Abertura manual de pendência de ${item} para ${esc ? esc.denominação : ''} (${comp}) - Responsável: ${resp}.`;
        }
    } catch (error) {
        showPendencyNotice(error && error.message
            ? error.message
            : 'Não foi possível validar a pendência.', 'error');
        if (isDocumentary) {
            const firstErrorInput = document.querySelector('input[name="pend-erros"]');
            if (firstErrorInput) firstErrorInput.focus();
        }
        return;
    }

    pendencias.push(newPend);
    rebuildOperationalIndexes();
    registerLog('Pendência Criada', logDetails);

    persist();
    closeModal('modal-nova-pendencia');
    resetNovaPendenciaForm();

    if (sourceView === 'prontuario') {
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
        <option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>
    `).join('');

    const chkContainer = document.getElementById('edit-programas-checkboxes');
    chkContainer.innerHTML = programas.map(p => `
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
}

function saveEscolaEdit(e) {
    e.preventDefault();
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

            esc.sici = sici;

            esc.email = email;

            esc.diretor = diretor;

            esc.telefoneDiretor = telefoneDiretor;

            esc.diretorAdjunto = diretorAdjunto;

            esc.telefoneDiretorAdjunto = telefoneDiretorAdjunto;

            esc.telefone = tel;

            esc.telefoneCelularInstitucional = celularInstitucional;

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

            sici: sici,

            email: email,

            diretor: diretor,

            telefoneDiretor: telefoneDiretor,

            diretorAdjunto: diretorAdjunto,

            telefoneDiretorAdjunto: telefoneDiretorAdjunto,

            telefone: tel,

            telefoneCelularInstitucional: celularInstitucional,

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
    rebuildOperationalIndexes();
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
                                <button class="btn btn-danger btn-sm" onclick="removerControlador('${escapeHtml(c.id)}')" title="Remover controlador" ${controladores.length <= 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
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
                            ${controladores.map(ctrl => `<option value="${escapeHtml(ctrl.id)}">${escapeHtml(ctrl.name)}</option>`).join('')}
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
                                                ${controladores.map(ctrl => `
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
                ${equipeInventario.map(inv => `
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
                                <button class="btn btn-danger btn-sm" onclick="removerInventariador('${escapeHtml(inv.id)}')" title="Remover integrante" ${equipeInventario.length <= 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
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

    // Scenario 1: Verify getProgramVerificationStatus on mock/existing scenarios
    escolas.forEach(e => {
        e.programasIds.forEach(progId => {
            const compKey = activeCompetenciaKey;
            const status = getProgramVerificationStatus(e.id, compKey, progId);
            
            // Check status is valid
            assert(['apta', 'inapta', 'em-andamento', 'nao-lancado'].includes(status), 
                `Invalid status value "${status}" for school ${e.id}, program ${progId}`, 
                { schoolId: e.id, status });

            // Specific rule checks if verification object exists
            const compProgKey = `${compKey}_${progId}`;
            const v = verificacoes[e.id]?.[compProgKey];
            if (v) {
                const analiseVals = Object.values(v.analise || {});
                const temIncorreto = analiseVals.includes('Incorreto');
                
                if (v.resultadoBonif === 'inapta' || temIncorreto) {
                    assert(status === 'inapta', 
                        `Expected status to be "inapta" for school ${e.id}, program ${progId} because of inapta result or incorrect analysis.`, 
                        { v, status });
                }
                
                const analisesConcluidas = analiseVals.length > 0
                    && analiseVals.every(x => x === 'Correto' || x === 'Correto (Atrasado)')
                    && !analiseVals.includes('Não analisado');
                
                if ((v.resultadoBonif === 'apta' || analisesConcluidas) && !(v.resultadoBonif === 'inapta' || temIncorreto)) {
                    assert(status === 'apta', 
                        `Expected status to be "apta" for school ${e.id}, program ${progId} because of apta result or completed analyses.`, 
                        { v, status });
                }
            }
        });
    });

    // Scenario 2: Test getEscolasStats counts match sum of individual program statuses
    const stats = getEscolasStats(escolas, activeCompetenciaKey);
    let calculatedApto = 0;
    let calculatedInapto = 0;
    let calculatedEmAndamento = 0;
    let calculatedNaoAnalisado = 0;
    let calculatedForaEscopo = 0;

    escolas.forEach(e => {
        const hasPendencies = pendencias.some(p => p.escolaId === e.id && p.competencia === activeCompetenciaKey);
        let hasVerifications = false;
        if (verificacoes[e.id]) {
            hasVerifications = Object.keys(verificacoes[e.id]).some(k => k.startsWith(activeCompetenciaKey));
        }
        const forceInScope = hasPendencies || hasVerifications;

        if (!forceInScope && !isCompetenceInScope(e.competenciaInicial, activeCompetenciaKey)) {
            calculatedForaEscopo++;
            return;
        }

        e.programasIds.forEach(progId => {
            const progStatus = getProgramVerificationStatus(e.id, activeCompetenciaKey, progId);
            if (progStatus === 'inapta') calculatedInapto++;
            else if (progStatus === 'apta') calculatedApto++;
            else if (progStatus === 'em-andamento') calculatedEmAndamento++;
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
    await initData();
    initTheme();
    switchProfile('controlador'); // Inicia como Controlador para simular a visão principal
    
    // Executa diagnósticos de status apenas se em modo debug
    if (RADAR_DEBUG_MODE) {
        runRadarStatusDiagnostics();
    }
});
