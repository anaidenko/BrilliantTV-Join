const constraints = {
  fullName: {
    presence: {
      allowEmpty: false,
    },

    format: {
      pattern: '[a-z0-9 ]+',
      flags: 'i',
      message: '^Full name can contain only letters, numbers, and spaces',
    },

    type: 'string',
  },

  emailAddress: {
    email: {
      message: '^Email address is invalid',
    },

    presence: {
      allowEmpty: false,
    },

    type: 'string',
  },

  emailAddressConfirmation: {
    email: {
      message: '^Email address confirmation is invalid',
    },

    equality: {
      attribute: 'emailAddress',
      message: '^Email address confirmation is not equal to e-mail address',
    },

    presence: {
      allowEmpty: false,
    },

    type: 'string',
  },

  password: {
    length: {
      minimum: 6,
      maximum: 100,
    },

    presence: {
      allowEmpty: false,
    },

    type: 'string',
  },

  passwordConfirmation: {
    equality: 'password',

    length: {
      minimum: 6,
      maximum: 100,
    },

    presence: {
      allowEmpty: false,
    },

    type: 'string',
  },
};

export default constraints;
