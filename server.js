exports = {}

const express = require('express')
const server = express()
const GRAPHQL_PORT = 4000
const HTTP_PORT = 3000
const HOST ='0.0.0.0'

const pg = require('pg')
const db_config = {
    user: 'postgres',
    database: 'block_one',
    password: 'password',
    host: process.env.DATABASE_HOST, // Server hosting the postgres database
    port: 5432, // env var: PGPORT
    max: 10, // max number of clients in the pool
    idleTimeoutMillis: 30000 // how long a client is allowed to remain idle before being closed
}
const pool = new pg.Pool(db_config)

const Eos = require('eosjs')
// Private key or keys (array) provided statically or by way of a function.
// For multiple keys, the get_required_keys API is used (more on that below).
const eos_config = {

    chainId: null, // 32 byte (64 char) hex string
    keyProvider: '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3', // WIF string or array of keys..
    httpEndpoint: 'http://' + process.env.EOS_HOST + ':8888',
    expireInSeconds: 60,
    broadcast: true,
    verbose: false, // API activity
    sign: true
}
// Localhost Testnet (run ./docker/up.sh)
const eos = Eos(eos_config)




async function get_latest_block_num() {
    const info = await eos.getInfo({})
    const block_num = await info.last_irreversible_block_num

    return block_num
}

async function insert_block(block) {
    const client = await pool.connect()

    const hash =0 //figure out what to get here

    const insert_block_query = "INSERT INTO block (" +
        "block_num, " +
        "timestamp, " +
        "previous, " +
        "transaction_mroot, " +
        "action_mroot, " +
        "block_mroot, " +
        "id, " +
        "ref_block_prefix, " +
        "input_transactions," +
        "producer_signature, " +
        "hash) " +
        "VALUES ('" +
        block.block_num + "', '" +
        block.timestamp + "', '" +
        block.previous + "', '" +
        block.transaction_mroot + "', '" +
        block.action_mroot + "', '" +
        block.block_mroot + "', '" +
        block.id + "', '" +
        block.ref_block_prefix + "'," +
        block.input_transactions.length + ", '" +
        block.producer_signature + "', '" +
        hash + "') ON CONFLICT DO NOTHING;"
    console.log(insert_block_query)
    try {
        await client.query('BEGIN')
        try {
            await client.query(insert_block_query)
            await client.query('COMMIT')
        } catch (err) {
            await client.query('ROLLBACK')
            throw err
        }
    } finally {
        client.release()
    }
}

async function load_block_by_num(block_num) {

    const block_response = await eos.getBlock(block_num)
    //console.log(block_response)
    await insert_block(block_response)

    console.log(block_response)

    return block_response
}

async function load_block_by_id(id) {

    const block_response = await eos.getBlock(id)
    //console.log(block_response)
    await insert_block(block_response)

    console.log(block_response)

    return block_response
}



const express_graphql = require('express-graphql');
const  { buildSchema } = require('graphql');
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
        ref_block_prefix: String,
        input_transactions: Int,
        producer_signature: String,
        hash: String
    }
`)

get_block = async function(args) {
    let block_query = ''
    if (args.block_num) {
        const block_num = args.block_num
        console.log(block_num)
        block_query = "SELECT * FROM block WHERE block_num = " + block_num + ";"
    }
    else if (args.id) {
        const id = args.id
        console.log(id)
        block_query = "SELECT * FROM block WHERE id = '" + id + "';"
    }
    else {
        return null
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
        const row = res.rows[0]
        //console.log(row)
        const result = {
            block_num: row.block_num,
            timestamp: row.timestamp,
            previous: row.previous,
            transaction_mroot: row.transaction_mroot,
            action_mroot: row.action_mroot,
            block_mroot: row.block_mroot,
            id: row.id,
            ref_block_prefix: row.ref_block_prefix,
            input_transactions: row.input_transactions,
            producer_signature: row.producer_signature,
            hash: row.hash
        }
        return result
    }
    else {
        if (args.block_num) {
            return load_block_by_num(args.block_num)
        }
        else if (args.id) {
            return load_block_by_id(args.id)
        }
    }
}

// Root resolver
const root = {
    block: get_block
}
// Create an express server and a GraphQL endpoint
const app = express();
app.use('/graphql', express_graphql({
    schema: schema,
    rootValue: root,
    graphiql: true
}))
app.listen(GRAPHQL_PORT, HOST, () => console.log('Express GraphQL Server Now Running On localhost:' + GRAPHQL_PORT + '/graphql'))





app.set('view engine', 'ejs')
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));


exports.start = async function () {
    const block_num = await get_latest_block_num()
    const block = await load_block_by_num(block_num)
    const result = {block_num: block_num,
        id: block.id}
    return result
}

app.get('/', async function (req, res) {
    const result = await exports.start()
    res.render('index', {id: result.id, block_num: result.block_num, error: null})
})


exports.update = async function (req) {
    if (req.body.block_num) {
        const block_num = req.body.block_num
        //console.log(block_num)
        const block = await load_block_by_num(block_num)
        const id = await block.id
        //console.log(id)

        const result = await {block_num: block_num,
            id: id}
        return result
    }
    else if (req.body.id) {
        const id = req.body.id
        //console.log(block_num)
        const block = await load_block_by_id(id)

        const block_num = await block.block_num
        //console.log(id)

        const result = await {block_num: block_num,
            id: id}
        return result
    }
    else {
        return exports.start()
    }
}

app.post('/', async function (req, res) {
    const result = await exports.update(req)
    res.render('index', {id: result.id, block_num: result.block_num, error: null})

})

app.listen(HTTP_PORT, HOST, function () {
    console.log('Web server listening on port ' + HTTP_PORT)
})

module.exports = exports