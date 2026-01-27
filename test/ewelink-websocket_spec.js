const helper = require("node-red-node-test-helper");
const websocketNode = require("../src/ewelink-websocket/ewelink-websocket.js");
const authNode = require("../src/ewelink-auth/ewelink-auth.js");
const util = require("../src/ewelink-util/ewelink-util.js");
const wsUtils = require("../src/ewelink-util/ewelink-websocket-utils.js");
const sinon = require('sinon');

describe('eWeLink Websocket tests', () => {
    afterEach(() => {
        helper.unload();
    });

    it('Should be loaded', done => {
        const flow = [
            { id: 'n1', type: 'ewelink-auth' },
            { id: 'n2', type: 'ewelink-websocket', auth: 'n1', name: 'Devices Node 123' }
        ];

        // override the home.getFamily method of the client
        const connect = { create: () => { }};
        const connectStub = sinon.stub(connect, 'create').callsFake(() => {url: 'ws://testurl'});

        // override the home value of the clinet
        const clientWs = { Connect: {}, appId: 'something' };
        const clientWsStub = sinon.stub(clientWs, "Connect").value(connect);

        // override the creation of the client
        const utilStub = sinon.stub(util, 'getWssClient').callsFake(() => clientWs);
        
        // override the home value of the clinet
        const client = { at: 'at', region: 'eu', appId: 'something' };

        // override the creation of the client
        const utilStub2 = sinon.stub(util, 'genericGetClient').callsFake(() => client);

        helper.load([authNode, websocketNode], flow, () => {
            const n2 = helper.getNode('n2');

            n2.should.have.property('name', 'Devices Node 123');

            connectStub.restore();
            clientWsStub.restore();
            utilStub.restore();
            utilStub2.restore();
            done();
        })
    });

    it('Should send message from WS to the output', done => {
        const flow = [
            { id: 'n1', type: 'ewelink-auth' },
            { id: 'n2', type: 'ewelink-websocket', auth: 'n1', name: 'Devices Node 123', wires: [['n3']], status: {text: ''} },
            { id: 'n3', type: 'helper' }
        ];

        // override the home.getFamily method of the client
        const connect = { 
            onMessage: () => {},
            create: () => {},
            fakeMessage: (msg) => {
                this.onMessage(this, msg);
            }
        };
        const connectStub = sinon.stub(connect, 'create').callsFake(
            (options, onConnect, onDisconnect, onError, onMessage) => {
                this.onMessage = onMessage; 

                return {url: 'ws://testurl'}
            });

        // override the home value of the clinet
        const clientWs = { Connect: {}, appId: 'something' };
        const clientWsStub = sinon.stub(clientWs, "Connect").value(connect);
        
        // override the creation of the client
        const utilStub = sinon.stub(util, 'getWssClient').callsFake(() => {
            return clientWs;
        });

        const wsUtilsStub = sinon.stub(wsUtils, 'addNode').callsFake((node, callback) => {
            wsUtils.nodeList.set(node.id, {node: node, callback: callback});
            wsUtils.ws = clientWs;
            wsUtils.ws.Connect.create({}, () => {}, () => {}, () => {}, (ws_, msg) => {
                callback(msg);
            })
            wsUtils.isConnected = true;
        });

        helper.load([authNode, websocketNode], flow, () => {
            const n3 = helper.getNode('n3');
            const messageSent = { test: 'data' };

            let nbMessageReceived = 0;

            n3.on('input', msg => {
                msg.should.have.a.property('payload');
                msg.should.have.property('payload', messageSent);

                nbMessageReceived++;
            });

            setTimeout(() => {
                connectStub.restore();
                clientWsStub.restore();
                utilStub.restore();
                wsUtilsStub.restore();

                if (nbMessageReceived === 0) {
                    throw new Error("Should send the message on the output");
                }
                done();
            }, 1500)

            connect.fakeMessage({data: JSON.stringify(messageSent)});
        });
    });
   
    

    it('Should filter message on the device id', done => {
        const flow = [
            { id: 'n1', type: 'ewelink-auth' },
            { id: 'n2', type: 'ewelink-websocket', auth: 'n1', name: 'Devices Node 123', deviceId: '123456789', wires: [['n3']], status: {text: ''} },
            { id: 'n3', type: 'helper' }
        ];

        // override the home.getFamily method of the client
        const connect = { 
            onMessage: () => {},
            create: () => {},
            fakeMessage: (msg) => {
                this.onMessage(this, msg);
            }
        };
        const connectStub = sinon.stub(connect, 'create').callsFake(
            (options, onConnect, onDisconnect, onError, onMessage) => {
                this.onMessage = onMessage; 

                return {url: 'ws://testurl'}
            });

        // override the home value of the clinet
        const clientWs = { Connect: {}, appId: 'something' };
        const clientWsStub = sinon.stub(clientWs, "Connect").value(connect);
        
        // override the creation of the client
        const utilStub = sinon.stub(util, 'getWssClient').callsFake(() => {
            return clientWs;
        });

        const wsUtilsStub = sinon.stub(wsUtils, 'addNode').callsFake((node, callback) => {
            wsUtils.nodeList.set(node.id, {node: node, callback: callback});
            wsUtils.ws = clientWs;
            wsUtils.ws.Connect.create({}, () => {}, () => {}, () => {}, (ws_, msg) => {
                callback(msg);
            })
            wsUtils.isConnected = true;
        });

        helper.load([authNode, websocketNode], flow, () => {
            const n3 = helper.getNode('n3');
            const messageSent = { test: 'data', deviceId: '123456789' };

            let nbMessageReceived = 0;

            n3.on('input', msg => {
                msg.should.have.a.property('payload');
                msg.should.have.property('payload', messageSent);

                nbMessageReceived++;
            });

            setTimeout(() => {
                connectStub.restore();
                clientWsStub.restore();
                utilStub.restore();
                wsUtilsStub.restore();

                if (nbMessageReceived !== 1) {
                    throw new Error("Should send message only for the matching device id, sent " + nbMessageReceived + " message(s)");
                }
                done();
            }, 1500)

            connect.fakeMessage({data: JSON.stringify(messageSent)});
            
            messageSent.deviceId = '987654321';
            connect.fakeMessage({data: JSON.stringify(messageSent)});
        });
    });
    
});