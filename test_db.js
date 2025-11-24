import { initializeDatabase } from './backend/database.js';
import fs from 'fs';

console.log('Imported DB');
try {
    initializeDatabase()
        .then(() => {
            console.log('Initialized');
            fs.writeFileSync('db_success.txt', 'Success');
        })
        .catch(e => {
            console.error(e);
            fs.writeFileSync('db_error.txt', e.toString());
        });
} catch (e) {
    fs.writeFileSync('db_sync_error.txt', e.toString());
}
