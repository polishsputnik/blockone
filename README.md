# blockone

To run: docker-compose up

This starts Postgres DB, EOSIO Generator, and a web server that gets blocks on demand. Web server listens on port 3000 (localhost:3000). At this page, you can get the latest block and see the block number and id, as well as get blocks by number or id. The web server also exposes a GraphQL endpoint on port 4000 (localhost:4000/graphql). GraphQL queries are structured like so:

{
  block(block_num: 29) {
    block_num,
  	id,
    hash
  }
}

Or:

{
  block(id: 0000000ca3edffe3a06ca13a334fdef97035c86559f758efbf8e1ffcbc0f396b) {
    block_num,
  	id,
    hash
  }
}

Hash currently returns 0 for all blocks because there doesn't seem to be a mechanism for getting the hash of the created block. :(

Unit test writing currently in progress.
