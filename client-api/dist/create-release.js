"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// includes
const devops = __importStar(require("azure-devops-node-api"));
const cmd = require("commander");
const dotenv = require("dotenv");
const winston = __importStar(require("winston"));
// set env
dotenv.config();
// define options
cmd.option('-l, --log-level <s>', 'LOG_LEVEL. The minimum level to log (error, warn, info, verbose, debug, silly). Defaults to "info".', /^(error|warn|info|verbose|debug|silly)$/i)
    .option('-o, --organization <i>', '[REQUIRED] ORGANIZATION. The URL for the organization (ex. https://dev.azure.com/org).', parseInt)
    .option('-t, --access-token <i>', '[REQUIRED] ACCESS_TOKEN. The Personal Access Token for an account that has access.', parseInt)
    .parse(process.argv);
// globals
const LOG_LEVEL = cmd.logLevel || process.env.LOG_LEVEL || 'info';
const ORGANIZATION = cmd.organization || process.env.ORGANIZATION;
const ACCESS_TOKEN = cmd.accessToken || process.env.ACCESS_TOKEN;
// start logging
const logColors = {
    debug: '\x1b[32m',
    error: '\x1b[31m',
    info: '',
    silly: '\x1b[32m',
    verbose: '\x1b[32m',
    warn: '\x1b[33m' // yellow
};
const transport = new winston.transports.Console({
    format: winston.format.combine(winston.format.timestamp(), winston.format.printf(event => {
        const color = logColors[event.level] || '';
        const level = event.level.padStart(7);
        return `${event.timestamp} ${color}${level}\x1b[0m: ${event.message}`;
    }))
});
const logger = winston.createLogger({
    level: LOG_LEVEL,
    transports: [transport]
});
async function setup() {
    try {
        // log settings
        console.log(`LOG_LEVEL is "${LOG_LEVEL}".`);
        logger.info(`ORGANIZATION is "${ORGANIZATION}".`);
        logger.info(`ACCESS_TOKEN is "${ACCESS_TOKEN ? 'provided' : 'missing'}".`);
        const authHandler = devops.getPersonalAccessTokenHandler(ACCESS_TOKEN);
        const connection = new devops.WebApi(ORGANIZATION, authHandler);
        const release = await connection.getReleaseApi();
        const results = await release.getReleaseDefinitions('vdc');
        for (const defin of results) {
            console.log(`${defin.name} (${defin.id})`);
        }
    }
    catch (error) {
        logger.error(error.stack);
    }
}
// run setup
setup();
