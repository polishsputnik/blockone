const express = require('express')
const server = express()
const PORT = 3000
const pg = require('pg')

var config = {
    user: 'postgres',
    database: 'blockone',
    password: 'password',
    host: 'localhost', // Server hosting the postgres database
    port: 5432, // env var: PGPORT
    max: 10, // max number of clients in the pool
    idleTimeoutMillis: 30000 // how long a client is allowed to remain idle before being closed
}

const pool = new pg.Pool(config)

Eos = require('eosjs')
// Private key or keys (array) provided statically or by way of a function.
// For multiple keys, the get_required_keys API is used (more on that below).
keyProvider= '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'

// Localhost Testnet (run ./docker/up.sh)
eos = Eos({keyProvider})

async function get_latest_block_num() {
    let info = await eos.getInfo({})
    let block_num = await info.last_irreversible_block_num

    return block_num
}

async function load_block(block_num) {

    let block_response = await eos.getBlock(block_num)
    //console.log(block_response)

    const client = await pool.connect()

    insert_block_query = "INSERT INTO blocks (" +
        "block_num, " +
        "timestamp, " +
        "previous, " +
        "transaction_mroot, " +
        "action_mroot, " +
        "block_mroot, " +
        "id, " +
        "ref_block_prefix) " +
        "VALUES ('" +
        block_response.block_num + "', '" +
        block_response.timestamp + "', '" +
        block_response.previous + "', '" +
        block_response.transaction_mroot + "', '" +
        block_response.action_mroot + "', '" +
        block_response.block_mroot + "', '" +
        block_response.id + "', '" +
        block_response.ref_block_prefix + "') ON CONFLICT DO NOTHING;"
    //console.log(insert_block_query)
    let res
    try {
        await client.query('BEGIN')
        try {
            res = await client.query(insert_block_query)
            await client.query('COMMIT')
        } catch (err) {
            await client.query('ROLLBACK')
            throw err
        }
    } finally {
        client.release()
    }
    //console.log(res)
    return block_response
}

async function start() {
    let block_num = await get_latest_block_num()
    let block_response = await load_block(block_num)
}


start()

express_graphql = require('express-graphql');
var { buildSchema } = require('graphql');
// GraphQL schema
schema = buildSchema(`
    type Query {
        block(block_num: Int, 
            id: String): Block
    },
    type Block {
        block_num: Int,
        timestamp: String,
        previous: String,
        transaction_mroot: String,
        action_mroot: String,
        block_mroot: String,
        id: String,
        ref_block_prefix: String
    }
`)

get_block = async function(args) {
    if (args.block_num) {
        block_num = args.block_num
        console.log(block_num)
        block_query = "SELECT * FROM blocks WHERE block_num = " + block_num + ";"
    }
    else if (args.id) {
        id = args.id
        console.log(id)
        block_query = "SELECT * FROM blocks WHERE id = '" + id + "';"
    }

    const client = await pool.connect()
    console.log(block_query)

    let res
    try {
        await client.query('BEGIN')
        try {
            res = await client.query(block_query)
            await client.query('COMMIT')
        } catch (err) {
            await client.query('ROLLBACK')
            throw err
        }
    } finally {
        client.release()
    }
    //console.log(res)

    if (res.rows.length > 0) {
        row = res.rows[0]
        //console.log(row)
        result = {
            block_num: row.block_num,
            timestamp: row.timestamp,
            previous: row.previous,
            transaction_mroot: row.transaction_mroot,
            action_mroot: row.action_mroot,
            block_mroot: row.block_mroot,
            id: row.id,
            ref_block_prefix: row.ref_block_prefix
        }
    }
    else {
        if (args.block_num) {
            result = load_block(block_num)
        }
        else if (args.id) {
            result = null
        }
    }

    //console.log(result)
    return result



}

// Root resolver
root = {
    block: get_block
}
// Create an express server and a GraphQL endpoint
app = express();
app.use('/graphql', express_graphql({
    schema: schema,
    rootValue: root,
    graphiql: true
}))
app.listen(4000, () => console.log('Express GraphQL Server Now Running On localhost:4000/graphql'))


app.get('/', function (req, res) {
    res.send('Hello World!')
})

app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
})