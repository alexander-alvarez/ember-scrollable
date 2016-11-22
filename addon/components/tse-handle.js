import Ember from 'ember';
import layout from '../templates/components/tse-handle';

const TSEHandle = Ember.Component.extend({
  layout,
  classNames: ['drag-handle'],
  classNameBindings: ['showHandle:visible'],

  scrollbar: null,

  startDrag(e) {
    // Preventing the event's default action stops text being
    // selectable during the drag.
    e.preventDefault();

    const scrollbar = this.get('scrollbar').startDrag(e);

    this.on('mouseMove', this, this.drag);
    this.on('mouseUp', this, this.endDrag);
  },

  drag(e) {
    e.preventDefault();

    this.get('scrollbar').drag(e);
  },

  endDrag() {
    this.off('mouseMove', this, this.drag);
    this.off('mouseUp', this, this.endDrag);
  },

});


TSEHandle.reopenClass({
  positionalParams: ['showHandle']
});

export default TSEHandle;
