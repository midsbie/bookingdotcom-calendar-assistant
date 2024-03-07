// ==UserScript==
// @name        Calendar Assistant for Booking.com
// @description This user script enhances Booking.com's calendar interface for property managers by adding "Capture" and "Restore" functionalities. It allows users to easily save the state of their property's pricing and availability settings for a specific month and then apply these settings across other properties or times. This automation aims to streamline the process of managing seasonal rate variations and booking conditions without the need for repetitive manual entry, enhancing efficiency and accuracy in property management on the platform.
// @version     1
// @grant       none
// @include     https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/calendar/index.html?*
// ==/UserScript==

const htmlMetaUI = `
<div class="bui-spacer--medium" style="margin-top: 16px">
  <div class="bui-spacer--medium">
    <hr class="bui-divider bui-divider--light">
  </div>
  <span>Calendar State Assistant</span>
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

const RADIO_AVAILABILITY_OPEN = "AVAILABILITY_OPEN";

let formContainer, availabilityOpenedInput, priceInput, lengthStay, advanceReservation;
let btnCapture;
let isAvailabilityOpen;
document.addEventListener("DOMContentLoaded", async () => {
  formContainer = [...document.querySelectorAll(".av-monthly-container__block")].slice(-2)[0];
  priceInput = document.querySelector('input[id^="price-"][type="text"]');
  lengthStay = document.querySelector('select[id^="min-length-of-stay-"]');
  advanceReservation = document.querySelector('select[id^="children-"]');

  const container = document.createElement("div");
  container.innerHTML = htmlMetaUI;
  formContainer.appendChild(container);

  btnCapture = formContainer.querySelector(".btn-capture");
  formContainer.querySelector(".btn-restore").addEventListener("click", restoreState);
  btnCapture.addEventListener("click", saveState);

  availabilityOpenedInput = document.getElementById("availability-opened");
  watchForAvailabilityChanges();
});

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitUntil(predicate) {
  while (!predicate()) {
    await sleep(100);
  }
}

function waitUntilEnablement(el) {
  return waitUntil(() => el.disabled);
}

/**
 * Monitors availability radio button changes at a regular interval.
 *
 * This function periodically checks the selected availability status and updates the UI
 * accordingly.  Unfortunately, I could not find a way to rely on a change event notification
 * because the page's JavaScript makes programmatic changes to the active radio button that do not
 * seem to result in an event being fired.  Additionally, these programmatic changes do not seem to
 * mutate an attribute in the DOM that could be detected by a MutationObserver. Therefore, this
 * polling approach is used as a workaround to detect changes in availability status. Not pretty but
 * it does the job.
 */
function watchForAvailabilityChanges() {
  setInterval(() => {
    const price = priceInput.value.trim();
    const priceValid = price.length > 0 && /^-?\d*(\.\d*)?$/.test(price);
    const cur = getSelectedRadioButtonValue("availability");
    isAvailabilityOpen = cur === RADIO_AVAILABILITY_OPEN;
    btnCapture.disabled = !isAvailabilityOpen || !priceValid;
  }, 100);
}

function getSelectedRadioButtonValue(name) {
  return document.querySelector(`input[type="radio"][name="${name}"]:checked`)?.value;
}

function setSelectOption(sel, value) {
  sel.value = value;
  const opt = sel.querySelector(`[value="${value}"]`);
  if (!opt || !opt.selected) return false;

  dispatchEvent(sel, "change");
  return true;
}

function dispatchEvent(el, name) {
  const ev = new Event(name, { bubbles: true, cancelable: true });
  el.dispatchEvent(ev);
}

function restoreState() {
  try {
    const str = localStorage.getItem("calendar_state");
    if (!str) return;

    const state = JSON.parse(str);
    loadForm(state);
    console.log("restored state:", state);
  } catch (e) {
    console.error("failed to restore state from local storage:", e);
  }
}

function saveState() {
  const state = {
    price: priceInput.value,
    stay: lengthStay.value,
    advance: advanceReservation.value,
  };

  try {
    localStorage.setItem("calendar_state", JSON.stringify(state));
    console.log("State updated:", state);
  } catch (e) {
    console.error("Failed to save state to local storage:", e);
  }
}

async function loadForm(state) {
  availabilityOpenedInput.click();
  await waitUntilEnablement(priceInput);

  if (state.price) {
    priceInput.focus();
    priceInput.value = state.price;
    dispatchEvent(priceInput, "input");
  }

  if (state.stay) {
    if (!setSelectOption(lengthStay, state.stay)) {
      console.error("cannot find length of stay select option with value =", state.stay);
    }
  }

  if (state.advance) {
    if (!setSelectOption(advanceReservation, state.advance)) {
      console.error(
        "cannot find advance reservation days select option with value =",
        state.advance,
      );
    }
  }
}
