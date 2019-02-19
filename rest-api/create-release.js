require('dotenv').config();
const cmd = require('commander');
const AuthenticationContext = require('adal-node').AuthenticationContext;
const urljoin = require('url-join');
const request = require('request');

// define command line parameters
cmd.version('0.1.0')
    .option(
        '-d, --directory <string>',
        `DIRECTORY. The name or GUID of the Azure AD containing the APP_ID.`
    )
    .option(
        '-i, --app-id <string>',
        `APP_ID. The ID (GUID) for the Application that was created in Azure AD.`
    )
    .option(
        '-k, --app-key <string>',
        `APP_KEY. The key from the Application that was created in Azure AD.`
    )
    .parse(process.argv);

// variables
const DIRECTORY = cmd.directory || process.env.DIRECTORY;
const APP_ID = cmd.appId || process.env.APP_ID;
const APP_KEY = cmd.appKey || process.env.APP_KEY;
const resource = '499b84ac-1321-427f-aa17-267ca6975798'; // hardcoded Azure DevOps Resource ID
const authority = 'https://login.microsoftonline.com/';

// log
console.log(`DIRECTORY    = "${DIRECTORY}"`);
console.log(`APP_ID       = "${APP_ID}"`);
console.log(`APP_KEY      = "${APP_KEY ? 'provided' : 'missing'}"`);
if (!DIRECTORY || !APP_ID || !APP_KEY) {
    console.error('DIRECTORY, APP_ID, and APP_KEY are required parameters.');
    process.exit(1);
}

// get an access token for the DevOps REST API
function getAccessToken() {
    return new Promise((resolve, reject) => {
        const base = urljoin(authority, DIRECTORY);
        const authenticationContext = new AuthenticationContext(base);
        authenticationContext.acquireTokenWithClientCredentials(
            resource,
            APP_ID,
            APP_KEY,
            (err, response) => {
                if (!err) {
                    resolve(response);
                } else {
                    reject(err);
                }
            }
        );
    });
}

function getProjects(token) {
    return new Promise((resolve, reject) => {
        // specify the request options, including the headers
        const options = {
            headers: {
                Authorization: `Bearer ${token}`,
                'User-Agent': `Node.js`,
                'X-TFS-FedAuthRedirect': 'Suppress'
            },
            json: true,
            url: `http://dev.azure.com/pelasne/_apis/projects?api-version=5.0`
        };

        // execute
        request.get(options, (error, response) => {
            if (
                !error &&
                response.statusCode >= 200 &&
                response.statusCode < 300
            ) {
                resolve(response.body);
            } else if (error) {
                reject(error);
            } else {
                reject(
                    new Error(
                        `${response.statusCode}: ${response.statusMessage}`
                    )
                );
            }
        });
    });
}

// startup
async function startup() {
    try {
        const token = await getAccessToken();
        const projects = await getProjects(token.accessToken);
        console.log(projects);
    } catch (error) {
        console.error(error);
    }
}
startup();
