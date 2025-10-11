const request = require('supertest');
const url = 'http://localhost';

describe('User API', () => {

    let adminAuthToken;
    let customerAuthToken;
    let userId;
    let testCustomerEmail;

    beforeAll(async () => {
        // check we are not in production mode
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Do not run tests in production mode!');
        }

        testCustomerEmail = 'customertest13@gnar.co.uk';
    });

    // Test authenticate with email and password
    it('POST /authenticate (as admin)', async () => {
        const response = await request(url).post('/authenticate')
        .set('Content-Type', 'application/json')
        .send({
            username: 'root@gnar.co.uk',
            password: 'gn4rlyR00tP0rt4lP4ss'
        });
        console.log(response.body);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');

        adminAuthToken = response.body.token;
    });

    // Create new customer user (success no auth required)
    it('POST /users (create new customer user no auth required)', async () => {
        const response = await request(url).post('/users')
        .set('Content-Type', 'application/json')
        .send({
            user: 
                {
                    email: testCustomerEmail,
                    password: 'password1234'
                }
        })
        console.log(response.body);
        expect(response.status).toBe(200);
        expect(response.body.users[0].email).toBe(testCustomerEmail);

        // Save the new user id
        userId = response.body.users[0].id;
        console.log('New user id: ' + userId);
    });

    // Test authenticate with new user
    it('POST /authenticate (as new customer user)', async () => {
        const response = await request(url).post('/authenticate')
        .set('Content-Type', 'application/json')
        .send({
            username: testCustomerEmail,
            password: 'password1234'
        });
        console.log(response.body);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');

        customerAuthToken = response.body.token;
    });

    // Fetch single customer user (as customer)
    it('GET /users/{id} (as customer)', async () => {
        const response = await request(url).get('/users/' + userId)
        .set('Authorization', 'Bearer ' + customerAuthToken);
        console.log(response.body);
        expect(response.status).toBe(200);
    });

    // Fetch all users (not authorised as customer)
    it('GET /users (not authorised as customer)', async () => {
        const response = await request(url).get('/users')
        .set('Authorization', 'Bearer ' + customerAuthToken);
        console.log(response.body);
        expect(response.status).toBe(403);
    });

    // Fetch all users (success as admin)
    it('GET /users (as admin)', async () => {
        const response = await request(url).get('/users')
        .set('Authorization', 'Bearer ' + adminAuthToken);
        console.log(response.body);
        expect(response.status).toBe(200);
    });

    // Update customer user (as customer)
    it('POST /users/{id} (as customer)', async () => {
        const response = await request(url).post('/users/' + userId)
        .set('Authorization', 'Bearer ' + customerAuthToken)
        .set('Content-Type', 'application/json')
        .send({
            email: 'changedcustomeremail2@gnar.co.uk'
        });
        console.log(response.body);
        expect(response.status).toBe(200);
        expect(response.body.user.email).toBe('changedcustomeremail2@gnar.co.uk');
    });

    // Update customer user (check cannot elevate role to admin)
    it('POST /users/{id} (as customer)', async () => {
        const response = await request(url).post('/users/' + userId)
        .set('Authorization', 'Bearer ' + customerAuthToken)
        .set('Content-Type', 'application/json')
        .send({
            role: 'service_admin'
        });
        console.log(response.body);
        expect(response.status).toBe(403);
    });-

    // Delete customer user (as admin)
    it('DELETE /users/{id} (as admin)', async () => {
        const response = await request(url).delete('/users/' + userId)
        .set('Authorization', 'Bearer ' + adminAuthToken);
        console.log(response.body);
        expect(response.status).toBe(200);
    });
});
