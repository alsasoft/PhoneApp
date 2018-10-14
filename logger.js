'use strict';
const pad = require('pad');
const objectId = require('./object-id');

const Logger = function(parentLogger, args) {
	this.args = args;
	this.parentLogger = parentLogger;
	this.service_module = args.service_module;
	this.service_module_function = args.service_module_function;
	this.levels = ["debug", "info", "warning", "error", "critical"];
};

Logger.prototype._add_level = function(level) {
	level = level.toLowerCase();

	if(this.levels.indexOf(level) < 0){
		this.levels.push(level);
		return true;
	}
	else{ 
		return false;
	}
}

Logger.prototype._remove_level = function(level) {
	level = level.toLowerCase();
	var i = this.levels.indexOf(level);

	if(i >= 0){
		this.levels.splice(i, 1);
		return true;
	}
	else{ 
		return false;
	}
}

Logger.prototype._log = function(level, message, code, reqid) {
	level = level.toLowerCase();

	var now = new Date();

	if(this.parentLogger){
		reqid = this.parentLogger.reqid || reqid;

		this.parentLogger.registerMessage({
			'reqid':    reqid,
			'datetime': now.getTime(),
			'message':  message,
			'level':    level,
			'code':     code,
			'service_module': this.service_module,
			'service_module_function': this.service_module_function
		});
	}
	
	reqid = reqid || 'XXXXXXXXXXXXXXXXXXXXXXXX';
	reqid = reqid.slice(18, 24);

	let timestamp = now.getFullYear()
		+ '-' + pad(2, (now.getMonth() + 1).toString(), '0')
		+ '-' + pad(2, now.getDate().toString(), '0')
		+ ' ' + pad(2, now.getHours().toString(), '0')
		+ ':' + pad(2, now.getMinutes().toString(), '0')
		+ ':' + pad(2, now.getSeconds().toString(), '0')
		+ '.' + pad(3, now.getMilliseconds().toString(), '0');

	message = "[" + timestamp + "][" + reqid + "]" + pad(8, level.toUpperCase(), ' ') + ": [" + this.service_module + '.' + this.service_module_function + "]: " + message + ".";

	if(this.levels.indexOf(level) >= 0){
		switch(level){
			case 'info':
				console.info(message);
				break;
			case 'warning':
				console.warn(message);
				break;
			case 'error':
			case 'critical':
				console.error("===============");
				console.error(message); 
				console.error("===============");
				break;
			case 'debug':
			default:
				console.log(message);
		}
	}
};

Logger.prototype.log = function(message, code = null, reqid = null) {
	this._log("debug", message, code, reqid);
};

Logger.prototype.debug = function(message, code = null, reqid = null) {
	this._log("debug", message, code, reqid);
};

Logger.prototype.info = function(message, code = null, reqid = null) {
	this._log("info", message, code, reqid);
};

Logger.prototype.warning = function(message, code = null, reqid = null) {
	this._log("warning", message, code, reqid);
};

Logger.prototype.error = function(message, code = null, reqid = null) {
	this._log("error", message, code, reqid);
};

Logger.prototype.critical = function(message, code = null, reqid = null) {
	this._log("critical", message, code, reqid);
};

/**
 * Factory asociado a una petición HTTP
 */
var RequestLoggerFactory = function(globalLoggerFactory, req, args) {
	this.globalLoggerFactory = globalLoggerFactory;
	this.req    = req;
	this.args   = args;
	
	this.pid    = process.pid;
	this.reqid  = objectId.generateObjectId('request');
	this.jobid  = req.hasOwnProperty('headers') && req.headers.hasOwnProperty('x-job-id') ? req.headers['x-job-id'] : objectId.generateObjectId('job');
	this.userid = req.hasOwnProperty('credentials') && req.credentials.hasOwnProperty('id') ? req.credentials.id : null;
	
	this.time_begin   = (new Date()).getTime();
	this.time_end     = null;
	this.time_request = null;
	this.status_code  = null;
	this.response     = null;
};

RequestLoggerFactory.prototype.createLocalLogger = function(args) {
	return new Logger(this, args);
};

RequestLoggerFactory.prototype.registerMessage = function(register){
	register.reqid = this.reqid;
	return this.globalLoggerFactory.registerMessage(register);
};

RequestLoggerFactory.prototype.endRequest = function(res){
	this.status_code  = res.statusCode;
	this.resonse      = res;
	this.time_end     = (new Date()).getTime();
	this.time_request = this.time_end - this.time_begin;
	return this.globalLoggerFactory.endRequest(this);
};

var GlobalLoggerFactory = function() {
	this.init({});
};

GlobalLoggerFactory.prototype.init = function(args) {
	this.args = args;
	this.service = args.service || 'service';
	this.service_instance = args.service_instance || 'service-instance';
	
	this.buffer_limit = parseInt(args.buffer_limit) || null; // 90 kilobytes
	this.buffer_timer = parseInt(args.buffer_timer) || null; // 1 minuto
};

GlobalLoggerFactory.prototype.createRequestLoggerFactory = function(req, args) {
	return new RequestLoggerFactory(this, req, args);
};

GlobalLoggerFactory.prototype.createLocalLogger = function(args) {
	return new Logger(this, args);
};

GlobalLoggerFactory.prototype.registerMessage = function(register){

}

GlobalLoggerFactory.prototype.endRequest = function(resquestLoggerFactory){
	
};

GlobalLoggerFactory.prototype.isEmpty = function() {
	return true;
};

GlobalLoggerFactory.prototype.empty = function() {
	this.requestBuffer = [];
	this.messageBuffer = [];
};

GlobalLoggerFactory.prototype.send = function() {

};

module.exports = GlobalLoggerFactory;
