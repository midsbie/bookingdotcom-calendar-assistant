# Calendar Assistant for Booking.com

A userscript that adds **Capture** and **Restore** buttons to the Booking.com calendar interface, letting property managers apply the same pricing and availability settings across properties without re-entering them manually.

## Installation

1. Install [Greasemonkey](https://addons.mozilla.org/en-GB/firefox/addon/greasemonkey/) (Firefox) or [Tampermonkey](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) (Chrome).
2. Create a new userscript and paste the contents of [bookingdotcom-calendar-assistant.js](https://raw.githubusercontent.com/midsbie/bookingdotcom-calendar-assistant/master/bookingdotcom-calendar-assistant.js).
3. Save, enable, and reload any open Booking.com calendar pages.

## Usage

1. Open the calendar, select dates, and configure pricing and availability.
2. Click **Capture** to save the current settings (enabled only when dates are open and a price is set).
3. Navigate to another property or month, select dates, and click **Restore** to apply the saved settings.

Settings persist in the browser's local storage.

## License

MIT License. See LICENSE file.
