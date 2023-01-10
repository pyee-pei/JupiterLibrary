// Description: Utility functions for ThoughtTrace document objects

/***
 * calculate periodic payments for a given term
 */

const calcPeriodicPayments = (term, paymentModels) => {
  const payments = [];

  // get payment model for this term
  const model = termPaymentModel(term, paymentModels);
  const periodic_payment = periodicBasePayment(model);

  // exit if no model
  if (!model) {
    return null;
  }

  // initialize variables
  var current_payment_date = term.start_date,
    i = 0,
    prorata_years,
    payment_period_end;
  var term_escalation_rate = term.escalation_rate ?? 0;
  var periodic_escalation_rate = model.periodic_escalation_rate ?? 0;

  if (model.prorated_first_period && i === 0) {
    // payment period ends on 12/31 of starting year
    payment_period_end = new luxon.DateTime.local(term.start_date.year, 12, 31);

    // calculate prorata years
    // add a day to the end (luxon diff math)
    prorata_years = +payment_period_end
      .plus({ days: 1 })
      .diff(term.start_date, "years")
      .years.toFixed(2);

    // push initial payment
    payments.push({
      payment_index: i,
      payment_date: term.start_date
        .plus({ days: model.first_payment_due_days_after_term_start ?? 0 })
        .toLocaleString(),
      payment_period_end: payment_period_end.toLocaleString(),
      prorata_years: prorata_years,
      base_payment: +(
        periodic_payment *
        (1 + term_escalation_rate / 100)
      ).toFixed(2),
      total_payment_amount: +(
        periodic_payment *
        (1 + (term_escalation_rate * (term.term_ordinal - 1)) / 100) *
        (1 + (periodic_escalation_rate * (i + term.previous_periods)) / 100) *
        prorata_years
      ).toFixed(2),
    });

    current_payment_date = new luxon.DateTime.local(
      term.start_date.year + 1,
      1,
      1
    ); // jan 1 of next year
    i++;
  }

  // TODO loop through remaining payments
  while (current_payment_date < term.end_date) {
    payment_period_end = model.prorated_first_period
      ? new luxon.DateTime.local(current_payment_date.year, 12, 31)
      : current_payment_date.plus({ years: 1 }).minus({ days: 1 });
    payment_period_end =
      payment_period_end > term.end_date ? term.end_date : payment_period_end;

    prorata_years = +payment_period_end
      .plus({ days: 1 })
      .diff(current_payment_date, "years")
      .years.toFixed(2);

    payments.push({
      payment_index: i,
      payment_date: term.start_date
        .plus({
          days:
            i === 0 ? model.first_payment_due_days_after_term_start ?? 0 : 0,
        })
        .toLocaleString(),
      payment_period_end: payment_period_end.toLocaleString(),
      prorata_years: prorata_years,
      base_payment: +(
        periodic_payment *
        (1 + term_escalation_rate / 100)
      ).toFixed(2),
      total_payment_amount: +(
        periodic_payment *
        (1 + (term_escalation_rate * (term.term_ordinal - 1)) / 100) *
        (1 + (periodic_escalation_rate * (i + term.previous_periods)) / 100) *
        prorata_years
      ).toFixed(2),
    });

    current_payment_date = payment_period_end.plus({ days: 1 });
    i++;
  }

  payments.sort((a, b) => a.payment_date - b.payment_date);

  // mutate term object to store payment array
  term.payments = payments;

  // calc total payments for whole term
  term.cumulative_payment_amount = payments.reduce(
    (a, b) => a + b.total_payment_amount,
    0
  );
};

/***
 * assign model to given lease term
 */

const termPaymentModel = (term, paymentModels) => {
  // exit if there are no models
  if (!paymentModels || paymentModels.length === 0) {
    return null;
  }

  const model_name = term.payment_model ?? term.term_type;
  // return model if name matches, or first model if no name
  return model_name
    ? paymentModels.find((x) => x.model_type === model_name)
    : paymentModels[0];
};

/***
 * calc periodic payment - largest of all possible ways to calculate payment
 */

const periodicBasePayment = (model) => {
  if (!model) {
    return 0;
  }

  return Math.max(
    model.minimum_payment ?? 0,
    (model.payment_per_mw ?? 0) * (model.mw ?? 0),
    (model.inverter_count ?? 0) *
      (model.inverter_rating_mvas ?? 0) *
      (model.payment_per_mva ?? 0),
    model.flat_payment_amount ?? 0,
    (model.payment_per_acre ?? 0) * (model.leased_acres ?? 0)
  );
};

/***
 * function to mutuate lease term objects to include start and end dates
 */

const calcLeaseTermDates = (leaseTerms, effectiveDate) => {
  // set start & end dates for each term
  leaseTerms
    .sort((a, b) => a.term_ordinal - b.term_ordinal)
    .forEach((term, index) => {
      // start day after previous term end, or if no previous term, use effective date
      term.start_date = leaseTerms[index - 1]
        ? leaseTerms[index - 1].end_date.plus({ days: 1 })
        : effectiveDate;
      term.start_date_text = term.start_date.toFormat("M/d/yyyy");

      // end one day prior to the Nth anniversary
      term.end_date = term.start_date
        .plus({ years: term.term_length_years })
        .plus({ days: -1 });
      term.end_date_text = term.end_date.toFormat("M/d/yyyy");

      // calculate previous periods on same payment model for escalation
      // NOTE: this will not continue periodic escalations across payment models
      term.previous_periods = leaseTerms
        .filter(
          (x) =>
            x.term_ordinal < term.term_ordinal &&
            x.payment_model === term.payment_model
        )
        .reduce((accumulator, t) => accumulator + t.term_length_years, 0);
    });
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
        const factFieldType = factTypes
          .find((x) => x.id === f.factTypeId)
          .fieldTypes.find((x) => x.id === ff.factFieldTypeId);

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
  const fact = doc.facts
    ? doc.facts.find((x) => x.factTypeId == factType)
    : null;

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
 * extract multiple facts from a fact type
 */
const extractMultiFactValues = (doc, factType) => {
  const facts = doc.facts
    ? doc.facts.filter((x) => x.factTypeId === factType)
    : null;

  // do not proceed if no facts found
  if (!facts) {
    return [];
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

    result.push(fact);
  });

  return result;
};

/***
 * clean unused fields from document object
 * just makes debugging easier
 */
const cleanDoc = (doc) => {
  // fields to delete
  const fields = [
    "archivedBy",
    "archivedOn",
    "highlightedText",
    "pageManipulationStatus",
    "processingStatus",
    "pages",
    "securityLabelId",
    "sourceDocumentId",
    "sourceDocumentName",
    "pageCount",
    "thoughts",
    "userIds",
  ];

  fields.forEach((field) => {
    delete doc[field];
  });

  return doc;
};

/***
 * convert fact field names to be more javascript friendly
 */
const cleanFieldNames = (str) => {
  // convert field name text to property names
  return str
    .toLowerCase()
    .replace(/[\s()]+/g, "_")
    .replace(/_+$/, "");
};

export default {
  calcPeriodicPayments,
  calcLeaseTermDates,
  addFactandFieldNames,
  extractFactValue,
  extractMultiFactValues,
  cleanDoc,
  cleanFieldNames,
};
