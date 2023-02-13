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
    jdoc.calcOneTimePayments();
    jupiterDocs.push(jdoc);
});

// run a pass to associate amendments with parent docs
jupiterDocs.forEach((doc, index) => {
    doc.processAmendments(jupiterDocs);
});

const documentsDiv = document.querySelector('.documents');

// filter jupiter docs and iterate to display data
jupiterDocs
    .filter((x) => x.agreement_terms.length > 0 || x.periodic_payment_models.length > 0 || x.one_time_payment_models.length > 0)
    .forEach((doc, index) => {
        let p = document.createElement('p');
        p.setAttribute('class', 'document');
        p.innerHTML = index + ' - ' + doc.name;
        documentsDiv.appendChild(p);
    });

console.log(jupiterDocs.filter((x) => x.agreement_terms.length > 0 || x.periodic_payment_models.length > 0 || x.one_time_payment_models.length > 0));
console.log(jupiterDocs.filter((x) => x.id === '86ab20ff-d2bd-49f2-8334-b19517cd7ba3')[0]);
console.log(jupiterDocs.filter((x) => x.id === 'eace6482-f8fc-4917-a993-4e45404ed469')[0]);
console.log(jupiterDocs.filter((x) => x.id === '20c1d6c3-68e5-4b5d-882f-f92c478543ea')[0]);
console.log(jupiterDocs.filter((x) => x.id === '4d657dd0-edf5-40c8-8717-6855b2681bf6')[0]);

// for (let i = 0; i < 10; i++) {
//     console.log(utils.round(utils.calculateCompoundingGrowth(75000, 0.1, i), 4));
//     console.log(utils.round(utils.calculateGrowth(75000, 0.1, i), 4));
// }

export default {};
