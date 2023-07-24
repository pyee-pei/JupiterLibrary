import axios from "axios";
import querystring from "querystring";

const CLIENT_ID = "0a089276-00f5-444f-e407-08dac8de685f";
const CLIENT_SECRET = "/7iqIntITg0OJPthutQLSND3zh1W40kyQD4oE516LLbbcJEKmDGzBHTAa6Zgb4shvWYQE4p5bBTNZ1nTePftvA==";

const AUTH_URL = "https://identity.thoughttrace.com/connect/token";
const BASE_URL = "https://api.thoughttrace.com";

const getAccessToken = async () => {
  const body = querystring.stringify({
    grant_type: "client_credentials",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
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

export default {
  getAccessToken,
  getFactTypes,
  getDocTypes,
  getTags,
  getActiveFactFieldIds,
  searchDocuments,
};
