import { Base } from '../polymer/polymer.js';
import { IronA11yAnnouncer } from '../iron-a11y-announcer/iron-a11y-announcer.js';
import { IronOverlayBehavior, IronOverlayBehaviorImpl } from '../iron-overlay-behavior/iron-overlay-behavior.js';
import { Polymer } from '../polymer/lib/legacy/polymer-fn.js';

// Keeps track of the toast currently opened.
var currentToast = null;

Polymer({
  _template: `
    <style>
      :host {
        display: block;
        position: fixed;
        background-color: var(--paper-toast-background-color, #323232);
        color: var(--paper-toast-color, #f1f1f1);
        min-height: 48px;
        min-width: 288px;
        padding: 16px 24px;
        box-sizing: border-box;
        box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.26);
        border-radius: 2px;
        margin: 12px;
        font-size: 14px;
        cursor: default;
        -webkit-transition: -webkit-transform 0.3s, opacity 0.3s;
        transition: transform 0.3s, opacity 0.3s;
        opacity: 0;
        -webkit-transform: translateY(100px);
        transform: translateY(100px);
        @apply --paper-font-common-base;
      }

      :host(.capsule) {
        border-radius: 24px;
      }

      :host(.fit-bottom) {
        width: 100%;
        min-width: 0;
        border-radius: 0;
        margin: 0;
      }

      :host(.paper-toast-open) {
        opacity: 1;
        -webkit-transform: translateY(0px);
        transform: translateY(0px);
      }
    </style>

    <span id="label">{{text}}</span>
    <slot></slot>
`,

  is: 'paper-toast',

  behaviors: [
    IronOverlayBehavior
  ],

  properties: {
    /**
     * The element to fit `this` into.
     * Overridden from `Polymer.IronFitBehavior`.
     */
    fitInto: {
      type: Object,
      value: window,
      observer: '_onFitIntoChanged'
    },

    /**
     * The orientation against which to align the dropdown content
     * horizontally relative to `positionTarget`.
     * Overridden from `Polymer.IronFitBehavior`.
     */
    horizontalAlign: {
      type: String,
      value: 'left'
    },

    /**
     * The orientation against which to align the dropdown content
     * vertically relative to `positionTarget`.
     * Overridden from `Polymer.IronFitBehavior`.
     */
    verticalAlign: {
      type: String,
      value: 'bottom'
    },

    /**
     * The duration in milliseconds to show the toast.
     * Set to `0`, a negative number, or `Infinity`, to disable the
     * toast auto-closing.
     */
    duration: {
      type: Number,
      value: 3000
    },

    /**
     * The text to display in the toast.
     */
    text: {
      type: String,
      value: ''
    },

    /**
     * Overridden from `IronOverlayBehavior`.
     * Set to false to enable closing of the toast by clicking outside it.
     */
    noCancelOnOutsideClick: {
      type: Boolean,
      value: true
    },

    /**
     * Overridden from `IronOverlayBehavior`.
     * Set to true to disable auto-focusing the toast or child nodes with
     * the `autofocus` attribute` when the overlay is opened.
     */
    noAutoFocus: {
      type: Boolean,
      value: true
    }
  },

  listeners: {
    'transitionend': '__onTransitionEnd'
  },

  /**
   * Read-only. Deprecated. Use `opened` from `IronOverlayBehavior`.
   * @property visible
   * @deprecated
   */
  get visible() {
    Base._warn('`visible` is deprecated, use `opened` instead');
    return this.opened;
  },

  /**
   * Read-only. Can auto-close if duration is a positive finite number.
   * @property _canAutoClose
   */
  get _canAutoClose() {
    return this.duration > 0 && this.duration !== Infinity;
  },

  created: function() {
    this._autoClose = null;
    IronA11yAnnouncer.requestAvailability();
  },

  /**
   * Show the toast. Without arguments, this is the same as `open()` from `IronOverlayBehavior`.
   * @param {(Object|string)=} properties Properties to be set before opening the toast.
   * e.g. `toast.show('hello')` or `toast.show({text: 'hello', duration: 3000})`
   */
  show: function(properties) {
    if (typeof properties == 'string') {
      properties = { text: properties };
    }
    for (var property in properties) {
      if (property.indexOf('_') === 0) {
        Base._warn('The property "' + property + '" is private and was not set.');
      } else if (property in this) {
        this[property] = properties[property];
      } else {
        Base._warn('The property "' + property + '" is not valid.');
      }
    }
    this.open();
  },

  /**
   * Hide the toast. Same as `close()` from `IronOverlayBehavior`.
   */
  hide: function() {
    this.close();
  },

  /**
   * Called on transitions of the toast, indicating a finished animation
   * @private
   */
  __onTransitionEnd: function(e) {
    // there are different transitions that are happening when opening and
    // closing the toast. The last one so far is for `opacity`.
    // This marks the end of the transition, so we check for this to determine if this
    // is the correct event.
    if (e && e.target === this && e.propertyName === 'opacity') {
      if (this.opened) {
        this._finishRenderOpened();
      } else {
        this._finishRenderClosed();
      }
    }
  },

  /**
   * Overridden from `IronOverlayBehavior`.
   * Called when the value of `opened` changes.
   */
  _openedChanged: function() {
    if (this._autoClose !== null) {
      this.cancelAsync(this._autoClose);
      this._autoClose = null;
    }
    if (this.opened) {
      if (currentToast && currentToast !== this) {
        currentToast.close();
      }
      currentToast = this;
      this.fire('iron-announce', {
        text: this.text
      });
      if (this._canAutoClose) {
        this._autoClose = this.async(this.close, this.duration);
      }
    } else if (currentToast === this) {
      currentToast = null;
    }
    IronOverlayBehaviorImpl._openedChanged.apply(this, arguments);
  },

  /**
   * Overridden from `IronOverlayBehavior`.
   */
  _renderOpened: function() {
    this.classList.add('paper-toast-open');
  },

  /**
   * Overridden from `IronOverlayBehavior`.
   */
  _renderClosed: function() {
    this.classList.remove('paper-toast-open');
  },

  /**
   * @private
   */
  _onFitIntoChanged: function(fitInto) {
    this.positionTarget = fitInto;
  }

  /**
   * Fired when `paper-toast` is opened.
   *
   * @event 'iron-announce'
   * @param {{text: string}} detail Contains text that will be announced.
   */
});