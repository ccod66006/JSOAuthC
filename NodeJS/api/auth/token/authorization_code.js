const fs = require('fs');
const querystring = require("querystring");
const { getUserInfo } = require("../getUserInfo");
const configPath = './configOAuth.json';
var tokenEndpoint = '/realms/{realm}/protocol/openid-connect/token';
var authEndpoint = '/realms/{realm}/protocol/openid-connect/auth';

var config;
var https;
fs.readFile(configPath, 'utf8', (err, data) => {
    if (err) {
      reject(err);
      return;
    }
    config = JSON.parse(data);
    https = config.http === 'https' ? require('https') : require('http');
    tokenEndpoint = config.tokenEndpoint;
    authEndpoint = config.authEndpoint;
});

const serverHTTP = process.env.SERVER_HTTP || 'http'; 
const serverIP = process.env.SERVER_IP || 'localhost'; // 取得伺服器位址，預設為 localhost
const serverPort = process.env.SERVER_PORT || 3000; // 取得伺服器端口，預設為 3000

/**
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Reponse} res 
 * @param {*} next 
 * @returns 
 */
module.exports = async function (req, res, next) {
    if (req.headers["authorization"] != undefined || (req.query.access_token != undefined && req.query.access_token != "")) {
        console.log("OAUTH status: has access token");
        var theToken = "";
        // 檢查 token 是否 放在 HTTP Header 裡面的 authorization 欄位
        if (req.headers["authorization"] != undefined) {
            theToken = req.headers["authorization"];
        }
        if (req.query.access_token != undefined) {
            theToken = "" + req.query.access_token;
        }
        console.log("thetoken="+theToken);
        var userInfo = "";
        try {
            userInfo = await getUserInfo(theToken);
            // 把query放回去...
            if (req.session.oriQuery) {
                req.query = req.session.oriQuery
            }
            console.log(userInfo);
            res.send(userInfo);
        } 
        catch(e) {
            return res
                .status(500).send("token not vaild");
        }

        // 否則就回401
        return res
            .status(401);
    } else if (req.query.code != undefined) {
        // 如果有Auth code 就試試看跟OAuth請求token
        console.log("OAUTH status: has auth code");
        console.log("auth code=" + req.query.code);
        await requestOAuthToken(req, res);
        return;
    } // 如果連code都沒
    else {
        console.log("OAUTH status: missing token and auth code");
        await redirectToOAuthLoginPage(req, res);
        return;
    }
};

/**
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 */
async function requestOAuthToken(req, res) {
    // 重新導回的網址
    let theUrl = req.originalUrl;
    console.log("原網址:" + req.originalUrl);

    // 移除掉OAuth給我們的3個參數
    theUrl = removeURLParameter(
                removeURLParameter( 
                    removeURLParameter(theUrl, "session_state"),"code"),"iss");

    let postData = querystring.stringify({
        client_id: config.client_id,
        grant_type: "authorization_code",
        method: "POST",
        code: req.query.code,
        client_secret: config.client_secret,
        scope: config.scope,
        session_state: req.query.session_state,
        redirect_uri: `${serverHTTP}://${req.headers.host}${theUrl}`
    });

    const tokenOptions = {
        hostname: config.hostname,
        path:
            tokenEndpoint +
            `?session_state=${req.query.session_state}&code=${req.query.code}`,
        port: config.port,
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(postData)
        }
    };
    await new Promise((resolve) => {
        let postReq = https.request(tokenOptions, (response) => {
            let result = "";

            // 資料傳輸中
            response.on("data", function (chunk) {
                result += chunk;
            });

            // 資料傳輸結束
            response.on("end", function () {
                //有取得到token就重新來一次
                console.log(result);
                //console.log(JSON.parse(result));
                let resultObj = JSON.parse(result);
                if (resultObj["access_token"] != undefined) {
                    res.set({
                        authorization: `${resultObj["access_token"]}`
                    });
                    //console.log("利用Auth Code取得了Token=" + resultObj["access_token"]);
                    //console.log("導回網址="+ theUrl + `?access_token=${resultObj["access_token"]}`);
                    res.redirect(
                        theUrl + `?access_token=${resultObj["access_token"]}`
                    );
                }

                // 結束promise的等待
                resolve();
            });
        });

        // post the data
        postReq.write(postData);
        postReq.end();
    });
}

/**
 * 
 * @param {import("express").Request} req 
 * @param {*} res 
 */
async function redirectToOAuthLoginPage(req, res) {
    // 可能keycloak有點bug，會遺失掉放在網址的參數，我們這邊從先把query的Parameters存在session...。
    let theUrl = req.originalUrl.split("?")[0];
    console.log(
        "OAuth2轉址位址:" +
            `${serverHTTP}://${req.headers.host}${theUrl}`
    );
    console.log(req.session);
    if(req.query != undefined) {
        req.session.oriQuery = req.query;
    }

    // 導向至登入畫面...
    res.redirect(
        `${config.http}://${config.hostname}:${config.port}${authEndpoint}?client_id=${config.client_id}&grant_type=authorization_code&response_type=code&redirect_uri=${serverHTTP}://${req.headers.host}${theUrl}`
    );
}

function removeURLParameter(url, parameter) {
    //prefer to use l.search if you have a location/link object
    let urlparts = url.split("?");
    if (urlparts.length >= 2) {
        let prefix = encodeURIComponent(parameter) + "=";
        let pars = urlparts[1].split(/[&;]/g);

        //reverse iteration as may be destructive
        for (let i = pars.length; i-- > 0; ) {
            //idiom for string.startsWith
            if (pars[i].lastIndexOf(prefix, 0) !== -1) {
                pars.splice(i, 1);
            }
        }

        return urlparts[0] + (pars.length > 0 ? "?" + pars.join("&") : "");
    }
    return url;
}
