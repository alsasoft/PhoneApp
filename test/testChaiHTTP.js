'use stricts';

let chai = require('chai');
let chaiHttp = require('chai-http');
const expect = require('chai').expect;

chai.use(chaiHttp);
const url = 'http://phone-service:8081';

describe('Post an order: ',() => {
	it('Should list phones', (done) => {
		chai.request(url)
			.get('/api/phone/')
			.end(function(err, res) {
				expect(res).to.have.status(200);
				done();
			});
	});
});

describe('Post an order: ',() => {
	it('should insert an order', (done) => {
		chai.request(url)
			.post('/api/order/')
			.send({ "name": "Bartolo", "surname": "Diaz", "email" : "bartolo@diaz.com", "phones": [21, 21, 65, 87, 98] })
			.end(function(err, res) {
				expect(res).to.have.status(201);
				done();
			});
	});
});