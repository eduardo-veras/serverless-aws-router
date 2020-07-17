process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();


chai.use(chaiHttp);

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

