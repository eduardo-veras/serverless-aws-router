process.env.NODE_ENV = 'test';

const { exec } = require('child_process');
const jwt = require('jsonwebtoken');
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();

chai.use(chaiHttp);

const JWT_ISSUER = "yoursite.com";
const JWT_SECRET = "YOUR_JWT_SECRET";

const tokens = {
	wrongSecret : jwt.sign({ active : false }, "123456", { "issuer" : JWT_ISSUER }),
	wrongIssuer : jwt.sign({ active : false }, JWT_SECRET, { "issuer" : "nowebsite.com" }),
	inactive : jwt.sign({ active : false }, JWT_SECRET, { "issuer" : JWT_ISSUER }),
	valid : jwt.sign({ active : true }, JWT_SECRET, { "issuer" : JWT_ISSUER })
};

const subprocess = exec('sls offline start --config test/src/serverless.yml');
before(function (done) {
	subprocess.stdout.on('data', (data) => {
		if(data.indexOf('server ready')>0)
			done();
	});
});

describe('GET /', () => {
	it('it should have status 200', (done) => {
		chai.request('http://localhost:8080')
			.get('/')
			.end((err, res) => {
				res.should.have.status(200);
				done();
			});
	});
	it('it should return response, { Hello:"World!" }', (done) => {
		chai.request('http://localhost:8080')
			.get('/')
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('response');
				res.body.response.should.have.property('Hello').eql("World!");
				done();
			});
	});
});

describe('GET /meta', () => {
	it('it should have status 200', (done) => {
		chai.request('http://localhost:8080')
			.get('/meta')
			.end((err, res) => {
				res.should.have.status(200);
				done();
			});
	});
	it('it should return response, { page: { actual: 1 } }', (done) => {
		chai.request('http://localhost:8080')
			.get('/meta')
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('page');
				res.body.page.should.have.property('actual').eql(1);
				done();
			});
	});
});

describe('GET /status202, { ok: true }', () => {
	it('it should have status 202', (done) => {
		chai.request('http://localhost:8080')
			.get('/status202')
			.end((err, res) => {
				res.should.have.status(202);
				res.body.should.be.a('object');
				res.body.should.have.property('response');
				res.body.response.should.have.property('ok').eql(true);
				done();
			});
	});
});

describe('GET /validation', () => {
	it('it should have status 412', (done) => {
		chai.request('http://localhost:8080')
			.get('/validation')
			.end((err, res) => {
				res.should.have.status(412);
				done();
			});
	});
	it('it should have status 200', (done) => {
		chai.request('http://localhost:8080')
			.get('/validation?page=1')
			.end((err, res) => {
				res.should.have.status(200);
				done();
			});
	});
});

describe('GET /validationSchema', () => {
	it('it should have status 412', (done) => {
		chai.request('http://localhost:8080')
			.get('/validationSchema')
			.end((err, res) => {
				res.should.have.status(412);
				done();
			});
	});
	it('extra key, it should have status 412', (done) => {
		chai.request('http://localhost:8080')
			.get('/validationSchema?page=1&extra=1')
			.end((err, res) => {
				res.should.have.status(412);
				done();
			});
	});
	it('it should have status 200', (done) => {
		chai.request('http://localhost:8080')
			.get('/validationSchema?page=1')
			.end((err, res) => {
				res.should.have.status(200);
				done();
			});
	});
});

describe('GET /auth', () => {
	it('no token, it should return status 401', (done) => {
		chai.request('http://localhost:8080')
			.get('/auth')
			.end((err, res) => {
				res.should.have.status(401);
				done();
			});
	});
	it('invalid token:wrong Secret, it should return status 401', (done) => {
		chai.request('http://localhost:8080')
			.get('/auth')
			.set('Authorization', 'bearer ' + tokens.wrongSecret)
			.end((err, res) => {
				res.should.have.status(401);
				done();
			});
	});
	it('invalid token:wrong Issuer, it should return status 401', (done) => {
		chai.request('http://localhost:8080')
			.get('/auth')
			.set('Authorization', 'bearer ' + tokens.wrongIssuer)
			.end((err, res) => {
				res.should.have.status(401);
				done();
			});
	});
	it('invalid token:inactive user, it should return status 401', (done) => {
		chai.request('http://localhost:8080')
			.get('/auth')
			.set('Authorization', 'bearer ' + tokens.inactive)
			.end((err, res) => {
				res.should.have.status(401);
				done();
			});
	});

	it('valid token, it should return status 200 and response, { auth:true }', (done) => {
		chai.request('http://localhost:8080')
			.get('/auth')
			.set('Authorization', 'bearer ' + tokens.valid)
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.have.property('response');
				res.body.response.should.have.property('auth').eql(true);
				done();
			});
	});
});

after(function () {
	subprocess.kill();
	try{ process.kill(subprocess.pid+1); } catch(e){} //Only necessary on linux
});
