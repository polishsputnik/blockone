#!/bin/bash
set -e
set -x

pg_createcluster 9.4 main --start
/etc/init.d/postgresql start
psql -f create_fixtures.sql
/etc/init.d/postgresql stop