import express from 'express';
import { promises as fs } from 'fs';
import { throws } from 'assert';

const { readFile, writeFile } = fs;
const router = express();

//Endpoint "GET" para exibir o json
router.get('/', async (req, res, next) => {
  try {
    const data = JSON.parse(await readFile(global.fileName));
    await writeFile(global.fileName, JSON.stringify(data, null, 2));
    delete data.nextId;
    res.send(data);
    logger.info(`GET /student - ${global.fileName}`);
  } catch (err) {
    next(err);
    logger.info('GET /student');
  }
});

//Endpoint "POST" para adicionar
router.post('/', async (req, res, next) => {
  try {
    let students = req.body;

    if (
      !students.student ||
      !students.subject ||
      !students.type ||
      students.value < 0
    ) {
      throw new Error('Student, subject, type ou value são obrigatórios');
    }

    const data = JSON.parse(await readFile(global.fileName));
    students = {
      id: data.nextId++,
      student: students.student,
      subject: students.subject,
      type: students.type,
      value: students.value,
      timestamp: new Date(),
    };

    data.grades.push(students);

    await writeFile(global.fileName, JSON.stringify(data, null, 2));

    res.send(students);

    logger.info(`POST /student - ${JSON.stringify(students)}`);
  } catch (err) {
    next(err);
  }
});

//Endpoint "GET" para exibir a busca do Id no body
router.get('/:id', async (req, res) => {
  try {
    const data = JSON.parse(await readFile(global.fileName));
    const student = data.grades.find(
      (student) => student.id === Number(req.params.id)
    );

    res.send(student);
    logger.info(`GET /student/${req.params.id}`);
  } catch (err) {
    next(err);
    logger.info('GET /student/:id');
  }
});

//Endpoint "PUT" para altera uma chave no arquivo json
router.put('/', async (req, res, next) => {
  try {
    let students = req.body;
    const data = JSON.parse(await readFile(global.fileName));
    const comperData = data.grades.map((item) => {
      return `${item.id}`;
    });

    if (comperData.indexOf(students.id.toString()) === -1) {
      throw new Error('Id inexistente');
    } else if (
      !students.student ||
      !students.subject ||
      !students.type ||
      students.value < 0
    ) {
      throw new Error('Id, student, subject, type ou value são obrigatórios');
    }

    const index = data.grades.findIndex((index) => index.id === students.id);

    data.grades[index].student = students.student;
    data.grades[index].subject = students.subject;
    data.grades[index].type = students.type;
    data.grades[index].value = students.value;
    data.grades[index].timestamp = new Date();

    await writeFile(global.fileName, JSON.stringify(data, null, 2));

    res.send(students);
    logger.info(`PUT /student - ${JSON.stringify(students)}`);
  } catch (err) {
    next(err);
  }
});

//Endpoint "DELETE" para excuir uma chave no arquivo json
router.delete('/:id', async (req, res, next) => {
  try {
    const data = JSON.parse(await readFile(global.fileName));

    const removedStudent = data.grades.filter(
      (student) => student.id === parseInt(req.params.id)
    );

    data.grades = data.grades.filter(
      (student) => student.id !== parseInt(req.params.id)
    );

    await writeFile(global.fileName, JSON.stringify(data, null, 2));
    res.send(removedStudent);

    logger.info(`DELETE /student/:id ${JSON.stringify(removedStudent)}`);
  } catch (err) {
    next(err);
  }
});

//Endpoint "GET" para Buscar uma estudante por nome e matéria
router.get('/:student/:subject', async (req, res, next) => {
  try {
    const data = JSON.parse(await readFile(global.fileName));
    const studentAll = data.grades.filter(
      (student) => student.student === req.params.student
    );

    const subjectAll = studentAll.filter(
      (student) => student.subject === req.params.subject
    );

    const valueAll = subjectAll.reduce((acc, cur) => acc + cur.value, 0);

    let studentFinal = {
      student: req.params.student,
      subject: req.params.subject,
      valueTotal: valueAll,
    };

    res.send(studentFinal);
    logger.info(`GET /${req.params.student}/${req.params.subject}`);
  } catch (err) {
    next(err);
    logger.info(`GET /:student/:subject`);
  }
});

//Endpoint "GET" para Buscar por nome da matéria e o tipo, mostrando o valor total mais a média com os nomes do alunos que participarão e suas notas
router.get('/materia/:subject/:type', async (req, res, next) => {
  try {
    const data = JSON.parse(await readFile(global.fileName));
    const subjectAll = data.grades.filter(
      (subject) => subject.subject === req.params.subject
    );
    const typeAll = subjectAll.filter((type) => type.type === req.params.type);

    const valueSubjectType = typeAll.reduce((acc, cur) => acc + cur.value, 0);

    let averageSubjectType = valueSubjectType / typeAll.length;

    const names = typeAll.map((name) => {
      return `Estudantes: ${name.student} / Nota: ${name.value}`;
    });

    let resultFinal = {
      subject: req.params.subject,
      type: req.params.type,
      totalValue: valueSubjectType,
      averageValue: averageSubjectType,
      studentsName: names,
    };

    res.send(resultFinal);
    logger.info(`GET /materia/${req.params.subject}/${req.params.type}`);
  } catch (error) {
    next(err);
    logger.info(`GET /materia/:subject/:type`);
  }
});

router.get('/melhoresnotas/:subject/:type', async (req, res, next) => {
  try {
    const data = JSON.parse(await readFile(global.fileName));
    const subjectAll = data.grades.filter(
      (subject) => subject.subject === req.params.subject
    );
    const typeAll = subjectAll.filter((type) => type.type === req.params.type);
    const sortByHighest = typeAll.sort((a, b) => b.value - a.value);
    const mapTypeAll = sortByHighest.map((type) => {
      return `${Number(type.value)}`;
    });

    const resultFInal = {
      amount: sortByHighest.slice(0, 4).length,
      highestValue: Math.max(...mapTypeAll),
      lowerValue: Math.min(...mapTypeAll),
      filtersTheTop3: sortByHighest.slice(0, 3),
    };

    res.send(resultFInal);
    logger.info(`GET /melhoresnotas/${req.params.subject}/${req.params.type}`);
  } catch (err) {
    next(err);
    logger.info(`GET /melhoresnotas/:subject/:type`);
  }
});

router.use((err, req, res, next) => {
  logger.error(`${req.method} ${req.baseUrl} - ${err.message}`);
  res.status(400).send({ error: err.message });
});

export default router;
