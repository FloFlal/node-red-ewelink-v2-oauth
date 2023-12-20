module.exports = function(RED) {
    const ewelinkUtil = require('../ewelink-util/ewelink-util.js')

    function EwelinkListDevices(config) {
        RED.nodes.createNode(this,config);
        this.name = config.name;
        this.auth = RED.nodes.getNode(config.auth);

        var node = this;

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }

            ewelinkUtil.handleEwelinkResponse(RED, node.auth, msg, send, client => {
                return client.device.getAllThings();
            });

            if(done) {
                done();
            }
        });
    }
    RED.nodes.registerType("ewelink-list-devices",EwelinkListDevices);
}
