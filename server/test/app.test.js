const app = require('../index');
const request = require('supertest');

describe("POST /api/readings: Create Reading ", () => {
    test("Create reading...", async () => {
        const response = await request(app)
            .post("/api/readings")
            .send({
                "sensorId": "3",
                "timestamp": "Tue Jun 13 2023 00:49:50 GMT-0400 (Eastern Daylight Time)",
                "quality": {
                    "O3": 0.5,
                    "CO": 0.3,
                    "SO2": 0.6,
                    "NO2": 55
                }
            })
            expect(response.statusCode).toBe(201);
            expect(response.body.errors).toBeUndefined();
            expect(response.body.data).toBeDefined();
            expect(response.body.data.sensorId).toBe("3");
            
    });

    test("Error if over maximum", async () => {
        const response = await request(app)
            .post("/api/readings")
            .send({
                "sensorId": "3",
                "timestamp": "Tue Jun 13 2023 00:49:50 GMT-0400 (Eastern Daylight Time)",
                "quality": {
                    "O3": 0.5,
                    "CO": 0.3,
                    "SO2": 0.6,
                    "NO2": 9999
                }
            })
            expect(response.statusCode).toBe(400);
            expect(response.body.errors).toBeDefined();
            
    });

    test("Error if below minimum", async () => {
        const response = await request(app)
            .post("/api/readings")
            .send({
                "sensorId": "3",
                "timestamp": "Tue Jun 13 2023 00:49:50 GMT-0400 (Eastern Daylight Time)",
                "quality": {
                    "O3": -3,
                    "CO": 0.3,
                    "SO2": 0.6,
                    "NO2": 1
                }
            })
            expect(response.statusCode).toBe(400);
            expect(response.body.errors).toBeDefined();
    });

    test("Error if incorrect type", async () => {
        const response = await request(app)
            .post("/api/readings")
            .send({
                "sensorId": true,
                "timestamp": "Tue Jun 13 2023 00:49:50 GMT-0400 (Eastern Daylight Time)",
                "quality": {
                    "O3": -3,
                    "CO": 0.3,
                    "SO2": 0.6,
                    "NO2": 1
                }
            })
            expect(response.statusCode).toBe(400);
            expect(response.body.errors).toBeDefined();
    });

    test("Missing required input...", async () => {
        const response = await request(app)
            .post("/api/readings")
            .send({
                "sensorId": "3",
                "quality": {
                    "O3": 0.5,
                    "CO": 0.3,
                    "SO2": 0.6,
                    "NO2": 2
                }
            })
            expect(response.statusCode).toBe(400);
            expect(response.body.errors).toBeDefined();
            expect(response.body.errors).toHaveLength(1);
    });
  });

  describe("GET /api/readings/summary: Get Sensor Readings Summary ", () => {
    beforeAll(async () => {
        await request(app).post("/api/readings").send({
                "sensorId": "59",
                "timestamp": 'Tue Jun 13 2023 11:58:29 GMT-0400 (Eastern Daylight Time)',
                "quality": {
                    "O3": 0.2,
                    "CO": 0.3,
                    "SO2": 0.6,
                    "NO2": 2
                }
            })
        await request(app).post("/api/readings").send({
                "sensorId": "59",
                "timestamp": 'Tue Jun 13 2023 11:58:29 GMT-0400 (Eastern Daylight Time)',
                "quality": {
                    "O3": 0.6,
                    "CO": 0.3,
                    "SO2": 0.6,
                    "NO2": 2
                }
            })
        await request(app).post("/api/readings").send({
                "sensorId": "13",
                "timestamp": 'Tue Jun 13 2023 11:58:29 GMT-0400 (Eastern Daylight Time)',
                "quality": {
                    "O3": undefined,
                    "CO": 0.3,
                    "SO2": 0.6,
                    "NO2": 2
                }
            })
      })
    test("Get sensor readings summary...", async () => {
        const response = await request(app).get("/api/readings/summary");
        expect(response.statusCode).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(typeof response.body.summary === 'object').toBe(true);
        expect(response.body.summary).toBeDefined();

    });

    test("Get sensor readings summary filtered by sensorId...", async () => {
        const response = await request(app).get("/api/readings/summary?sensorId=59");
        const { statusCode, body } = response;
        const { O3, CO, SO2, NO2 } = body.summary
        expect(statusCode).toBe(200);
        expect(body.errors).toBeUndefined();
        expect(typeof body.summary === 'object').toBe(true);
        expect(O3.minimum.value === 0.2).toBe(true);
        expect(O3.maximum.value === 0.6).toBe(true);
        expect(O3.average === 0.4).toBe(true);
    });

    test("Record units of readings", async () => {
        const response = await request(app).get("/api/readings/summary?sensorId=59");
        const { statusCode, body } = response;
        const { O3, CO, SO2, NO2 } = body.summary;
        expect(statusCode).toBe(200);
        expect(body.errors).toBeUndefined();
        expect(typeof body.summary === 'object').toBe(true);
        expect(O3.units === 'ppm').toBe(true);
        expect(CO.units === 'ppm').toBe(true);
        expect(SO2.units === 'ppb').toBe(true);
        expect(NO2.units === 'ppb').toBe(true);
    });

    test("Sensor readings can be faulty", async () => {
        const response = await request(app).get("/api/readings/summary?sensorId=13");
        const { statusCode, body } = response;
        const { O3, CO, SO2, NO2 } = body.summary;
        expect(statusCode).toBe(200);
        expect(body.errors).toBeUndefined();
        expect(typeof body.summary === 'object').toBe(true);
        expect(O3.units === 'ppm').toBe(true);
        expect(O3.minumum).toBeUndefined();
        expect(O3.maximum).toBeUndefined();
        expect(O3.average).toBeUndefined();
    });
});