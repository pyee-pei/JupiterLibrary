import utils from './utils.js'; // generic import, requires "utils" namespace to be used in code

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
 * @property {Array} lease_terms - array of potential lease terms
 * @property {Date} lease_terms.start_date - start date of lease term
 * @property {Date} lease_terms.end_date - end date of lease term
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

        // Grantor/Lessor
        this.grantor = utils.extractFactValue(
            doc,
            utils.getFactTypeId('Grantor/Lessor', factTypes),
            utils.getFactFieldId('Grantor/Lessor', 'Grantor/Lessor Name', factTypes),
            'string'
        );

        // Effective Date
        this.effective_date = utils.extractFactValue(
            doc,
            utils.getFactTypeId('Effective Date', factTypes),
            utils.getFactFieldId('Effective Date', 'Effective Date', factTypes),
            'date'
        );

        // Lease Terms
        this.lease_terms = utils.extractMultiFactValues(doc, utils.getFactTypeId('Lease Term', factTypes));

        // Periodic Payment Models
        this.periodic_payment_models = utils.extractMultiFactValues(doc, utils.getFactTypeId('Periodic Payment Model', factTypes));

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
        this.calcLeaseTermDates(this.lease_terms, this.effective_date);

        // calc payments in each term
        this.lease_terms.forEach((term) => {
            this.calcPeriodicPayments(term, this.periodic_payment_models);
        });
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
    calcLeaseTermDates(leaseTerms, effectiveDate) {
        leaseTerms
            .sort((a, b) => a.term_ordinal - b.term_ordinal)
            .forEach((term, index) => {
                // start day after previous term end, or if no previous term, use effective date
                term.start_date = leaseTerms[index - 1] ? leaseTerms[index - 1].end_date.plus({ days: 1 }) : effectiveDate;
                term.start_date_text = term.start_date.toFormat('M/d/yyyy');

                // end one day prior to the Nth anniversary
                term.end_date = term.start_date.plus({ years: term.term_length_years }).plus({ days: -1 });
                term.end_date_text = term.end_date.toFormat('M/d/yyyy');

                // calculate previous periods on same payment model for escalation
                // NOTE: this will not continue periodic escalations across payment models
                term.previous_periods = leaseTerms
                    .filter((x) => x.term_ordinal < term.term_ordinal && x.payment_model === term.payment_model)
                    .reduce((accumulator, t) => accumulator + t.term_length_years, 0);

                // calculate perevious terms for term escalation
                term.previous_terms = leaseTerms.filter((x) => x.term_ordinal < term.term_ordinal && x.payment_model === term.payment_model).length;
            });
    }

    /**
     * calculates base periodic payment for a given model
     * largest of all possible ways to calculate payment
     */
    periodicBasePayment(model, compounding_escalation, term_escalation_rate, term_escalation_amount, previous_terms) {
        if (!model) {
            return 0;
        }

        // calculate max payment from different methods
        var base = Math.max(
            model.minimum_payment ?? 0,
            (model.payment_per_mw ?? 0) * (model.mw ?? 0),
            (model.inverter_count ?? 0) * (model.inverter_rating_mvas ?? 0) * (model.payment_per_mva ?? 0),
            model.flat_payment_amount ?? 0,
            (model.payment_per_acre ?? 0) * (model.leased_acres ?? 0)
        );

        // apply amount escalation
        base = base + ((term_escalation_amount ?? 0) * previous_terms ?? 0);

        // apply rate escalation
        if (compounding_escalation) {
            base = base * Math.pow(1 + (term_escalation_rate ?? 0), previous_terms ?? 0);
        } else {
            base = base + base * (term_escalation_rate ?? 0) * (previous_terms ?? 0);
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
     * calculate periodic payments for a given term
     */

    calcPeriodicPayments(term, paymentModels) {
        const payments = [];

        // get payment model for this term
        const model = this.termPaymentModel(term, paymentModels);
        const periodic_payment = this.periodicBasePayment(
            model,
            term.compounding_escalation,
            term.escalation_rate,
            term.escalation_amount,
            term.previous_terms
        );

        // exit if no model
        if (!model) {
            return null;
        }

        // initialize variables
        // var current_payment_date = term.extension ? term.start_date : model.first_payment_date ?? term.start_date;
        if (!term.extension) {
            // if not an extension, use first payment date or term start date + lag
            var current_payment_date = model.first_payment_date ?? term.start_date.plus({ days: model.first_payment_due_days_after_term_start ?? 0 });
        } else {
            // if an extension, use term start date + lag
            var current_payment_date = term.start_date;
        }
        var payment_period_start = term.start_date;
        var i = 0;
        var prorata_years;
        var payment_period_end;
        var term_escalation_rate = term.escalation_rate ?? 0;
        var periodic_escalation_rate = model.periodic_escalation_rate ?? 0;

        if (model.prorated_first_period && i === 0) {
            // payment period ends on 12/31 of starting year
            payment_period_end = new luxon.DateTime.local(current_payment_date.year, 12, 31);

            // calculate prorata years
            // add a day to the end (luxon diff math)
            prorata_years = utils.round(payment_period_end.plus({ days: 1 }).diff(payment_period_start, 'years').years, 2);

            // push initial payment
            payments.push({
                payment_index: i,
                payment_date: current_payment_date.toLocaleString(),
                payment_period_start: payment_period_start.toLocaleString(),
                payment_period_end: payment_period_end.toLocaleString(),
                prorata_years: prorata_years,
                base_payment: periodic_payment,
                total_payment_amount: utils.round(utils.calculateCompoundingGrowth(periodic_paymnet, periodic_escalation_rate, i + term.previous_periods) * 
                // total_payment_amount: utils.round(
                //     periodic_payment * (1 + (periodic_escalation_rate * (i + term.previous_periods)) / 100) * prorata_years,
                //     4
                // ),
            });

            current_payment_date = new luxon.DateTime.local(current_payment_date.year + 1, 1, 1); // jan 1 of next year
            i++;
        }

        // TODO loop through remaining payments
        while (current_payment_date < term.end_date) {
            payment_period_end = model.prorated_first_period
                ? new luxon.DateTime.local(current_payment_date.year, 12, 31)
                : current_payment_date.plus({ years: 1 }).minus({ days: 1 });
            payment_period_end = payment_period_end > term.end_date ? term.end_date : payment_period_end;

            prorata_years = utils.round(payment_period_end.plus({ days: 1 }).diff(current_payment_date, 'years').years, 4);

            payments.push({
                payment_index: i,
                payment_date: current_payment_date
                    .plus({
                        days: i === 0 ? model.first_payment_due_days_after_term_start ?? 0 : 0,
                    })
                    .toLocaleString(),
                payment_period_start: current_payment_date.toLocaleString(),
                payment_period_end: payment_period_end.toLocaleString(),
                prorata_years: prorata_years,
                base_payment: utils.round(periodic_payment * (1 + term_escalation_rate / 100), 4),
                total_payment_amount: utils.round(
                    periodic_payment *
                        (1 + (term_escalation_rate * (term.term_ordinal - 1)) / 100) *
                        (1 + (periodic_escalation_rate * (i + term.previous_periods)) / 100) *
                        prorata_years,
                    4
                ),
            });

            current_payment_date = payment_period_end.plus({ days: 1 });
            i++;
        }

        payments.sort((a, b) => a.payment_date - b.payment_date);

        // mutate term object to store payment array
        term.payments = payments;

        // calc total payments for whole term
        term.cumulative_payment_amount = payments.reduce((a, b) => a + b.total_payment_amount, 0);
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

export default JupiterDoc;
