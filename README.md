rtp-sqs-producer [![Build Status](https://travis-ci.org/UKHomeOffice/rtp-sqs-producer.svg)](https://travis-ci.org/UKHomeOffice/rtp-sqs-producer)
-----------------

Very thin wrapper around amazon sqs. Provides little more than a friendly interface to publish messages to the sqs queue, and
retry in case of failure.
Currently doesn't support receiving, but only publishing.

Use
---

    var producer = new (require('rtp-sqs-connector'))(config)
    
The module assumes that you have injected your amazon sqs credentials into `process.env`.

