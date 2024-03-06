'use strict';

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

var utils = {
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
  // apiGetAuthToken,
  // apiGetTags,
};

const DOC_TYPE_ABBREVIATIONS = {
  Assignment: "ASGMT",
  Easement: "ESMNT",
  "Farm and Ranch Contract": "FRC",
  "Interconnection Agreement": "INTCON",
  Lease: "LEASE",
  "Lease Option": "LOPT",
  "Purchase and Sale Agreement": "AOS",
  "Purchase Option": "POPT",
};

/**
 * Represents a Jupiter document.
 * @constructor
 * @param {Object} doc - The document object itself
 * @property {string} id - Unique identifier (ThoughtTrace)
 * @property {string} name - Document name
 *
 * @property {string} document_type - Document Type
 * @property {string} project_id - Project ID
 * @property {string} project_name - Project Name
 * @property {Date} effective_date - Effective date of the document
 *
 * @property {Array} agreement_terms - array of potential agreement terms
 * @property {Date} agreement_terms.start_date - start date of lease term
 * @property {Date} agreement_terms.end_date - end date of lease term
 *
 * @property {Array} term_payment_models - array of periodic payment models
 * @property {Array} tags - array of tags
 */
class JupiterDoc {
  constructor(doc, factTypes, docTypes = [], tags = []) {
    // remove clutter
    this.cleanDoc(doc);
    utils.addFactandFieldNames(doc, factTypes);

    // set initial properties
    this.rawDoc = doc; // for debugging
    this.id = doc.id;
    this.name = doc.name;

    // set fact-based properties and arrays
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    // Document Type
    var docType = docTypes.find((x) => x.id === doc.documentTypeId);
    this.document_type = docType ? docType.name : null;

    // Agreement ID
    this.agreement_id = utils.extractFactValue(
      doc,
      utils.getFactTypeId("Agreement ID", factTypes),
      utils.getFactFieldId("Agreement ID", "Agreement ID", factTypes),
      "string"
    );

    // Project ID
    this.project_id = utils.extractFactValue(
      doc,
      utils.getFactTypeId("Project ID", factTypes),
      utils.getFactFieldId("Project ID", "Project ID", factTypes),
      "string"
    );

    // Project Name
    this.project_name = utils.extractFactValue(
      doc,
      utils.getFactTypeId("Project Name", factTypes),
      utils.getFactFieldId("Project Name", "Project Name", factTypes),
      "string"
    );

    // Jupiter Entity
    this.jupiter_entity = utils.extractFactValue(
      doc,
      utils.getFactTypeId("Jupiter Entity", factTypes),
      utils.getFactFieldId("Jupiter Entity", "Jupiter Entity", factTypes),
      "string"
    );

    // Grantee
    this.grantee = utils.extractFactValue(
      doc,
      utils.getFactTypeId("Grantee/Lessee", factTypes),
      utils.getFactFieldId("Grantee/Lessee", "Grantee/Lessee", factTypes),
      "string"
    );

    // Grantor/Lessor - Multi-instance fact
    this.grantor = utils.extractMultiFactValues(doc, utils.getFactTypeId("Grantor/Lessor", factTypes));

    // Effective Date
    this.effective_date = utils.extractFactValue(
      doc,
      utils.getFactTypeId("Effective Date", factTypes),
      utils.getFactFieldId("Effective Date", "Effective Date", factTypes),
      "date"
    );

    // Amendment Date
    this.amendment_date = utils.extractFactValue(
      doc,
      utils.getFactTypeId("Amendment Date", factTypes),
      utils.getFactFieldId("Amendment Date", "Amendment Date", factTypes),
      "date"
    );

    // Outside Date
    this.outside_date = utils.extractFactValue(
      doc,
      utils.getFactTypeId("Outside Date", factTypes),
      utils.getFactFieldId("Outside Date", "Outside Date", factTypes),
      "date"
    );

    // Purchase Price
    this.full_purchase_price = utils.extractFactValue(
      doc,
      utils.getFactTypeId("Full Purchase Price", factTypes),
      utils.getFactFieldId("Full Purchase Price", "Full Purchase Price", factTypes),
      "number"
    );

    // Closing Date
    this.closing_date = utils.extractFactValue(
      doc,
      utils.getFactTypeId("Closing Date", factTypes),
      utils.getFactFieldId("Closing Date", "Closing Date", factTypes),
      "date"
    );

    // Terminated
    this.terminated = utils.extractFactValue(
      doc,
      utils.getFactTypeId("Terminated", factTypes),
      utils.getFactFieldId("Terminated", "Terminated", factTypes),
      "bool"
    );

    // Property Details
    this.property_description = utils.extractMultiFactValues(doc, utils.getFactTypeId("Property Description", factTypes));

    // calc total acres for all proprerty descriptions
    this.total_agreement_acres = this.property_description.reduce((acc, desc) => {
      return acc + desc.agreement_acres || 0;
    }, 0);

    // calc controlled acres for all proprerty descriptions
    this.total_controlled_acres = this.property_description.reduce((acc, desc) => {
      return acc + (!desc.exclude_acres_from_controlled_acres ? desc.agreement_acres : 0) || 0;
    }, 0);

    // Notice Details
    this.notice_details = utils.extractFactValue(
      doc,
      utils.getFactTypeId("Notice Details", factTypes),
      utils.getFactFieldId("Notice Details", "Notice Details", factTypes),
      "string"
    );

    // Operational Details
    this.operational_details = utils.extractFactMultiFields(doc, utils.getFactTypeId("Operational Details", factTypes)) ?? {};

    // Agreement Terms
    this.agreement_terms = utils.extractMultiFactValues(doc, utils.getFactTypeId("Agreement Term", factTypes));

    // Periodic Payment Models (term based)
    this.term_payment_models = utils.extractMultiFactValues(doc, utils.getFactTypeId("Payment Model - Term Based", factTypes));

    // Peroidic Payment Models (date based)
    this.date_payment_models = utils.extractMultiFactValues(doc, utils.getFactTypeId("Payment Model - Date Based", factTypes));

    // Periodic Payments (date based)
    this.date_payments = [];

    // Tags
    this.tags = this.getTags(tags);

    this.termination = utils.extractFactMultiFields(doc, utils.getFactTypeId("Termination", factTypes)) ?? {};

    // Associated Agreements
    this.associated_agreements = utils.extractMultiFactValues(doc, utils.getFactTypeId("Associated Agreements", factTypes));

    // Review Status
    this.review_status = utils.extractFactValue(
      doc,
      utils.getFactTypeId("Review Status", factTypes),
      utils.getFactFieldId("Review Status", "Review Status", factTypes),
      "string"
    );

    // Review Status Notes
    this.review_status_notes = utils.extractFactValue(
      doc,
      utils.getFactTypeId("Review Status", factTypes),
      utils.getFactFieldId("Review Status", "Notes", factTypes),
      "string"
    );

    this.review_status_instance_id = utils.extractFactInstanceId(doc, utils.getFactTypeId("Review Status", factTypes));

    // Review Status Field Instance ID
    this.review_status_value_instance_id = utils.extractFactFieldInstanceId(
      doc,
      utils.getFactTypeId("Review Status", factTypes),
      utils.getFactFieldId("Review Status", "Review Status", factTypes)
    );

    // Agreement Group
    this.agreement_group = utils.extractFactValue(
      doc,
      utils.getFactTypeId("Agreement Group", factTypes),
      utils.getFactFieldId("Agreement Group", "Agreement Group", factTypes),
      "string"
    );

    // calculate lease term dates
    this.calcAgreementTermDates(this.agreement_terms, this.effective_date, this.operational_details, this.termination);

    this.qc_flags = [];

    // flag a version number
    this.libraryVersion = "1.1.27";
  }

  /**
   * calc agreement ID
   */
  calcAgreementGroup() {
    // only calculate for completed docs
    if (!this.grantor[0] || !this.review_status === "Complete") {
      return null;
    }
    // check other required fields, and exclude any known amendments

    if (this.project_id && this.project_name && this.document_type && !this.amendment_date) {
      return `${DOC_TYPE_ABBREVIATIONS[this.document_type]} - ${this.project_name} - ${this.nicknameGrantor(this.grantor[0]["grantor/lessor_name"])} - ${
        this.project_id
      }`;
    }

    return null;
  }

  /**
   * creates array of tag names from tag ids
   */
  getTags(tags) {
    var result = [];
    this.rawDoc.tagIds.forEach((id) => {
      var tag = tags.find((x) => x.id === id);

      if (tag) {
        result.push(tags.find((x) => x.id === id).name);
      }
    });

    return result;
  }

  /**
   * calculates the term dates from the given facts
   * This function mutates lease term objects and creates calculated properties
   */
  calcAgreementTermDates(agreementTerms, effectiveDate, opDetails, termination) {
    // exit if no effectiveDate
    if (!effectiveDate && !opDetails.commencement_date) {
      return;
    }

    termination = termination || {};
    opDetails = opDetails || {};

    agreementTerms
      .sort((a, b) => a.term_ordinal - b.term_ordinal)
      .forEach((term, index) => {
        // check opDetails for actual construction start date
        // only set on non-extension terms for construction and operations
        if (term.term_type === "Construction" && !term.extension && opDetails.construction_commencement) {
          term.start_date = opDetails.construction_commencement;
        } else if (term.term_type === "Operations" && !term.extension && opDetails.operations_commencement) {
          term.start_date = opDetails.operations_commencement;
        } else {
          // start day after previous term end, or if no previous term, use effective date
          term.start_date = agreementTerms[index - 1]?.end_date.plus({ days: 1 }) || opDetails.commencement_date || effectiveDate;
        }
        // add a text version pre-formatted
        term.start_date_text = term.start_date.toFormat("MM/dd/yyyy");

        // determine appropriate duration to add

        if (!term.term_length_years) {
          var addDuration = { days: 0 };
        } /* else if (parseInt(term.term_length_years) === term.term_length_years) {
          var addDuration = { years: term.term_length_years };
        } else if (parseInt(term.term_length_years * 12) === term.term_length_years * 12) {
          var addDuration = { months: term.term_length_years * 12 };
        } */ else {
          var addDuration = utils.plusDuration(term.term_length_years);
        }

        // calculate end date from what will be a rounded year decimal approximation
        var endCalc = term.start_date.plus(addDuration);
        endCalc = endCalc.plus({ days: endCalc.c.hour >= 12 ? 1 : 0 }).startOf("day"); // this is to round up to the next day if the time is after noon

        // calculated end-date, will be tested against opDates later
        // end one day prior to the Nth anniversary, or on operationalDetails termination date, whichever is sooner
        term.end_date = utils.getEarliestDateTime(termination?.termination_date, endCalc.plus({ days: -1 }));

        // on non-construction and non-operational terms, check to see if they are cut short, or totally removed by operational dates
        if (term.term_type !== "Construction" && term.term_type !== "Operations") {
          var firstOpsDate = utils.getEarliestDateTime(opDetails.construction_commencement, opDetails.operations_commencement);

          if (firstOpsDate) {
            // check start date
            if (term.start_date.ts >= firstOpsDate.ts) {
              // cancel the whole term
              term.cancelled_by_ops = true;
            } else if (term.end_date.ts >= firstOpsDate.ts) {
              // cut the term short
              term.end_date = firstOpsDate.plus({ days: -1 });
            }
          }
        } else if (term.term_type === "Construction" && opDetails.operations_commencement) {
          // check construction term against operations commencement date
          if (term.end_date.ts >= opDetails.operations_commencement.ts) {
            term.end_date = opDetails.operations_commencement.plus({ days: -1 });
          }
        }

        term.end_date_text = term.end_date.toFormat("MM/dd/yyyy");

        // calculate cumulative increase amount from all prior terms of same payment model
        term.cumulative_increase_amount = agreementTerms
          .filter((x) => x.term_ordinal <= term.term_ordinal && x.payment_model === term.payment_model)
          .reduce((accumulator, t) => accumulator + (t.increase_amount ?? 0), 0);

        // calculate cumulative escalation rate from all prior terms of same payment model
        term.cumulative_escalation_rate = agreementTerms
          .filter((x) => x.term_ordinal <= term.term_ordinal && x.payment_model === term.payment_model)
          .reduce((accumulator, t) => accumulator * (1 + (t.escalation_rate ?? 0) / 100), 1);
      });

    // calculate final term end date
    this.final_term_end_date = agreementTerms[agreementTerms.length - 1]?.end_date.toFormat("M/d/yyyy");
  }

  /**
   * calculates base periodic payment for a given model
   * largest of all possible ways to calculate payment
   */
  periodicBasePayment(model, op_details, cumulative_escalation_rate, cumulative_increase_amount, agreement_acres) {
    if (!model) {
      return 0;
    }

    // set defaults if no provided
    if (!op_details) {
      op_details = {
        mw: 0,
        inverter_count: 0,
        inverter_rating_mvas: 0,
      };
    }

    // calculate max payment from different methods
    var base = Math.max(
      model.minimum_payment ?? 0,
      (model.payment_per_mw ?? 0) * (op_details.mw ?? 0),
      (op_details.inverter_count ?? 0) * (op_details.inverter_rating_mvas ?? 0) * (model.payment_per_mva ?? 0),
      model.flat_payment_amount ?? 0,
      (model.payment_per_acre ?? 0) * (agreement_acres ?? 0)
    );

    // apply cumulative increase and escalation for TERM escalation and TERM increase
    base = (base + cumulative_increase_amount) * cumulative_escalation_rate;

    return base;
  }

  /***
   * assign model to given lease term
   */

  termPaymentModel(term, paymentModels) {
    // exit if there are no models
    if (!paymentModels || paymentModels.length === 0) {
      return null;
    }

    const model_name = term.payment_model ?? term.term_type;
    // return model if name matches, or first model if no name
    return model_name ? paymentModels.find((x) => x.model_type === model_name) : paymentModels[0];
  }

  /***
   * calculate payment period end
   */
  calcPaymentPeriodEnd(start_date, frequency, prorated, term_end) {
    var payment_period_end;

    if (prorated) {
      // pro-rated payment dates
      if (frequency === "Annually") {
        payment_period_end = new luxon.DateTime.local(start_date.year, 12, 31);
      } else if (frequency === "Quarterly") {
        payment_period_end = start_date.plus({ months: 3 }).minus({ days: 1 });
      } else if (frequency === "Monthly") {
        payment_period_end = start_date.plus({ months: 1 }).minus({ days: 1 });
      }
    } else {
      // anniversary payment dates
      if (frequency === "Annually") {
        payment_period_end = start_date.plus({ years: 1 }).minus({ days: 1 });
      } else if (frequency === "Semiannually") {
        payment_period_end = start_date.plus({ months: 6 }).minus({ days: 1 });
      } else if (frequency === "Quarterly") {
        payment_period_end = start_date.plus({ months: 3 }).minus({ days: 1 });
      } else if (frequency === "Monthly") {
        payment_period_end = start_date.plus({ months: 1 }).minus({ days: 1 });
      } else if (frequency === "Once per Term") {
        payment_period_end = term_end;
      }
    }

    // if payment period end is after term end, return term end
    return payment_period_end >= term_end ? term_end : payment_period_end;
  }

  /***
   * calculate periodic payments for a given term
   */

  calcPeriodicPaymentsForTerm(term, op_details, paymentModels, agreement_acres, grantor, project_id) {
    // exit if term is cancelled by operations starting, or there are no grantors listed
    if (term.cancelled_by_ops || grantor.length === 0) {
      return null;
    }

    const payments = [];

    // get payment model for this term
    const model = this.termPaymentModel(term, paymentModels);
    const periodic_payment = this.periodicBasePayment(
      model,
      op_details,
      term.cumulative_escalation_rate,
      term.cumulative_increase_amount,
      agreement_acres
    );

    // exit if no model, or start/end dates
    if (!model || !term.start_date || !term.end_date) {
      return null;
    }

    // initialize variables
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    var i = 0;
    var prorata_factor;
    //var term_payment_delay_days = term.term_payment_delay_days ?? 0;
    var payment_period_start = term.start_date; //.plus({ days: term.term_payment_delay_days });
    var payment_date;
    var payment_period_end;

    term.escalation_rate ?? 0;
    var periodic_escalation_rate = model.periodic_escalation_rate ?? 0;

    var previous_terms = 0;
    var previous_periods = 0;

    // calculate previous periods for periodic escalation
    if (model.periodic_escalation_frequency === "Annually") {
      previous_terms = this.agreement_terms.filter((x) => x.term_ordinal < term.term_ordinal && x.payment_model === term.payment_model);
      previous_periods = previous_terms?.reduce((acc, t) => acc + t.term_length_years, 0);
    }

    // calc first payment date for term
    switch (term.first_payment_start) {
      case "Start with Term":
        payment_date = term.start_date; //.plus({ days: term_payment_delay_days });
        break;
      case "Start next Jan 1 after Term commencement":
        payment_date = new luxon.DateTime.local(term.start_date.year + 1, 1, 1); //.plus({ days: term_payment_delay_days });
        break;
      case "Start 1st of month after commencement":
        payment_date = new luxon.DateTime.local(payment_period_start.year, payment_period_start.month, 1).plus({ months: 1 });
        break;
      // add more cases as they arise
      default:
        payment_date = term.first_payment_date ?? term.start_date;
    }

    // loop through remaining payments
    while (payment_period_start < term.end_date) {
      // calculate payment period end date
      payment_period_end = this.calcPaymentPeriodEnd(payment_date, model.payment_frequency, model.prorated_first_period, term.end_date);

      if (!payment_period_end) return;

      // calculate pro rata periods
      if (model.payment_frequency === "Annually") {
        prorata_factor = utils.round(payment_period_end.plus({ days: 1 }).diff(payment_period_start, "years").years, 4);
      } else if (model.payment_frequency === "Semiannually") {
        prorata_factor = utils.round(payment_period_end.plus({ days: 1 }).diff(payment_period_start, "months").months / 6, 4);
      } else if (model.payment_frequency === "Quarterly") {
        prorata_factor = utils.round(payment_period_end.plus({ days: 1 }).diff(payment_period_start, "quarters").quarters, 4);
      } else if (model.payment_frequency === "Monthly") {
        prorata_factor = utils.round(payment_period_end.plus({ days: 1 }).diff(payment_period_start, "months").months, 4);
      } else {
        prorata_factor = 1;
      }

      // handle discrepancy between payment frequency and escalation frequency
      // set up index variable and ratio factors
      var periodic_escalation_frequency_index;
      var ratioFactors = {
        Annually: 1,
        Semiannually: 2,
        Quarterly: 4,
        Monthly: 12,
      };

      // determine an index difference between escalation frequency and payment frequency
      if (model.payment_frequency && model.periodic_escalation_frequency) {
        periodic_escalation_frequency_index = ratioFactors[model.payment_frequency] / ratioFactors[model.periodic_escalation_frequency];
      } else {
        periodic_escalation_frequency_index = 1;
      }

      // calc payment lag
      var late_payment_date = null;
      if (i === 0 && model.first_payment_lag && (!term.extension || model.apply_payment_lag_to_extension)) {
        late_payment_date = payment_date.plus({ days: model.first_payment_lag });
      } else if (i > 0 && model.subsequent_payment_lag && (!term.extension || model.apply_payment_lag_to_extension)) {
        late_payment_date = payment_date.plus({ days: model.subsequent_payment_lag });
      } else {
        late_payment_date = null;
      }

      // loop through grantors and add payments per payee according to their split
      grantor.forEach((g) => {
        if (this.id === "cf043a46-e73e-457b-8050-5ab9291cad85" && term.term_type === "Construction") {
          console.log(previous_terms, i);
        }
        payments.push({
          payment_source: "Term Model",
          model_id: model.id,
          project_id: project_id,
          payment_index: i,
          payment_date: payment_date.toLocaleString(),
          late_payment_date: late_payment_date?.toLocaleString() || null,
          payment_type: `${term.term_type}${term.extension ? " (ext)" : ""} Term Payment`,
          payment_amount:
            utils.calculateCompoundingGrowth(
              (periodic_payment + (model.increase_amount ?? 0) * i) * ((g.payment_split ?? 100 / grantor.length) / 100),
              (periodic_escalation_rate ?? 0) / 100,
              Math.floor((previous_periods + i) / periodic_escalation_frequency_index)
            ) * prorata_factor,
          payee: model.payee ?? this.nicknameGrantor(g["grantor/lessor_name"]),
          //grace_days: i === 0 ? term.first_payment_grace_days ?? 0 : term.subsequent_payment_grace_days ?? 0,
          payment_period_start: payment_period_start.toLocaleString(),
          payment_period_end: payment_period_end.toLocaleString(),
          prorata_factor: prorata_factor,
          applicable_to_purchase: model.applicable_to_purchase,
          refundable: false, // defaults to false on term payments
          after_outside_date: this.outside_date ? payment_date.ts > this.outside_date.ts : false,
          previous_periods: previous_periods + i,
        });
      });

      payment_period_start = payment_period_end.plus({ days: 1 });
      payment_date = payment_period_end.plus({ days: 1 });
      i++;
    }

    payments.sort((a, b) => a.payment_date - b.payment_date);

    return payments;
  }

  /***
   * calc payments on all terms for the lease
   */
  calcAllTermPayments() {
    // calc payments in each term
    // and mutate the term object to set value of periodic_payments array

    this.agreement_terms.forEach((term) => {
      if (this.term_payment_models) {
        term.periodic_payments = this.calcPeriodicPaymentsForTerm(
          term,
          this.operational_details,
          this.term_payment_models,
          this.amended_agreement_acres ?? this.total_agreement_acres,
          this.grantor,
          this.project_id
        );
      }
    });
  }

  calcDatePayments() {
    this.date_payments = []; // reset date payment array, re-calc for all new models

    this.date_payment_models.forEach((model) => {
      // return null if missing required fields
      // must have EITHER: date_begin, date_end, frequency OR date_one_time, and a payment amount
      if ((!(model.date_begin && model.date_end && model.frequency) && !model.date_one_time) || !model.payment_amount || !this.grantor.length > 0)
        return;

      // iterating variables
      var payment_date = model.date_one_time ?? model.date_begin;
      var payment_date_end = utils.getEarliestDateTimeFromArray([this.termination?.termination_date, model.date_one_time, model.date_end]);
      var period = 1;
      var payment_amount = 0;
      var payment_source = model.date_one_time ? "Date Model (One Time)" : "Date Model";

      // loop until end date is reached
      while (payment_date <= payment_date_end) {
        // apply escalation as needed
        payment_amount = utils.calculateCompoundingGrowth(
          model.payment_amount + (model.increase_amount ?? 0) * (period - 1),
          (model.periodic_escalation_rate ?? 0) / 100,
          period
        );

        // calculate late_payment_date
        var late_payment_date = null;
        if (period === 1 && model.first_payment_lag) {
          late_payment_date = payment_date.plus({ days: model.first_payment_lag });
        } else if (period > 1 && model.subsequent_payment_lag) {
          late_payment_date = payment_date.plus({ days: model.subsequent_payment_lag });
        }

        // create a payment object for each grantor on the agreement
        this.grantor.forEach((g) => {
          // create payment object
          var payment = {
            payment_source: payment_source,
            model_id: model.id,
            project_id: this.project_id,
            payment_index: period - 1,
            payment_date: payment_date.toLocaleString(),
            late_payment_date: late_payment_date?.toLocaleString() || null,
            payment_type: model.payment_type,
            payment_amount: payment_amount * ((g.payment_split ?? 100 / this.grantor.length) / 100),
            payee: model.payee ?? this.nicknameGrantor(g["grantor/lessor_name"]),
            applicable_to_purchase: model.applicable_to_purchase,
            refundable: model.refundable,
            after_outside_date: this.outside_date ? payment_date.ts > this.outside_date.ts : false,
          };

          // add payment to array
          this.date_payments.push(payment);
        });

        // increment period
        period++;

        // increment payment date based on model frequency
        if (model.frequency === "Annually") {
          payment_date = payment_date.plus({ years: 1 });
        } else if (model.frequency === "Semiannually") {
          payment_date = payment_date.plus({ months: 6 });
        } else if (model.frequency === "Quarterly") {
          payment_date = payment_date.plus({ months: 3 });
        } else if (model.frequency === "Monthly") {
          payment_date = payment_date.plus({ months: 1 });
        } else {
          // if frequency doesn't match one of those options return - we can't get into an infinite loop
          // this can probably go above so we don't post any payments...
          return;
        }
      }
    });

    // all models, all loops complete, mutate doc object to contain results
    //this.date_payments.push(...date_payments); // already mutating object in push() above
  }

  /**
   * calc final purchase price
   */
  calcEstimatedPurchasePrice() {
    if (!this.full_purchase_price || !this.closing_date) {
      return;
    }
    // calculate how mcuh of the purchase price has already been paid
    var previous_applicable_payments = 0;

    // loop through agreement terms and find all payments applicable to purchase price
    if (this.agreement_terms.length > 0) {
      this.agreement_terms.forEach((term) => {
        if (term.periodic_payments) {
          // add any payments applicable to purchase price
          previous_applicable_payments +=
            term.periodic_payments.filter((x) => x.applicable_to_purchase)?.reduce((a, b) => a + b.payment_amount, 0) ?? 0;
        }
      });
    }

    // filter dated payments and find all payments applicable to purchase price
    if (this.date_payments) {
      previous_applicable_payments += this.date_payments.filter((x) => x.applicable_to_purchase)?.reduce((a, b) => a + b.payment_amount, 0) ?? 0;
    }

    // only run purchase price if there is a closing date and a purchase price
    // and it is not terminated (added 2023-10-23)
    if (this.closing_date && this.full_purchase_price && !this.termination?.termination_date) {
      this.grantor.forEach((g) => {
        // create payment object for purchase price
        this.date_payments.push({
          payment_source: "Purchase Price Calculation",
          model_id: null,
          payment_date: this.closing_date.toLocaleString(),
          payment_type: "Purchase Price",
          payee: this.nicknameGrantor(g["grantor/lessor_name"]),
          // purchase payment will subtract all payments applicable to purchase price
          payment_amount: (this.full_purchase_price - previous_applicable_payments) * ((g.payment_split ?? 100 / this.grantor.length) / 100),
          applicable_to_purchase: true,
          refundable: false,
        });
      });
    }
  }

  /**
   * load amendments & create new properties to store them
   */

  processAmendments(allDocs) {
    // don't process amendments of amendments
    if (this.amendment_date) {
      return;
    }

    const amendments = allDocs.filter(
      (x) => this.agreement_group && x.agreement_group === this.agreement_group && x.amendment_date && x.id !== this.id && x.document_type !== "Deed"
    );
    if (amendments.length > 0) {
      // sort amendments by amendment date, adding an ordinal property
      amendments
        .sort((a, b) => {
          return new Date(a.amendment_date) - new Date(b.amendment_date);
        })
        .map((x) => (x.amendment_ordinal = amendments.indexOf(x) + 1));

      // check each amendment for new values
      // newer amendments overwrite older values
      amendments.forEach((amendment) => {
        // these facts get overwritten by the amendment

        // effective date
        if (amendment.effective_date) {
          this.effective_date = amendment.effective_date;
        }

        // outside date
        if (amendment.outside_date) {
          this.outside_date = amendment.outside_date;
        }

        // property description
        if (amendment.property_description.length > 0) {
          this.property_description = amendment.property_description;
        }

        // jupiter entity
        if (amendment.jupiter_entity) {
          this.jupiter_entity = amendment.jupiter_entity;
        }

        // lessees
        if (amendment.grantee) {
          this.grantee = amendment.grantee;
        }

        if (amendment.grantor && amendment.grantor.length > 0) {
          // lessors
          this.grantor = amendment.grantor;
        }

        // closing date
        if (amendment.closing_date) {
          this.closing_date = amendment.closing_date;
        }

        // agreement terms
        if (amendment.agreement_terms && amendment.agreement_terms.length > 0) {
          this.agreement_terms = amendment.agreement_terms;
        }

        // periodic payment models
        if (amendment.term_payment_models && amendment.term_payment_models.length > 0) {
          this.term_payment_models = amendment.term_payment_models;
        }

        // termination
        if (amendment.termination) {
          this.termination = amendment.termination;
        }

        // these facts are additive, not replacement facts
        // if an original fact of these types exists, it will need to be modified on the original document

        // periodic date payment models
        amendment.date_payment_models.forEach((model) => {
          this.date_payment_models.push(model);
        });

        // replace review status with newest status fields & ids
        if (amendment.review_status) {
          this.review_status = amendment.review_status;
          this.review_status_doc_id = amendment.id;
          this.review_status_instance_id = amendment.review_status_instance_id;
          this.review_status_value_instance_id = amendment.review_status_value_instance_id;
          this.review_status_notes = amendment.review_status_notes;
        }
      });

      // re-calculate payments based on amended values
      if (this.agreement_terms) {
        this.calcAgreementTermDates(this.agreement_terms, this.effective_date, this.operational_details, this.termination);
        this.calcAllTermPayments();
        this.calcDatePayments();
        //this.calcOneTimePayments();
        this.calcEstimatedPurchasePrice();
      }

      this.amendments = amendments;
    }
  }

  /**
   * find deeds for a given document
   */

  findDeeds(allDocs) {
    var deeds = allDocs.filter((x) => x.document_type === "Deed" && x.agreement_group && x.agreement_group === this.agreement_group);

    if (this.document_type !== "Deed" && deeds.length > 0) {
      this.processDeedAmendments(deeds);
    }
  }

  processDeedAmendments(deeds) {
    const deed = deeds[0];
    const amendments = deeds.slice(1);

    // sort amendments by amendment date, adding an ordinal property
    amendments.sort((a, b) => {
      return new Date(a.amendment_date) - new Date(b.amendment_date);
    });

    // check each amendment for new values
    // newer amendments overwrite older values
    amendments.forEach((amendment) => {
      // effective date
      if (amendment.effective_date) {
        deed.effective_date = amendment.effective_date;
      }

      // property description
      if (amendment.property_description) {
        deed.property_description = amendment.property_description;
      }
    });

    // update root document
    this.deed_count = deeds.length;
    //this.deeds = deeds;
    this.deed_effective_date = deed.effective_date?.toFormat("M/d/yyyy");
    this.property_description = deed.property_description;
    if (!this.tags.includes("Purchased")) {
      this.tags.push("Purchased");
    }
  }

  /**
   * QC functions that add QC tags to documents (Document-Level QC)
   */
  qc() {
    // exit on out-of-scope documents
    if (this.document_type === "Master Service Agreement" || this.termination?.termination_date) {
      return;
    }

    // check all docs for these required facts
    const all_required = ["agreement_group", "document_type"];
    var missing = all_required.filter((x) => !this[x]);
    missing.forEach((x) => this.qc_flags.push(`Missing ${x}`));

    // check to see if any original docs have any of the following facts missing
    const original_required = ["project_id", "project_name"];
    const oringial_missing = original_required.filter((x) => !this[x] && this.amendment_date === null && this.document_type != "Deed");
    oringial_missing.forEach((x) => this.qc_flags.push(`Missing ${x}`));

    // check for missing property_description on original documents
    if (this.property_description.length === 0 && this.amendment_date === null && this.document_type != "Deed") {
      this.qc_flags.push("Missing Property Description");
    }

    // check for state and county on each property description provided
    if (this.property_description.length > 0) {
      this.property_description.forEach((desc, descIndex) => {
        ["county", "state"].forEach((x) => {
          if (!desc[x]) {
            this.qc_flags.push(`Missing ${x} on Property Description ${descIndex + 1}`);
          }
        });
      });
    }

    // check for effective date and amendment date
    if (this.effective_date && this.amendment_date) {
      this.qc_flags.push("Docment has Effective Date AND Amendment Date");
    } else if (!this.effective_date && !this.amendment_date) {
      this.qc_flags.push("Document has no Effective Date OR Amendment Date");
    }

    // document has termiation tag, but no termination date
    if (this.tags.includes("Terminated") && !this.termination?.termination_date) {
      this.qc_flags.push("Termination tag but no Termination Date");
    }

    // document has closed tag, but no closing date
    if (this.tags.includes("Closed") && !this.closing_date) {
      this.qc_flags.push("Closed tag but no Closing Date");
    }

    // document has puchase price, but no closing date
    if (this.full_purchase_price && !this.closing_date) {
      this.qc_flags.push("Purchase Price but no Closing Date");
    }

    // agreement term QC
    if (this.agreement_terms) {
      this.agreement_terms.forEach((term, termIndex) => {
        // check for agreement term missing fields
        ["term_length_years", "term_ordinal", "term_type"].forEach((x) => {
          if (!term[x]) {
            this.qc_flags.push(`Missing ${x} on Agreement Term ${termIndex + 1}`);
          }
        });

        // if payment_model is specified, make sure payment_start is also specified
        if (term.payment_model && !term.first_payment_start) {
          this.qc_flags.push(`Missing First Payment Start on Agreement Term ${termIndex + 1}`);
        }
      });
    }

    // check date payment models for missing fields
    if (this.date_payment_models.length > 0) {
      this.date_payment_models.forEach((model, modelIndex) => {
        // check required fields for all models
        ["payment_type", "payment_amount"].forEach((x) => {
          // skip qc flag if the payment amount is 0
          if (x === "payment_amount" && model.payment_amount === 0) {
            return;
          }
          if (!model[x]) {
            this.qc_flags.push(`Missing ${x} on Date Payment Model ${modelIndex + 1}`);
          }
        });

        // check for start date or one-time date
        if (!model.date_begin && !model.date_one_time) {
          this.qc_flags.push(`Missing Start Date OR One-time Date on Date Payment Model ${modelIndex + 1}`);
        }

        // check frequency on periodic models
        if (!model.date_one_time && !model.frequency) {
          this.qc_flags.push(`Missing Frequency on Recurring Date Payment Model ${modelIndex + 1}`);
        }

        // check for end_date when start_date is provided
        if (model.date_begin && !model.date_end) {
          this.qc_flags.push(`Missing End Date on Recurring Date Payment Model ${modelIndex + 1}`);
        }
      });
    }

    // check term payment models for missing fields
    if (this.term_payment_models) {
      this.term_payment_models.forEach((model, modelIndex) => {
        // check required fields for all models
        ["model_type", "payment_frequency"].forEach((x) => {
          if (!model[x]) {
            this.qc_flags.push(`Missing ${x} on Term Payment Model ${modelIndex + 1}`);
          }
        });

        // check for a payment amount
        if (!model.minimum_payment && !model.flat_payment_amount && !model.payment_per_mw && !model.payment_per_mva && !model.payment_per_acre) {
          this.qc_flags.push(`Cannot calculate payment amount on Term Payment Model ${modelIndex + 1}`);
        }

        // check for acreage if payment per acre is specified
        if (model.payment_per_acre && !this.total_agreement_acres) {
          this.qc_flags.push(`Missing Total acres required for Term Payment Model ${modelIndex + 1} $/acre calculation`);
        }
      });
    }

    // end of qc function
  }

  /**
   * Nickname lessors
   */

  nicknameGrantor(longName) {
    // create array of indexes
    var indexes = [];

    // find first instance of "and" or a "," in the name
    // repeat for anything we want to search for, and add it to the list
    longName.toLowerCase().indexOf(" and ") > 0 ? indexes.push(longName.toLowerCase().indexOf(" and ")) : null;
    longName.toLowerCase().indexOf(", ") > 0 ? indexes.push(longName.toLowerCase().indexOf(",")) : null;

    // return whole string if no "stoppers" found
    if (indexes.length === 0) {
      return longName;
    }

    var index = Math.min(...indexes);

    // return the substring up to to the index
    return longName.substring(0, index);
  }

  /**
   * clean unused fields from document object
   * just makes debugging easier
   */
  cleanDoc(doc) {
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
  }
}

module.exports = JupiterDoc;
