0.8.6 - 2018-02-10

* Fixes issue #158, #160 and #165
* More robust and secure filling of password fields
* Uses some new ES6 JavaScript features
* Updated jQuery, QUnit and sjcl.js

0.8.5 - 2016-08-25

* Fixes issue #156 and #153
* Updated jQuery and QUnit

0.8.4 - 2016-01-25

* Fixes issue #152
* Fix layout issue on import/export option pages
* Updated jQuery, QUnit and sjcl.js

0.8.3 - 2015-08-08

* Added keyboard shortcut to Copy Password from popup
* Fixes issue #149
* Layout fixes for Opera on Linux machines

0.8.2 - 2015-05-01

* Added feature #147: time-based password expiration option
* Added option to hide the "Save Password" option field from the popup
* Updated jQuery, QUnit and sjcl.js

0.8.1 - 2015-01-28

* Fixes issue #143
* Updated jQuery and QUnit
* Allow creation of 4 digit PIN's

0.8.0 - 2014-10-01

* Use getComputedStyle() to only ever fill visible input elements
* Added offline capability to manifest.json

0.7.9 - 2014-09-21

* For issue #137, fill only one username and one password field at a time

0.7.8 - 2014-09-21

* Addresses issue #137 about filling in too many fields
* Only convert multi-byte characters when required

0.7.7 - 2014-09-10

* Fixed a bug in password generation with 4-byte length characters
* Some optimization and reorganization in the hash algorithm code

0.7.6 - 2014-08-28

* Some optimization/simplification of a few key functions
* Changed username field in UI to be dynamic, so a username can be altered within the popup

0.7.5 - 2014-08-15

* Fixed a username filling bug
* Changed username field in UI to be static
* Fixed a file import bug
* Some optimizations in popup and settings

0.7.4 - 2014-08-13

* Added a username filling function
* Improved popup interaction, functionality and appearance
* Many other small code tweaks and optimizations

0.7.3 - 2014-08-05

* Added a password strength meter to the popup
* Changed popup to use flexbox layout
* Fixes Bug #135: Used text not updating on second window
* Addresses issue #136, Worried about removal of legacy algorithms
* Massive refactoring of primary algorithms

0.7.2 - 2014-07-17

* Fixes Bug #133: Incorrect password generation during delayed display
* Fixes popup button visibility bug
* Migrate to asynchronous chrome.runtime calls

0.7.1 - 2014-07-15

* Remove the need for a content script, no more dangerous permissions required!
* Fixes options.css top nav position bug
* Closes Request #112: Submit extension to the opera extension catalog

0.7.0 - 2014-07-12

* Fixes Bug #130: Incognito window usage
* Put options page navigation at top
* Closes Request #23: Added password strength meter to profile customization

0.6.5 - 2014-07-11

* Added a 2nd default profile called "Alphanumeric"
* Addresses issue #125 about a potential visual replay attack
* Increased security by using PBKDF2 for key derivation
* Added a large "Reset All Profiles" button on "General Option" settings page

0.6.4 - 2014-06-22

* Closes Request #113: Added 3 letter password verification code option
* Fixes Bug #115: Never save master password
* Change suggested keyboard shortcut from Alt+Shift+M to Alt+Z for new installations
* More css and ui improvements

0.6.3 - 2014-05-29

* Another fix for the fill form function
* Removed usage of jQuery in content script
* Reduced permissions to activeTab
* Removed sourcemap for jQuery

0.6.2 - 2014-05-23

* Fixed fill form bug

0.6.1 - 2014-05-22

* Emergency release that should fix problems created in the 0.6.0 release

0.6.0 - 2014-05-18

* This release includes lots of stuff done by @heavensrevenge
* A small list of the many things he did:
 * Lots of css and ui improvements
 * Refactored some parts of the javascript code
 * Updating included libraries
 * Closes Request #87: It fills only password fields that are not populated yet

0.5.5 - 2014-04-26

* Fixes Bug #93: Removed warning in Console about jQuery sourcemap

0.5.4 - 2013-11-10

* Fixes Bug #86: No edit box for "Keep Master Password Hash" option

0.5.3 - 2013-11-08

* Fixes Bug #85: Error message in chrome developer console

0.5.2 - 2013-11-02

* Fixes Bug #84: If password_crypt is empty, the popup crashes
* Update usage of chrome extension apis to remove deprecated stuff
* Updated jQuery and jQuery-UI

0.5.1 - 2013-09-21

* Adds option to never save master password
* Fixes Bug #63: Master password stays saved in extension drop down on Mac, despite "never store"

0.5.0 - 2012-03-25

* Added Alt+Shift+M to invoke the password popup
* Fixed keyboard handling

0.4.2 - 2012-01-08

* font-family "monospace" for password field

0.4.1 - 2012-01-06

* Starting Changelog
* Fixes Bug #78: Fixes password not saving on exit
