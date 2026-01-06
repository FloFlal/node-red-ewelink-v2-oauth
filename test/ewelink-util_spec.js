const helper = require("node-red-node-test-helper");
const authNode = require("../src/ewelink-auth/ewelink-auth.js");
const util = require("../src/ewelink-util/ewelink-util.js");
const sinon = require('sinon');
const express = require('express');

const app = express();

describe('eWeLink util tests', () => {
	afterEach(() => {
    	helper.unload();
	});

	it('Should return an empty client if there is no name', done => {
		const flow = [
	      { id: 'n1', type: 'ewelink-auth' }
	    ];

	    helper.load(authNode, flow, () => {
	    	const n1 = helper.getNode('n1');
			const resp = n1.getClient();
			if(Object.keys(resp).length !== 0){
				throw new Error("Expected an empty object got: " + JSON.stringify(resp));
			}
			done();
		});
	});

	it('Should retreive all information from credentials', done => {
		const flow = [
	      { id: 'n1', type: 'ewelink-auth' }
	    ];

		const defaultDate = Date.now() + (24*60*60*1000*29);

	    const cred = {
	    	n1: {
	    		displayName: 'displayName',
	    		appId: 'appId',
	    		appSecret: 'appSecret',
	    		region: 'eu',
	    		atExpiredTime: defaultDate,
	    		rtExpiredTime: defaultDate,
	    		at: 'atToken',
	    		rt: 'rtToken'
	    	}
	    }

	    helper.load(authNode, flow, cred, () => {
	    	const n1 = helper.getNode('n1');
			const resp = n1.getClient();
			if(Object.keys(resp).length === 0){
				throw new Error("Expected an object not empty got: " + JSON.stringify(resp));
			}
			if (resp.appId !== 'appId') throw new Error("The appId property is not OK");
			if (resp.appSecret !== 'appSecret') throw new Error("The appSecret property is not OK");
			if (resp.region !== 'eu') throw new Error("The region property is not OK");
			if (resp.at !== 'atToken') throw new Error("The at property is not OK");
			if (resp.rt !== 'rtToken') throw new Error("The rt property is not OK");
			if (resp.atExpiredTime !== defaultDate) throw new Error("The atExpiredTime property is not OK");
			if (resp.rtExpiredTime !== defaultDate) throw new Error("The rtExpiredTime property is not OK");

			done();
	    });
	});

	it('Should renew the token it the at is expired during call', done => {
		// override the user.refreshToken method of the client
		const user = { refreshToken: () => { }};
		const userStub = sinon.stub(user, 'refreshToken').callsFake(() => Promise.resolve({
			error: 0,
			data: {
				at: 'newAt',
				rt: 'newRt',
				atExpiredTime: (new Date()).getTime() + (24*60*60*1000*29),
				rtExpiredTime: (new Date()).getTime() + (24*60*60*1000*59),
			},
			msg: null
		}));

		// override the home value of the clinet
  		const client = {
  			user: {},
  			displayName: 'displayName',
	    	appId: 'appId',
	    	appSecret: 'appSecret',
	    	region: 'eu',
	    	atExpiredTime: (new Date()).getTime() - (24*60*60*1000),
	    	at: 'atToken',
	    	rt: 'rtToken'
  		};
  		const clientStub = sinon.stub(client, "user").value(user);

  		// override the creation of the client
		const utilStub = sinon.stub(util, 'getBasicClient').callsFake(() => client);

		const flow = [
	      { id: 'n2', type: 'ewelink-auth' }
	    ];

	    const cred = {
	    	n2: {
	    		displayName: 'displayName',
	    		appId: 'appId',
	    		appSecret: 'appSecret',
	    		region: 'eu',
	    		atExpiredTime: (new Date()).getTime() - (24*60*60*1000),
	    		at: 'atToken',
	    		rt: 'rtToken'
	    	}
	    }

	    const RED = {
	    	nodes: {
	    		addCredentials: function (id, credentials) {
	    			return;
	    		}
	    	}
	    }

	    helper.load(authNode, flow, cred, () => {
	    	const n2 = helper.getNode('n2');

			util.handleEwelinkResponse(RED, n2, {payload: 'test'}, () => {}, client => {
				if(Object.keys(client).length === 0){
					throw new Error("Expected an object not empty got: " + JSON.stringify(client));
				}
				
				if (client.appId !== 'appId') throw new Error("The appId property is not OK");
				if (client.appSecret !== 'appSecret') throw new Error("The appSecret property is not OK");
				if (client.region !== 'eu') throw new Error("The region property is not OK");
				if (client.at !== 'newAt') throw new Error("The at property is not OK");
				if (client.rt !== 'newRt') throw new Error("The rt property is not OK");

				// release all stubs
				userStub.restore();
				clientStub.restore();
				utilStub.restore();

				done();

				return Promise.resolve({error: 0, data: 'test'})
			});
		});
	});

	it('Should put default values on token expiration date if not provided', done => {
		// override the user.refreshToken method of the client
		const user = { refreshToken: () => { }};
		const userStub = sinon.stub(user, 'refreshToken').callsFake(() => Promise.resolve({
			error: 0,
			data: {
				at: 'newAt',
				rt: 'newRt'
			},
			msg: null
		}));

		// override the home value of the clinet
  		const client = {
  			user: {},
  			displayName: 'displayName',
	    	appId: 'appId',
	    	appSecret: 'appSecret',
	    	region: 'eu',
	    	atExpiredTime: (new Date()).getTime() - (24*60*60*1000),
	    	rtExpiredTime: undefined,
	    	at: 'atToken',
	    	rt: 'rtToken'
  		};
  		const clientStub = sinon.stub(client, "user").value(user);

  		// override the creation of the client
		const utilStub = sinon.stub(util, 'getBasicClient').callsFake(() => client);

		const flow = [
	      { id: 'n2', type: 'ewelink-auth' }
	    ];

	    const cred = {
	    	n2: {
	    		displayName: 'displayName',
	    		appId: 'appId',
	    		appSecret: 'appSecret',
	    		region: 'eu',
	    		atExpiredTime: (new Date()).getTime() - (24*60*60*1000),
	    		at: 'atToken',
	    		rt: 'rtToken'
	    	}
	    }

	    const RED = {
	    	nodes: {
	    		addCredentials: function (id, credentials) {
	    			return;
	    		}
	    	}
	    }

	    helper.load(authNode, flow, cred, () => {
	    	const n2 = helper.getNode('n2');

			util.handleEwelinkResponse(RED, n2, {payload: 'test'}, () => {}, client => {
				if(Object.keys(client).length === 0){
					throw new Error("Expected an object not empty got: " + JSON.stringify(client));
				}
				
				if (client.appId !== 'appId') throw new Error("The appId property is not OK");
				if (client.appSecret !== 'appSecret') throw new Error("The appSecret property is not OK");
				if (client.region !== 'eu') throw new Error("The region property is not OK");
				if (client.at !== 'newAt') throw new Error("The at property is not OK");
				if (client.rt !== 'newRt') throw new Error("The rt property is not OK");
				if (client.atExpiredTime === undefined || client.atExpiredTime <= (new Date()).getTime() - (24*60*60*1000)) throw new Error("The atExpiredTime property is not OK");

				// release all stubs
				userStub.restore();
				clientStub.restore();
				utilStub.restore();

				done();

				return Promise.resolve({error: 0, data: 'test'})
			});
		});
	});

});
