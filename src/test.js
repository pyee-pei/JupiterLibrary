import api from "./api.js";

const factTypes = await api.getFactTypes();
const docs = await api.searchDocuments();

docs.forEach((doc) => {
  doc.facts.forEach((fact) => {
    fields.forEach(field);
    fact.docId = doc.id;
    fact.factTypeName = factTypes.find((x) => x.id === fact.factTypeId).name;
  });
});

console.log(docs[0], docs[0].facts);

/*

const docs = {{ jpTopNav.filteredDocs }};

if (docs.length === 0) { return null; }
const projects = {{ SELECT_Projects.data }};

var result = [];

// loop through all docs and all agreement terms, adding an object to the result array for every term
docs.forEach(doc => {

  // lookup the ISO for the project
  var project = projects.find(x => x.project_id === doc.project_id);
  
  doc.agreement_terms?.forEach(term => {
    var obj = {
      docName: doc.name,
      docProjectId: doc.project_id,
      agreementId: doc.agreement_group,
      project_id: project?.project_id,
      project_name: project?.project_name,
      ISO: project?.ISO,
      term_ordinal: term.term_ordinal,
      term_type: term.term_type,
      term_start: term.start_date_text,
      term_end: term.end_date_text,
      extension: term.extension
    };
    result.push(obj);
  })
});

return result;


*/
