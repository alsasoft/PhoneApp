'use strict';
const mysqlPool = require('./mysql-pool');
const loggerModuleString = 'PhoneAPI';

module.exports = {
	setServerLogger(serverLogger){
		this.serverLogger = serverLogger;
		this.serverLogger.debug(loggerModuleString + ".setServerLogger");
	},

	register: function(router){
		var _this = this;
		this.serverLogger.debug(loggerModuleString + ".register");
		
		router.route('/phone/')
		.get(function (req, res, next) {
			let logger = req.reqLoggerFactory.createLocalLogger({
				'service_module': loggerModuleString, 
				'service_module_function': 'GET /phone/'
			});

			let args = {
				'connection': { 'release': function() {} },
				'reqLoggerFactory': req.reqLoggerFactory
			};

			let count = 0;
			let where = '1';
			let mainQuery = 'SELECT * FROM challenge_phone WHERE ' + where;
			let countQuery = "SELECT COUNT(1) AS 'count' FROM (" + mainQuery + ") AUX";
			let queryParams = [];

			logger.debug("Connecting...");
			mysqlPool.getConnection(args)
			.then(connection => {
				args.connection = connection;
				logger.debug("Connected!");
				return mysqlPool.executeQuery(args.connection, countQuery, queryParams, args);
			})
			.then(_data => {
				count = _data[0]['count'];
				logger.debug("Counted " + count + " results!");
				return mysqlPool.executeQuery(args.connection, mainQuery, queryParams, args);
			})
			.then(results => {
				logger.debug("" + results.length + " results!");
				res.status(200).send({ 'count': count, 'results': results });
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
