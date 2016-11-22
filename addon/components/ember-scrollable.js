import Ember from 'ember';
import InboundActionsMixin from 'ember-component-inbound-actions/inbound-actions';
import layout from '../templates/components/ember-scrollable';

const {
  get,
  run: { scheduleOnce, debounce, bind },
  $,
  isEmpty,
  isPresent
} = Ember;

const hideDelay = Ember.testing ? 16 : 1000;

const handleSelector = '.drag-handle';

const verticalScrollbarSelector = '.tse-scrollbar.tse-scrollbar-vertical';
const horizontalSelector = '.tse-scrollbar.tse-scrollbar-horizontal';
const verticalScrollbarHandleSelector = `${verticalScrollbarSelector} ${handleSelector}`;
const horizontalScrollbarHandleSelector = `${horizontalSelector} ${handleSelector}`;
const scrollContentSelector = '.tse-scroll-content';
const contentSelector = '.tse-content';

export default Ember.Component.extend(InboundActionsMixin, {
  layout,
  classNameBindings: [':ember-scrollable', ':tse-scrollable', 'horizontal:horizontal:vertical'],
  both:false,
  horizontal: false,
  autoHide: true,
  scrollBuffer: 50,
  scrollTo: null,
  _scrollTo: null,


  init() {
    this._super(...arguments);
    //this.setupResize();
    //this.measureScrollbar();
  },

  didInsertElement() {
    this._super(...arguments);

    this.setupElements();

    if (this.get('autoHide')) {
      this.on('mouseEnter', this, this.showScrollbar);
    }
  },

  didReceiveAttrs() {
    const oldOffset = this.get('_scrollTo');
    const newOffset = this.get('scrollTo');

    if (oldOffset !== newOffset) {
      this.set('_scrollTo', newOffset);
      this.scrollToPosition(newOffset);
    }
  },


  setupScrollbar() {
    let scrollbars = this.createScrollbars();

    this.set('scrollbars', scrollbars);

    this.scrollToPosition(this.get('scrollTo'));
    this.checkScrolledToBottom();

    if (scrollbars.some((o) => get(o, 'isNecessary'))) {
      this.showScrollbar();
    }
  },

  setupElements() {
    this._scrollContentElement = this.$(`${scrollContentSelector}`);
    this._contentElement = this.$(`${contentSelector}:first`);

    this._verticalScrollbarElement = this.$(`${verticalScrollbarSelector}:first`);
    this._verticalHandleElement = this.$(`${verticalScrollbarHandleSelector}:first`);

    this._horizontalScrollbarElement = this.$(`${horizontalSelector}:first`);
    this._horizontalHandleElement = this.$(`${horizontalScrollbarHandleSelector}:first`);

  },


  checkScrolledToBottom() {
    let scrollBuffer = this.get('scrollBuffer');
    /*
    if (this.get('scrollbar').isScrolledToBottom(scrollBuffer)) {
      debounce(this, this.sendScrolledToBottom, 100);
    }
    */
  },

  sendScrolledToBottom() {
    this.sendAction('onScrolledToBottom');
  },

  // sendScroll(event) {
  //   if (this.get('onScroll')) {
  //     this.sendAction('onScroll', this.getScrollbarForHandle(event).scrollOffset(), event);
  //   }
  // },

  scrollToPosition(offset) {
    offset = Number.parseInt(offset, 10);

    if (Number.isNaN(offset)) {
      return;
    }

    /**
    const scrollbar = this.get('scrollbar');
    if (isPresent(scrollbar)) {
      scrollbar.scrollTo(offset);
    }
     **/
  },

  resizeScrollbar() {
    // TODO figure this out
    //this.showScrollbar();
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
    }
  }
});
