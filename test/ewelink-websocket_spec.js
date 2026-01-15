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
});