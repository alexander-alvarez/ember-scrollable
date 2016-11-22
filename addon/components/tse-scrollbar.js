import Ember from 'ember';
import layout from '../templates/components/tse-scrollbar';

const TSEScrollbar = Ember.Component.extend({
  layout,
  classNames: ['tse-scrollbar'],
  classNameBindings: ['horizontal:tse-scrollbar-horizonal:tse-scrollbar-vertical'],
  horizontal: false,
  showHandle: false
});

TSEScrollbar.reopenClass({
  positionalParams: ['horizontal', 'showHandle']
});

export default TSEScrollbar;
