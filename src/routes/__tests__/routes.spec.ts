import { createConnection } from "typeorm";
import request from "supertest";
import { Connection, getConnection } from "typeorm";

import { app } from "../../app";

let connection: Connection;

beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations()
})

afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
})

describe("[POST] /api/v1/users", () => {
    
    it("Should be able create a new user", async () => {

        const user = {
            name: "John Doe",
            email: "john@example.com",
            password: "12345678"
        };
        
        const response = await request(app).post("/api/v1/users").send(user);

        expect(response.statusCode).toBe(201);
        expect(response.body).toMatchObject({});
    })

})


describe("[POST] /api/v1/sessions", () => {
    it("Should be able to authenticate user", async () => {
        const data = {
            email: "john@example.com",
            password: "12345678"
        }

        const response = await request(app).post("/api/v1/sessions").send(data);

        expect(response.body.user).toHaveProperty("id");
        expect(response.body).toHaveProperty("token");

    })
})

describe("[GET] /api/v1/profile", () => {
    it("should be able return info when user is authenticated", async () => {
        
        const user = {
            name: "John",
            email: "johnDoe@example.com",
            password: "12345678"
        };
        
        const userCreate = await request(app).post("/api/v1/users").send(user).expect(201);
        
        const userLogin = await request(app).post("/api/v1/sessions").send(user);
    
        const userList = await request(app).get("/api/v1/profile").set({
            Authorization: `Authorization ${userLogin.body.token}`
        });
                
        expect(userList.body).toHaveProperty("id");
    })
})


describe("[GET] /api/v1/statements/balance", () => {
    
    it("should be able return list with all operations of deposit and saque, and all balance in one property that name is balance", async () => {
        
        const user = {
            name: "John",
            email: "johnDoe2@example.com",
            password: "12345678"
        };
        
        const userCreate = await request(app).post("/api/v1/users").send(user).expect(201);
        
        const userLogin = await request(app).post("/api/v1/sessions").send(user);
    
        const userList = await request(app).get("/api/v1/statements/balance").set({
            Authorization: `Authorization ${userLogin.body.token}`
        });   

        expect(userList.body).toHaveProperty("statement")
        expect(userList.body).toHaveProperty("balance");
        
    })

})


describe("[POST] /api/v1/statements/deposit", () => {
    
    it ("Should be able create a new deposit", async () =>  {
        
        const user = {
            name: "John",
            email: "johnDoe3@example.com",
            password: "12345678"
        };
    
        const userCreate = await request(app).post("/api/v1/users").send(user).expect(201);
        
        const userLogin = await request(app).post("/api/v1/sessions").send(user);

        const userList = await request(app).post("/api/v1/statements/deposit").set({
            Authorization: `Authorization ${userLogin.body.token}`
        }).send({
            amount: 100,
            description: "description test"
        });
        
        expect(userList.status).toBe(201);

    })
})


describe("[POST] /api/v1/statements/withdraw", () => {
    it ("Should be able create a new withdraw", async () =>  {
        
        const user = {
            name: "John",
            email: "johnDoe4@example.com",
            password: "12345678"
        };

        const withdrawIntent = {
            amount: 50,
            description: "description test"
        }
    
        const userCreate = await request(app).post("/api/v1/users").send(user).expect(201);
        
        const userLogin = await request(app).post("/api/v1/sessions").send(user);
        
        const response = await request(app).get(`/api/v1/statements/balance`).set({
            Authorization: `Authorization ${userLogin.body.token}`
        });
        
        const userList = await request(app).post("/api/v1/statements/withdraw").set({
            Authorization: `Authorization ${userLogin.body.token}`
        }).send(withdrawIntent);
        
        if(response.body.balance >= withdrawIntent){
            expect(userList.status).toBe(201);
        } else {
            expect(userList.status).toBe(400);
        }


    })
})



describe("[GET] /api/v1/statements/:statement_id", () => {
    it("should be able to show informations of operation", async () => {
                
        const user = {
            name: "John",
            email: "johnDoe5@example.com",
            password: "12345678"
        };

        const userCreate = await request(app).post("/api/v1/users").send(user).expect(201);

        const userLogin = await request(app).post("/api/v1/sessions").send(user);

        const operation = await request(app).post('/api/v1/statements/deposit').set({
            Authorization: `Authorization ${userLogin.body.token}`
        }).send({
            amount: 100,
            description: "description test"
        });
        
        const statementOperation = await request(app)
        .get(`/api/v1/statements/${operation.body.id}`)
        .set({
            Authorization: `Authorization ${userLogin.body.token}`
        })

        expect(statementOperation.body).toHaveProperty("id");
        expect(statementOperation.body).toHaveProperty("user_id");
        expect(statementOperation.body).toHaveProperty("amount");
        expect(statementOperation.status).toBe(200);

    })
})