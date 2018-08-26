const rewire = require("rewire")
let server_exports = rewire("../server.js")

const assert = require('assert')


get_latest_block_num_mock = function() { return 1}
load_block_by_num_mock = function(block_num) {
    response = {block_num: block_num,
            id: 1}
    return response
}

server_exports.__set__("get_latest_block_num", get_latest_block_num_mock)
server_exports.__set__("load_block_by_num", load_block_by_num_mock)


describe("Server Start", function() {
    describe("start", function() {
        block_result = server_exports.start()
        console.log(block_result)
        it("should have id of latest block", function() {
            assert.equal(block_result.id, 1)
        })
        it("should have number of latest block", function() {
            assert.equal(block_result.block_num, 1)
        })
    })
})


