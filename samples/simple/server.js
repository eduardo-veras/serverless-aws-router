"use strict";

const slsRouter = require('../../lib');


const server = new slsRouter.Server({});


server.route({
	method: 'GET',
	path: '/',
	handler: async (request, reply) => {
		return reply.response({ Hello : "World!" });
	}
});

server.route({
	method: 'GET',
	path: '/protected',
	config : {
		auth: async (request, credentials) => {
			if(!credentials.active) return false; //Return false to invalidate
			//Use this space to check user data on DB for example
			return true; //If the user is ok, return true to validate it
		}
	},
	handler: async (request, reply) => {
		return reply.response({ Hello : "World (Protected)!" });
	}
});


module.exports.handler = (event, context, callback) => { return server.handler(event, context, callback) };