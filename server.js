const express = require('express');
const app = express();
const mysql = require('mysql');
const bodyParser = require('body-parser');

try {
	const GlobalLoggerFactory = require('./logger');
	const mysqlPool = require('./mysql-pool');
	const phoneApi = require('./phone-api');
	const orderApi = require('./order-api');

	const deployPort = process.env.DEPLOY_PORT;

	const pool = mysql.createPool({
		'host':     process.env.MYSQL_HOST,
		'user':     process.env.MYSQL_USER,
		'password': process.env.MYSQL_PASSWORD,
		'database': process.env.MYSQL_DATABASE,
		'debug':    false
	});

	mysqlPool.setMysqlPool(pool);

	let globalLoggerFactory = new GlobalLoggerFactory();

	globalLoggerFactory.init({
		'service':          process.env.SERVICE_NAME || 'challenge',
		'service_instance': process.env.SERVICE_INSTANCE || 0
	});

	let logger = globalLoggerFactory.createLocalLogger({
		'service_module':          'server',
		'service_module_function': 'loader'
	});

	phoneApi.setServerLogger(logger);
	orderApi.setServerLogger(logger);

	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());

	app.use(function (req, res, next) {
		req.reqLoggerFactory = globalLoggerFactory.createRequestLoggerFactory(req, {});
		logger.info(" > " + req.method + " " + req.url, null, req.reqLoggerFactory.reqid);
		return next();
	});

	app.use(function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-User");
		res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
		return next();
	});

	let router = express.Router();

	app.use('/api', router);

	phoneApi.register(router);
	orderApi.register(router);

	app.use(function (req, res, next) {
		req.reqLoggerFactory.endRequest(res);
		logger.info(" < " + req.method + " " + req.url + ": " + res.statusCode, null, req.reqLoggerFactory.reqid);
		return next();
	});

	app.listen(deployPort, () => {
		logger.debug('Listening on port ' + deployPort);
	});
}
catch(err){
	console.error('err', err);
}