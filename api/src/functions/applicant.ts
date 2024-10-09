import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Sequelize, DataTypes } from 'sequelize';
import Joi = require('joi');
import ApplicantModel from '../models/applicant';
const validateBody = require('../validators/applicantsValidate');

const sequelize = new Sequelize(process.env['PGDATABASE'], process.env['PGUSER'], process.env['PGPASSWORD'], {
    host: process.env['PGHOST'],
    dialect: 'postgres',
    logging: false,
});

export async function applicant(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        await sequelize.authenticate();
        ApplicantModel(sequelize, DataTypes);
        const Applicant = sequelize.models.Applicant;
        Applicant.sync()

        if (request.method === 'GET') {
            const id = request.query.get('id');
            context.debug('id:', id);
            if (!id) {
                const applicants = await Applicant.findAll({});
                return { jsonBody: applicants }
            } else {
                Joi.assert(id, Joi.string().guid());
                const applicant = await Applicant.findByPk(id);
                if (!applicant) {
                    return { status: 404, body: 'applicant not found' }
                }
                return { jsonBody: applicant }
            }
        } else if (request.method === 'POST') {
            const reqBody = await request.json() as any;
            context.debug('reqBody:', reqBody);
            validateBody(reqBody);

            const applicant = await Applicant.create({
                name: reqBody['name'],
                email: reqBody['email'],
                mobile_no: reqBody['mobile_no'],
            });

            return { jsonBody: applicant }

        } else if (request.method === 'PATCH') {

            const id = request.query.get('id');
            context.debug('id:', id);
            const reqBody = await request.json() as any;
            context.debug('reqBody:', reqBody);
            Joi.assert(id, Joi.string().guid().required());
            validateBody(reqBody);

            const applicant = await Applicant.findByPk(id);
            if (!applicant) {
                return { status: 400, body: 'invalid id provided' }
            }

            const result = await sequelize.transaction(async t => {
                const applicant = await Applicant.findByPk(id, { transaction: t });
                applicant.update(reqBody);
                return applicant;
            });
            return { jsonBody: result.dataValues }

        } else if (request.method === 'DELETE') {
            const id = request.query.get('id');
            context.debug('id:', id);
            Joi.assert(id, Joi.string().guid());
            const applicant = await Applicant.findByPk(id);
            if (!applicant) {
                return { status: 400, body: 'invalid id provided' }
            }
            await applicant.destroy();
            return { body: id }
        }

    } catch (error) {
        context.error('applicants: error encountered:', error);
        if (error?.message?.startsWith('unauthorized')) { return { status: 403, body: error } }
        if (Joi.isError(error)) return { status: 400, jsonBody: error }
        return { status: 500, body: `Unexpected error occured: ${error}` }
    }
}

app.http('applicants', {
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    authLevel: 'anonymous',
    handler: applicant
});
