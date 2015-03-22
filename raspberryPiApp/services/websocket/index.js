var io = require('socket.io');

module.exports = function setup(options, imports, register) {

	var webserver = imports.webserver;

	io = io.listen(webserver.http);
	register(null, {
		websocket: io
	});

};