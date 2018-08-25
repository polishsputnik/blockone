const express = require('express');
const server = express();
const PORT = 3000;

const { Pool, Client } = require('pg')
const connectionString = 'postgresql://postgres:password@localhost:5432/blockone'

const pool = new Pool({
  connectionString: connectionString,
})

pool.query('SELECT NOW()', (err, res) => {
  console.log(err, res)
  pool.end()
})

const client = new Client({
  connectionString: connectionString,
})
client.connect()

client.query('SELECT NOW()', (err, res) => {
  console.log(err, res)
  client.end()
})


server.listen(PORT, () => console.log(`Server running on ${PORT}`));
server.get('/', (req, res) => res.status(200).send('hello'));