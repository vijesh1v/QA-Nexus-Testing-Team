import sqlite3 from 'sqlite3';
console.log('sqlite3:', sqlite3);
const db = new sqlite3.Database(':memory:');
console.log('db created');
