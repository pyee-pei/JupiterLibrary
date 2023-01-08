'use strict';

function Constructor(doc) {
    this.doc = doc;
}

Constructor.prototype.getId = function() {
    return this.doc.id;
};

Constructor.prototype.getName = function() {
    return this.doc.name;
};

module.exports = Constructor;
