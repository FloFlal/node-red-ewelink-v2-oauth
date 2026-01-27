module.exports = function(RED) {
    const ewelinkWebsocketUtil = require('../ewelink-util/ewelink-websocket-utils.js');

    function EwelinkWebsocket(config) {
        RED.nodes.createNode(this,config);
        this.name = config.name;
        this.auth = RED.nodes.getNode(config.auth);
        this.deviceId = config.deviceid;
        this.apiKey = config.apikey;

        var node = this;

        ewelinkWebsocketUtil.addNode(node, (message) => {
                data = message.data;
                
                // Filter messages if needed
                if (
                    data                                                    // Check that we have data
                    && (
                        node.deviceId === ''                                // if there is no deviceId, then send all message
                        || JSON.parse(data).deviceid === node.deviceId      // if there is a deviceId, send message only if this deviceId correspond to the deviceId of the message
                    )
                ) {
                    node.send({payload: JSON.parse(data)});                 // send the message
                }
        });

        node.on('close', function() {
            ewelinkWebsocketUtil.removeNode(node);
        });
    }
    RED.nodes.registerType("ewelink-websocket",EwelinkWebsocket);
}


