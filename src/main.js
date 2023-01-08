//import { version } from '../package.json';
import JupiterDoc from './jupiter.js';

const myDoc = new JupiterDoc({
    id: 12345,
    name: 'test',
    //library_version: version
});

console.log(myDoc.getId());