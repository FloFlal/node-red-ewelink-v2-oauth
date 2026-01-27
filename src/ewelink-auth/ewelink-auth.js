module.exports = function(RED) {
    const ewelinkApi = require('ewelink-api-next').default;
    const crypto = require('crypto');
    const url = require('url');
    const ewelinkUtil = require('../ewelink-util/ewelink-util.js');
    let authNodeInstance;

    function EwelinkAuth(n) {
        RED.nodes.createNode(this,n);
        authNodeInstance = this;

        // unpack credentials
        this.displayName = n.displayName;
        this.appId = n.appid;
        this.appSecret = n.appSecret;
        this.redirectUrl = n.redirectUrl;

        this.getClient = function () {
            return ewelinkUtil.genericGetClient(this.credentials);
        }

        this.getWebsocketClient = function () {
            process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
            return ewelinkUtil.getWssClient(this.credentials);
        }
    }
        
    RED.nodes.registerType("ewelink-auth",EwelinkAuth,{

        credentials: {
            displayName: {type:"text"},
            region: {type:"text"},
            redirectUrl: {type: "text"},
            csrfToken: {type:"text"},
            appId: {type: "password"},
            appSecret: {type: "password"},
            at: {type:"password"},
            rt: {type:"password"}
        }
    });

    RED.httpAdmin.get('/ewelink-auth/auth', function(req, res){
        if (!req.query.appId || !req.query.appSecret ||
            !req.query.id || !req.query.redirectUrl) {
            res.status(400).send({
                    code: 'eWeLink.error.noparams',
                    message: 'missing parameters'
                });
            return;
        }
        const nodeId = req.query.id;
        const redirectUrl = req.query.redirectUrl;
        const credentials = {
            appId: req.query.appId,
            appSecret: req.query.appSecret
        };
        const seq = Date.now();

        // Create the authorization value as described in doc at
        // https://coolkit-technologies.github.io/eWeLink-API/#/en/OAuth2.0?id=authorization-page-description
        const csrfToken = crypto.randomBytes(18).toString('base64').replace(/\//g, '-').replace(/\+/g, '_');
        credentials.csrfToken = csrfToken;
        credentials.redirectUrl = redirectUrl;

        const buffer = Buffer.from(`${credentials.appId}_${seq}`, "utf-8");
        const authorization = crypto.createHmac("sha256", credentials.appSecret).update(buffer).digest("base64");

        let nonce = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < 8) {
          nonce += characters.charAt(Math.floor(Math.random() * charactersLength));
          counter += 1;
        }

        credentials.nonce = nonce;

        res.redirect(url.format({
            protocol: 'https',
            hostname: 'c2ccdn.coolkit.cc',
            pathname: '/oauth/index.html',
            query: {
                clientId: credentials.appId,
                seq: seq,
                authorization: authorization,
                redirectUrl: redirectUrl,
                grantType: 'authorization_code',
                state: nodeId + ":" + csrfToken,
                nonce: nonce
            }
        }));
        RED.nodes.addCredentials(nodeId, credentials);
    });

    RED.httpAdmin.get('/ewelink-auth/auth/callback', function(req, res) {
        if (req.query.error) {
            return res.status(401).send({ code: "eWeLink.error.error", message: {error: req.query.error, description: req.query.error_description}});
        }
        if(!req.query || !req.query.state || !req.query.code || !req.query.region) {
            return res.status(401).send({
                    code: 'eWeLink.error.noparams',
                    message: 'missing parameters'
                });
        }

        const state = req.query.state.split(':');
        const nodeId = state[0];

        var credentials = RED.nodes.getCredentials(nodeId);
        if (!credentials || !credentials.appId || !credentials.appSecret) {
            return res.status(401).send({
                    code: 'ewelink.error.no-credentials',
                    message: 'The node is not retreivable or there is no credentials for it'
                });
        }
        if (state[1] !== credentials.csrfToken) {
            return res.status(401).send({
                    code: 'ewelink.error.token-mismatch',
                    message: 'Incorrect token'
                });
        }

        const code = req.query.code;
        credentials.region = req.query.region;
        credentials.displayName = 'tmp';

        const client = ewelinkUtil.genericGetClient(credentials);

        delete credentials.displayName;

        client.oauth.getToken({
            region: credentials.region,
            redirectUrl: credentials.redirectUrl,
            code: code,
            grantType: 'authorization_code'
        }).then(resp => {
            if(resp.error === 0) {
                credentials.at = resp.data.accessToken;
                credentials.rt = resp.data.refreshToken;
                credentials.atExpiredTime = resp.data.atExpiredTime;
                credentials.rtExpiredTime = resp.data.rtExpiredTime;

                credentials.displayName = credentials.region + '-' + resp.data.accessToken;
                RED.nodes.addCredentials(nodeId, credentials);
                res.send('<script>window.setTimeout(window.close,5000);</script> Authorized ! The page will automatically close in 5s.');
            } else {
                return res.status(401).send({code: 'ewelink.error.api-error', message: `Could not receive tokens [${resp.error}]: ${resp.msg}`});
            }
        }).catch((error) => {
            return res.status(401).send({code: 'ewelink.error.token-mismatch', message: 'Could not receive tokens: ' + error});
        });
    });

}