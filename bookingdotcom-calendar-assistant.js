// ==UserScript==
// @name        Calendar Assistant for Booking.com
// @description This user script enhances Booking.com's calendar interface for property managers by adding "Capture" and "Restore" functionalities. It allows users to easily save the state of their property's pricing and availability settings for a specific month and then apply these settings across other properties or times. This automation aims to streamline the process of managing seasonal rate variations and booking conditions without the need for repetitive manual entry, enhancing efficiency and accuracy in property management on the platform.
// @version     1
// @grant       none
// @include     https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/calendar/*
// ==/UserScript==

const htmlMetaUI = `
<div class="bui-spacer--medium" style="margin-top: 16px">
  <div class="bui-spacer--medium">
    <hr class="bui-divider bui-divider--light">
  </div>
  <span>Calendar Assistant</span>
</div>

<div class="av-monthly__form-btn-wrap av-monthly-flex-inline__wrap">
  <button type="button" class="btn-restore av-monthly-flex-inline__item--equal bui-button bui-button--secondary bui-button--wide">
    <span class="bui-button__text"><span>Restore</span></span>
  </button>
  <button type="button" class="btn-capture av-monthly-flex-inline__item--equal bui-button bui-button--secondary bui-button--wide">
    <span class="bui-button__text"><span>Capture</span></span>
  </button>
</div>
`;

const PRICE_PATTERN = /^\d+(\.\d*)?$/;

const logger = {
  PREFIX: "[CalendarAssistant]",
  log: (...args) => console.log(logger.PREFIX, ...args),
  error: (...args) => console.error(logger.PREFIX, ...args),
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitUntil(predicate) {
  while (!predicate()) {
    await sleep(100);
  }
}

function waitUntilEnablement(el) {
  return waitUntil(() => !el.disabled);
}

function isPriceValid(value) {
  return PRICE_PATTERN.test(value.trim());
}

class CalendarForm {
  static #RADIO_AVAILABILITY_OPEN = "AVAILABILITY_OPEN";

  #priceInput;
  #lengthStay;
  #advanceReservation;
  #availabilityOpenedInput;

  constructor() {
    this.#priceInput = document.querySelector('input[id^="price-"][type="text"]');
    this.#lengthStay = document.querySelector('select[id^="min-length-of-stay-"]');
    this.#advanceReservation = document.querySelector(".av-monthly__default-restriction select");
    this.#availabilityOpenedInput = document.getElementById("availability-opened");

    if (
      !this.#priceInput ||
      !this.#lengthStay ||
      !this.#advanceReservation ||
      !this.#availabilityOpenedInput
    ) {
      throw new Error("CalendarForm: one or more expected form elements not found in the DOM");
    }
  }

  readState() {
    return {
      price: this.#priceInput.value,
      stay: this.#lengthStay.value,
      advance: this.#advanceReservation.value,
    };
  }

  async writeState(state) {
    this.#availabilityOpenedInput.click();
    await waitUntilEnablement(this.#priceInput);

    if (state.price) {
      this.#priceInput.focus();
      this.#priceInput.value = state.price;
      this.#dispatchEvent(this.#priceInput, "input");
    }

    this.#restoreSelectOption(this.#lengthStay, state.stay, "length of stay");
    this.#restoreSelectOption(this.#advanceReservation, state.advance, "advance reservation days");
  }

  isCaptureEligible() {
    return this.#isAvailabilityOpen() && isPriceValid(this.#priceInput.value);
  }

  #isAvailabilityOpen() {
    return (
      this.#getSelectedRadioButtonValue("availability") === CalendarForm.#RADIO_AVAILABILITY_OPEN
    );
  }

  #getSelectedRadioButtonValue(name) {
    return document.querySelector(`input[type="radio"][name="${name}"]:checked`)?.value;
  }

  #setSelectOption(sel, value) {
    sel.value = value;
    const opt = sel.querySelector(`[value="${value}"]`);
    if (!opt || !opt.selected) return false;

    this.#dispatchEvent(sel, "change");
    return true;
  }

  #restoreSelectOption(el, value, label) {
    if (value && !this.#setSelectOption(el, value)) {
      logger.error(`Cannot find ${label} select option with value =`, value);
    }
  }

  #dispatchEvent(el, name) {
    const ev = new Event(name, { bubbles: true, cancelable: true });
    el.dispatchEvent(ev);
  }
}

class StateStore {
  #key;

  constructor(key = "calendar_state") {
    this.#key = key;
  }

  save(state) {
    try {
      localStorage.setItem(this.#key, JSON.stringify(state));
    } catch (e) {
      logger.error("Failed to save state to local storage:", e);
    }
  }

  load() {
    try {
      const str = localStorage.getItem(this.#key);
      if (!str) return null;
      return JSON.parse(str);
    } catch (e) {
      logger.error("Failed to restore state from local storage:", e);
      return null;
    }
  }
}

class CalendarAssistant {
  #form;
  #store;
  #btnCapture;

  constructor() {
    this.#form = new CalendarForm();
    this.#store = new StateStore();

    const formContainer = [...document.querySelectorAll(".av-monthly-container__block")].slice(
      -2,
    )[0];

    if (!formContainer) {
      throw new Error("CalendarAssistant: form container element not found in the DOM");
    }

    const container = document.createElement("div");
    container.innerHTML = htmlMetaUI;
    formContainer.appendChild(container);

    this.#btnCapture = formContainer.querySelector(".btn-capture");
    formContainer.querySelector(".btn-restore").addEventListener("click", () => this.#restore());
    this.#btnCapture.addEventListener("click", () => this.#capture());

    this.#watchCaptureEligibility();
  }

  #capture() {
    const state = this.#form.readState();
    this.#store.save(state);
    logger.log("State updated:", state);
  }

  async #restore() {
    try {
      const state = this.#store.load();
      if (!state) return;

      await this.#form.writeState(state);
      logger.log("Restored state:", state);
    } catch (e) {
      logger.error("Failed to restore state:", e);
    }
  }

  /**
   * Polls form state to enable or disable the capture button.
   *
   * Polling is necessary because the page's JavaScript makes programmatic changes to the active
   * availability radio button that do not fire change events and do not mutate a DOM attribute
   * observable by a MutationObserver.
   */
  #watchCaptureEligibility() {
    setInterval(() => {
      this.#btnCapture.disabled = !this.#form.isCaptureEligible();
    }, 100);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  void new CalendarAssistant();
});
