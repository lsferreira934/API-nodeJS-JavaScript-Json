import express from 'express';
import gradesRouter from './routes/grades.js';
import { promises as fs } from 'fs';
import winston from 'winston';

const { readFile, writeFile } = fs;
const { combine, timestamp, label, printf } = winston.format;
const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

global.fileName = 'grades.json';
global.logger = winston.createLogger({
  level: 'silly', // configuração do inicio do LOG, você pode mudar para outro level
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'grade-control-api.log' }),
  ],
  format: combine(
    label({ label: 'grade-control-api.log' }),
    timestamp(),
    myFormat
  ),
});

const app = express();
app.use(express.json());
app.use('/student', gradesRouter);
app.listen(3000, async () => {
  try {
    await readFile(global.fileName);
    logger.info('API Started!');
  } catch (err) {
    const grades = {
      nextId: 1,
      grades: [],
    };
    writeFile(global.fileName, JSON.stringify(grades))
      .then(() => {
        logger.info('API stared and file created!');
      })
      .catch((err) => {
        logger.erro(err);
      });
  }
});
