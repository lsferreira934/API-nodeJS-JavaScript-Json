# API-nodeJS-JavaScript-Json

![](https://user-images.githubusercontent.com/56802012/89557028-96c37d80-d7e8-11ea-9f3e-e6f71ee72ad0.jpg)




# Por quê?
Mini Programa feito para estudo usando arquivos ".json", realizando manipulações desde leituras até  escritas. Projeto criado para aplicação de conhecimento em Javascript.
# Desafio
(✔) Crie um endpoint para criar uma grade. Este endpoint deverá receber como parâmetros
os campos student, subject, type e value conforme descritos acima. Esta grade deverá ser
salva no arquivo json grades.json, e deverá ter um id único associado. No campo
timestamp deverá ser salvo a data e hora do momento da inserção. O endpoint deverá
retornar o objeto da grade que foi criada. A API deverá garantir o incremento automático
deste identificador, de forma que ele não se repita entre os registros. Dentro do arquivo
grades.json que foi fornecido para utilização no desafio o campo nextId já está com um
valor definido. Após a inserção é preciso que esse nextId seja incrementado e salvo no
próprio arquivo, de forma que na próxima inserção ele possa ser utilizado

(✔) Crie um endpoint para atualizar uma grade. Este endpoint deverá receber como
parâmetros o id da grade a ser alterada e os campos student, subject, type e value. O
endpoint deverá validar se a grade informada existe, caso não exista deverá retornar um
erro. Caso exista, o endpoint deverá atualizar as informações recebidas por parâmetros
no registro, e realizar sua atualização com os novos dados alterados no arquivo
grades.json.

(✔) Crie um endpoint para excluir uma grade. Este endpoint deverá receber como
parâmetro o id da grade e realizar sua exclusão do arquivo grades.json.

(✔) Crie um endpoint para consultar uma grade em específico. Este endpoint deverá
receber como parâmetro o id da grade e retornar suas informações.

(✔) Crie um endpoint para consultar a nota total de um aluno em uma disciplina. O
endpoint deverá receber como parâmetro o student e o subject, e realizar a soma de
todas os as notas de atividades correspondentes a aquele subject para aquele student. O
endpoint deverá retornar a soma da propriedade value dos registros encontrados.

(✔) Crie um endpoint para consultar a média das grades de determinado subject e type. O
endpoint deverá receber como parâmetro um subject e um type, e retornar a média. A
média é calculada somando o registro value de todos os registros que possuem o subject
e type informados, e dividindo pelo total de registros que possuem este mesmo subject e
type

(✔) Crie um endpoint para retornar as três melhores grades de acordo com determinado
subject e type. O endpoint deve receber como parâmetro um subject e um type retornar
um array com os três registros de maior value daquele subject e type. A ordem deve ser
do maior para o menor.
# Tecnologias Utilizadas
### JavaScritp

##### Arquivo index.js

```javascript
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

```
##### Arquivo grades.js
```javascript
import express from 'express';
import { promises as fs } from 'fs';

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
```
#### Insomnia
![insomnia](https://user-images.githubusercontent.com/56802012/89560760-eb1d2c00-d7ed-11ea-9609-0ecbf25cca09.jpg)

#### Winston (Gerar Logs)
![winston](https://user-images.githubusercontent.com/56802012/89561000-42bb9780-d7ee-11ea-8e69-97c4157cb171.jpg)
