import JupiterDoc from "./jupiter.js";

var docs = [];
var factTypes = [];

const jupiterDocs = [];

// fetch data from json files and put them into variables
const getDocs = () => {
    return fetch("../data/documents.json")
        .then(res => res.json())
        .then((data) => {
            return data;
        });
}

const getFactTypes = () => {
    return fetch("../data/factTypes.json")
        .then(res => res.json())
        .then((data) => {
            return data;
        });
}

// await both fetches to complete with Promise.all

const getDocsAndFactTypes = async () => {
    docs = await getDocs();
    factTypes = await getFactTypes();
    return { docs, factTypes };
}

// wait until arrays are filled
await getDocsAndFactTypes();

docs.forEach((doc) => {
    jupiterDocs.push(new JupiterDoc(doc, factTypes));
});

console.log(jupiterDocs);

export default {};
