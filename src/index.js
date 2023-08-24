"use strict";

let promiser;
let databaseName = 'test.db';
let numRows = 2_000_000;
let retrieveCount = 0;


document.addEventListener("DOMContentLoaded", function() {
    document.getElementById('generate').addEventListener('click', function() {
        promiser = self.sqlite3Worker1Promiser( generate );
    });
    document.getElementById('retrieve').addEventListener('click', function() {
        retrieve();
    });
});


async function generate() {
    document.getElementById('generate').disabled = true;

    console.log('generate: opening db');
    await promiser('open', {
        filename: databaseName,
        vfs: 'opfs'
    });

    console.log('generate: inserting data');
    let insertSql = `
INSERT INTO t (url, title)
WITH RECURSIVE generate_series(value) AS (
    SELECT 1
    UNION ALL
    SELECT value + 1 FROM generate_series WHERE value + 1 <= ${numRows}
)
SELECT 
    'http://www.example.com/?value=' || value,
    'Title ' || value
FROM
    generate_series;
`;
    let response = await promiser('exec', {
        sql: [
            "DROP TABLE IF EXISTS t;",
            "CREATE TABLE t (url TEXT, title TEXT);",
            "BEGIN;",
            insertSql,
            "COMMIT;",
        ],
        countChanges: true
    });
    console.log(`generate: inserted ${response.result.changeCount} rows`);

    console.log('generate: closing db');
    await promiser('close', {});

    document.getElementById('generate').disabled = false;
}


async function retrieve() {
    ++retrieveCount;
    document.getElementById('retrieve').disabled = true;

    console.log(`retrieve ${retrieveCount}: opening db`);
    await promiser('open', {
        filename: databaseName,
        vfs: 'opfs'
    });

    console.log(`retrieve ${retrieveCount}: selecting rows`);
    let response = await promiser('exec', {
        sql: 'SELECT * FROM t',
        resultRows: [],
        rowMode: 'object'
    });
    console.log(`retrieve ${retrieveCount}: got ${response.result.resultRows.length} rows`);

    console.log(`retrieve ${retrieveCount}: closing db`);
    await promiser('close', {});

    document.getElementById('retrieve').disabled = false;
}

