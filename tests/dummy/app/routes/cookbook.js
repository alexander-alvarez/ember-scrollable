import Ember from 'ember';

const { Route } = Ember;

export default Route.extend({

  model() {
    return {
      range: Array.apply(null, new Array(10000)).map((_, i) => i + 1)
    };
  }
});
