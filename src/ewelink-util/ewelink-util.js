 

module.exports = {
    wsClient: null,

    handlePromiseCall(callPromise, msg, send) {
        callPromise.then(resp => {
            if(resp.error === 0) {
                send({payload: resp.data});
            } else {
                send({payload: {
                    error: resp.error,
                    msg: resp.msg
                }});
            }
        }).catch(error => {
            send({payload: {
                error: -1,
                msg: "An error occured during the call to ewelink: " + error
            }});
        });
    },

	handleEwelinkResponse(RED, nodeAuth, msg, send, callback) {
		const client = nodeAuth.getClient();
        
        if(client && client.appId) {

            const currentTime = (new Date()).getTime();

            if (client.atExpiredTime <= currentTime) {
                // it is time to renew at and rt
                client.user.refreshToken({rt: client.rt}).then(resp => {
                    if(resp.error === 0) {
                        // save access token and refresh token in the node credentials
                        nodeAuth.credentials.at = resp.data.at;
                        nodeAuth.credentials.rt = resp.data.rt;

                        // if we have expriation time save it, otherwise set to 30 days for at and 60 days for rt
                        nodeAuth.credentials.atExpiredTime = resp.data?.atExpiredTime || currentTime + (24*60*60*1000*29);
                        nodeAuth.credentials.rtExpiredTime = resp.data.rtExpiredTime || currentTime + (24*60*60*1000*59);

                        RED.nodes.addCredentials(nodeAuth.id, nodeAuth.credentials);

                        client.at = nodeAuth.credentials.at;
                        client.rt = nodeAuth.credentials.rt;
                        client.atExpiredTime = nodeAuth.credentials.atExpiredTime;

                        const callPromise = callback(client);
                        this.handlePromiseCall(callPromise, msg, send);
                    } else {
                        console.log("Error during refresh of the token with code [" + resp.error + "]: " + resp.msg);
                    }
                }).catch(error => {
                    console.log("Error during refresh of the token: " + error);
                });
            } else {
                const callPromise = callback(client);
                this.handlePromiseCall(callPromise, msg, send);
            }
        } else {
            send({payload: {
                error: -2,
                msg: "There is an error to retreive the client to call eWeLink !"
            }});
        }
	},

    getWssClient(credentials) {
        console.log('Get WS client');
        const ewelinkApi = require('ewelink-api-next').default;

        if (this.wsClient || this.wsClient === null) {
            this.wsClient = new ewelinkApi.Ws({
                appId: credentials.appId,
                appSecret: credentials.appSecret,
                region: credentials.region
            });
        }

        return this.wsClient;
    },
    
    getBasicClient(credentials) {
        const ewelinkApi = require('ewelink-api-next').default;

        return new ewelinkApi.WebAPI({
            appId: credentials.appId,
            appSecret: credentials.appSecret,
            region: credentials.region,
            logObj: ewelinkApi.createLogger(credentials.region)
        });
    },

	genericGetClient (credentials) {
        if(credentials.displayName) {
            const client = this.getBasicClient(credentials);

            client.at = credentials.at;
            client.rt = credentials.rt;
            client.atExpiredTime = credentials.atExpiredTime;
            client.rtExpiredTime = credentials.rtExpiredTime;

            return client;
        } else {
            return {};
        }
    }
}
