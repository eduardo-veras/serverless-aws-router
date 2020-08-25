"use strict";

const slsRouter = require('../../lib');
const path = require('path');

const server = new slsRouter.Server({ Joi : require('joi') });


server.loadRoutes(path.join(__dirname, 'routes'), { recursive : true });


module.exports.handler = (event, context, callback) => server.handler(event, context, callback);