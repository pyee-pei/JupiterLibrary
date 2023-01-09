'use strict';

// Description: Utility functions for ThoughtTrace document objects

function cleanDoc(doc) {
  // remove clutter
  delete doc.archivedBy;
  delete doc.archivedOn;
  delete doc.highlightedText;
  delete doc.pageManipulationStatus;
  delete doc.processingStatus;
  delete doc.pages;
  delete doc.securityLabelId;
  delete doc.sourceDocumentId;
  delete doc.sourceDocumentName;
  delete doc.pageCount;
  delete doc.thoughts;
  delete doc.userIds;

  return doc;
}

function cleanFieldNames(str) {
  // convert field name text to property names
  return str
    .toLowerCase()
    .replace(/[\s()]+/g, "_")
    .replace(/_+$/, "");
}

var utils = { cleanDoc, cleanFieldNames };

/**
 * Represents a Jupiter document.
 * @constructor
 * @param {Object} doc - The document object itself
 */
function Constructor(doc) {
  // remove clutter
  utils.cleanDoc(doc);
  this.doc = doc;
}

/**
 * Returns the document id.
 * @returns {string} - The document id
 */
Constructor.prototype.getId = function () {
  return this.doc.id;
};

/**
 * Returns the document name.
 * @returns {string} - The document name
 */
Constructor.prototype.getName = function () {
  return this.doc.name;
};

module.exports = Constructor;
