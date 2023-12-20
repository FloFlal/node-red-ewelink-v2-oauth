module.exports = function(RED) {
    const ewelinkUtil = require('../ewelink-util/ewelink-util.js')

    function EwelinkSetStatus(config) {
        RED.nodes.createNode(this,config);
        this.name = config.name;
        this.auth = RED.nodes.getNode(config.auth);
        this.deviceId = config.deviceid;
        this.deviceidType = config.deviceidType;
        this.params = config.params;
        this.paramsType = config.paramsType;

        var node = this;

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }

                ewelinkUtil.handleEwelinkResponse(RED, node.auth, msg, send, client => {
                    // handle the retreive of the params to set      
                    let paramsValue = RED.util.evaluateNodeProperty(node.params, node.paramsType, node, msg);
                    if (typeof paramsValue === "string") {
                        paramsValue = JSON.parse(paramsValue);
                    }

                    // handle the retreive of the device Id to trigger
                    const deviceIdValue = RED.util.evaluateNodeProperty(node.deviceId, node.deviceidType, node, msg);

                    // return the promise of the call to the api
                    return client.device.setThingStatus({id: deviceIdValue,params: paramsValue})
                });

                

            if(done) {
                done();
            }
        });
    }
    RED.nodes.registerType("ewelink-set-status",EwelinkSetStatus);
}
