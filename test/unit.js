process.env.NODE_ENV = 'test';

const { exec } = require('child_process');
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();

chai.use(chaiHttp);

const msleep = ms => { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); };

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
	it('it should return response ok true', (done) => {
		chai.request('http://localhost:8080')
			.get('/')
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.be.a('object');
				res.body.should.have.property('response');
				res.body.response.should.have.property('ok').eql(true);
				done();
			});
	});
});

after(function () {
	subprocess.kill();
	msleep(500);
	process.kill(subprocess.pid+1); //sls offline will spawn a new process on 1st kill
});
