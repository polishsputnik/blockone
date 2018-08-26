CREATE TABLE block(
  block_num bigint PRIMARY KEY,
  id VARCHAR(128) UNIQUE NOT NULL,
  timestamp TIMESTAMP,
  previous VARCHAR(128),
  transaction_mroot VARCHAR(128),
  action_mroot VARCHAR(128),
  block_mroot VARCHAR(128),
  ref_block_prefix VARCHAR(128)
);