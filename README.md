# Calendar Assistant for Booking.com

The Calendar Assistant is a userscript that adds **Capture** and **Restore** functions to the Booking.com calendar interface. It helps property managers manage pricing and availability by reducing repetitive manual work.

## Features

* Capture State: Save the current pricing and availability settings of a property.
* Restore State: Apply saved settings to the same or other properties.

## Installation

1. Install a userscript manager extension:

   * [Greasemonkey (Firefox)](https://addons.mozilla.org/en-GB/firefox/addon/greasemonkey/)
   * [Tampermonkey (Chrome and others)](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)

2. Create a new userscript in the manager’s dashboard.
3. Open the script: [bookingdotcom-calendar-assistant.js](https://raw.githubusercontent.com/midsbie/bookingdotcom-calendar-assistant/master/bookingdotcom-calendar-assistant.js).
4. Copy its contents.
5. Paste them into the new userscript.
6. Save and enable the script.
7. Reload any open Booking.com calendar pages.

## Usage

In the Booking.com calendar, two new buttons appear:

* Capture: Saves current pricing and availability (only enabled if a price is set and dates are open).
* Restore: Applies the most recently captured settings.

Settings are stored locally in the browser.

### Example Workflow

1. Open the calendar for the first property.
2. Select dates, ensure they are open, enter price, minimum stay, and advance reservation.
3. Click **Capture**, then **Save**.
4. Open the calendar for another property.
5. Select dates, click **Restore**, verify details, then **Save**.

## Limitations

* Works only on supported Booking.com calendar pages.
* Dependent on Booking.com’s current interface; site changes may break functionality.

## Contributing

Contributions are welcome.

## License

MIT License. See LICENSE file.
