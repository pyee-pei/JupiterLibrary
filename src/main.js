import JupiterDoc from "./jupiter.js";
import { allDocs, devDecisions } from "./reports.js";
import utils from "./utils.js";

var docs = [];
var factTypes = [];
var docTypes = [];
var tags = [];

const jupiterDocs = [];

// fetch data from json files and put them into variables
const getDocs = () => {
  return fetch("../data/documents.json")
    .then((res) => res.json())
    .then((data) => {
      return data;
    });
};

const getFactTypes = () => {
  return fetch("../data/factTypes.json")
    .then((res) => res.json())
    .then((data) => {
      return data;
    });
};

const getDocTypes = () => {
  return fetch("../data/documentTypes.json")
    .then((res) => res.json())
    .then((data) => {
      return data;
    });
};

const getTags = () => {
  return fetch("../data/tags.json")
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

const calcDocs = async () => {
  docs.forEach((doc) => {
    var jdoc = new JupiterDoc(doc, factTypes, docTypes, tags);
    jdoc.calcAllTermPayments();
    jdoc.calcDatePayments();
    //jdoc.calcOneTimePayments();
    jdoc.calcEstimatedPurchasePrice();
    jupiterDocs.push(jdoc);
  });

  // run a pass to associate amendments with parent docs
  jupiterDocs.forEach((doc, index) => {
    doc.processAmendments(jupiterDocs);
    doc.findDeeds(jupiterDocs);
    doc.qc();
  });
};

await calcDocs();

const documentsDiv = document.querySelector(".documents");

// filter jupiter docs and iterate to display data
jupiterDocs
  .filter((x) => x.agreement_terms.length > 0 || x.term_payment_models.length > 0)
  .forEach((doc, index) => {
    let p = document.createElement("p");
    p.setAttribute("class", "document");
    p.innerHTML = index + " - " + doc.name;
    documentsDiv.appendChild(p);
  });

var consoleHeaderFormat = "color: blue; font-size: 12px; font-weight: bold;";

// console.log(jupiterDocs[0].rawDoc.facts);

const factArray = [];
jupiterDocs.map((doc) => {
  doc.rawDoc.facts.map((fact) => {
    fact.fields.map((field) => {
      factArray.push({
        docId: doc.id,
        agreement_group: doc.agreement_group,
        factId: fact.id,
        factType: factTypes.find((x) => x.id === fact.factTypeId).name,
        fieldName: field.factTypeFieldName,
        factDate: (doc.effective_date ?? doc.amendment_date)?.toFormat("MM/dd/yyyy"),
        value: field.stringValue ?? field.dateValue ?? field.numberValue ?? field.booleanValue,
        fileName: doc.name,
      });
    });
  });
});

/*
const resultString = JSON.stringify(factArray, null, 2);
const blob = new Blob([resultString], { type: "application/json" });

const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = "jupiterFacts.json";

document.body.appendChild(a);

a.click();

console.log(factArray.slice(0, 30));

*/

console.log("%cDEV REPORTS:", consoleHeaderFormat);

console.log(allDocs(jupiterDocs));
console.log(devDecisions(jupiterDocs, 90));

console.log("%c~~~~~~~", consoleHeaderFormat);

console.log(jupiterDocs.filter((x) => x.termination?.termination_date));

console.log("%c~~~~~~~", consoleHeaderFormat);

console.log(jupiterDocs.find((x) => x.id === "cf043a46-e73e-457b-8050-5ab9291cad85"));
console.log(jupiterDocs.filter((x) => x.qc_flags.includes("Purchase Price but no Closing Date")));

const termModelIncreaseAmount = jupiterDocs.filter((doc) => {
  if (doc.term_payment_models.length > 0) {
    return doc.term_payment_models.some((model) => model.increase_amount > 0);
  }
});

console.log("Term Model Increase Amount", termModelIncreaseAmount);

const termIncreaseAmount = jupiterDocs.filter((doc) => {
  if (doc.agreement_terms.length > 0) {
    return doc.agreement_terms.some((term) => term.increase_amount > 0);
  }
});

console.log("Term Increase Amount", termIncreaseAmount);

const nonIntTermLengths = jupiterDocs.filter((doc) => {
  if (doc.agreement_terms.length > 0) {
    return doc.agreement_terms.some((term) => (term.term_length_years * 100) % 1 !== 0);
  }
});

console.log("Non-Integer Term Lengths", nonIntTermLengths);

console.log("%cAll docs with term payment models:", consoleHeaderFormat);
console.log(jupiterDocs.filter((x) => x.term_payment_models.length > 0));

const total_qc_count = jupiterDocs.reduce((acc, doc) => acc + doc.qc_flags.length, 0);
console.log("Total QC Flag Count:", total_qc_count);

console.log(jupiterDocs.filter((x) => x.qc_flags.length > 0));
console.log(jupiterDocs.filter((x) => x.qc_flags.length > 0 && x.agreement_terms.length > 0));

// find docs with a qc_flag similar to 'Date % Model' (wildcard % search)
console.log(jupiterDocs.filter((x) => x.qc_flags.some((flag) => flag.includes("First Payment"))));

/*

console.log(jupiterDocs.filter((x) => x.id === "27173908-621a-4f09-bb91-bc9ee195d84c"));

// console.log(jupiterDocs.find((x) => x.id === '7125c0e5-11b6-41b5-a94d-20b422915d7a'));
// console.log(jupiterDocs.find((x) => x.id === '9b4b5d40-1dc0-4806-b783-5799338bce99'));

console.log("%cAll docs with terms or payment models:", consoleHeaderFormat);
console.log(jupiterDocs.filter((x) => x.agreement_terms.length > 0 || x.term_payment_models.length > 0 || x.one_time_payment_models.length > 0));
// console.log(jupiterDocs.filter((x) => x.id === '04c13bf6-dcf7-4496-b2a3-b54588e9e279')[0]);
// console.log(jupiterDocs.filter((x) => x.id === 'c5feac8e-87ba-4cde-bdf9-5ed8074b391f')[0]);

console.log("%cThese docs have an outside date:", consoleHeaderFormat);
console.log(jupiterDocs.filter((x) => x.outside_date));

console.log("%cThese docs have property descriptions:", consoleHeaderFormat);
console.log(jupiterDocs.filter((doc) => doc.property_description.length > 0));

// filter to document where the rawDoc.facts array contains a fact with factTypeName of 'Property Description'
const docsWithPropertyDescription = jupiterDocs.filter((doc) => doc.rawDoc.facts.some((fact) => fact.factTypeName === "Property Description"));
console.log("%cThese docs have rawDoc property descriptions:", consoleHeaderFormat);
console.log(docsWithPropertyDescription);

// filter docsWithPropertyDescription where the property 'property_description' is empty
const docsWithEmptyPropertyDescription = docsWithPropertyDescription.filter((doc) => doc.property_description.length === 0);
console.log("%cThese docs have empty property descriptions:", consoleHeaderFormat);
console.log(docsWithEmptyPropertyDescription);

// filter to documents that are terminated
const terminatedDocs = jupiterDocs.filter((doc) => doc.terminated && doc.agreement_terms.length > 0);
console.log("%cThese docs are terminated:", consoleHeaderFormat);
console.log(terminatedDocs);

*/
// filter to documents that have deeds
const docsThatHaveDeeds = jupiterDocs.filter((doc) => doc.deed_count > 0);
console.log("%cThese docs have deeds:", consoleHeaderFormat);
console.log(docsThatHaveDeeds);

export default {};
