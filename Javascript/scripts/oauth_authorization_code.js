var OAuthConfig = {};

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
    let authCode = searchParams.get("code");
    let session_state = searchParams.get("session_state");
    let thePort = OAuthConfig.port != "" ? `:${OAuthConfig.port}` : "";
    // 無token但有auth code (通常為登入後跳轉回來的情況)
    if (theToken == "" && authCode != null) {
        theToken = await requestToken(authCode, session_state);
        console.log(theToken);
    }
    // 已有token 不跳轉
    let tokenVaild = await isTokenVaild(theToken);
    //let tokenVaild = false;
    if (tokenVaild == true) {
        return true;
    }
    // 無token或token驗證失敗 轉到keycloak登入並在Callback URL帶入目前網址
    else {
        let redirectUri = removeURLParameter(window.location.href, "code");
        redirectUri = removeURLParameter(redirectUri, "session_state");
        redirectUri = removeURLParameter(redirectUri, "iss");
        let loginPage = `${OAuthConfig.http}://${OAuthConfig.hostname}:${OAuthConfig.port}/${OAuthConfig.authEndpoint}?client_id=${OAuthConfig.client_id}&grant_type=authorization_code&response_type=code&redirect_uri=${redirectUri}`;
        window.location.href = loginPage;
        return false;
    }
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
 * 使用auth code向keycloak伺服器請求token
 */
function requestToken(code, session_state) {
    return new Promise((resolve, reject) => {
        let tokenAPI = `${OAuthConfig.http}://${OAuthConfig.hostname}:${OAuthConfig.port}/${OAuthConfig.tokenEndpoint}`;
        let redirectUri = removeURLParameter(window.location.href, "code");
        redirectUri = removeURLParameter(redirectUri, "session_state");
        let responseToken = "";
        let params = `grant_type=authorization_code&client_id=${OAuthConfig.client_id}&client_secret=${OAuthConfig.client_secret}&code=${code}&session_state=${session_state}&redirect_uri=${redirectUri}`;
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

/**
 * 移除網址的某個參數
 */
function removeURLParameter(url, parameter) {
    //prefer to use l.search if you have a location/link object
    let urlparts = url.split("?");
    if (urlparts.length >= 2) {
        let prefix = encodeURIComponent(parameter) + "=";
        let pars = urlparts[1].split(/[&;]/g);

        //reverse iteration as may be destructive
        for (let i = pars.length; i-- > 0;) {
            //idiom for string.startsWith
            if (pars[i].lastIndexOf(prefix, 0) !== -1) {
                pars.splice(i, 1);
            }
        }

        return urlparts[0] + (pars.length > 0 ? "?" + pars.join("&") : "");
    }
    return url;
}