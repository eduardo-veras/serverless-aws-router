"use strict";

const Joi = require('joi');

module.exports.register = (server) => {

	server.route({
		method: 'GET',
		path: '/',
		handler: async (request, reply) => {
			return reply.response({ Hello : "World!" });
		}
	});

	server.route({
		method: 'GET',
		path: '/meta',
		handler: async (request, reply) => {
			return reply.response({ ok: true }).meta('page', { actual : 1 });
		}
	});

	server.route({
		method: 'GET',
		path: '/validation',
		config: {
			validate:{
				query: { page : Joi.number().required() }
			}
		},
		handler: async (request, reply) => {
			return reply.response({ ok: true });
		}
	});

	server.route({
		method: 'GET',
		path: '/status202',
		handler: async (request, reply) => {
			return reply.response({ ok: true }).code(202);
		}
	});

	server.route({
		method: 'GET',
		path: '/validationSchema',
		config: {
			validate:{
				query: Joi.object({ page : Joi.number().required() })
			}
		},
		handler: async (request, reply) => {
			return reply.response({ ok: true });
		}
	});

};