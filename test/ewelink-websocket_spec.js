const helper = require("node-red-node-test-helper");
const websocketNode = require("../src/ewelink-websocket/ewelink-websocket.js");
const authNode = require("../src/ewelink-auth/ewelink-auth.js");
const util = require("../src/ewelink-util/ewelink-util.js");
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

    it('Should handle handcheck: no output message and status connected', done => {
        const flow = [
            { id: 'n1', type: 'ewelink-auth' },
            { id: 'n2', type: 'ewelink-websocket', auth: 'n1', name: 'Devices Node 123', wires: [['n3']], status: {text: ''} },
    		{ id: 'n3', type: 'helper' }
        ];

        // override the home.getFamily method of the client
        const connect = { 
            onMessage: () => {},
            create: (options, onConnect, onDisconnect, onError, onMessage) => {
                this.onMessage = onMessage;
            },
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
        const utilStub = sinon.stub(util, 'getWssClient').callsFake(() => clientWs);
        
        // override the home value of the clinet
        const client = { at: 'at', region: 'eu', appId: 'something' };

        // override the creation of the client
        const utilStub2 = sinon.stub(util, 'genericGetClient').callsFake(() => client);


        helper.load([authNode, websocketNode], flow, () => {
            const n3 = helper.getNode('n3');
            const messageSent = {data:{config: 'config' }};
            
            n3.on('intput', msg => {
                msg.should.not.have.a.property('payload');
            });

            connect.fakeMessage(messageSent);

            setTimeout(() => {
                connectStub.restore();
                clientWsStub.restore();
                utilStub.restore();
                utilStub2.restore();
                done();
            }, 
            1000);
        })
    });

    it('Should filter not object messages (ping/pong)', done => {
        const flow = [
            { id: 'n1', type: 'ewelink-auth' },
            { id: 'n2', type: 'ewelink-websocket', auth: 'n1', wires:[['n3']], name: 'Devices Node 123', deviceId: '' },
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
        const utilStub = sinon.stub(util, 'getWssClient').callsFake(() => clientWs);
        
        // override the home value of the clinet
        const client = { at: 'at', region: 'eu', appId: 'something' };

        // override the creation of the client
        const utilStub2 = sinon.stub(util, 'genericGetClient').callsFake(() => client);

        helper.load([authNode, websocketNode], flow, () => {
            const n3 = helper.getNode('n3');
            const messageSent = 'pong';

            n3.on('input', msg => {
                msg.should.not.have.a.property('payload');
            });

            connect.fakeMessage({data: messageSent});

            setTimeout(() => {
                connectStub.restore();
                clientWsStub.restore();
                utilStub.restore();
                utilStub2.restore();
                done();
            }, 1000);

        })
    });

    it('Should send message from WS to the output', done => {
        const flow = [
            { id: 'n1', type: 'ewelink-auth' },
            { id: 'n2', type: 'ewelink-websocket', auth: 'n1', wires:[['n3']], name: 'Devices Node 123', deviceId: '' },
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
        const utilStub = sinon.stub(util, 'getWssClient').callsFake(() => clientWs);
        
        // override the home value of the clinet
        const client = { at: 'at', region: 'eu', appId: 'something' };

        // override the creation of the client
        const utilStub2 = sinon.stub(util, 'genericGetClient').callsFake(() => client);

        helper.load([authNode, websocketNode], flow, () => {
            const n3 = helper.getNode('n3');
            const messageSent = { test: 'data' };

            n3.on('input', msg => {
                msg.should.have.a.property('payload');
				msg.should.have.property('payload', messageSent);
                
                connectStub.restore();
                clientWsStub.restore();
                utilStub.restore();
                utilStub2.restore();
                done();
            });

            connect.fakeMessage({data: messageSent});

        })
    });

    

    it('Should handle disconnection', done => {
        const flow = [
            { id: 'n1', type: 'ewelink-auth' },
            { id: 'n2', type: 'ewelink-websocket', auth: 'n1', wires:[['n3']], name: 'Devices Node 123', deviceId: '' },
    		{ id: 'n3', type: 'helper' }
        ];

        // override the home.getFamily method of the client
        const connect = { 
            onDisconnect: () => {},
            create: () => {},
            disconnect: () => {
                this.onDisconnect();
            }
        };
        const connectStub = sinon.stub(connect, 'create').callsFake(
            (options, onConnect, onDisconnect, onError, onMessage) => {
                this.onDisconnect = onDisconnect; 

                return {url: 'ws://testurl'}
            });

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
            const n3 = helper.getNode('n3');
            const messageSent = 'pong';

            n3.on('input', msg => {
                msg.should.not.have.a.property('payload');
            });

            connect.disconnect();

            setTimeout(() => {
                connectStub.restore();
                clientWsStub.restore();
                utilStub.restore();
                utilStub2.restore();
                done();
            }, 1000);

        })
    });

    
    it('Should handle connect', done => {
        const flow = [
            { id: 'n1', type: 'ewelink-auth' },
            { id: 'n2', type: 'ewelink-websocket', auth: 'n1', wires:[['n3']], name: 'Devices Node 123', deviceId: '' },
    		{ id: 'n3', type: 'helper' }
        ];

        // override the home.getFamily method of the client
        const connect = { 
            onError: () => {},
            create: () => {},
            connect: () => {
                this.onConnect(this);
            }
        };
        const connectStub = sinon.stub(connect, 'create').callsFake(
            (options, onConnect, onDisconnect, onError, onMessage) => {
                this.onConnect = onConnect; 
                this.url = 'ws://testurl';
                return this;
            });

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
            const n3 = helper.getNode('n3');
            const messageSent = 'pong';

            n3.on('input', msg => {
                msg.should.not.have.a.property('payload');
            });

            connect.connect();

            setTimeout(() => {
                connectStub.restore();
                clientWsStub.restore();
                utilStub.restore();
                utilStub2.restore();
                done();
            }, 1000);

        })
    });
    

    it('Should handle errors', done => {
        const flow = [
            { id: 'n1', type: 'ewelink-auth' },
            { id: 'n2', type: 'ewelink-websocket', auth: 'n1', wires:[['n3']], name: 'Devices Node 123', deviceId: '' },
    		{ id: 'n3', type: 'helper' }
        ];

        // override the home.getFamily method of the client
        const connect = { 
            onError: () => {},
            create: () => {},
            error: (err) => {
                this.onError(err);
            }
        };
        const connectStub = sinon.stub(connect, 'create').callsFake(
            (options, onConnect, onDisconnect, onError, onMessage) => {
                this.onError = onError; 

                return {url: 'ws://testurl'}
            });

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
            const n3 = helper.getNode('n3');
            const messageSent = 'pong';

            n3.on('input', msg => {
                msg.should.not.have.a.property('payload');
            });

            connect.error('error');

            n2.on('error', msg => {
                msg.should.equals('error');
            });

            setTimeout(() => {
                connectStub.restore();
                clientWsStub.restore();
                utilStub.restore();
                utilStub2.restore();
                done();
            }, 1000);

        })
    });
});