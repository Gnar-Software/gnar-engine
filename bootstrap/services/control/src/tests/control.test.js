import request from 'supertest';
const url = 'http://localhost:4000';
const authUrl = 'http://localhost:4001';

describe('Products API CRUD', () => {

    let authToken;
    let productId;

    beforeAll(async () => {
        // check we are not in production mode
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Do not run tests in production mode!');
        }
    });

    // authenticate with email and password
    it('POST /authenticate', async () => {
        const response = await request(authUrl).post('/authenticate')
        .set('Content-Type', 'application/json')
        .send({
            username: 'adam@gnar.co.uk',
            password: 'password'
        });
        console.log(response.body);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');

        authToken = response.body.token;
    });

    // schedule a task
    it('should return 200 OK - POST /tasks/schedule', async () => {
        const res = await request(url).post('/tasks/schedule')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + authToken)
        .send({
            name: 'test-task',
            payload: { test: 'data' },
            scheduled: new Date().addMonths(1),
            recurringInterval: 'monthly',
            recurringIntervalCount: 1,
            handlerServiceName: 'userService',
            handlerName: 'testHandler'
        });
        console.log(res.body);
        expect(res.statusCode).toEqual(200);
    });

});
