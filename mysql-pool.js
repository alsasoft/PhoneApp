'use strict';
const loggerModuleString = 'MysqlPool';

module.exports = {
	setMysqlPool(mysqlPool){
		this.mysqlPool = mysqlPool;
	},

	getConnection: function(args) {
		var _this = this;

		let logger = args.reqLoggerFactory.createLocalLogger({
			'service_module': loggerModuleString, 
			'service_module_function': 'getConnection'
		});

		logger.debug("Getting connection...");

		return new Promise(function(resolve, reject) {
			_this.mysqlPool.getConnection(function(err, connection){
				if (err) {
					logger.error(err);
					return reject(err);
				}
				else {
					logger.debug("Connection got!");
					return resolve(connection);
				}
			});
		});
	},

	executeQuery: function(connection, query, query_params, args) {
		let _self = this;

		let logger = args.reqLoggerFactory.createLocalLogger({
			'service_module': loggerModuleString, 
			'service_module_function': 'executeQuery'
		});

		logger.debug(query);
		logger.debug(query_params);

		return new Promise(function(resolve, reject) {
			connection.query(query, query_params, function(err, data){
				if(err) {
					logger.error(err);
					return reject(err);
				}
				else{
					logger.debug(JSON.stringify(data));
					return resolve(data);
				}
			});
		});
	}
}
