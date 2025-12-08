import { init, tx } from '@instantdb/react';

const APP_ID = '11721285-12af-4d29-b313-81b6a664697a';

// Initialize InstantDB - schema is optional and can be defined in the dashboard
const db = init({ appId: APP_ID });
console.log('InstantDB initialized successfully');
console.log('db object keys:', Object.keys(db));
console.log('db.transact:', typeof db.transact);

export { db, tx };

