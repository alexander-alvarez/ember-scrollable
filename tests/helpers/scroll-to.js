/* global self */
import Ember from 'ember';
const {run, RSVP} = Ember;

export default function(selector, scrollDirection, position) {
  const $el = self.$(selector);
  return new RSVP.Promise(function(resolve) {
    run(() => {
      $el[scrollDirection](position).promise().done(function() {
        resolve();
      });
    });
  });
}
