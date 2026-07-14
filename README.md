# ThingsBoard CSV Import Tools

Scripts em **Node.js** para importação de dados históricos de telemetria para o **ThingsBoard Community Edition (CE)**.

O projeto foi desenvolvido para facilitar a migração de dados coletados por diferentes dispositivos de monitoramento ambiental, realizando validações de qualidade antes do envio da telemetria para o ThingsBoard.

## Funcionalidades

* Importação de arquivos CSV para dispositivos do ThingsBoard.
* Conversão automática de diferentes formatos de data.
* Conversão de números com vírgula decimal.
* Envio de telemetria utilizando a API HTTP do ThingsBoard.
* Validação dos dados antes da importação.
* Geração de log com registros rejeitados.
* Geração de relatório CSV contendo estatísticas da importação.
* Suporte a campanhas compostas por múltiplas pastas.

---

## Estrutura do projeto

```text
project/
│
├── campanhas/
│   ├── campanha_01/
│   │   ├── fundo.csv
│   │   └── superficie.csv
│   │
│   ├── campanha_02/
│   │   ├── fundo.csv
│   │   └── superficie.csv
│   │
│   └── ...
│
├── scripts/
│   ├── import-miniCTD.js
│   ├── import-ph-tds.js
│   └── ...
│
├── rejected-data.json
├── campaign-report.csv
└── README.md
```

---

# Requisitos

* Node.js 18 ou superior
* ThingsBoard Community Edition
* Dispositivos previamente cadastrados no ThingsBoard

---

# Instalação

Clone o repositório:

```bash
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
```

Instale as dependências:

```bash
npm install
```

Dependências utilizadas:

```bash
npm install axios csv-parser
```

---

# Configuração

Edite os scripts informando:

```javascript
const THINGSBOARD_URL = 'http://localhost:8080';

const DEVICE_TOKEN = 'SEU_TOKEN';
```

ou, para campanhas com dois dispositivos:

```javascript
const DEVICE_FUNDO_TOKEN = 'TOKEN_FUNDO';

const DEVICE_SUPERFICIE_TOKEN = 'TOKEN_SUPERFICIE';
```

---

# Formatos de CSV suportados

## miniCTD - Fundo

```csv
timestamp,temperature,depth,salinity-psu
28.12.15 13:00:00,"32,5","-0,13",0
28.12.15 13:10:00,"30,77","-0,04",0
28.12.15 13:20:00,"31,33","0,01","11,43"
```

---

## miniCTD - Superfície

```csv
timestamp,temperature,salinity-psu
28.12.15 13:00:00,"30,67",0
28.12.15 13:10:00,"32,08",0
28.12.15 13:20:00,"34,07",0
```

---

## Sensor pH / TDS

```csv
timestamp,temperature,ph,tds
2025-06-11T18:58:51+00:00,25.31,8.79,1158.72
2025-06-11T19:28:51+00:00,25.50,0.00,1158.91
```

---

# Validações implementadas

## Validação por faixa

### Temperatura

* mínima: 15 °C
* máxima: 40 °C

### pH

* maior que 0
* menor ou igual a 14

### Salinidade

* maior que 0 PSU

### TDS

* maior que 0

### Profundidade

* intervalo configurável (padrão: -1 m a 100 m)

---

# Validação temporal

Os scripts também realizam verificações entre leituras consecutivas.

## Temperatura

Rejeita variações superiores a **3 °C** entre duas medições consecutivas.

---

## Salinidade

Rejeita variações superiores a **5 PSU** em um intervalo de até **15 minutos**.

---

## pH

Rejeita variações superiores a **2 unidades** entre leituras consecutivas.

---

## TDS

Rejeita variações superiores a **500 ppm** entre leituras consecutivas.

---

# Estabilização do sensor

Os scripts podem identificar o período inicial de estabilização dos sensores e descartar leituras inconsistentes antes do início efetivo da campanha.

Essa funcionalidade é especialmente útil para sensores CTD e sondas multiparâmetro durante a etapa de imersão.

---

# Arquivos gerados

## rejected-data.json

Contém todas as leituras rejeitadas durante a importação.

Exemplo:

```json
{
  "timestamp":"2025-06-11T19:28:51+00:00",
  "reason":"pH inválido",
  "data":{
    ...
  }
}
```

---

## campaign-report.csv

Resumo da importação.

Exemplo:

```csv
campanha,validos,invalidos
Campanha_01,238,17
Campanha_02,311,6
```

---

# Fluxo de processamento

```text
CSV
   │
   ▼
Leitura
   │
   ▼
Conversão de datas
   │
   ▼
Conversão numérica
   │
   ▼
Validação física
   │
   ▼
Validação temporal
   │
   ▼
Geração de log
   │
   ▼
Envio para o ThingsBoard
```

---

# Tecnologias utilizadas

* Node.js
* Axios
* csv-parser
* ThingsBoard Community Edition
* REST API

---

# Casos de uso

O projeto foi desenvolvido para importação de séries históricas de monitoramento ambiental, incluindo:

* qualidade da água;
* monitoramento estuarino;
* monitoramento costeiro;
* campanhas oceanográficas;
* sensores multiparâmetro;
* dispositivos CTD (Conductivity, Temperature and Depth);
* sensores de pH, temperatura e TDS.

---

# Licença

Este projeto está disponível sob a licença MIT. Sinta-se à vontade para utilizar, modificar e contribuir.
