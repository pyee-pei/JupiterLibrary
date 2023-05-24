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
    jdoc.calcDatePayments();
    jdoc.calcOneTimePayments();
    jdoc.calcEstimatedPurchasePrice();
    jupiterDocs.push(jdoc);
});

// run a pass to associate amendments with parent docs
jupiterDocs.forEach((doc, index) => {
    doc.processAmendments(jupiterDocs);
});

const documentsDiv = document.querySelector('.documents');

// filter jupiter docs and iterate to display data
jupiterDocs
    .filter((x) => x.agreement_terms.length > 0 || x.term_payment_models.length > 0 || x.one_time_payment_models.length > 0)
    .forEach((doc, index) => {
        let p = document.createElement('p');
        p.setAttribute('class', 'document');
        p.innerHTML = index + ' - ' + doc.name;
        documentsDiv.appendChild(p);
    });

var consoleHeaderFormat = 'color: blue; font-size: 12px; font-weight: bold;';

console.log(jupiterDocs.filter((x) => x.id === 'acbb1921-adfa-4b89-93e3-9b3b6e43b8bc'));

// console.log(jupiterDocs.find((x) => x.id === '7125c0e5-11b6-41b5-a94d-20b422915d7a'));
// console.log(jupiterDocs.find((x) => x.id === '9b4b5d40-1dc0-4806-b783-5799338bce99'));

console.log('%cAll docs with terms or payment models:', consoleHeaderFormat);
console.log(jupiterDocs.filter((x) => x.agreement_terms.length > 0 || x.term_payment_models.length > 0 || x.one_time_payment_models.length > 0));
// console.log(jupiterDocs.filter((x) => x.id === '04c13bf6-dcf7-4496-b2a3-b54588e9e279')[0]);
// console.log(jupiterDocs.filter((x) => x.id === 'c5feac8e-87ba-4cde-bdf9-5ed8074b391f')[0]);

console.log('%cThese docs have an outside date:', consoleHeaderFormat);
console.log(jupiterDocs.filter((x) => x.outside_date));

// console.log('%cThese docs have property descriptions:', consoleHeaderFormat);
// jupiterDocs
//     .filter((doc) => doc.property_description.length > 0)
//     .forEach((doc) => {
//         console.log(doc);
//     });

// console.log('%cThese docs have price per acre:', consoleHeaderFormat);
// jupiterDocs
//     .filter(
//         (doc) =>
//             doc.term_payment_models.some((model) => model.payment_per_acre > 0) || doc.date_payment_models.some((model) => model.payment_per_acre > 0)
//     )
//     .forEach((doc) => {
//         console.log(doc);
//     });

// filter jupiterDocs for any doc with a term that is cancelled by ops
// console.log('%cThese docs have a cancelled term:', consoleHeaderFormat);
// jupiterDocs
//     .filter((doc) => doc.agreement_terms.some((term) => term.cancelled_by_ops === true))
//     .forEach((doc) => {
//         console.log(doc);
//     });

// console.log('%cThese docs have multiple splits on the Grantor:', consoleHeaderFormat);
// jupiterDocs
//     .filter((doc) => doc.grantor.length > 1)
//     .forEach((doc) => {
//         console.log(doc);
//     });

// console.log('%cThese docs have operational details:', consoleHeaderFormat);
// jupiterDocs
//     .filter((doc) => doc.operational_details)
//     .forEach((doc) => {
//         console.log(doc);
//     });

// console.log('%cThese docs have date-based payments:', consoleHeaderFormat);
// jupiterDocs
//     .filter((doc) => doc.date_payment_models.length > 0)
//     .forEach((doc) => {
//         console.log(doc);
//     });

// jupiterDocs.forEach((doc) => {
//     if (!doc.grantor[0]) return;
//     console.log(doc.grantor[0]['grantor/lessor_name']);
//     console.log(doc.nicknameGrantor(doc.grantor[0]['grantor/lessor_name']));
// });

// for (let i = 0; i < 10; i++) {
//     console.log(utils.round(utils.calculateCompoundingGrowth(75000, 0.1, i), 4));
//     console.log(utils.round(utils.calculateGrowth(75000, 0.1, i), 4));
// }

export default {};
