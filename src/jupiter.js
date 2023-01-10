import utils from "./utils.js"; // generic import, requires "utils" namespace to be used in code

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
    utils.cleanDoc(doc);
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

    // Grantor/Lessor
    this.grantor = utils.extractFactValue(
      doc,
      utils.getFactTypeId("Grantor/Lessor", factTypes),
      utils.getFactFieldId("Grantor/Lessor", "Grantor/Lessor Name", factTypes),
      "string"
    );

    // Effective Date
    this.effective_date = utils.extractFactValue(
      doc,
      utils.getFactTypeId("Effective Date", factTypes),
      utils.getFactFieldId("Effective Date", "Effective Date", factTypes),
      "date"
    );

    // Lease Terms
    this.lease_terms = utils.extractMultiFactValues(
      doc,
      utils.getFactTypeId("Lease Term", factTypes)
    );

    // Periodic Payment Models
    this.periodic_payment_models = utils.extractMultiFactValues(
      doc,
      utils.getFactTypeId("Periodic Payment Model", factTypes)
    );

    // tags
    this.tags = this.#getTags(tags);

    // these may need to be methods in the class that we call in the constructor
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

  /**
   * creates array of tag names from tag ids
   */
  #getTags(tags) {
    var result = [];
    this.rawDoc.tagIds.forEach((id) => {
      var tag = tags.find((x) => x.id === id);

      if (tag) {
        result.push(tags.find((x) => x.id === id).name);
      }
    });

    return result;
  }
}

export default JupiterDoc;
