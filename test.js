import Database from 'better-sqlite3';

console.log('Database imported successfully.');
try {
    const db = new Database(':memory:');
    db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY)');
    console.log('Database created successfully.');
} catch (e) {
    console.error(e);
}
