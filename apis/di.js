import axios from "axios";
import querystring from "querystring";
import fs from "fs";
import "dotenv/config";

const AUTH_URL = "https://identity.thoughttrace.com/connect/token";
const BASE_URL = "https://api.thoughttrace.com";

const getAccessToken = async () => {
  const body = querystring.stringify({
    grant_type: "client_credentials",
    client_id: process.env.DI_CLIENT_ID,
    client_secret: process.env.DI_CLIENT_SECRET,
  });

  const response = await axios.post(AUTH_URL, body);

  return response.data.access_token;
};

const getFactTypes = async () => {
  const accessToken = await getAccessToken();
  const response = await axios.get(`${BASE_URL}/factTypes`, { headers: { Authorization: `Bearer ${accessToken}` } });

  return response.data;
};

const getDocTypes = async () => {
  const accessToken = await getAccessToken();
  const response = await axios.get(`${BASE_URL}/documentTypes`, { headers: { Authorization: `Bearer ${accessToken}` } });
  return response.data;
};

const getTags = async () => {
  const accessToken = await getAccessToken();
  const response = await axios.get(`${BASE_URL}/tags`, { headers: { Authorization: `Bearer ${accessToken}` } });
  return response.data;
};

const postFact = async (doc, payload) => {
  const accessToken = await getAccessToken();
  const response = await axios.post(`${BASE_URL}/documents/${doc.id}/facts`, payload, { headers: { Authorization: `Bearer ${accessToken}` } });
  return response.data;
};

const getActiveFactFieldIds = (factTypes) => {
  // return array of all factType.fields.fieldTypeId where factType.isActive === true
  return factTypes
    .filter((factType) => !factType.archived)
    .map((factType) => factType.fieldTypes.map((field) => field.id))
    .flat();
};

// search for all documents
const searchDocuments = async () => {
  const accessToken = await getAccessToken();
  const factFieldIds = await getFactTypes(accessToken).then((data) => getActiveFactFieldIds(data));

  const response = await axios.post(
    `${BASE_URL}/documents/search`,
    {
      top: 500,
      skip: 0,
      sort: {
        field: "CreatedOn",
        direction: "desc",
      },
      factFieldTypeIdsToInclude: factFieldIds,
      includePageDetails: false,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

const docs = await searchDocuments();
const factTypes = await getFactTypes();
const docTypes = await getDocTypes();
const tags = await getTags();

// write to json files for web app to consume
fs.writeFileSync("./data/documents.json", JSON.stringify(docs, null, 2));
fs.writeFileSync("./data/factTypes.json", JSON.stringify(factTypes, null, 2));
fs.writeFileSync("./data/documentTypes.json", JSON.stringify(docTypes, null, 2));
fs.writeFileSync("./data/tags.json", JSON.stringify(tags, null, 2));

// this finds all docs with Operation Details > Termination Date and puts that value in Termination > Termination Date
// should be one-time use only
const updateTermFacts = async () => {
  const terminationDocs = docs.filter((doc) =>
    doc.facts.some(
      (f) =>
        f.factTypeId === "b4f52442-1b7d-4b04-8a37-eb114aec2210" &&
        f.fields.some((field) => field.factFieldTypeId === "77d6673d-5a8c-4d7e-bffe-04e8123e21b1")
    )
  );

  terminationDocs.map(async (doc) => {
    var payload = [
      {
        factTypeId: "9d5b0a1b-9cc5-4f7f-959e-9c26ea185431",
        fields: [
          {
            factFieldTypeId: "c55b250a-d482-43b2-89c4-91bd967021ab",
            dateValue: doc.facts
              .find((fact) => fact.factTypeId === "b4f52442-1b7d-4b04-8a37-eb114aec2210")
              .fields.find((field) => field.factFieldTypeId === "77d6673d-5a8c-4d7e-bffe-04e8123e21b1").dateValue,
          },
        ],
      },
    ];

    var response = await postFact(doc, payload);
    console.log(response);
  });
};

//console.log("breakpoint");

export { getAccessToken, getFactTypes, getDocTypes, getTags, postFact, getActiveFactFieldIds, searchDocuments };
