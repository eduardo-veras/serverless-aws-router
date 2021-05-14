"use strict";

const slsRouter = require('../../lib');
const path = require('path');

const server = new slsRouter.Server({ Joi : require('joi') });


server.loadRoutes(path.join(__dirname, 'routes'), { recursive : true });


/*
// Lifecycle Events
server.on('onEvent', async event => {
	console.log('onEvent', event);
});

server.on('onRequest', async request => {
	console.log('onRequest', request);
});

server.on('onPostAuth', async request => {
	console.log('onPostAuth',request);
});

server.on('onPreHandler', async request => {
	console.log('onPreHandler', request);
});

server.on('onPostHandler', async payload => {
	console.log('onPostHandler', payload);
});

server.on('onPreResponse', async response => {
	console.log('onPreResponse', response);
});
*/


module.exports.handler = (event, context, callback) => server.handler(event, context, callback);