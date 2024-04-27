var OAuthConfig = {};
var keycloakAPI = "";

async function authTest() {
    let authResult = await auth();
    if(authResult == true) {
        console.log("auth OK!");
    }
    else {
        console.log("auth FAILED!");
    }
}
authTest();

/**
 * 登入檢查
 */
async function auth() {
    OAuthConfig = await loadOAuthConfig("./data/configOAuth.json");
    let theToken = getCookie("access_token");
    let searchParams = new URL(window.location.href).searchParams;
    let thePort = OAuthConfig.port != "" ? `:${OAuthConfig.port}` : "";
    // 無token
    if (theToken == "") {
        theToken = await requestToken();
        console.log(theToken);
    }
    // 已有token 不跳轉
    let tokenVaild = await isTokenVaild(theToken);
    //let tokenVaild = false;
    if (tokenVaild == true) {
        return true;
    }
    // 無token或token驗證失敗
    else {
        return false;
    }
}

/**
 * 向keycloak伺服器請求token
 */
function requestToken() {
    return new Promise((resolve, reject) => {
        let tokenAPI = `${OAuthConfig.http}://${OAuthConfig.hostname}:${OAuthConfig.port}/${OAuthConfig.tokenEndpoint}`;
        let responseToken = "";
        let params = `grant_type=client_credentials&client_id=${OAuthConfig.client_id}&client_secret=${OAuthConfig.client_secret}`;
        let request = new XMLHttpRequest();
        request.open('POST', tokenAPI);
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        request.responseType = 'json';
        request.send(params);
        request.onload = function () {
            let result = request.response;
            console.log(result);
            responseToken = result.access_token;
            resolve(responseToken);
        }
    });
}

/**
 * 讀取cookie
 */
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    else {
        return "";
    }
}

/**
 * 叫keycloak伺服器檢查token是否正確
 */
function isTokenVaild(theToken) {
    return new Promise((resolve, reject) => {
        let tokenAuthAPI = `${OAuthConfig.http}://${OAuthConfig.hostname}:${OAuthConfig.port}/${OAuthConfig.userinfoEndpoint}`;
        let request = new XMLHttpRequest();
        request.open('GET', tokenAuthAPI);
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        request.setRequestHeader("Authorization", "Bearer " + theToken);
        request.responseType = 'json';
        request.onload = function () {
            let result = request.response;
            console.log(request.status);
            console.log(result);
            if (request.status == "200") {
                resolve(true);
            }
            else {
                resolve(false);
            }
        }
        request.send();
    });
}

/**
 * 讀取設定檔
 */
function loadOAuthConfig(url) {
    return new Promise((resolve, reject) => {
        let config = {};
        let requestURL = url;
        let request = new XMLHttpRequest();
        request.open('GET', requestURL);
        request.responseType = 'json';
        request.send();
        request.onload = function () {
            config = request.response;
            return resolve(config);
        }
    });
}