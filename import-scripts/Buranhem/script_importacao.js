const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');

const THINGSBOARD_URL = '';

const DEVICE_FUNDO_TOKEN = '';
const DEVICE_SUPERFICIE_TOKEN = '';

const ROOT_FOLDER = './campanhas';

const rejectedRows = [];

function parseNumber(value) {

    if (value === undefined || value === null || value === '') {
        return null;
    }

    return Number(
        String(value)
            .trim()
            .replace(',', '.')
    );
}

function parseDate(dateString) {

    const [datePart, timePart] = dateString.split(' ');

    const [day, month, year] = datePart
        .split('.')
        .map(Number);

    const fullYear = year < 70
        ? 2000 + year
        : 1900 + year;

    const [hour, minute, second] = timePart
        .split(':')
        .map(Number);

    return new Date(
        fullYear,
        month - 1,
        day,
        hour,
        minute,
        second
    ).getTime();
}

function validateBottomRecord(row) {

    const temperature = parseNumber(row.temperature);
    const depth = parseNumber(row.depth);
    const salinity = parseNumber(row['salinity-psu']);

    if (salinity <= 0) {
        return 'Salinidade igual ou menor que zero';
    }

    if (temperature < 15 || temperature > 40) {
        return 'Temperatura fora da faixa';
    }

    if (depth < -1 || depth > 100) {
        return 'Profundidade fora da faixa';
    }

    return null;
}

function validateSurfaceRecord(row) {

    const temperature = parseNumber(row.temperature);
    const salinity = parseNumber(row['salinity-psu']);

    if (salinity <= 0) {
        return 'Salinidade igual ou menor que zero';
    }

    if (temperature < 15 || temperature > 40) {
        return 'Temperatura fora da faixa';
    }

    return null;
}

async function sendTelemetry(token, telemetry) {

    if (!telemetry.length) {
        return;
    }

    await axios.post(
        `${THINGSBOARD_URL}/api/v1/${token}/telemetry`,
        telemetry,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
}

async function processBottomFile(filePath) {

    return new Promise((resolve, reject) => {

        const telemetry = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', row => {

                const validationError =
                    validateBottomRecord(row);

                if (validationError) {

                    rejectedRows.push({
                        file: filePath,
                        timestamp: row.timestamp,
                        reason: validationError,
                        data: row
                    });

                    return;
                }

                telemetry.push({
                    ts: parseDate(row.timestamp),
                    values: {
                        temperature:
                            parseNumber(row.temperature),

                        depth:
                            parseNumber(row.depth),

                        salinity_psu:
                            parseNumber(
                                row['salinity-psu']
                            )
                    }
                });

            })
            .on('end', async () => {

                try {

                    await sendTelemetry(
                        DEVICE_FUNDO_TOKEN,
                        telemetry
                    );

                    console.log(
                        `FUNDO -> ${filePath} -> ${telemetry.length} registros`
                    );

                    resolve();

                } catch (err) {
                    reject(err);
                }

            });

    });
}

async function processSurfaceFile(filePath) {

    return new Promise((resolve, reject) => {

        const telemetry = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', row => {

                const validationError =
                    validateSurfaceRecord(row);

                if (validationError) {

                    rejectedRows.push({
                        file: filePath,
                        timestamp: row.timestamp,
                        reason: validationError,
                        data: row
                    });

                    return;
                }

                telemetry.push({
                    ts: parseDate(row.timestamp),
                    values: {

                        temperature:
                            parseNumber(
                                row.temperature
                            ),

                        salinity_psu:
                            parseNumber(
                                row['salinity-psu']
                            )

                    }
                });

            })
            .on('end', async () => {

                try {

                    await sendTelemetry(
                        DEVICE_SUPERFICIE_TOKEN,
                        telemetry
                    );

                    console.log(
                        `SUPERFICIE -> ${filePath} -> ${telemetry.length} registros`
                    );

                    resolve();

                } catch (err) {
                    reject(err);
                }

            });

    });
}

async function walkDirectory(directory) {

    const items =
        fs.readdirSync(directory, {
            withFileTypes: true
        });

    for (const item of items) {

        const fullPath =
            path.join(directory, item.name);

        if (item.isDirectory()) {

            await walkDirectory(fullPath);

            continue;
        }

        const fileName =
            item.name.toLowerCase();

        if (fileName === 'fundo.csv') {

            await processBottomFile(
                fullPath
            );
        }

        if (
            fileName ===
            'superficie.csv'
        ) {

            await processSurfaceFile(
                fullPath
            );
        }
    }
}

async function saveRejectLog() {

    const output = {
        generatedAt:
            new Date().toISOString(),

        rejectedCount:
            rejectedRows.length,

        records:
            rejectedRows
    };

    fs.writeFileSync(
        'rejected-data.json',
        JSON.stringify(
            output,
            null,
            2
        )
    );

    console.log(
        `Log salvo: ${rejectedRows.length} registros rejeitados`
    );
}

async function main() {

    try {

        await walkDirectory(
            ROOT_FOLDER
        );

        await saveRejectLog();

        console.log(
            'Importação finalizada.'
        );

    } catch (err) {

        console.error(
            'Erro na importação:',
            err.message
        );
    }
}

main(); 
