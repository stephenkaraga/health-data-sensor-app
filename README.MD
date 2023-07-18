Steps
Ensure Docker and Docker compose is installed.
https://docs.docker.com/compose/install/
Start Docker
In terminal, run:
docker-compose up --build --remove-orphans


Endpoints:
POST http://localhost:8081/api/readings
Example request body:
{
    "sensorId": "3",
    "timestamp": "Tue Jun 13 2023 00:49:50 GMT-0400 (Eastern Daylight Time)",
    "quality": {
        "O3": 0.5,
        "CO": 0.3,
        "SO2": 0.6,
        "NO2": 999
    }
}

GET http://localhost:8081/api/readings/summary
Optional query param of sensorId
GET http://localhost:8081/api/readings/summary?sensorId=59