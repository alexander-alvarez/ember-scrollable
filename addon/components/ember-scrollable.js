import Ember from 'ember';
import InboundActionsMixin from 'ember-component-inbound-actions/inbound-actions';
import layout from '../templates/components/ember-scrollable';
import {Horizontal, Vertical} from '../classes/scrollable';

const {
  computed,
  run: {
    scheduleOnce,
    debounce
  },
  $,
  isEmpty,
  isPresent,
  String: {
    camelize,
    htmlSafe
  }
} = Ember;

const hideDelay = Ember.testing ? 16 : 1000;

const scrollbarSelector = '.tse-scrollbar';
const handleSelector = '.drag-handle';
const scrollContentSelector = '.tse-scroll-content';
const contentSelector = '.tse-content';

function styleify(obj) {
  if (isEmpty(obj)) {
    return htmlSafe('');
  }
  const styles = Object.keys(obj).reduce((styleString, key) => {
    const styleValue = obj[key];
    if (!isEmpty(styleValue)) {
      styleString += `${key}: ${styleValue}; `;
    }
    return styleString;
  }, '');
  return htmlSafe(styles);

}


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

  offsetAttr: computed('horizontal', function() {
    return this.get('horizontal') ? 'left' : 'top';
  }),

  scrollOffsetAttr: computed('offsetAttr', function() {
    return camelize(`scroll-${this.get('offsetAttr')}`);
  }),


  /*
   * JSON object with keys representing CSS styles their respective values for the content that is being scrolled.
   * @property scrollContentStyles
   * @private
   * @type JSON
   */
  scrollContentStylesObject: null,

  scrollContentStyles: computed('scrollContentStylesObject', 'scrollContentStylesObject.scrollTop',
    'scrollContentStylesObject.scrollLeft', function() {
      return styleify(this.get('scrollContentStylesObject'));
    }),

  contentStylesObject: null,

  contentStyles: computed('contentStylesObject', function() {
    return styleify(this.get('contentStylesObject'));
  }),

  handleStylesObject: null,

  handleStyles: computed('handleStylesObject', 'handleStylesObject.handleOffset', 'handleStylesObject.handleSize', function() {
    const handleStylesObject = this.get('handleStylesObject');
    if (handleStylesObject) {
      if (this.get('horizontal')) {
        const {handleOffset: left, handleSize: width} = handleStylesObject;
        return styleify({left, width});
      } else {
        const {handleOffset: top, handleSize: height} = handleStylesObject;
        return styleify({top, height});
      }
    }
  }),

  init() {
    this._super(...arguments);

    this.setupResize();
    this.measureScrollbar();
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
      this.scrollToPositionAndUpdatePreviousValue(newOffset);
    }
  },

  scrollToPositionAndUpdatePreviousValue(newOffset) {
    this.set('_previousScrollTo', newOffset);
    this.scrollToPosition(newOffset);
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

    this._scrollbarWidth = scrollbarWidth();

  },

  setupScrollbar() {
    let scrollbar = this.createScrollbar();

    this.set('scrollbar', scrollbar);

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

  createScrollbar() {
    if (this.get('isDestroyed')) {
      return;
    }

    let ScrollbarClass = this.get('horizontal') ? Horizontal : Vertical;

    const scrollBar = new ScrollbarClass({
      scrollContentElement: this._scrollContentElement,
      scrollbarElement: this._scrollbarElement,
      handleElement: this._handleElement,
      contentElement: this._contentElement,

      width: this.$().width(),
      height: this.$().height(),
      scrollbarWidth: this._scrollbarWidth
    });


    this.set('scrollContentStylesObject', scrollBar.resizeScrollContent());
    this.set('contentStylesObject', scrollBar.resizeContentElement());
    this.set('handleStylesObject', scrollBar.update());
    return scrollBar;
  },

  startDrag(e) {
    // Preventing the event's default action stops text being
    // selectable during the drag.
    e.preventDefault();

    this.get('scrollbar').startDrag(e);

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

    const newOffset = this.get('scrollbar').drag(e);
    this.set(`handleStylesObject.handleOffset`, newOffset);
    this.scrollToPositionAndUpdatePreviousValue(newOffset);
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
    const scrollBar = this.get('scrollbar');
    const newOffset = scrollBar.jumpScroll(e);
    const newOffsetAsNumber = Number.parseInt(newOffset);
    this.scrollToPositionAndUpdatePreviousValue(newOffset);

    const handleOffset = Math.round(Math.min(scrollBar.contentOuterSize() - scrollBar.scrollbarSize(), newOffsetAsNumber)) + 'px';
    this.set(`handleStylesObject.handleOffset`, handleOffset);
  },

  /**
   * Callback for the scroll event emitted by the container of the content that can scroll.
   * Here we update the scrollbar to reflect the scrolled position.
   *
   * @method scrolled
   * @param event
   */
  scrolled(event) {
    this.get('scrollbar').update();
    this.showScrollbar();

    this.checkScrolledToBottom();

    this.sendScroll(event);
  },

  checkScrolledToBottom() {
    let scrollBuffer = this.get('scrollBuffer');

    if (this.get('scrollbar').isScrolledToBottom(scrollBuffer)) {
      debounce(this, this.sendScrolledToBottom, 100);
    }
  },

  sendScrolledToBottom() {
    this.sendAction('onScrolledToBottom');
  },

  sendScroll(event) {
    if (this.get('onScroll')) {
      this.sendAction('onScroll', this.get('scrollbar').scrollOffset(), event);
    }
  },

  scrollToPosition(offset) {
    offset = Number.parseInt(offset, 10);

    if (Number.isNaN(offset)) {
      return;
    }

    const scrollbar = this.get('scrollbar');
    if (isPresent(scrollbar)) {
      scrollbar.scrollTo(offset);
    }
  },

  resizeScrollbar() {
    let scrollbar = this.get('scrollbar');
    if (!scrollbar) {
      return;
    }

    scrollbar = this.createScrollbar();
    this.set('scrollbar', scrollbar);

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
     * {{#ember-scrollable as |scrollbar|}}
     *   {{#each (compute scrollbar.update rows) as |row|}}
     *     {{row.title}}
     *   {{/each}}
     * {{/ember-scrollable}}
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
