![Logo](admin/hoymiles-wifi.png)
# ioBroker.hoymiles-wifi

[![NPM version](http://img.shields.io/npm/v/iobroker.hoymiles-wifi.svg)](https://www.npmjs.com/package/iobroker.hoymiles-wifi)
[![Downloads](https://img.shields.io/npm/dm/iobroker.hoymiles-wifi.svg)](https://www.npmjs.com/package/iobroker.hoymiles-wifi)
![Number of Installations (latest)](http://iobroker.live/badges/hoymiles-wifi-installed.svg)
![Number of Installations (stable)](http://iobroker.live/badges/hoymiles-wifi-stable.svg)
[![Dependency Status](https://img.shields.io/david/MicHi07i/iobroker.hoymiles-wifi.svg)](https://david-dm.org/MicHi07i/iobroker.hoymiles-wifi)
[![Known Vulnerabilities](https://snyk.io/test/github/MicHi07i/ioBroker.hoymiles-wifi/badge.svg)](https://snyk.io/test/github/MicHi07i/ioBroker.hoymiles-wifi)

[![NPM](https://nodei.co/npm/iobroker.hoymiles-wifi.png?downloads=true)](https://nodei.co/npm/iobroker.hoymiles-wifi/)

## hoymiles-wifi adapter for ioBroker

Communication with Hoymiles DTUs and the HMS-XXXXW-2T HMS microinverters, utilizing protobuf messages. Disclaimer: This library is not affiliated with Hoymiles. It is an independent project developed to provide tools for interacting with Hoymiles HMS-XXXXW-2T series micro-inverters featuring integrated WiFi DTU. Any trademarks or product names mentioned are the property of their respective owners. https://github.com/suaveolent/hoymiles-wifi

### Getting started

1) Visit https://github.com/suaveolent/hoymiles-wifi and install
       ```bash
    $ pip install hoymiles-wifi
    ```
   Please test if you can read data from your HMS using the IP address, run from your shell/command line.
   Please make sure your PATH variable is set, (strangely on my Pi I had to use 'sudo pip install hoymiles-wifi').
   I advise to make sure your password of the access point of the HMS is complex.
2) Install this adapter in ioBroker.
3) Adjust IP address of your HMS as host. Rest of the default settings should be fine.
4) By default this adapter verifies IP address before running commands to keep CPU usage low, especisally when HMS is offline while night time.
5) Most valuable to me is hoymiles-wifi.0.get_real_data_new.dtuPower (e.g. value of 6321 means actual 632.1 Watt)
6) Writing is not supported yet, I strongly suggest using your app from SmartPhone instead.
7) Feel free to give me feedback.



### Publishing the adapter

## Changelog

### 0.1.0
* (MicHi07i) initial release

## License
MIT License

Copyright (c) 2024 MicHi07i <michi07@mein.gmx>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.# ioBroker.hoymiles-wifi
