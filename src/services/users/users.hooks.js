import errors from 'feathers-errors';
import commons from 'feathers-hooks-common';
import { restrictToOwner } from 'feathers-authentication-hooks';
import { toChecksumAddress } from 'web3-utils';

import notifyOfChange from '../../hooks/notifyOfChange';
import sanitizeAddress from '../../hooks/sanitizeAddress';

const normalizeId = () => {
  return context => {
    if (context.id) {
      context.id = toChecksumAddress(context.id);
    }
    return context;
  };
};

const setAddress = context => {
  if (context.provider === undefined) {
    if (!context.data.address) throw new errors.GeneralError('must provide address when calling users.create internally');

    return context;
  }

  commons.setByDot(context.data, 'address', context.params.user.address);
  return context;
};

const restrict = [
  normalizeId(),
  restrictToOwner({
    idField: 'address',
    ownerField: 'address',
  }),
];

const address = [
  setAddress,
  sanitizeAddress('address', { required: true, validate: true }),
];

const notifyParents = [
  {
    service: 'campaigns',
    parentField: 'ownerAddress',
    childField: 'address',
    watchFields: [ 'avatar', 'name' ],
  },
  {
    service: 'causes',
    parentField: 'ownerAddress',
    childField: 'address',
    watchFields: [ 'avatar', 'name' ],
  },
];

module.exports = {
  before: {
    all: [],
    find: [ sanitizeAddress('address') ],
    get: [ normalizeId() ],
    create: [ commons.discard('_id'), ...address ],
    update: [ ...restrict, commons.stashBefore() ],
    patch: [ ...restrict, commons.stashBefore() ],
    remove: [ commons.disallow() ],
  },

  after: {
    all: [
      commons.when(hook => hook.params.provider, commons.discard('_id')),
    ],
    find: [],
    get: [],
    create: [],
    update: [ notifyOfChange(...notifyParents) ],
    patch: [ notifyOfChange(...notifyParents) ],
    remove: [ notifyOfChange(...notifyParents) ],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
};