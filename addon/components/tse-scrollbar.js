import Ember from 'ember';
import layout from '../templates/components/tse-scrollbar';
import {Horizontal, Vertical} from '../classes/scrollable';

const {
  computed
} = Ember;

const TSEScrollbar = Ember.Component.extend({
  layout,
  classNames: ['tse-scrollbar'],
  classNameBindings: ['horizontal:tse-scrollbar-horizontal:tse-scrollbar-vertical'],
  scrollbar: null,
  horizontal: false,
  showHandle: false,

  mouseDown(e) {
    this.get('scrollbar').jumpScroll(e);
  },

  jumpScroll(e) {
    // If the drag handle element was pressed, don't do anything here.
    //if (e.target === this._verticalHandleElement[0] || e.target === this._horizontalHandleElement[0]) {
    //  return;
    //}

    this.get('scrollbar').jumpScroll(e);
  },

  scrollbar: computed('horizontal', 'width', 'height', 'scrollBarWidth', function() {
    const {width, height, scrollBarWidth} = this.getProperties('width', 'height', 'scrollBarWidth');
    const Class = this.get('horizontal') ? Horizontal : Vertical;
    return new Class({
      scrollbarElement: this.$(),
      handleElement: this.$('.drag-handle'),
      width: width,
      height: height,
      scrollbarWidth: this.measureScrollbar()
    });
  }),

  measureScrollbar() {

    /**
     * Calculate scrollbar width
     *
     * Original function by Jonathan Sharp:
     * http://jdsharp.us/jQuery/minute/calculate-scrollbar-width.php
     * Updated to work in Chrome v25.
     */
      // Append a temporary scrolling element to the DOM, then measure
      // the difference between between its outer and inner elements.
    var tempEl = $('<div class="scrollbar-width-tester" style="width:50px;height:50px;overflow-y:scroll;position:absolute;top:-200px;left:-200px;"><div style="height:100px;"></div>');
    $('body').append(tempEl);
    var width = $(tempEl).innerWidth();
    var widthMinusScrollbars = $('div', tempEl).innerWidth();
    tempEl.remove();
    // On OS X if the scrollbar is set to auto hide it will have zero width. On webkit we can still
    // hide it using ::-webkit-scrollbar { width:0; height:0; } but there is no moz equivalent. So we're
    // forced to sniff Firefox and return a hard-coded scrollbar width. I know, I know...
    if (width === widthMinusScrollbars && navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
      return 17;
    }
    return (width - widthMinusScrollbars);


  },

  setupResize() {
    this._resizeHandler = () => {
      debounce(this, this.resizeScrollbar, 16);
    };

    window.addEventListener('resize', this._resizeHandler, true);
  },


});

TSEScrollbar.reopenClass({
  positionalParams: ['horizontal', 'showHandle']
});

export default TSEScrollbar;
