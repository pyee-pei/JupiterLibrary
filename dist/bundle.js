'use strict';

// Description: Utility functions for ThoughtTrace document objects

/***
 * round number to specified decimal places
 * only works when @decimals is a positive integer
 */

const round = (value, decimals) => {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
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
                case 'date':
                    return new luxon.DateTime.fromISO(field.dateValue);
                case 'number':
                    return field.numberValue;
                case 'string':
                    return field.stringValue;
                case 'bool':
                    return field.booleanValue;
                default:
                    return null;
            }
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
            var value = '';

            switch (field.dataType) {
                case 'Number':
                    value = field.numberValue;
                    break;
                case 'Date':
                    value = new luxon.DateTime.fromISO(field.dateValue);
                    break;
                case 'String':
                    value = field.stringValue;
                    break;
                case 'SelectList':
                    value = field.stringValue;
                    break;
                case 'Boolean':
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
        var value = '';

        switch (field.dataType) {
            case 'Number':
                value = field.numberValue;
                break;
            case 'Date':
                value = new luxon.DateTime.fromISO(field.dateValue);
                break;
            case 'String':
                value = field.stringValue;
                break;
            case 'SelectList':
                value = field.stringValue;
                break;
            case 'Boolean':
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
              .replace(/[\s()]+/g, '_')
              .replace(/_+$/, '')
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

// /***
//  * API - GET Auth Token
//  */
// const apiGetAuthToken = async (clienet_id, secret) => {
//     const url = `https://cors-anywhere.herokuapp.com/https://identity.thoughttrace.com/connect/token`;
//     const response = await fetch(url, {
//         method: 'POST',
//         querytype: 'x-www-form-urlencoded',
//         body: `grant_type=client_credentials&client_id=${clienet_id}&client_secret=${secret}`,
//     });

//     return response;
// };

// /***
//  * API - GET Tags
//  */
// const apiGetTags = async (token) => {
//     const url = `https://api.thoughttrace.com/tags`;
//     const response = await fetch(url, {
//         method: 'GET',
//         headers: {
//             Authorization: `Bearer ${token}`,
//         },
//     });

//     return response;
// };

var utils = {
    round,
    getFactTypeId,
    getFactFieldId,
    getTagName,
    addFactandFieldNames,
    extractFactValue,
    extractMultiFactValues,
    extractFactMultiFields,
    getEarliestDateTime,
    cleanFieldNames,
    calculateCompoundingGrowth,
    calculateGrowth,
    // apiGetAuthToken,
    // apiGetTags,
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
 * @property {Array} periodic_payment_models - array of periodic payment models
 * @property {Array} tags - array of tags
 */
class JupiterDoc {
    constructor(doc, factTypes, docTypes = [], tags = []) {
        // remove clutter
        this.cleanDoc(doc);
        utils.addFactandFieldNames(doc, factTypes);

        // set initial properties
        this.rawDoc = doc;
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
            utils.getFactTypeId('Agreement ID', factTypes),
            utils.getFactFieldId('Agreement ID', 'Agreement ID', factTypes),
            'string'
        );

        // Project ID
        this.project_id = utils.extractFactValue(
            doc,
            utils.getFactTypeId('Project ID', factTypes),
            utils.getFactFieldId('Project ID', 'Project ID', factTypes),
            'string'
        );

        // Project Name
        this.project_name = utils.extractFactValue(
            doc,
            utils.getFactTypeId('Project Name', factTypes),
            utils.getFactFieldId('Project Name', 'Project Name', factTypes),
            'string'
        );

        // Grantor/Lessor - Multi-instance fact
        this.grantor = utils.extractMultiFactValues(doc, utils.getFactTypeId('Grantor/Lessor', factTypes));

        // Effective Date
        this.effective_date = utils.extractFactValue(
            doc,
            utils.getFactTypeId('Effective Date', factTypes),
            utils.getFactFieldId('Effective Date', 'Effective Date', factTypes),
            'date'
        );

        // Amendment Date
        this.amendment_date = utils.extractFactValue(
            doc,
            utils.getFactTypeId('Amendment Date', factTypes),
            utils.getFactFieldId('Amendment Date', 'Amendment Date', factTypes),
            'date'
        );

        // Leased Acres
        this.leased_acres = utils.extractFactValue(
            doc,
            utils.getFactTypeId('Leased Acres', factTypes),
            utils.getFactFieldId('Leased Acres', 'Leased Acres', factTypes),
            'number'
        );

        // Purchase Price
        this.full_purchase_price = utils.extractFactValue(
            doc,
            utils.getFactTypeId('Full Purchase Price', factTypes),
            utils.getFactFieldId('Full Purchase Price', 'Full Purchase Price', factTypes),
            'number'
        );

        // Operational Details
        this.operational_details = utils.extractFactMultiFields(doc, utils.getFactTypeId('Operational Details', factTypes));

        // Agreement Terms
        this.agreement_terms = utils.extractMultiFactValues(doc, utils.getFactTypeId('Agreement Term', factTypes));

        // Option Terms
        this.option_terms = utils.extractMultiFactValues(doc, utils.getFactTypeId('Option Term', factTypes));

        // Periodic Payment Models
        this.periodic_payment_models = utils.extractMultiFactValues(doc, utils.getFactTypeId('Periodic Payment Model', factTypes));

        // One Time Payment Models
        this.one_time_payment_models = utils.extractMultiFactValues(doc, utils.getFactTypeId('One Time Payment Model', factTypes));

        // Tags
        this.tags = this.getTags(tags);

        // Review Status
        this.review_status = utils.extractFactValue(
            doc,
            utils.getFactTypeId('Review Status', factTypes),
            utils.getFactFieldId('Review Status', 'Review Status', factTypes),
            'string'
        );

        // Review Status Notes
        this.review_status_notes = utils.extractFactValue(
            doc,
            utils.getFactTypeId('Review Status', factTypes),
            utils.getFactFieldId('Review Status', 'Notes', factTypes),
            'string'
        );

        // calculate lease term dates
        this.calcAgreementTermDates(this.agreement_terms, this.effective_date, this.operational_details);
        this.calcOptionTermDates(this.option_terms, this.effective_date);
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
    calcAgreementTermDates(agreementTerms, effectiveDate, opDetails) {
        // exit if no effectiveDate
        if (!effectiveDate) {
            return;
        }

        opDetails = opDetails || {};

        agreementTerms
            .sort((a, b) => a.term_ordinal - b.term_ordinal)
            .forEach((term, index) => {
                // check opDetails for actual construction start date
                // only set on non-extension terms for construction and operations
                if (term.term_type === 'Construction' && !term.extension && opDetails.construction_commencement) {
                    term.start_date = opDetails.construction_commencement;
                } else if (term.term_type === 'Operations' && !term.extension && opDetails.operations_commencement) {
                    term.start_date = opDetails.operations_commencement;
                } else {
                    // start day after previous term end, or if no previous term, use effective date
                    term.start_date = agreementTerms[index - 1] ? agreementTerms[index - 1].end_date.plus({ days: 1 }) : effectiveDate;
                }
                // add a text version pre-formatted
                term.start_date_text = term.start_date.toFormat('MM/dd/yyyy');

                // calculated end-date, will be tested against opDates later
                // end one day prior to the Nth anniversary, or on operationalDetails termination date, whichever is sooner
                term.end_date = utils.getEarliestDateTime(
                    opDetails.termination,
                    term.start_date.plus({ years: term.term_length_years }).plus({ days: -1 })
                );

                // on non-construction and non-operational terms, check to see if they are cut short, or totally removed by operational dates
                if (term.term_type !== 'Construction' && term.term_type !== 'Operations') {
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
                } else if (term.term_type === 'Construction' && opDetails.operations_commencement) {
                    // check construction term against operations commencement date
                    if (term.end_date.ts >= opDetails.operations_commencement.ts) {
                        term.end_date = opDetails.operations_commencement.plus({ days: -1 });
                    }
                }

                term.end_date_text = term.end_date.toFormat('MM/dd/yyyy');

                // calculate previous periods on same payment model for periodic escalation
                // NOTE: this will not continue periodic escalations across payment models
                term.previous_periods = agreementTerms
                    .filter((x) => x.term_ordinal < term.term_ordinal && x.payment_model === term.payment_model)
                    .reduce((accumulator, t) => accumulator + t.term_length_years, 0);

                // calculate perevious terms for term escalation
                term.previous_terms = agreementTerms.filter(
                    (x) => x.term_ordinal < term.term_ordinal && x.payment_model === term.payment_model
                ).length;
            });
    }

    /**
     * calculate option term dates
     */
    calcOptionTermDates(optionTerms, effectiveDate) {
        // exit if no effectiveDate
        if (!effectiveDate) {
            return;
        }

        optionTerms
            .sort((a, b) => a.term_ordinal - b.term_ordinal)
            .forEach((term, index) => {
                // start day after previous term end, or if no previous term, use effective date
                term.start_date = optionTerms[index - 1] ? optionTerms[index - 1].end_date.plus({ days: 1 }) : effectiveDate;
                // add a text version pre-formatted
                term.start_date_text = term.start_date.toFormat('MM/dd/yyyy');

                // calculated end-date
                term.end_date = term.start_date.plus({ months: term.term_months ?? 0, days: term.term_days ?? 0 });
                term.end_date_text = term.end_date.toFormat('MM/dd/yyyy');
            });
    }

    /**
     * calculates base periodic payment for a given model
     * largest of all possible ways to calculate payment
     */
    periodicBasePayment(model, compounding_escalation, term_escalation_rate, term_escalation_amount, previous_terms, leased_acres) {
        if (!model) {
            return 0;
        }

        // calculate max payment from different methods
        var base = Math.max(
            model.minimum_payment ?? 0,
            (model.payment_per_mw ?? 0) * (model.mw ?? 0),
            (model.inverter_count ?? 0) * (model.inverter_rating_mvas ?? 0) * (model.payment_per_mva ?? 0),
            model.flat_payment_amount ?? 0,
            (model.payment_per_acre ?? 0) * (leased_acres ?? 0)
        );

        // apply amount escalation
        base = base + ((term_escalation_amount ?? 0) * previous_terms ?? 0);

        // apply rate escalation
        if (compounding_escalation) {
            base = utils.calculateCompoundingGrowth(base, (term_escalation_rate ?? 0) / 100, previous_terms ?? 0);
        } else {
            base = utils.calculateGrowth(base, (term_escalation_rate ?? 0) / 100, previous_terms ?? 0);
        }

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
            if (frequency === 'Annually') {
                payment_period_end = new luxon.DateTime.local(start_date.year, 12, 31);
            } else if (frequency === 'Quarterly') {
                payment_period_end = new luxon.DateTime.local(start_date.year, start_date.month + 3, 1).minus({ days: 1 });
            } else if (frequency === 'Monthly') {
                payment_period_end = new luxon.DateTime.local(start_date.year, start_date.month, 1).plus({ months: 1 }).minus({ days: 1 });
            }
        } else {
            // anniversary payment dates
            if (frequency === 'Annually') {
                payment_period_end = start_date.plus({ years: 1 }).minus({ days: 1 });
            } else if (frequency === 'Quarterly') {
                payment_period_end = start_date.plus({ months: 3 }).minus({ days: 1 });
            } else if (frequency === 'Monthly') {
                payment_period_end = start_date.plus({ months: 1 }).minus({ days: 1 });
            }
        }

        // if payment period end is after term end, return term end
        return payment_period_end > term_end ? term_end : payment_period_end;
    }

    /***
     * calculate periodic payments for a given term
     */

    calcPeriodicPaymentsForTerm(term, paymentModels, leased_acres) {
        const payments = [];

        // get payment model for this term
        const model = this.termPaymentModel(term, paymentModels);
        const periodic_payment = this.periodicBasePayment(
            model,
            term.compounding_escalation,
            term.escalation_rate,
            term.escalation_amount,
            term.previous_terms,
            leased_acres
        );

        // exit if no model, or start/end dates
        if (!model || !term.start_date || !term.end_date) {
            return null;
        }

        // initialize variables
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        var i = 0;
        var prorata_factor;
        var term_payment_delay_days = term.term_payment_delay_days ?? 0;
        var payment_period_start = term.start_date.plus({ days: term.term_payment_delay_days });
        var payment_date;
        var payment_period_end;

        // var term_escalation_rate = term.escalation_rate ?? 0;
        var periodic_escalation_rate = model.periodic_escalation_rate ?? 0;

        // calc first payment date for term
        switch (term.first_payment_start) {
            case 'Start with Term (plus applicable lag)':
                payment_date = term.start_date.plus({ days: term_payment_delay_days });
                break;
            case 'Start next Jan 1 after Term commencement':
                payment_date = new luxon.DateTime.local(term.start_date.year + 1, 1, 1).plus({ days: term_payment_delay_days });
                break;
            case 'Start 1st of month after commencement':
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
            if (model.payment_frequency === 'Annually') {
                prorata_factor = utils.round(payment_period_end.plus({ days: 1 }).diff(payment_period_start, 'years').years, 4);
            } else if (model.payment_frequency === 'Quarterly') {
                prorata_factor = utils.round(payment_period_end.plus({ days: 1 }).diff(payment_period_start, 'quarters').quarters, 4);
            } else if (model.payment_frequency === 'Monthly') {
                prorata_factor = utils.round(payment_period_end.plus({ days: 1 }).diff(payment_period_start, 'months').months, 4);
            }

            payments.push({
                payment_index: i,
                payment_date: payment_date.toLocaleString(),
                grace_days: i === 0 ? term.first_payment_grace_days ?? 0 : term.subsequent_payment_grace_days ?? 0,
                payment_period_start: payment_period_start.toLocaleString(),
                payment_period_end: payment_period_end.toLocaleString(),
                prorata_factor: prorata_factor,
                applicable_to_purchase: model.applicable_to_purchase,
                // base_payment: utils.round(periodic_payment * (1 + term_escalation_rate / 100), 4),
                total_payment_amount:
                    utils.calculateCompoundingGrowth(periodic_payment, periodic_escalation_rate / 100, i + term.previous_periods) * prorata_factor,
            });

            payment_period_start = payment_period_end.plus({ days: 1 });
            payment_date = payment_period_end.plus({ days: 1 });
            i++;
        }

        payments.sort((a, b) => a.payment_date - b.payment_date);

        // mutate term object to store payment array
        return payments;

        // calc total payments for whole term
        //term.cumulative_payment_amount = payments.reduce((a, b) => a + b.total_payment_amount, 0);
    }

    /***
     * calc payments on all terms for the lease
     */
    calcAllTermPayments() {
        // calc payments in each term
        this.agreement_terms.forEach((term) => {
            if (this.periodic_payment_models) {
                term.periodic_payments = this.calcPeriodicPaymentsForTerm(
                    term,
                    this.amended_periodic_payment_models ?? this.periodic_payment_models,
                    this.amended_leased_acres ?? this.leased_acres
                );
            }
        });
    }

    /**
     * calc one-time payments (including purchase price)
     */
    calcOneTimePayments() {
        // exit if no one-time models
        if (!this.one_time_payment_models.length > 0 || !this.option_terms.length > 0) return;

        var one_time_payments = [];

        // create payment object for all models
        this.one_time_payment_models.forEach((model) => {
            // if payment date is not specified, use effective date
            var payment_date = model.payment_date ?? this.effective_date;

            one_time_payments.push({
                // payment is due on fixed date, or on the effective date
                payment_date: payment_date.toLocaleString(),
                payment_type: model.payment_type,
                payment_amount: model.payment_amount,
                applicable_to_purchase: model.applicable_to_purchase,
                refundable: model.refundable,
            });
        });

        // calculate how mcuh of the purchase price has already been paid
        var previous_applicable_payments = one_time_payments.filter((x) => x.applicable_to_purchase).reduce((a, b) => a + b.payment_amount, 0);

        // loop through agreement terms and find all payments applicable to purchase price
        this.agreement_terms.forEach((term) => {
            if (term.periodic_payments) {
                // add any payments applicable to purchase price
                previous_applicable_payments +=
                    term.periodic_payments.filter((x) => x.applicable_to_purchase).reduce((a, b) => a + b.total_payment_amount, 0) ?? 0;
            }
        });

        // create payment object for purchase price
        one_time_payments.push({
            // assume closing date at the end of all the options
            payment_date: this.option_terms.sort((a, b) => b.end_date - a.end_date)[0].end_date.toLocaleString(),
            payment_type: 'Purchase Price',
            // purchase payment will subtract all payments applicable to purchase price
            payment_amount: this.full_purchase_price - previous_applicable_payments,
            applicable_to_purchase: true,
            refundable: false,
        });

        // mutate doc object to store one time payment array
        this.one_time_payments = one_time_payments;
    }

    /**
     * load amendments & create new properties to store them
     */

    processAmendments(allDocs) {
        const amendments = allDocs.filter((x) => x.agreement_id === this.agreement_id && x.amendment_date && x.id !== this.id);
        if (amendments) {
            // sort amendments by amendment date, adding an ordinal property
            amendments
                .sort((a, b) => {
                    return new Date(a.amendment_date) - new Date(b.amendment_date);
                })
                .map((x) => (x.amendment_ordinal = amendments.indexOf(x) + 1));

            // check each amendment for new values
            // newer amendments overwrite older values
            amendments.forEach((amendment) => {
                // leased acres
                // only write if different from parent doc
                if (amendment.leased_acres && amendment.leased_acres !== this.leased_acres) {
                    this.amended_leased_acres = amendment.leased_acres;
                }

                // lease terms
                if (amendment.agreement_terms && amendment.agreement_terms.length > 0) {
                    this.amended_agreement_terms = amendment.agreement_terms;
                }

                // periodic payment models
                if (amendment.periodic_payment_models && amendment.periodic_payment_models.length > 0) {
                    this.amended_periodic_payment_models = amendment.periodic_payment_models;
                }
            });

            // re-calculate payments based on amended values
            if (this.agreement_terms) {
                this.calcAllTermPayments();
            }
        }
    }

    /**
     * Nickname lessors
     */

    nicknameGrantor(longName) {
        // create array of indexes
        var indexes = [];

        // find first instance of "and" or a "," in the name
        // repeat for anything we want to search for, and add it to the list
        longName.toLowerCase().indexOf(' and ') > 0 ? indexes.push(longName.toLowerCase().indexOf(' and ')) : null;
        longName.toLowerCase().indexOf(', ') > 0 ? indexes.push(longName.toLowerCase().indexOf(',')) : null;

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
            'archivedBy',
            'archivedOn',
            'highlightedText',
            'pageManipulationStatus',
            'processingStatus',
            'pages',
            'securityLabelId',
            'sourceDocumentId',
            'sourceDocumentName',
            'pageCount',
            'thoughts',
            'userIds',
        ];

        fields.forEach((field) => {
            delete doc[field];
        });

        return doc;
    }
}

module.exports = JupiterDoc;
