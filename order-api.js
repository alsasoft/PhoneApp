'use strict';
const url = require('url');
const http = require('http');
const mysqlPool = require('./mysql-pool');
const objectId = require('./object-id');
const loggerModuleString = 'OrderAPI';

module.exports = {
	setServerLogger(serverLogger){
		this.serverLogger = serverLogger;
		this.serverLogger.debug(loggerModuleString + ".setServerLogger");
	},

	executeHttpRequest: function (r_options, r_data, args){
		var logger = args.reqLoggerFactory.createLocalLogger({
			'service_module': loggerModuleString, 
			'service_module_function': 'executeHttpRequest'
		});
		
		return new Promise(function(resolve, reject) {
			let post_req = http.request(r_options, function(resp) {
				let data = '';
				
				logger.debug("Response status code: " + resp.statusCode);

				resp.on('data', chunk => {
					data += chunk;
				});

				resp.on('end', () => {
					if(resp.statusCode < 400){
						logger.debug("Response OK!");

						return resolve({
							'status': resp.statusCode,
							'headers': resp.headers,
							'body': data
						});
					}
					else{
						let errMessage = "Request failed with status code " + resp.statusCode;
						logger.error(errMessage);
						return reject({
							'code': 'HTTP_BAD_RESPONSE',
							'message': errMessage,
							'status': resp.statusCode,
							'headers': resp.headers,
							'body': data
						});
					}
				});

				resp.on('error', err => {
					logger.error(err);
					return reject(err);
				});
			})
			.on('error', err => {
				logger.error(err);
				return reject(err);
			});

			logger.debug("Requesting ...");

			if(r_data){
				post_req.write(r_data);
			}
			
			post_req.end();
		});
	},	

	register: function(router){
		var _this = this;
		this.serverLogger.debug(loggerModuleString + ".register");
		
		router.route('/order/')
		.post(function (req, res, next) {
			let logger = req.reqLoggerFactory.createLocalLogger({
				'service_module': loggerModuleString, 
				'service_module_function': 'GET /order/'
			});

			let args = {
				'connection': { 'release': function() {} },
				'reqLoggerFactory': req.reqLoggerFactory
			};

			if(!req.body.name || typeof(req.body.name) != 'string'){
				let errMessage = "Invalid customer name";
				logger.warning(errMessage);
				res.status(400).send({ 'error': errMessage });
				return next();
			}

			if(!req.body.surname || typeof(req.body.surname) != 'string'){
				let errMessage = "Invalid customer surname";
				logger.warning(errMessage);
				res.status(400).send({ 'error': errMessage });
				return next();
			}

			if(!req.body.email || typeof(req.body.email) != 'string' || !objectId.checkEmail(req.body.email)){
				let errMessage = "Invalid customer email";
				logger.warning(errMessage);
				res.status(400).send({ 'error': errMessage });
				return next();
			}

			if(!Array.isArray(req.body.phones) || req.body.phones.length == 0){
				let errMessage = "Invalid phone list";
				logger.warning(errMessage);
				res.status(400).send({ 'error': errMessage });
				return next();
			}

			let url_string = 'http://phone-service:8081/api/phone/?page_size=0';
			let phone_ids_array = [];
			let phone_ids_index = {};
			let total_price = 0;

			for(let _id of req.body.phones){
				let p_id = parseInt(_id);

				if(p_id > 0){
					if(!phone_ids_index.hasOwnProperty("" + p_id)){
						phone_ids_array.push(p_id);
						phone_ids_index["" + p_id] = { 'count': 0, 'price': 0 };
						url_string += "&_id=" + p_id;
					}
					phone_ids_index["" + p_id]['count']++;
				}
			}

			logger.debug("URL: " + url_string);

			let parsed = url.parse(url_string);

			let r_options = {
				'host':     parsed.hostname,
				'port':     parsed.port,
				'path':     parsed.path,
				'method':   'GET',
				'slashes':  parsed.slashes,
				'protocol': parsed.protocol,
				'headers':  {
					'Content-Type': 'application/json',
				}
			};

			logger.debug("Checking phone list in catalog...");
			_this.executeHttpRequest(r_options, null, args)
			.then(response => {
				let response_body = JSON.parse(response.body);

				for(let phone of response_body.results){
					let index = phone_ids_array.indexOf(phone._id);
					if(index >= 0){
						phone_ids_array.splice(index, 1);
						let price = phone_ids_index["" + phone._id]['count'] * phone.price;
						phone_ids_index["" + phone._id]['price'] = price;
						total_price += price;
					}
				}

				if(phone_ids_array.length > 0){
					let errMessage = "Unknown phone IDs: " + phone_ids_array.toString();
					logger.warning(errMessage);
					res.status(400).send({ 'error': errMessage });
					return next();
				}

				logger.debug("Connecting to database...");
				return mysqlPool.getConnection(args);
			})
			.then(connection => {
				args.connection = connection;
				logger.debug("Connected!");

				return mysqlPool.executeQuery(
					args.connection, 
					'INSERT INTO challenge_order (customer_name, customer_surname, customer_email, phones, total_price) VALUES(?, ?, ?, ?, ?)',
					[req.body.name, req.body.surname, req.body.email, req.body.phones.toString(), total_price],
					args
				);
			})
			.then(result => {
				logger.debug("Order posted! Total price: " + total_price);
				phone_ids_index['total_price'] = total_price;
				res.status(201).send(phone_ids_index);
				args.connection.release();
				return next();
			})
			.catch(err => {
				logger.error(err);
				res.status(err.status || 500).send({ 'error': err.toString() });
				args.connection.release();
				return next();
			});
		});
	}
}
