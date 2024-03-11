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

const getEarliestDateTimeFromArray = (dates) => {
  if (dates.length === 0) {
    return null;
  }

  var earliest = dates[0];

  dates.forEach((date) => {
    if (!earliest || date?.ts < earliest?.ts) {
      earliest = date;
    }
  });

  return earliest;
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
  // less than a year, even # months, return months only
  if ((length_years * 12) % 1 === 0 && length_years < 1) {
    return { months: length_years * 12 };
  }
  // more than a year, even months, return years and months
  else if (length_years % 1 != 0 && (length_years * 12) % 1 === 0 && length_years > 1) {
    return { years: Math.floor(length_years), months: (length_years * 12) % 12 };
  } else {
    return { years: length_years };
  }
};

const blendedEscalation = (startDate, endDate, escalationStart, rate, baseAmount, paymentStart) => {
  // this function calculates a daily rate based on escalation anniversary, and then calculates each Jan-Dec payment on blended cost

  // create array of all dates between start and end
  var results = [];
  // format dates to luxon objects
  // startDate = new luxon.DateTime.fromISO(startDate);
  // endDate = new luxon.DateTime.fromISO(endDate);
  // escalationStart = new luxon.DateTime.fromISO(escalationStart);

  // first payment date is either the first Jan 1 after the startDate, or the startDate, based on delay_first_payment
  if (paymentStart === "Start next Jan 1 after Term commencement") {
    var firstPayment = startDate.set({ year: startDate.year + 1, month: 1, day: 1 });
  } else if (paymentStart === "Start 1st of month after commencement") {
    var firstPayment = startDate.set({ year: startDate.year, month: startDate.month + 1, day: 1 });
  } else {
    var firstPayment = startDate;
  }

  // initialize loop over dates
  var currentDate = startDate;
  while (currentDate <= endDate) {
    // calc factors
    var days_in_year = currentDate.daysInYear;
    var escalation_periods = Math.floor(currentDate.diff(escalationStart, "years").years);
    var escalated_cost = baseAmount * Math.pow(1 + rate, escalation_periods);

    // calculate payment index
    var payment_index = Math.floor(currentDate.diff(firstPayment, "years").years);
    if (payment_index < 0) {
      payment_index = 0;
    }

    var obj = {};

    // create object
    obj.date = currentDate.toFormat("yyyy-MM-dd");
    obj.annual_cost = escalated_cost;
    obj.daily_cost = escalated_cost / days_in_year;
    obj.payment_index = payment_index;

    // push to results
    results.push(obj);

    // increment date
    currentDate = currentDate.plus({ days: 1 });
  }

  // create array of payments by index and sum daily costs
  const payments = Object.values(
    results.reduce((acc, obj) => {
      const { payment_index, daily_cost, date } = obj;
      acc[payment_index] = acc[payment_index] || { payment_index, total_payment: 0, min_date: date, max_date: date, date_count: 0 };
      acc[payment_index].total_payment += daily_cost;

      // set min date
      if (date < acc[payment_index].min_date) {
        acc[payment_index].min_date = date;
      }

      // set max date
      if (date > acc[payment_index].max_date) {
        acc[payment_index].max_date = date;
      }

      // increment date count
      acc[payment_index].date_count += 1;

      return acc;
    }, {})
  );

  // return a final rounded amount for each payment index
  return payments.map((p) => {
    return {
      payment_index: p.payment_index,
      payment_date: firstPayment.plus({ years: p.payment_index }),
      total_payment: round(p.total_payment, 2),
      min_date: p.min_date,
      max_date: p.max_date,
      date_count: p.date_count,
    };
  });
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
  getEarliestDateTimeFromArray,
  cleanFieldNames,
  calculateCompoundingGrowth,
  calculateGrowth,
  plusDuration,
  blendedEscalation,
  // apiGetAuthToken,
  // apiGetTags,
};
