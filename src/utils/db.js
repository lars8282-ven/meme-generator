import { init, tx } from '@instantdb/react';
import rules from '../../instant.perms';

const APP_ID = '11721285-12af-4d29-b313-81b6a664697a';

// Initialize InstantDB with permissions
const db = init({ 
  appId: APP_ID,
  rules 
});
console.log('InstantDB initialized successfully');

export { db, tx };

