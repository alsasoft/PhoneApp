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

			let where = '1';
			let queryParams = [];

			let i_where = '';
			let f_where = false;

			if(req.query.hasOwnProperty('_id')){
				let _ids = req.query._id;

				if(typeof(_ids) == 'string' || !Array.isArray(_ids)){
					_ids = [_ids];
				}

				for(let _id of _ids){
					let p_id = parseInt(_id);
					if(p_id > 0){
						if(!f_where){
							f_where = true;
						}
						else {
							i_where += ", ";
						}
						i_where += "?";
						queryParams.push(p_id);
					}
				}
			}

			let page = 0;

			if(req.query.hasOwnProperty('page')){
				page = parseInt(req.query.page);
				page = page > 0 ? page : 0;
			}

			let page_size = 10;

			if(req.query.hasOwnProperty('page_size')){
				page_size = parseInt(req.query.page_size);
				page_size = page_size >= 0 ? page_size : 10;
			}

			if(f_where){
				where += " AND _id IN(" + i_where + ")";
			}

			let count = 0;
			let mainQuery  = "SELECT * FROM challenge_phone WHERE " + where;
			let countQuery = "SELECT COUNT(1) AS 'count' FROM (" + mainQuery + ") AUX";
			let pagedQuery = mainQuery;

			if(page_size > 0){
				pagedQuery += " LIMIT " + page_size + " OFFSET " + (page * page_size);
			}

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
				return mysqlPool.executeQuery(args.connection, pagedQuery, queryParams, args);
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
