'use strict';

let Boom = require('boom');
let Joi = require('joi');
let lodash = require('lodash');

let internal = Joi.object({
    extendConditions: Joi.object(),
    extendCategories: Joi.object()
});

let condition = {
    '23505': function (err) {
        return Boom.conflict(`Failed relationship constraint: ${err.constraint}`);
    }, 
    '42501': function (err) {
        return Boom.forbidden(err.toString());
    }
}

let category = {
    '08': function (err) {
        return Boom.serverTimeout('Database unavailable');
    },
    '53': function (err) {
        return Boom.serverTimeout('Database unavailable');
    },
    '22': function (err) {
        return Boom.badData(err.toString());
    },
    '23': function (err) {
        return Boom.badData(err.constraint);
    }
}

module.exports = (options) => {

  if (typeof options !== 'undefined') {
    let regErr = internal.validate(options);
    if (regErr.error) {
      throw regErr.error;
    }
    condition = lodash.assign(condition, options.extendConditions);
    category = lodash.assign(category, options.extendCategories);
  }

  return {

    detect: (value) => {
      return (value !== null && typeof value === 'object' && value.severity === 'ERROR');
    },

    handle: (value) => {
      if (value.hasOwnProperty('code') && condition.hasOwnProperty(value.code)) {
          return condition[value.code](value);
      } else if (value.hasOwnProperty('code') && typeof value.code === 'string' && category.hasOwnProperty(value.code.substr(0, 2))) {
          return category[value.code.substr(0, 2)](value);
      } else {
          return Boom.badImplementation(value.toString());
      }
    }
  };
};
