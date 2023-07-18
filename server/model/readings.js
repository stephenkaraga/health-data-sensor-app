const { date, number, object, ref, string } = require("yup");

const ReadingSchema = object({
    sensorId: string().required(),
    timestamp: date().required(),
    quality: object({
      O3: number().min(0).max(0.604).default(undefined),
      CO: number().min(0).max(50.4).default(undefined),
      SO2: number().min(0).max(1004).default(undefined),
      NO2: number().min(0).max(2049).default(undefined),
    }).required()
  });

exports.ReadingSchema = ReadingSchema;