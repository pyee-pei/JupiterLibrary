// Description: Utility functions for ThoughtTrace document objects

/***
 * round number to specified decimal places
 * only works when @decimals is a positive integer
 */

const round = (value, decimals) => {
  return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
};

/***
 * get fact type id from name
 */

const getFactTypeId = (factTypeName, factTypes) => {
  var factType = factTypes.find((x) => x.name === factTypeName);
  return factType ? factType.id : null;
};

/***
 * get fact field id from name
 */

const getFactFieldId = (factTypeName, factFieldName, factTypes) => {
  var factType = factTypes.find((x) => x.name === factTypeName);

  if (factType) {
    var factField = factType.fieldTypes.find((x) => x.name === factFieldName);
  }

  return factField ? factField.id : null;
};

const getTagName = (tagId, tags) => {
  var tag = tags.find((x) => x.id === tagId);
  return tag ? tag.name : null;
};

/***
 * add names to facts and fact fields
 */

const addFactandFieldNames = (doc, factTypes) => {
  if (!doc.facts) {
    return;
  }

  doc.facts.forEach((f) => {
    const factType = factTypes.find((x) => x.id === f.factTypeId);

    // add names to fact
    if (factType) {
      f.factTypeName = factType.name;
      f.allowMultiple = factType.allowMultiple;
      f.fieldCount = factType.fieldTypes.length;
    }

    // add names to fact fields
    if (f.fields) {
      f.fields.forEach((ff) => {
        const factFieldType = factTypes.find((x) => x.id === f.factTypeId).fieldTypes.find((x) => x.id === ff.factFieldTypeId);

        if (factFieldType) {
          ff.factTypeFieldName = factFieldType.name;
          ff.dataType = factFieldType.dataType;
        }
      });
    }
  });
};

/***
 * extract single fact field value
 */

const extractFactValue = (doc, factType, factTypeField, valueType) => {
  // find fact by name
  const fact = doc.facts ? doc.facts.find((x) => x.factTypeId == factType) : null;

  if (fact) {
    // fact exists, check fields by name
    const field = fact.fields.find((x) => x.factFieldTypeId == factTypeField);

    if (field) {
      switch (valueType) {
        case "date":
          return new luxon.DateTime.fromISO(field.dateValue);
        case "number":
          return field.numberValue;
        case "string":
          return field.stringValue;
        case "bool":
          return field.booleanValue;
        default:
          return null;
      }
    }
  }

  return null;
};

/***
 * extract single fact instance id
 */
const extractFactInstanceId = (doc, factType) => {
  const fact = doc.facts ? doc.facts.find((x) => x.factTypeId == factType) : null;

  if (fact) {
    return fact.id;
  }

  return null;
};

/***
 * extract fact field instance id
 */
const extractFactFieldInstanceId = (doc, factType, factTypeField) => {
  const fact = doc.facts ? doc.facts.find((x) => x.factTypeId == factType) : null;

  if (fact) {
    const field = fact.fields.find((x) => x.factFieldTypeId == factTypeField);

    if (field) {
      return field.id;
    }
  }

  return null;
};

/***
 * extract multiple fact instances from a fact type, with all fields
 */
const extractMultiFactValues = (doc, factType) => {
  const facts = doc.facts ? doc.facts.filter((x) => x.factTypeId === factType) : null;

  // do not proceed if no facts found
  if (!facts) {
    return null;
  }

  const result = [];

  facts.forEach((f) => {
    const fact = {};
    fact.id = f.id;

    if (!f.fields) {
      return fact;
    }

    f.fields.forEach((field) => {
      var property_name = cleanFieldNames(field.factTypeFieldName);
      var value = "";

      switch (field.dataType) {
        case "Number":
          value = field.numberValue;
          break;
        case "Date":
          value = new luxon.DateTime.fromISO(field.dateValue);
          break;
        case "String":
          value = field.stringValue;
          break;
        case "SelectList":
          value = field.stringValue;
          break;
        case "Boolean":
          value = field.booleanValue;
          break;
      }

      // create property and value based on results
      fact[property_name] = value;
    });

    fact.source_doc_id = doc.id;

    result.push(fact);
  });

  return result;
};

/***
 * return single object from single instanct factType
 */
const extractFactMultiFields = (doc, factType) => {
  const fact = doc.facts ? doc.facts.find((x) => x.factTypeId == factType) : null;

  if (!fact || !fact.fields) {
    return null;
  }

  const result = {};
  result.fact_id = fact.id;

  fact.fields.forEach((field) => {
    var property_name = cleanFieldNames(field.factTypeFieldName);
    var value = "";

    switch (field.dataType) {
      case "Number":
        value = field.numberValue;
        break;
      case "Date":
        value = new luxon.DateTime.fromISO(field.dateValue);
        break;
      case "String":
        value = field.stringValue;
        break;
      case "SelectList":
        value = field.stringValue;
        break;
      case "Boolean":
        value = field.booleanValue;
        break;
    }

    // only create property and value if value is not null
    if (value) {
      result[property_name] = value;
    }
  });

  return result;
};

/***
 * compare luxon date objects
 * return earliest date, or return the non-null date.
 * if both are null, return null
 */
const getEarliestDateTime = (date1, date2) => {
  if (date1 && date2) {
    return date1.ts < date2.ts ? date1 : date2;
  } else if (date1) {
    return date1;
  } else if (date2) {
    return date2;
  }

  return null;
};

/***
 * convert fact field names to be more javascript friendly
 */
const cleanFieldNames = (str) => {
  // convert field name text to property names
  return str
    ? str
        .toLowerCase()
        .replace(/[\s()-]+/g, "_")
        .replace(/_+$/, "")
    : null;
};

/***
 * calculate compounding growth
 */
const calculateCompoundingGrowth = (initial, rate, periods) => {
  return round(initial * Math.pow(1 + rate, periods), 4);
};

/***
 * calculate standard growth
 */
const calculateGrowth = (initial, rate, periods) => {
  return round(initial + initial * rate * periods, 4);
};

const plusDuration = (length_years) => {
  if ((length_years * 12) % 1 === 0 && length_years < 1) {
    return { months: length_years * 12 };
  } else {
    return { years: length_years };
  }
};

export default {
  round,
  getFactTypeId,
  getFactFieldId,
  getTagName,
  addFactandFieldNames,
  extractFactValue,
  extractFactInstanceId,
  extractFactFieldInstanceId,
  extractMultiFactValues,
  extractFactMultiFields,
  getEarliestDateTime,
  cleanFieldNames,
  calculateCompoundingGrowth,
  calculateGrowth,
  plusDuration,
  // apiGetAuthToken,
  // apiGetTags,
};
