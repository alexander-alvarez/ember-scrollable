import Ember from 'ember';
import layout from '../templates/components/tse-handle';

const TSEHandle = Ember.Component.extend({
  layout,
  classNames: ['drag-handle'],
  classNameBindings: ['showHandle:visible']
});


TSEHandle.reopenClass({
  positionalParams: ['showHandle']
});

export default TSEHandle;
