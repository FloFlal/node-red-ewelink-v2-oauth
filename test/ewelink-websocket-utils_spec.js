const helper = require("node-red-node-test-helper");
const authNode = require("../src/ewelink-auth/ewelink-auth.js");
const homeNode = require("../src/ewelink-home/ewelink-home.js");
const wsUtils = require("../src/ewelink-util/ewelink-websocket-utils.js");
const util = require("../src/ewelink-util/ewelink-util.js");
const sinon = require('sinon');

describe('eWeLink Websocket Utils tests', () => {
    beforeEach(() => {
        wsUtils.isConnected = false;
        wsUtils.isConnecting = false;
    });

    afterEach(() => {
        helper.unload();
    });

    it('Should add node in the list', done => {
		const flow = [
	      { id: 'n1', type: 'ewelink-auth' },
          { id: 'n2', type: 'helper' }
	    ];    

        helper.load([authNode], flow, () => {
            const n2 = helper.getNode('n2');

            wsUtils.isConnected = true;

            wsUtils.addNode(n2, (message) => {});
            
            if(!wsUtils.nodeList.has(n2.id)){
                throw new Error("The node was not added to the list");
            }

            done();
        });
    });

    it('Should remove node from the list', done => {
    
		const flow = [
	      { id: 'n1', type: 'ewelink-auth' },
          { id: 'n2', type: 'helper' }
	    ];    

        helper.load([authNode], flow, () => {
            const n2 = helper.getNode('n2');

            wsUtils.isConnected = true;

            wsUtils.addNode(n2, (message) => {});
            
            if(!wsUtils.nodeList.has(n2.id)){
                throw new Error("The node was not added to the list");
            }

            wsUtils.removeNode(n2);
            
            if(wsUtils.nodeList.has(n2.id)){
                throw new Error("The node was not removed from the list");
            }

            done();
        });
    });

    it('Should create a ws on 1st node addition', done => {
        // override the creation of the client
        const utilStub = sinon.stub(wsUtils, 'connect').callsFake(() => {});

		const flow = [
	      { id: 'n1', type: 'ewelink-auth' },
          { id: 'n2', type: 'helper' }
	    ];    

        helper.load([authNode], flow, () => {
            const n2 = helper.getNode('n2');

            wsUtils.addNode(n2, (message) => {});
            
            if(utilStub.calledOnce !== true){
                throw new Error("The addition of the 1st node did not create the WS connection");
            }

            utilStub.restore();
            done();
        });
    
    });


    it('Should not send technical messages (handcheck or ping/pong)', done => {
        const flow = [
            { id: 'n1', type: 'ewelink-auth' },
            { id: 'n2', type: 'ewelink-home', auth: 'n1', wires:[['n3']] },
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

        helper.load([authNode, homeNode], flow, () => {
            const n2 = helper.getNode('n2');
            
            wsUtils.addNode(n2, (message) => {
                n2.send({payload: JSON.parse(message.data)})
            });

            const n3 = helper.getNode('n3');
            const messageSent = { test: 'data' };

            n3.on('input', msg => {
                throw new Error("A technical message was sent to the node");
            });

            connect.fakeMessage({data: JSON.stringify({config: "technical message"})});
            connect.fakeMessage("pong");

            
            setTimeout(() => {
                connectStub.restore();
                clientWsStub.restore();
                utilStub.restore();
                done();
            }, 1500);
                
        })
    });

    it('Should send data to the node in the list', done => {
        const flow = [
            { id: 'n1', type: 'ewelink-auth' },
            { id: 'n2', type: 'ewelink-home', auth: 'n1', wires:[['n3']] },
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

        helper.load([authNode, homeNode], flow, () => {
            const n2 = helper.getNode('n2');
            
            wsUtils.addNode(n2, (message) => {
                n2.send({payload: JSON.parse(message.data)})
            });

            const n3 = helper.getNode('n3');
            const messageSent = { test: 'data' };

            n3.on('input', msg => {
                msg.should.have.a.property('payload');
                msg.should.have.property('payload', messageSent);
                
                connectStub.restore();
                clientWsStub.restore();
                utilStub.restore();
                done();
            });

            connect.fakeMessage({data: JSON.stringify(messageSent)});

        })
    });

    it('Should send data to all nodes in the list', done => {
        const flow = [
            { id: 'n1', type: 'ewelink-auth' },
            { id: 'n2', type: 'ewelink-home', auth: 'n1', wires:[['n3']] },
            { id: 'n3', type: 'helper' },
            { id: 'n4', type: 'ewelink-home', auth: 'n1', wires:[['n3']] },
            { id: 'n5', type: 'ewelink-home', auth: 'n1', wires:[['n3']] },
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

        helper.load([authNode, homeNode], flow, () => {
            const n2 = helper.getNode('n2');
            
            wsUtils.addNode(n2, (message) => {
                n2.send({payload: JSON.parse(message.data)})
            });

            const n4 = helper.getNode('n4');
            
            wsUtils.addNode(n4, (message) => {
                n4.send({payload: JSON.parse(message.data)})
            });

            const n5 = helper.getNode('n5');
            
            wsUtils.addNode(n5, (message) => {
                n5.send({payload: JSON.parse(message.data)})
            });

            const n3 = helper.getNode('n3');
            const messageSent = { test: 'data' };

            let numberOfMessagesReceived = 0;

            n3.on('input', msg => {
                numberOfMessagesReceived++;
            });

            setTimeout(() => {

                connectStub.restore();
                clientWsStub.restore();
                utilStub.restore();

                if(numberOfMessagesReceived !== 3){
                    throw new Error("Not all nodes received the message after 1s");
                }

                done();
            }, 1500);

            connect.fakeMessage({data: JSON.stringify(messageSent)});
        })
    
    });

    it('Should not create another WS on multiple node additions', done => {
    
        // override the creation of the client
        const utilStub = sinon.stub(wsUtils, 'connect').callsFake(() => {wsUtils.isConnected = !wsUtils.isConnected;});

		const flow = [
	      { id: 'n1', type: 'ewelink-auth' },
          { id: 'n2', type: 'helper' },
          { id: 'n3', type: 'helper' },
          { id: 'n4', type: 'helper' }
	    ];    

        helper.load([authNode], flow, () => {
            const n2 = helper.getNode('n2');
            const n3 = helper.getNode('n3');
            const n4 = helper.getNode('n4');

            wsUtils.addNode(n2, (message) => {});
            if (wsUtils.isConnected === false) {
                throw new Error("Should connect the WS on 1st node addition");
            }

            wsUtils.addNode(n3, (message) => {});
            if (wsUtils.isConnected === false) {
                throw new Error("Should not disconnect the WS on 2nd node addition");
            }

            wsUtils.addNode(n4, (message) => {});
            if (wsUtils.isConnected === false) {
                throw new Error("Should not disconnect the WS on 3rd node addition");
            }

            if(utilStub.calledOnce !== true){
                throw new Error("The addition of the other nodes tried to create another WS connection");
            }

            utilStub.restore();
            done();
        });
    });

    it('Should handle connection', done => {
        const flow = [
            { id: 'n1', type: 'ewelink-auth', appId: 'something' },
            { id: 'n2', type: 'ewelink-home', auth: 'n1', wires:[['n3']], apiKey: 'apiKey' },
            { id: 'n3', type: 'helper' }
        ];

        // override the home.getFamily method of the client
        const connect = { 
            onConnect: () => {},
            create: () => {},
            fakeMessage: () => {
                this.onConnect(this);
            }
        };
        const connectStub = sinon.stub(connect, 'create').callsFake(
            (options, onConnect, onDisconnect, onError, onMessage) => {
                this.onConnect = onConnect; 

                return {url: 'ws://testurl'};
            });

        // override the home value of the clinet
        const clientWs = { Connect: {}, appId: 'something' };
        const clientWsStub = sinon.stub(clientWs, "Connect").value(connect);
        
        // override the creation of the client
        const utilStub = sinon.stub(util, 'getWssClient').callsFake(() => {
            return clientWs;
        });

        // override the creation of the client
        const utilStub2 = sinon.stub(util, 'genericGetClient').callsFake(() => {
            return {appId: 'something', at: 'atoken', region: 'region'};
        });
        

        const wsUtilsStub = sinon.stub(wsUtils, 'updateNodesStatus').callsFake(() => {});

        helper.load([authNode, homeNode], flow, () => {
            const n2 = helper.getNode('n2');
            
            wsUtils.addNode(n2, (message) => {});

            connect.fakeMessage();

            if (wsUtils.isConnecting !== true && wsUtils.isConnected !== false) {
                throw new Error("The WS connection was not handled correctly");
            }

            if (wsUtilsStub.calledOnce !== true) {
                throw new Error("The nodes status were not updated on connection");
            }

            if (
                wsUtils.currentStatus.color !== "yellow" 
                && wsUtils.currentStatus.shape !== "ring" 
                && wsUtils.currentStatus.text !== "connecting"
            ) {
                console.log("currentStatus: " + JSON.stringify(wsUtils.currentStatus));
                throw new Error("The nodes status were not updated correctly on connection");
            }
            
            connectStub.restore();
            clientWsStub.restore();
            utilStub.restore();
            utilStub2.restore();
            wsUtilsStub.restore();
            
            done();
        });
    }).timeout(5000);

    it('Should handle disconnection', done => {
        const flow = [
            { id: 'n1', type: 'ewelink-auth' },
            { id: 'n2', type: 'ewelink-home', auth: 'n1', wires:[['n3']] },
            { id: 'n3', type: 'helper' }
        ];

        // override the home.getFamily method of the client
        const connect = { 
            onClose: () => {},
            create: () => {},
            fakeMessage: () => {
                this.onClose();
            }
        };
        const connectStub = sinon.stub(connect, 'create').callsFake(
            (options, onConnect, onClose, onError, onMessage) => {
                this.onClose = onClose; 

                return {url: 'ws://testurl'}
            });

        // override the home value of the clinet
        const clientWs = { Connect: {}, appId: 'something' };
        const clientWsStub = sinon.stub(clientWs, "Connect").value(connect);
        
        // override the creation of the client
        const utilStub = sinon.stub(util, 'getWssClient').callsFake(() => clientWs);

        const wsUtilsStub = sinon.stub(wsUtils, 'updateNodesStatus').callsFake(() => {});

        // override the creation of the client
        const utilStub2 = sinon.stub(util, 'genericGetClient').callsFake(() => {
            return {appId: 'something', at: 'atoken', region: 'region'};
        });
        

        helper.load([authNode, homeNode], flow, () => {
            const n2 = helper.getNode('n2');
            
            wsUtils.addNode(n2, (message) => {
                n2.send({payload: JSON.parse(message.data)})
            });

            const n3 = helper.getNode('n3');
            const messageSent = { test: 'data' };

            connect.fakeMessage();

            if (wsUtils.isConnected !== false && wsUtils.isConnecting !== false) {
                throw new Error("The WS disconnection was not handled correctly");
            }

            if (wsUtilsStub.calledOnce !== true) {
                throw new Error("The nodes status were not updated on connection");
            }

            if (
                wsUtils.currentStatus.color !== "red" 
                && wsUtils.currentStatus.shape !== "ring" 
                && wsUtils.currentStatus.text !== "disconnected"
            ) {
                console.log("currentStatus: " + JSON.stringify(wsUtils.currentStatus));
                throw new Error("The nodes status were not updated correctly on connection");
            }
            
            connectStub.restore();
            clientWsStub.restore();
            utilStub.restore();
            wsUtilsStub.restore();
            utilStub2.restore();
            done();
        });
    });

    it('Should handle errors', done => {
        const flow = [
            { id: 'n1', type: 'ewelink-auth' },
            { id: 'n2', type: 'ewelink-home', auth: 'n1', wires:[['n3']] },
            { id: 'n3', type: 'helper' }
        ];

        // override the home.getFamily method of the client
        const connect = { 
            onError: () => {},
            create: () => {},
            fakeMessage: (msg) => {
                this.onError(msg);
            }
        };
        const connectStub = sinon.stub(connect, 'create').callsFake(
            (options, onConnect, onDisconnect, onError, onMessage) => {
                this.onError = onError; 

                return {url: 'ws://testurl', close: () => {}};
            });

        // override the home value of the clinet
        const clientWs = { Connect: {}, appId: 'something' };
        const clientWsStub = sinon.stub(clientWs, "Connect").value(connect);
        
        // override the creation of the client
        const utilStub = sinon.stub(util, 'getWssClient').callsFake(() => clientWs);

        const wsUtilsStub = sinon.stub(wsUtils, 'updateNodesStatus').callsFake(() => {});

        // override the creation of the client
        const utilStub2 = sinon.stub(util, 'genericGetClient').callsFake(() => {
            return {appId: 'something', at: 'atoken', region: 'region'};
        });

        helper.load([authNode, homeNode], flow, () => {
            const n2 = helper.getNode('n2');
            
            wsUtils.addNode(n2, (message) => {
                n2.send({payload: JSON.parse(message.data)})
            });

            const n3 = helper.getNode('n3');
            const messageSent = { test: 'data' };

            connect.fakeMessage('on error');

            if (wsUtils.isConnected !== false && wsUtils.isConnecting !== false) {
                throw new Error("The WS onError was not handled correctly");
            }

            if (wsUtilsStub.calledOnce !== true) {
                throw new Error("The nodes status were not updated on connection");
            }

            if (
                wsUtils.currentStatus.color !== "red" 
                && wsUtils.currentStatus.shape !== "dot" 
                && wsUtils.currentStatus.text !== "on error"
            ) {
                console.log("currentStatus: " + JSON.stringify(wsUtils.currentStatus));
                throw new Error("The nodes status were not updated correctly on connection");
            }
            
            connectStub.restore();
            clientWsStub.restore();
            utilStub.restore();
            wsUtilsStub.restore();
            utilStub2.restore();
            done();
        });
    });
});