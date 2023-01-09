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

export default { cleanDoc, cleanFieldNames };
