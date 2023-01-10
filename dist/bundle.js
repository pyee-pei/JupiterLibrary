'use strict';

// Description: Utility functions for ThoughtTrace document objects

/***
 * extract multiple facts from a fact type
 */
function extractMultiFactValues (doc, factType) {
  
  const facts = doc.facts ? doc.facts.filter(x => x.factTypeId === factType) : null;
  
  // do not proceed if no facts found
  if (!facts) { return []; }
    
  const result = [];
  
  facts.forEach((f) => {
    
    const fact = {};
    fact.id = f.id;
    
    if (!f.fields) { return fact; }
    
    f.fields.forEach((field) => {
      
      var property_name = cleanFieldNames(field.factTypeFieldName);
      var value = '';
      
      switch(field.dataType) {
        case 'Number': value = field.numberValue; break;
        case 'Date': value = new luxon.DateTime.fromISO(field.dateValue); break;
        case 'String': value = field.stringValue; break;
        case 'SelectList': value = field.stringValue; break;
        case 'Boolean': value = field.booleanValue; break;
      }
      
      // create property and value based on results
      fact[property_name] = value;
      
    });
    
    result.push(fact);
    
  });
  
  return result;

}


/***
 * clean unused fields from document object
 * just makes debugging easier
 */
function cleanDoc(doc) {

  const fields = ['archivedBy', 'archivedOn', 'highlightedText', 'pageManipulationStatus', 'processingStatus', 'pages', 'securityLabelId', 'sourceDocumentId', 'sourceDocumentName', 'pageCount', 'thoughts', 'userIds'];

  fields.forEach(field => {
    delete doc[field];
  });

  return doc;
}

/***
 * convert fact field names to be more javascript friendly
 */
function cleanFieldNames(str) {
  // convert field name text to property names
  return str
    .toLowerCase()
    .replace(/[\s()]+/g, "_")
    .replace(/_+$/, "");
}

var utils = { extractMultiFactValues, cleanDoc, cleanFieldNames };

const FACT_TYPE_IDS = {
    lease_terms: '7601840f-8d47-4c0b-a2a1-2ad2a692bfb8'
};

/** 
* Represents a Jupiter document.
 * @constructor
 * @param {Object} doc - The document object itself
 * @property {string} id - Unique identifier (ThoughtTrace)
 * @property {Array} lease_terms - Lease terms
 */
class JupiterDoc {
    constructor(doc) {
        // remove clutter
        utils.cleanDoc(doc);

        // set properties
        this.docObject = doc;
        this.id = doc.id;

        this.lease_terms = utils.extractMultiFactValues(doc, FACT_TYPE_IDS.lease_terms);
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

module.exports = JupiterDoc;
