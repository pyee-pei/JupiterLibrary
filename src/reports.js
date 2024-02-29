// quick test report

const allDocs = (docs) => {
  return docs.filter((doc) => doc.agreement_terms.length > 0);
};

const devDecisions = (docs, outlookDays) => {
  // get all option terms coming due in the next outlookDays
  var options = docs.filter((doc) => {
    return (
      // find docs that are options and have a term starting soon
      (doc.document_type?.toLowerCase().includes("option") || doc.document_type?.toLowerCase() === "lease") &&
      doc.agreement_terms?.some((term) => {
        if (term.start_date) {
          // start date must be between today and the outlookDays
          var startDate = new luxon.DateTime.fromMillis(term.start_date?.ts);
          return startDate <= luxon.DateTime.now().plus({ days: outlookDays }) && startDate >= luxon.DateTime.now();
        }
      })
    );
  });

  return options.map((doc) => {
    // select the term that's coming due
    var upcomingTerm = doc.agreement_terms.filter((term) => {
      if (term.start_date) {
        var startDate = new luxon.DateTime.fromMillis(term.start_date?.ts);
        return startDate <= luxon.DateTime.now().plus({ days: outlookDays }) && startDate >= luxon.DateTime.now();
      }
    });

    // select current term
    var currentTerm = doc.agreement_terms.filter((term) => {
      if (term.start_date) {
        var startDate = new luxon.DateTime.fromMillis(term.start_date?.ts);
        var endDate = new luxon.DateTime.fromMillis(term.end_date?.ts);
        return startDate <= luxon.DateTime.now() && endDate >= luxon.DateTime.now();
      }
    });

    // consolidate payments into a single array
    var allPayments = doc.date_payments;
    doc.term_payment_models.forEach((model) => {
      allPayments = allPayments.concat(model.payments);
    });

    return {
      agreement_group: doc.agreement_group,
      upcomingTerm: upcomingTerm,
      currentTerm: currentTerm,
      allPayments: allPayments,
      termModels: doc.term_payment_models,
      dateModels: doc.date_payment_models,
      rawDoc: doc,
    };
  });
};

export { allDocs, devDecisions };
