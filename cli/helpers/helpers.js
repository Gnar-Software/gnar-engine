

export const helpers = {

    assertTrailingSlash: function (path) {
        if (!path.endsWith('/')) {
            return path + '/';
        }
        return path;
    },

    pascalCase: (str) => {
      return str
        .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
        .replace(/^(.)/, (_, c) => c.toUpperCase());
    },

    pascalCasePlural: (str) => {
      const plural = helpers.lowerCasePlural(str);
      return helpers.pascalCase(plural);
    },

    lowerCase: (str) => {
      return str.toLowerCase();
    },

    upperCase: (str) => {
      return str.toUpperCase();
    },

    plural: (str) => {
      if (str.endsWith('y')) {
        return str.slice(0, -1).toLowerCase() + 'ies';
      }
      return str + 's'; 
    },

    lowerCasePlural: (str) => {
      // A very simple pluralization. For production, use a proper pluralization lib.
      if (str.endsWith('y')) {
        return str.slice(0, -1).toLowerCase() + 'ies';
      }
      return str.toLowerCase() + 's';
    },

    capitaliseFirstLetter: function (str) {
        if (typeof str !== 'string' || str.length === 0) {
            return str;
        }
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
