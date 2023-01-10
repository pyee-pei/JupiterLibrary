import utils from "./utils.js"; // generic import, requires "utils" namespace to be used in code

const FACT_TYPE_IDS = {
    effective_date: 'cc05d0b7-005b-4775-a84d-e7cc98a7241f',
    lease_terms: '7601840f-8d47-4c0b-a2a1-2ad2a692bfb8',
    periodic_payment_models: 'e31c3090-21b0-4afd-877d-cf7eeed20673'
};

const FACT_FIELD_IDS = {
    effective_date: 'cb93b25d-8bed-4865-8402-b2b3ded62af5',
}

/** 
* Represents a Jupiter document.
 * @constructor
 * @param {Object} doc - The document object itself
 * @property {string} id - Unique identifier (ThoughtTrace)
 * @property {string} name - Document name
 * @property {Array} lease_terms - array of potential lease terms
 */
class JupiterDoc {
    constructor(doc, factTypes) {
        // remove clutter
        utils.cleanDoc(doc);
        utils.addFactandFieldNames(doc, factTypes)

        // set initial properties
        this.rawDoc = doc;
        this.id = doc.id;
        this.name = doc.name;

        // set fact-based properties and arrays
        this.effective_date = utils.extractFactValue(doc, FACT_TYPE_IDS.effective_date, FACT_FIELD_IDS.effective_date, 'date' )
        this.lease_terms = utils.extractMultiFactValues(doc, FACT_TYPE_IDS.lease_terms);
        this.periodic_payment_models = utils.extractMultiFactValues(doc, FACT_TYPE_IDS.periodic_payment_models);

        // calculate lease term dates
        utils.calcLeaseTermDates(this.lease_terms, this.effective_date);

        // calc payments in each term
        this.lease_terms.forEach((term) => {
            utils.calcPeriodicPayments(term, this.periodic_payment_models);
        });

    }
    /**
     * Returns the document id.
     * @returns {string} - The document id
     */
    getId() {
        return this.id;
    }
    /**
     * Returns the document name.
     * @returns {string} - The document name
     */
    getName() {
        return this.name;
    }
}

export default JupiterDoc;
