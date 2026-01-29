module.exports = {
    isConnected: false,
    isConnecting: false,
    currentStatus: {color: "yellow", shape: "ring", text: "connecting"},
    nodeList: new Map(),
    ws: null,

    addNode (node, callback = (message) => {}) {
        console.log('[' + new Date() + '] - eWeLink WS add the node ' + node.id);
        this.nodeList.set(node.id, {node: node, callback: callback});

        if (!this.isConnected && !this.isConnecting) {
            this.connect(node);
        } else {
            this.updateCurrentNodeStatus(node);
        }
    },
    
    removeNode (node) {
        console.log('[' + new Date() + '] - eWeLink WS remove the node ' + node.id);
        this.nodeList.delete(node.id);
    },

    updateCurrentNodeStatus (node) {
        node.status({
            fill: this.currentStatus.color,
            shape: this.currentStatus.shape,
            text: this.currentStatus.text
        });
    },

    updateNodesStatus () {
        console.log('[' + new Date() + '] - eWeLink WS update status for all ' + this.nodeList.size + ' nodes');
        this.nodeList.forEach((value, nodeId) => {
            this.updateCurrentNodeStatus(value.node);
        });
    },

    connect (node) {
        this.isConnecting = true;
        this.ws = node.auth.getWebsocketClient().Connect.create(
            {
                appId: node.auth.getClient()?.appId || "",
                at: node.auth.getClient().at,
                region: node.auth.getClient().region,
                userApiKey: node.apiKey
            },
            (_ws) => {
                this.isConnecting = true;
                this.isConnected = false;
                console.log('[' + new Date() + '] - Connecting to eWeLink WS: ' + this.ws.url);
                this.currentStatus = {color: "yellow", shape: "ring", text: "connecting"};
                this.updateNodesStatus();
            },
            () => {
                this.isConnecting = false;
                this.isConnected = false;
                console.log('[' + new Date() + '] - Disconnected from eWeLink WS');
                this.currentStatus = {color: "red", shape: "ring", text: "disconnected"};
                this.updateNodesStatus();
            },
            (error) => {
                this.isConnecting = false;
                this.isConnected = false;
                node.error('[' + new Date() + '] - eWeLink WS connection error: ', error);
                this.currentStatus = {color: "red", shape: "dot", text: "on error"};
                this.updateNodesStatus();
                this.ws.close();
            },
            (_ws, message) => {
                data = message.data;
                console.log('[' + new Date() + '] - eWeLink WS message: ', data);

                // Handle the handcheck response that is indicating that the connection is established
                if (data !== undefined && data[0] === "{" && JSON.parse(data).config !== undefined) {    
                    this.isConnecting = false;
                    this.isConnected = true;
                    console.log('[' + new Date() + '] - Connected to eWeLink WS: ' + this.ws.url);
                    this.currentStatus = {color: "green", shape: "dot", text: "connected"};
                    this.updateNodesStatus();
                    return false;
                }

                // Handle other messages
                if (
                    data                                                    // Check that we have a message
                    && data[0] === '{'                                      // Check that it is not a technical message (ping/pong)
                ) {
                    console.log('[' + new Date() + '] - eWeLink WS send message to (' + this.nodeList.size + ') nodes');
                    // push to all listeners
                    this.nodeList.forEach((value, nodeId) => {
                        value.callback(message);
                    });
                }
                
                
                return false;
            }
        );
    }
}