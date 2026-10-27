import { urlBaseTest } from './base-test.js';

// Chargé avant chaque fichier de test : l'application pointe sur la base de test.
process.env.DATABASE_URL = urlBaseTest();
process.env.SMS_DRIVER = 'console';
