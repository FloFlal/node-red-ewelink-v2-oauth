module.exports = function(RED) {
    const ewelinkUtil = require('../ewelink-util/ewelink-util.js')
    
    function EwelinkStatusDevices(config) {
        RED.nodes.createNode(this,config);
        this.name = config.name;
        this.auth = RED.nodes.getNode(config.auth);
        this.deviceId = config.deviceid;
        this.deviceidType = config.deviceidType;

        var node = this;

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }

            ewelinkUtil.handleEwelinkResponse(RED, node.auth, msg, send, client => {
                // handle the retreive of the device Id to trigger
                const deviceIdValue = RED.util.evaluateNodeProperty(node.deviceId, node.deviceidType, node, msg);
                
                return client.device.getThingStatus({id: deviceIdValue});
            });

            if(done) {
                done();
            }
        });
    }
    RED.nodes.registerType("ewelink-status-device",EwelinkStatusDevices);
}
