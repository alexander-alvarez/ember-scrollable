import Ember from 'ember';
import InboundActionsMixin from 'ember-component-inbound-actions/inbound-actions';
import layout from '../templates/components/ember-scrollable';
import {Horizontal, Vertical} from '../classes/scrollable';
import {styleify} from '../util/css';

const {
  computed,
  run: {
    scheduleOnce,
    debounce
  },
  $,
  isPresent
} = Ember;

const hideDelay = Ember.testing ? 16 : 1000;

const scrollbarSelector = '.tse-scrollbar';
const handleSelector = '.drag-handle';
const scrollContentSelector = '.tse-scroll-content';
const contentSelector = '.tse-content';

export default Ember.Component.extend(InboundActionsMixin, {
  layout,
  classNameBindings: [':ember-scrollable', ':tse-scrollable', 'horizontal:horizontal:vertical'],

  /**
   * If horizontal is true, the scrollbar will be shown horizontally, else vertically.
   *
   * @property horizontal
   * @public
   * @type Boolean
   * @default false
   */
  horizontal: false,
  /**
   * Indicates whether the scrollbar should auto hide after a given period of time (see hideDelay),
   * or remain persitent alongside the content to be scrolled.
   *
   * @property autoHide
   * @public
   * @type Boolean
   * @default true
   */
  autoHide: true,
  scrollBuffer: 50,
  /**
   * Number indicating offset from anchor point (top for vertical, left for horizontal) where the scroll handle
   * should be rendered.
   *
   * @property scrollTo
   * @public
   * @type Number
   */
  scrollTo: null,
  /**
   * Previous scrollTo value. Useful for calculating changes in scrollTo.
   *
   * @property _previousScrollTo
   * @private
   * @type Number
   */
  _previousScrollTo: null,

  init() {
    this._super(...arguments);

    this.setupResize();
    // this.measureScrollbar();
  },

  didInsertElement() {
    this._super(...arguments);
    this.setupElements();
    scheduleOnce('afterRender', this, this.setupScrollbar);
  },

  didReceiveAttrs() {
    const oldOffset = this.get('_previousScrollTo');
    const newOffset = this.get('scrollTo');

    if (oldOffset !== newOffset) {
      this.set('_previousScrollTo', newOffset);
    }
  },

  didRender() {
    this.scrollToPosition(this.get('scrollTo'));
  },

  handleOffset: null,
  handleSize: null,

  dragOffset: null,

  sizeAttr: computed('horizontal', function() {
    return this.get('horizontal') ? 'width': 'height';
  }),

  scrollOffsetAttr: computed('horizontal', function() {
    return this.get('horizontal') ? 'scrollLeft' : 'scrollTop';
  }),

  scrollOffset() {
    return this._scrollContentElement[this.get('scrollOffsetAttr')]();
  },

  handleStylesJSON: computed('handleOffset', 'handleSize', 'horizontal', function() {
    const {handleOffset, handleSize} = this.getProperties('handleOffset', 'handleSize');
    if (this.get('horizontal')) {
      return {left: handleOffset, width: handleSize};
    } else {
      return {top: handleOffset, height: handleSize};
    }
  }),

  handleStyles: computed('handleStylesJSON.{top,left,width,height}', function() {
    return styleify(this.get('handleStylesJSON'));
  }),

  scrollContentSize() {
    return this._scrollContentElement[this.get('sizeAttr')]();
  },

  measureScrollbar() {

    /**
     * Calculate scrollbar width
     *
     * Original function by Jonathan Sharp:
     * http://jdsharp.us/jQuery/minute/calculate-scrollbar-width.php
     * Updated to work in Chrome v25.
     */
    function scrollbarWidth() {
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
    }

    return scrollbarWidth();

  },

  setupScrollbar() {
    let scrollbar = this.createScrollbar();
    this.scrollToPosition(this.get('scrollTo'));
    this.checkScrolledToBottom();

    if (scrollbar.isNecessary) {
      this.showScrollbar();
    }
  },

  setupElements() {
    this._scrollContentElement = this.$(`${scrollContentSelector}`);
    this._scrollbarElement = this.$(`${scrollbarSelector}:first`);
    this._handleElement = this.$(`${handleSelector}:first`);
    this._contentElement = this.$(`${contentSelector}:first`);
  },

  setupResize() {
    this._resizeHandler = () => {
      debounce(this, this.resizeScrollbar, 16);
    };

    window.addEventListener('resize', this._resizeHandler, true);
  },

  resizeScrollContent() {
    const width = this.$().width();
    const height = this.$().height();
    const scrollbarThickness = this.measureScrollbar();

    if (this.get('horizontal')) {
      this.set('scrollContentWidth', width);
      this.set('scrollContentHeight', height + scrollbarThickness);
      this._contentElement.height(height);
    } else {
      this.set('scrollContentWidth', width + scrollbarThickness);
      this.set('scrollContentHeight', height);
    }
  },

  createScrollbar() {
    if (this.get('isDestroyed')) {
      return;
    }

    let ScrollbarClass = this.get('horizontal') ? Horizontal : Vertical;

    const scrollbar = new ScrollbarClass({
      scrollbarElement: this._scrollbarElement,
      handleElement: this._handleElement,
      contentElement: this._contentElement
    });

    this.resizeScrollContent();

    this.set('scrollbar', scrollbar);
    this.updateScrollbarAndSetupProperties();
    return scrollbar;

  },

  startDrag(e) {
    // Preventing the event's default action stops text being
    // selectable during the drag.
    e.preventDefault();

    // TODO suspicious
    const dragOffset = this.get('scrollbar').startDrag(e);
    this.set('dragOffset', dragOffset);

    this.on('mouseMove', this, this.drag);
    this.on('mouseUp', this, this.endDrag);
  },

  mouseEnter(){
    if (this.get('autoHide')) {
      this.showScrollbar();
    }
  },

  /**
   * Drag scrollbar handle
   */
  drag(e) {
    e.preventDefault();

    const scrollPos = this.get('scrollbar').drag(e, this.get('dragOffset'));
    this.scrollToPosition(scrollPos);
  },

  endDrag() {
    this.off('mouseMove', this, this.drag);
    this.off('mouseUp', this, this.endDrag);
  },

  /**
   * Handles when user clicks on scrollbar, but not on the actual handle, and the scroll should
   * jump to the selected position.
   *
   * @method jumpScroll
   * @param e
   */
  jumpScroll(e) {
    // If the drag handle element was pressed, don't do anything here.
    if (e.target === this._handleElement[0]) {
      return;
    }
    const scrollPos = this.get('scrollbar').jumpScroll(e, this.scrollOffset(), this.scrollContentSize());
    this.scrollToPosition(scrollPos);
  },

  updateScrollbarAndSetupProperties() {
    const {handleOffset, handleSize} = this.get('scrollbar').update(this.scrollOffset());
    this.set('handleOffset', handleOffset + 'px');
    this.set('handleSize', handleSize + 'px');
  },

  /**
   * Callback for the scroll event emitted by the container of the content that can scroll.
   * Here we update the scrollbar to reflect the scrolled position.
   *
   * @method scrolled
   * @param event
   */
  scrolled(event) {
    this.updateScrollbarAndSetupProperties();
    this.showScrollbar();

    this.checkScrolledToBottom();

    this.sendScroll(event);
  },


  checkScrolledToBottom() {
    let scrollBuffer = this.get('scrollBuffer');

    if (this.get('scrollbar').isScrolledToBottom(scrollBuffer), this.scrollOffset()) {
      debounce(this, this.sendScrolledToBottom, 100);
    }
  },

  sendScrolledToBottom() {
    this.sendAction('onScrolledToBottom');
  },

  sendScroll(event) {
    if (this.get('onScroll')) {
      this.sendAction('onScroll', this.scrollOffset(), event);
    }
  },

  scrollToPosition(offset) {
    offset = Number.parseInt(offset, 10);

    if (Number.isNaN(offset)) {
      return;
    }

    const scrollbar = this.get('scrollbar');
    if (isPresent(scrollbar)) {
      // scrollTop, etc functions will trigger the scroll event. TODO encapusulate this logic in a component
      this._scrollContentElement[this.get('scrollOffsetAttr')](offset);
    }
  },

  resizeScrollbar() {
    let scrollbar = this.get('scrollbar');
    if (!scrollbar) {
      return;
    }

    this.createScrollbar();
    this.showScrollbar();
  },

  showScrollbar() {
    if (this.get('isDestroyed')) {
      return;
    }
    this.set('showHandle', true);

    if (!this.get('autoHide')) {
      return;
    }

    debounce(this, this.hideScrollbar, hideDelay);
  },

  hideScrollbar() {
    if (this.get('isDestroyed')) {
      return;
    }
    this.set('showHandle', false);
  },

  willDestroyElement() {
    this._super(...arguments);

    this.$().off('transitionend webkitTransitionEnd', this._resizeHandler);
    window.removeEventListener('resize', this._resizeHandler, true);
  },

  actions: {

    /**
     * Update action should be called when size of the scroll area changes
     */
    recalculate() {
      this.resizeScrollbar();
    },

    /**
     * Can be called when scrollbars changes as a result of value change,
     *
     * for example
     * ```
     * {{#as-scrollable as |scrollbar|}}
     *   {{#each (compute scrollbar.update rows) as |row|}}
     *     {{row.title}}
     *   {{/each}}
     * {{/as-scrollable}}
     * ```
     */
    update(value) {
      scheduleOnce('afterRender', this, this.resizeScrollbar);
      return value;
    },

    /**
     * Scroll Top action should be called when when the scroll area should be scrolled top manually
     */
    scrollTop() {
      this.set('scrollTo', 0);
    },
    startDrag(){
      this.startDrag(...arguments);
    },
    jumpScroll() {
      this.jumpScroll(...arguments);
    },
    scrolled(){
      this.scrolled(...arguments);
    }
  }
});
