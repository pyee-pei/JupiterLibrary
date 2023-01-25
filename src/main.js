import JupiterDoc from './jupiter.js';
import utils from './utils.js';

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

const jupiterizeAll = async () => {
    // initial loop to Jupiterize docs
    docs.forEach((doc) => {
        jupiterDocs.push(new JupiterDoc(doc, factTypes, docTypes, tags));
    });
};

// wait until arrays are filled
await getAllLookups();

await jupiterizeAll();

const documentsDiv = document.querySelector('.documents');

// run a pass to associate amendments with parent docs
jupiterDocs.forEach((doc, index) => {
    const amendments = jupiterDocs.filter((x) => x.agreement_id === doc.agreement_id && x.amendment_date && x.id !== doc.id);
    if (amendments) {
        // sort amendments by amendment date, adding an ordinal property
        amendments
            .sort((a, b) => {
                return new Date(a.amendment_date) - new Date(b.amendment_date);
            })
            .map((x) => (x.amendment_ordinal = amendments.indexOf(x) + 1));

        // check each amendment for new values
        // newer amendments overwrite older values

        amendments.forEach((amendment) => {
            // leased acres
            // only write if different from parent doc
            if (amendment.leased_acres && amendment.leased_acres !== doc.leased_acres) {
                doc.amended_leased_acres = amendment.leased_acres;
            }

            // lease terms
            if (amendment.lease_terms && amendment.lease_terms.length > 0) {
                doc.amended_lease_terms = amendment.lease_terms;
            }

            // periodic payment models
            if (amendment.periodic_payment_models && amendment.periodic_payment_models.length > 0) {
                doc.amended_periodic_payment_models = amendment.periodic_payment_models;
            }
        });
    }
});

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
console.log(jupiterDocs.filter((x) => x.id === '2917c80e-5c87-444a-b085-1e937d6a6897')[0]);
console.log(jupiterDocs.filter((x) => x.id === '2a004f02-1d0a-426e-a878-731db53415e5')[0]);

// for (let i = 0; i < 10; i++) {
//     console.log(utils.round(utils.calculateCompoundingGrowth(75000, 0.1, i), 4));
//     console.log(utils.round(utils.calculateGrowth(75000, 0.1, i), 4));
// }

export default {};
