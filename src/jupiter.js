import utils from "./utils.js"; // generic import, requires "utils" namespace to be used in code

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

export default Constructor;
