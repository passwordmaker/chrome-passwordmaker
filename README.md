# PasswordMaker (.org) Chrome Extension

## Maintenance on May, 2023:
- code cleanups and minor changes
- will continue to do limited updates in sync with https://gitlab.com/spartanroc/passwordmaker-firefoxquantum

## Updated with many improvements based on v0.9.1 of https://github.com/passwordmaker/chrome-passwordmaker

- put in all improvements made for a firefox port (https://gitlab.com/spartanroc/passwordmaker-firefoxquantum).
- working search function for query fields of title/name,siteList,strUseText,username, and description
- import rdf with correct encodings
- implement the description field that was used in the original PasswordMaker. work with import/export.
- better siteList
- scroll bar for profile list


This is a Chrome Extension that implements the PasswordMaker.org method for generating a unique, secure password for any site, from a single master password.

This technique has been widely used since 2003, though it has been eclipsed by generators that create a random password for each site.  The problem with that method is that every generated password must be stored - with the PasswordMaker.org technique you just memorize or record the master password (this master password can not be determined from the generated passwords).

Later, if you switch to a different platform or lose all record of your passwords, you can still easily unlock all your passwords, for all your sites (and on any platform since this same technique is implemented on other platforms) as long as you can remember your master password.

### For more, see the [passwordmaker.org](https://www.passwordmaker.org/) site.

# Installation

Install this extension from the [Chrome Web Store](https://chrome.google.com/webstore/search/PasswordMaker%20(.org)).

# Status of this project

## Update 2021-05-16 by [@GitTom](https://github.com/GitTom)

The old "PasswordMaker Pro" published by @heavensrevenge was taken down by Google due to policy violations (probably just that the listing was not maintained with updated privacy declarations).  I applied some minor updates, incremented the version to 0.9.1, and created a new Chrome Web Store listing under the name "PasswordMaker (.org)".

### Update 2014-07-13 by [@heavensrevenge](https://github.com/heavensrevenge)

I am the new and active maintainer of this project and I have uploaded this extension back to the Chrome Web Store which is located at https://chrome.google.com/webstore/detail/passwordmaker-pro/lnhofcfhehhcbccpmdmdpjncdoihmkkh

**_PLEASE Export your profile data_** to be sure you have a back-up of your data which you can import into the most current version.
I apologize for any problems the disappearance from the Chrome Web Store may have caused, but I will do my best to keep this extension alive and well.


### Update 2014-07-12 by [@bitboxer](https://github.com/bitboxer)

I don't use this plug-in anymore and do not have the time or energy to continue maintainership.
I'm out. It was a nice ride.

## Note on Patches/Pull Requests:

* Fork the project.
* Make your feature addition or bug fix.
* Commit, do not mess with version in manifest.json
  (if you want to have your own version, that is fine but bump version in a commit by itself I can ignore when I pull)
* Send me a pull request. Bonus points for topic branches.

## Copyright

See LICENSE for details. A list of all contributors can be found [here](https://github.com/passwordmaker/chrome-passwordmaker/contributors).
