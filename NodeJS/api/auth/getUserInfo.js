const fs = require('fs');
const http = require('http');
const https = require('https');

const configPath = './configOAuth.json';
var userinfoEndpoint = '/realms/{realm}/protocol/openid-connect/userinfo';
module.exports.getUserInfo = async function(token) {
    return new Promise((resolve, reject) => {
      fs.readFile(configPath, 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }
  
        const config = JSON.parse(data);
        userinfoEndpoint = config.userinfoEndpoint;
        const httpModule = config.http === 'https' ? https : http;
  
        const options = {
          hostname: config.hostname,
          port: config.port,
          path: userinfoEndpoint,
          method: 'GET',
          headers: {
            client_id: config.client_id,
            Authorization: `Bearer ${token}`
          }
        };
  
        const req = httpModule.request(options, (res) => {
          let responseBody = '';
  
          res.on('data', (chunk) => {
            responseBody += chunk;
          });
  
          res.on('end', () => {
            if (res.statusCode === 200) {
              const userInfo = JSON.parse(responseBody);
              resolve(userInfo);
            } else {
              console.log(`Failed to fetch user info. Status code: ${res.statusCode}`);
              console.log(responseBody);
              reject(new Error(`Failed to fetch user info. Status code: ${res.statusCode}`));
            }
          });
        });
  
        req.on('error', (err) => {
          reject(err);
        });
  
        req.end();
      });
    });
  }