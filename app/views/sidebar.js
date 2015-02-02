import Ember from 'ember';

export default Ember.View.extend({
  classNameBindings: [':sidebar', 'isCollapsed:collapsed'],
  isCollapsed: Ember.computed.alias('controller.preferences.sidebarCollapsed'),

  actions: {
    toggleCollapse: function() {
      this.get('controller').send('toggleCollapse');
    }
  },

  didInsertElement: function() {
    this.addObserver('isCollapsed', this, this.animateWidth);
  },

  animateWidth: function() {
    var growth;

    if (this.get('isCollapsed')) {
      growth = '-= 200px';
    } else {
      growth = '+= 200px';
    }

    this.$().velocity({
      width: growth
    }, {
      duration: 150,
      progress: function() {
        Ember.$('.scrollable').TrackpadScrollEmulator('recalculate');
      }
    });
  }
});
