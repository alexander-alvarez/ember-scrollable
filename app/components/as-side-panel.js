import Ember from 'ember';

export default Ember.Component.extend({
  classNameBindings: [':side-panel', 'isActive:active'],
  layoutName: 'components/as-side-panel',

  click: function(event) {
    if(Ember.$(event.target).closest(this.$('> div')).length === 0) {
      this.send('close');
    }
  },

  open: function() {
    this.$('> div').velocity({
      right: 0
    }, {
      duration: 'fast'
    });

    this.set('isActive', true);
  }.on('didInsertElement'),

  actions: {
    close: function() {
      this.$('> div').velocity({
        right: '-70%'
      }, {
        duration: 'fast',
        complete: (() => {
          this.sendAction('close');
        })
      });

      this.set('isActive', false);
    }
  }
});
