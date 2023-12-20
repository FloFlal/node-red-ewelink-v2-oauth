const helper = require("node-red-node-test-helper");
const homeNode = require("../src/ewelink-home/ewelink-home.js");
const authNode = require("../src/ewelink-auth/ewelink-auth.js");
const util = require("../src/ewelink-util/ewelink-util.js");
const sinon = require('sinon');

describe('eWeLink Home tests', () => {
	afterEach(() => {
    	helper.unload();
	});

	it('Should be loaded', done => {
		const flow = [
	      { id: 'n2', type: 'ewelink-home', name: 'Devices Node 123' }
	    ];
	    helper.load([authNode, homeNode], flow, () => {
	      const n2 = helper.getNode('n2');

	      n2.should.have.property('name', 'Devices Node 123');
	      
	      done();
	    });
	});

	it('Should send error -2 if no connection client retreived', done => {
		const flow = [
			{id: 'n1', type: 'ewelink-auth'},
			{id: 'n2', type: 'ewelink-home', auth: 'n1', wires:[['n3']]},
    		{ id: 'n3', type: 'helper' }
		];

		helper.load([authNode, homeNode], flow, () => {
			const n2 = helper.getNode('n2');
			const n3 = helper.getNode('n3');

			n3.on("input", msg => {
				msg.should.have.a.property('payload');
				msg.payload.should.have.property('error', -2);

				done();
			})
			n2.receive({payload: 'anything'});
		})
	});

	it('Should send error -2 if there is a client but no appId', done => {
		// override the home value of the client
  		const client = { home: {} };

  		// override the creation of the client
		const utilStub = sinon.stub(util, 'genericGetClient').callsFake(() => client);

		const flow = [
			{id: 'n1', type: 'ewelink-auth'},
			{id: 'n2', type: 'ewelink-home', auth: 'n1', wires:[['n3']]},
    		{ id: 'n3', type: 'helper' }
		];

		helper.load([authNode, homeNode], flow, () => {
			const n2 = helper.getNode('n2');
			const n3 = helper.getNode('n3');

			n3.on("input", msg => {
				msg.should.have.a.property('payload');
				msg.payload.should.have.property('error', -2);
				
				// release all stubs
				utilStub.restore();

				done();
			})
			n2.receive({payload: 'anything'});
		})
	});

	it('Should send the error occured during the call to ewelink', done => {
		// override the home.getFamily method of the client
		const home = { getFamily: () => { }};
		const homeStub = sinon.stub(home, 'getFamily').callsFake(() => Promise.reject('My Nasty Error'));

		// override the home value of the clinet
  		const client = { home: {}, appId: 'something' };
  		const clientStub = sinon.stub(client, "home").value(home);

  		// override the creation of the client
		const utilStub = sinon.stub(util, 'genericGetClient').callsFake(() => client);

		const flow = [
			{id: 'n1', type: 'ewelink-auth'},
      		{id: 'n2', type: 'helper', wires: [['n3']] },
			{id: 'n3', type: 'ewelink-home', auth: 'n1', wires:[['n4']]},
    		{id: 'n4', type: 'helper' }
		];

		helper.load([authNode, homeNode], flow, () => {
			const n2 = helper.getNode('n2');
			const n4 = helper.getNode('n4');

	        n4.on("input", msg => {

				msg.should.have.a.property('payload');
				msg.payload.should.have.property('error', -1);
				msg.payload.should.have.property('msg', 'An error occured during the call to ewelink: My Nasty Error');

				// release all stubs
				homeStub.restore();
				clientStub.restore();
				utilStub.restore();
				
				done();

	        })
			n2.send({payload: 'anything'});

		})
	});

	it('Should send back eWeLink errors in the output', done => {
		// override the home.getFamily method of the client
		const home = { getFamily: () => { }};
		const homeStub = sinon.stub(home, 'getFamily').callsFake(() => Promise.resolve({
			error: 1,
			data: null,
			msg: "My Nasty eWeLink Error"
		}));

		// override the home value of the clinet
  		const client = { home: {}, appId: 'something' };
  		const clientStub = sinon.stub(client, "home").value(home);

  		// override the creation of the client
		const utilStub = sinon.stub(util, 'genericGetClient').callsFake(() => client);

		const flow = [
			{id: 'n1', type: 'ewelink-auth'},
      		{id: 'n2', type: 'helper', wires: [['n3']] },
			{id: 'n3', type: 'ewelink-home', auth: 'n1', wires:[['n4']]},
    		{id: 'n4', type: 'helper' }
		];

		helper.load([authNode, homeNode], flow, () => {
			const n2 = helper.getNode('n2');
			const n4 = helper.getNode('n4');

	        n4.on("input", msg => {

				msg.should.have.a.property('payload');
				msg.payload.should.have.property('error', 1);
				msg.payload.should.have.property('msg', 'My Nasty eWeLink Error');

				// release all stubs
				homeStub.restore();
				clientStub.restore();
				utilStub.restore();

				done();

	        })
			n2.send({payload: 'anything'});

		})
	});

	it('Should send the data in case of correct answer', done => {
		// override the home.getFamily method of the client
		const home = { getFamily: () => { }};
		const homeStub = sinon.stub(home, 'getFamily').callsFake(() => Promise.resolve({
			error: 0,
			data: {
				familly: 'familly value !'
			},
			msg: null
		}));

		// override the home value of the clinet
  		const client = { home: {}, appId: 'something' };
  		const clientStub = sinon.stub(client, "home").value(home);

  		// override the creation of the client
		const utilStub = sinon.stub(util, 'genericGetClient').callsFake(() => client);

		const flow = [
			{id: 'n1', type: 'ewelink-auth'},
      		{id: 'n2', type: 'helper', wires: [['n3']] },
			{id: 'n3', type: 'ewelink-home', auth: 'n1', wires:[['n4']]},
    		{id: 'n4', type: 'helper' }
		];

		helper.load([authNode, homeNode], flow, () => {
			const n2 = helper.getNode('n2');
			const n4 = helper.getNode('n4');

	        n4.on("input", msg => {

				msg.should.have.a.property('payload');
				msg.should.have.property('payload', {
					familly: 'familly value !'
				})

				// release all stubs
				homeStub.restore();
				clientStub.restore();
				utilStub.restore();

				done();

	        })
			n2.send({payload: 'anything'});

		})
	});

});