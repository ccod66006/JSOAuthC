const fs = require('fs');
const http = require('http');
const https = require('https');
const { getUserInfo } = require("../getUserInfo");

const configPath = './configOAuth.json';
const tokenEndpoint = '';

module.exports = async function(req, res, next) {
  var theToken = await getToken();
  res.send(await getUserInfo(theToken));
};

async function getToken() {
  return new Promise((resolve, reject) => {
    fs.readFile(configPath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      const config = JSON.parse(data);
      console.log(config);
      const httpModule = config.http === 'https' ? https : http;

      const postData = `client_id=${config.client_id}&scope=${config.scope}&client_secret=${config.client_secret}&grant_type=client_credentials`;
      const options = {
        hostname: config.hostname,
        port: config.port,
        path: config.tokenEndpoint,
        method: 'POST',
        headers: {
          'Accept':'*/*',
          'Content-Type': 'application/x-www-form-urlencoded',
          "Content-Length": Buffer.byteLength(postData)
        }
      };


      const req = httpModule.request(options, (res) => {
        let responseBody = '';

        res.on('data', (chunk) => {
          responseBody += chunk;
          console.log(chunk);
        });

        res.on('end', () => {
          const tokenResponse = JSON.parse(responseBody);
          console.log(tokenResponse);
          if (res.statusCode === 200) {
            resolve(tokenResponse.access_token);
          } else {
            console.log(responseBody);
            reject(new Error(`Failed to obtain token. Status code: ${res.statusCode}`));
          }
        });
      });

      req.write(postData);
      req.end();
    });
  });
}