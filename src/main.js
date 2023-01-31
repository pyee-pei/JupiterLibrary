import JupiterDoc from './jupiter.js';
// import utils from './utils.js';

var docs = [];
var factTypes = [];
var docTypes = [];
var tags = [];

const jupiterDocs = [];

// fetch data from json files and put them into variables
const getDocs = () => {
    return fetch('../data/documents.json')
        .then((res) => res.json())
        .then((data) => {
            return data;
        });
};

const getFactTypes = () => {
    return fetch('../data/factTypes.json')
        .then((res) => res.json())
        .then((data) => {
            return data;
        });
};

const getDocTypes = () => {
    return fetch('../data/documentTypes.json')
        .then((res) => res.json())
        .then((data) => {
            return data;
        });
};

const getTags = () => {
    return fetch('../data/tags.json')
        .then((res) => res.json())
        .then((data) => {
            return data;
        });
};

// await all fetches to complete with Promise.all

const getAllLookups = async () => {
    docs = await getDocs();
    factTypes = await getFactTypes();
    docTypes = await getDocTypes();
    tags = await getTags();
    return { docs, factTypes, docTypes };
};

// const jupiterizeAll = async () => {
//     // initial loop to Jupiterize docs
//     docs.forEach((doc) => {
//         var jdoc = new JupiterDoc(doc, factTypes, docTypes, tags);
//         jdoc.calcAllTermPayments();
//         jupiterDocs.push(jdoc);
//     });
// };

// wait until arrays are filled
await getAllLookups();

docs.forEach((doc) => {
    var jdoc = new JupiterDoc(doc, factTypes, docTypes, tags);
    jdoc.calcAllTermPayments();
    jupiterDocs.push(jdoc);
});

// run a pass to associate amendments with parent docs
jupiterDocs.forEach((doc, index) => {
    doc.processAmendments(jupiterDocs);
});

const documentsDiv = document.querySelector('.documents');

// filter jupiter docs and iterate to display data
jupiterDocs
    .filter((x) => x.lease_terms.length > 0)
    .forEach((doc, index) => {
        let p = document.createElement('p');
        p.setAttribute('class', 'document');
        p.innerHTML = index + ' - ' + doc.name;
        documentsDiv.appendChild(p);
    });

console.log(jupiterDocs.filter((x) => x.lease_terms.length > 0 || x.periodic_payment_models.length > 0));
console.log(jupiterDocs.filter((x) => x.id === 'af08218f-53ed-4fd6-97e1-cdecc6872548')[0]);
console.log(jupiterDocs.filter((x) => x.id === '878390b2-7380-44c5-8171-b07fbaef3592')[0]);

// for (let i = 0; i < 10; i++) {
//     console.log(utils.round(utils.calculateCompoundingGrowth(75000, 0.1, i), 4));
//     console.log(utils.round(utils.calculateGrowth(75000, 0.1, i), 4));
// }

export default {};
