import axios from "axios";
import fs from "fs";
import "dotenv/config";

const BASE_URL = "https://api.accrualify.com";
const AUTH_URL = "https://api.accrualify.com/oauth/token";

const getAccessToken = async () => {
  const body = {
    grant_type: "password",
    email: process.env.ACCRUALIFY_EMAIL,
    password: process.env.ACCRUALIFY_PASSWORD,
  };

  const response = await axios.post(AUTH_URL, body);

  return response.data.access_token;
};

const getVendors = async (pageIndex) => {
  const token = await getAccessToken();
  const response = await axios.get(`${BASE_URL}/vendors`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { items: 100, page: pageIndex, status: "ACTIVE" },
  });
  return response.data;
};

const getPOs = async (pageIndex) => {
  const token = await getAccessToken();
  const response = await axios.get(`${BASE_URL}/purchase_orders`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { items: 100, page: pageIndex },
  });

  return response.data;
};

const getPODetails = async (poId) => {
  const token = await getAccessToken();
  const response = await axios.get(`${BASE_URL}/purchase_orders/${poId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
};

// use the endpoints

const purchaseOrders = await getPOs(1);
if (purchaseOrders.meta.pages > 1) {
  for (var i = 2; i <= purchaseOrders.meta.pages; i++) {
    // get the next page of purchase orders
    const nextPurchaseOrders = await getPOs(i);
    // add the next page of purchase orders to the purchase orders array
    purchaseOrders.data = [...purchaseOrders.data, ...nextPurchaseOrders.data];
  }
}

// roll-up the count of purchase orders my month and year from the 'date' field on purchase orders
const poCountByMonth = purchaseOrders.data.reduce((acc, po) => {
  const date = new Date(po.date);
  const month = date.getMonth();
  const year = date.getFullYear();
  const key = `${year}-${month + 1}`;
  if (acc[key]) {
    acc[key] += 1;
  } else {
    acc[key] = 1;
  }
  return acc;
}, {});

const poDetails = await getPODetails(purchaseOrders.data[1].id);
const requestors = [...new Set(purchaseOrders.data.map((po) => po.requestor?.name))].sort();
const statuses = [...new Set(purchaseOrders.data.map((po) => po.status))].sort();
const currencies = [...new Set(purchaseOrders.data.map((po) => po.currency.iso_code))].sort();

const vendors = await getVendors(1);

if (vendors.meta.pages > 1) {
  for (var i = 2; i <= vendors.meta.pages; i++) {
    // get the next page of vendors
    const nextVendors = await getVendors(i);
    // add the next page of vendors to the vendors array
    vendors.data = [...vendors.data, ...nextVendors.data];
  }
}

const equipmentVendors = vendors.data.filter((v) => v.type_id === "Equipment");

fs.writeFileSync("./data/vendors.json", JSON.stringify(vendors.data, null, 2));
fs.writeFileSync("./data/equipmentVendors.json", JSON.stringify(equipmentVendors, null, 2));

const types = [...new Set(vendors.data.map((vendor) => vendor.type_id))].sort();
console.log("done");

export default {
  getVendors,
};
