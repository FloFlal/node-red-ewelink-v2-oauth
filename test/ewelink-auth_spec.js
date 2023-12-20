const helper = require("node-red-node-test-helper");
const authNode = require("../src/ewelink-auth/ewelink-auth.js");
const util = require("../src/ewelink-util/ewelink-util.js");
const sinon = require('sinon');
const express = require('express');

const app = express();

describe('eWeLink Auth tests - redirect', () => {
	beforeEach(done => {
		helper.startServer(done);
	});

	afterEach(done => {
	    helper.unload().then(function() {
	        helper.stopServer(done);
	    });
	});

	it('Should redirect to eWeLink servers to connect', done => {
		const flow = [
	      { id: 'n1', type: 'ewelink-auth' }
	    ];

		function validateRedirect(res) {
			if (!(res.headers["location"].includes('https://c2ccdn.coolkit.cc/oauth/index.html'))) throw new Error("No Location");
			if (!(res.headers["location"].includes('clientId=appId'))) throw new Error("No correct clientId in redirection");
			if (!(res.headers["location"].includes('seq='))) throw new Error("No seq in redirection");
			if (!(res.headers["location"].includes('authorization='))) throw new Error("No authorization in redirection");
			if (!(res.headers["location"].includes('redirectUrl=redirectUrl'))) throw new Error("No correct redirectUrl in redirection");
			if (!(res.headers["location"].includes('grantType=authorization_code'))) throw new Error("No correct grantType in redirection");
			if (!(res.headers["location"].includes('state=id%3A'))) throw new Error("No correct state in redirection");
			if (!(res.headers["location"].includes('nonce='))) throw new Error("No nonce in redirection");
		}

		helper.load([authNode], flow, () => {
			helper.request(app)
				.get('/ewelink-auth/auth?appId=appId&id=id&redirectUrl=redirectUrl&appSecret=appSecret')
				.expect(302)
				.expect(validateRedirect)
				.end(done)
		});

	});

	it('Should send a readable error if there is missing params', done => {
		const flow = [
	      { id: 'n1', type: 'ewelink-auth' }
	    ];

	    var nbCalls = 0

	    function callDone() {
	    	nbCalls += 1;
	    	if(nbCalls === 5	){
	    		done();
	    	}
	    }

	    helper.load([authNode], flow, () => {
			helper.request(app)
				.get('/ewelink-auth/auth')
				.expect(400, {
					code: 'eWeLink.error.noparams',
					message: 'missing parameters'
				})
				.end(done);

			helper.request(app)
				.get('/ewelink-auth/auth?appId=appId&id=id&redirectUrl=redirectUrl')
				.expect(400, {
					code: 'eWeLink.error.noparams',
					message: 'missing parameters'
				})
				.end(callDone);

			helper.request(app)
				.get('/ewelink-auth/auth?appId=appId&appSecret=appSecret&redirectUrl=redirectUrl')
				.expect(400, {
					code: 'eWeLink.error.noparams',
					message: 'missing parameters'
				})
				.end(callDone);

			helper.request(app)
				.get('/ewelink-auth/auth?appId=appId&appSecret=appSecret&id=id')
				.expect(400, {
					code: 'eWeLink.error.noparams',
					message: 'missing parameters'
				})
				.end(callDone);

			helper.request(app)
				.get('/ewelink-auth/auth?appSecret=appSecret&id=id&redirectUrl=redirectUrl')
				.expect(400, {
					code: 'eWeLink.error.noparams',
					message: 'missing parameters'
				})
				.end(callDone);
		});
	});
});

describe('eWeLink Auth tests - callback', () => {
	beforeEach(done => {
		helper.startServer(done);
	});


	afterEach(done => {
	    helper.unload().then(function() {
	        helper.stopServer(done);
	    });
	});

	it('Should send a readable error if there is no query params', done => {
		const flow = [
	      { id: 'n1', type: 'ewelink-auth' }
	    ];

	    helper.load([authNode], flow, () => {
			helper.request(app)
				.get('/ewelink-auth/auth/callback')
				.expect(401, {
					code: 'eWeLink.error.noparams',
					message: 'missing parameters'
				})
				.end(done);
		});
	});

	it('Should send a readable error if there is missing code and region params', done => {
		const flow = [
	      { id: 'n1', type: 'ewelink-auth' }
	    ];

	    helper.load([authNode], flow, () => {
			helper.request(app)
				.get('/ewelink-auth/auth/callback?state=n1:test')
				.expect(401, {
					code: 'eWeLink.error.noparams',
					message: 'missing parameters'
				})
				.end(done);
		});
	});

	it('Should send a readable error if there is missing region param', done => {
		const flow = [
	      { id: 'n1', type: 'ewelink-auth' }
	    ];

	    helper.load([authNode], flow, () => {
			helper.request(app)
				.get('/ewelink-auth/auth/callback?state=n1:test&code=mycodetoken')
				.expect(401, {
					code: 'eWeLink.error.noparams',
					message: 'missing parameters'
				})
				.end(done);
		});
	});

	it('Should send a readable error if there is no credentials in the node', done => {
		const flow = [];

	    helper.load([authNode], flow, () => {
			helper.request(app)
				.get('/ewelink-auth/auth/callback?state=n1:test&code=mycodetoken&region=eu')
				.expect(401, {
					code: 'ewelink.error.no-credentials',
					message: 'The node is not retreivable or there is no credentials for it'
				})
				.end(done);
		});
	});

	// need to be able to put values in credentials
	it('Should send a readable error if the csrf token mismatch', done => {
	    helper.load(authNode, [{ id: 'n1', type: 'ewelink-auth'}], {
	    	n1: {
	    		appId: 'appId',
	    		appSecret: 'appSecret',
	    		csrfToken: '321'
	    	}
	    }, () => {
	    	const n1 = helper.getNode('n1');	

			helper.request(app)
				.get('/ewelink-auth/auth/callback?state=n1:test&code=mycodetoken&region=eu')
				.expect(401, {
					code: 'ewelink.error.token-mismatch',
					message: 'Incorrect token'
				})
				.end(done);
		});
	});

	it('Should send a readable error if we try to call get token without redirect URL', done => {
		// override the oauth.getToken method of the client
		const oauth = { getToken: () => { }};
		const oauthStub = sinon.stub(oauth, 'getToken').callsFake(() => Promise.reject('no redirect url'));

		// override the oauth value of the clinet
  		const client = { oauth: {}, appId: 'something' };
  		const clientStub = sinon.stub(client, "oauth").value(oauth);

  		// override the creation of the client
		const utilStub = sinon.stub(util, 'genericGetClient').callsFake(() => client);
		
		const flow = [
	      { id: 'n1', type: 'ewelink-auth' }
	    ];

	    helper.load([authNode], flow, {
	    	n1: {
	    		appId: 'appId',
	    		appSecret: 'appSecret',
	    		csrfToken: 'test'
	    	}
	    }, () => {
			helper.request(app)
				.get('/ewelink-auth/auth/callback?state=n1:test&code=mycodetoken&region=eu')
				.expect(401, {
					code: 'ewelink.error.token-retreive',
					message: 'Could not receive tokens: no redirect url'
				})
				.end(() => {
					oauthStub.restore();
					clientStub.restore();
					utilStub.restore();
					done();
				});
		});
	});

	it('Should send back the errors of ewelink', done => {
		// override the oauth.getToken method of the client
		const oauth = { getToken: () => { }};
		const oauthStub = sinon.stub(oauth, 'getToken').callsFake(() => Promise.resolve({
			error: 1,
			data: null,
			msg: "My Badass Error"
		}));

		// override the oauth value of the clinet
  		const client = { oauth: {}, appId: 'something' };
  		const clientStub = sinon.stub(client, "oauth").value(oauth);

  		// override the creation of the client
		const utilStub = sinon.stub(util, 'genericGetClient').callsFake(() => client);
		
		const flow = [
	      { id: 'n1', type: 'ewelink-auth' }
	    ];

	    helper.load([authNode], flow, {
	    	n1: {
	    		appId: 'appId',
	    		appSecret: 'appSecret',
	    		csrfToken: 'test'
	    	}
	    }, () => {
			helper.request(app)
				.get('/ewelink-auth/auth/callback?state=n1:test&code=mycodetoken&region=eu')
				.expect(401, {
					code: 'ewelink.error.api-error',
					message: 'Could not receive tokens [1]: My Badass Error'
				})
				.end(() => {
					oauthStub.restore();
					clientStub.restore();
					utilStub.restore();
					done();
				});
		});
	});

	it('Should send back the errors of the query', done => {
		const flow = [
	      { id: 'n1', type: 'ewelink-auth' }
	    ];

	    helper.load([authNode], flow, () => {
			helper.request(app)
				.get('/ewelink-auth/auth/callback?error=MyBadassError&error_description=thisIsAnError')
				.expect(401, {
					code: 'eWeLink.error.error',
					message: {error: 'MyBadassError', description: 'thisIsAnError'}
				})
				.end(done);
		});
	});

	it('Should be OK', done => {
		// override the oauth.getToken method of the client
		const oauth = { getToken: () => { }};
		const oauthStub = sinon.stub(oauth, 'getToken').callsFake(() => Promise.resolve({
			error: 0,
			data: {
				accessToken: 'at',
				refreshToken: 'rt',
				atExpiredTime: 123,
				rtExpiredTime: 345
			},
			msg: null
		}));

		// override the oauth value of the clinet
  		const client = { oauth: {}, appId: 'something' };
  		const clientStub = sinon.stub(client, "oauth").value(oauth);

  		// override the creation of the client
		const utilStub = sinon.stub(util, 'genericGetClient').callsFake(() => client);
		
		const flow = [
	      { id: 'n1', type: 'ewelink-auth' }
	    ];

	    helper.load([authNode], flow, {
	    	n1: {
	    		appId: 'appId',
	    		appSecret: 'appSecret',
	    		csrfToken: 'test'
	    	}
	    }, () => {
			helper.request(app)
				.get('/ewelink-auth/auth/callback?state=n1:test&code=mycodetoken&region=eu')
				.expect(200, '<script>window.setTimeout(window.close,5000);</script> Authorized ! The page will automatically close in 5s.')
				.end(() => {
					oauthStub.restore();
					clientStub.restore();
					utilStub.restore();
					done();
				});
		});
	});

});