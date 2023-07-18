const express = require('express');
const redis = require('redis');
const { ReadingSchema } = require('./model/readings.js');
const { add, divide } = require('./utility/safe-math');

const app = express();
app.use(express.json());

const client = redis.createClient({
    socket: {
       port: 6379,
       host: 'client'
    }
});

client.on('error', err => console.log('Redis Client Error', err));

const pollutants = ["O3", "CO", "SO2", "NO2"];

app.post('/api/readings', async (req, res) => {
    const { body } = req;
    try {
        const data = ReadingSchema.validateSync(body, { abortEarly: false, stripUnknown: true });
        try {
            const sensors = await client.json.type('sensors');
            if (sensors) {
                await client.json.arrAppend('sensors', '.readings', body) 
            } else {
                await client.json.set('sensors', '$', {
                    readings: [body]
                })
            }
            return res.status(201).json({ message: 'Success', data });
        } catch (e) {
            return res.status(500).send('Error writing to cache.');
        }
      } catch (error) {
        //@ts-ignore
        // const error = e as ValidationError;
        return res.status(400).json({ errors: error.errors });
      }
})

app.get('/api/readings/summary', async (req, res) => {
    try {
        let sensors = await client.json.get('sensors', { path: '$.readings'});
        try {
            let data  = sensors[0];
            if (req.query.sensorId) data = data.filter(({ sensorId }) => sensorId === req.query.sensorId);
            let minimums = {"O3": undefined, "CO": undefined, "SO2": undefined, "NO2": undefined }
            let maximums = {"O3": undefined, "CO": undefined, "SO2": undefined, "NO2": undefined };
            let totals = {"O3": undefined, "CO": undefined, "SO2": undefined, "NO2": undefined }
            let countsOfReadings = {"O3": 0, "CO": 0, "SO2": 0, "NO2": 0 };
            let averages = {"O3": undefined, "CO": undefined, "SO2": undefined, "NO2": undefined }
            const length = data.length;
            for (var i = 0; i < length; i++) {
                let reading = data[i];
                let { quality, timestamp } = reading;
                pollutants.forEach((key) => {
                    let value = quality[key];
                    if (value !== undefined) {
                        countsOfReadings[key] += 1;
                        if (minimums[key] === undefined || value < minimums[key]?.value) {
                            minimums[key] = { timestamp, value };
                        }
                        if (maximums[key] === undefined || value > maximums[key]?.value) {
                            maximums[key] = { timestamp, value }
                        }
                        totals[key] = totals[key] === undefined ? value : (add(totals[key], value));
                    }
                });
            };
            pollutants.forEach((key) => {
                let total = totals[key];
                if (total !== undefined) {
                    averages[key] = divide(total, countsOfReadings[key]);
                };
            });
            const summary = pollutants.reduce((summary, current) => {
                summary[current] = {};
                summary[current]['units'] = (current === 'O3' || current === 'CO') ? 'ppm' : 'ppb';
                summary[current]['minimum'] = minimums[current];
                summary[current]['maximum'] = maximums[current];
                summary[current]['average'] = averages[current];
                return summary;
            }, {})
            res.json({ summary });

        } catch (err) {
            return res.status(500).send('Error parsing data.')
        }
        
    } catch (err) {
        return res.status(500).send('Error reading from cache.');
    }
});

const start = async function() {
    await client.connect();
    console.log('Connected to redis.');
    app.listen(8081, () => {
        console.log('Listening on port 8081')
    })
}
  
start();

module.exports = app;

