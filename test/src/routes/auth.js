"use strict";


module.exports.register = (server) => {

	server.route({
		method: 'GET',
		path: '/auth',
		config : {
			auth: async (request, credentials) => {
				if(!credentials.active) return false;
				return true;
			}
		},
		handler: async (request, reply) => {
			return reply.response({ auth : true });
		}
	});

};