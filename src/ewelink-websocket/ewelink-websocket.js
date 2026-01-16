module.exports = function(RED) {
    const ewelinkUtil = require('../ewelink-util/ewelink-util.js')

    function EwelinkWebsocket(config) {
        RED.nodes.createNode(this,config);
        this.name = config.name;
        this.auth = RED.nodes.getNode(config.auth);
        this.deviceId = config.deviceid;
        this.apiKey = config.apikey;

        var node = this;

        
        var ws = node.auth.getWebsocketClient().Connect.create(
            {
                appId: node.auth.getClient()?.appId || "",
                at: node.auth.getClient().at,
                region: node.auth.getClient().region,
                userApiKey: node.apiKey
            },
            (_ws) => {
                ws = _ws;
                node.log('[' + new Date() + '] - Connected to eWeLink WS: ' + ws.url);
                node.status({
                    fill: 'yellow',
                    shape: 'ring',
                    text: 'connecting'
                });
            },
            () => {
                node.log('[' + new Date() + '] - Disconnected from eWeLink WS');
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: 'disconnected'
                });
            },
            (error) => {
                node.error('[' + new Date() + '] - eWeLink WS connection error: ', error);
                node.status({
                    fill: 'red',
                    shape: 'dot',
                    text: 'on error'
                });
            },
            (_ws, message) => {
                data = message.data;
                node.log('[' + new Date() + '] - eWeLink WS message: ', JSON.stringify(data));

                // Handle the handcheck response that is indicating that the connection is established
                if (data !== undefined && JSON.stringify(data)[0] === "{" && data.config !== undefined) {
                    node.status({
                        fill: 'green',
                        shape: 'dot',
                        text: 'connected'
                    });
                    return false;
                }

                // Handle other messages
                if (
                    data                                                    // Check that we have a message
                    && JSON.stringify(data)[0] === '{'                      // Check that it is not a technical message (ping/pong)
                    && (
                        node.deviceId === ''                                // if there is no deviceId, then send all message
                        || data.deviceid === node.deviceId                  // if there is a deviceId, send message only if this deviceId correspond to the deviceId of the message
                    )
                ) {
                    node.send({payload: data});                              // send the message
                }
                return false;
            }
        );

        node.on('close', function() {
            if (ws) {
                ws.close();
                node.log('[' + new Date() + '] - eWeLink WS connection closed');
            }
        });
    }
    RED.nodes.registerType("ewelink-websocket",EwelinkWebsocket);
}


