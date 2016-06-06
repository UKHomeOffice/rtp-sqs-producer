'use strict';

const aws = require('aws-sdk');
const promiseRetry = require('promise-retry');

/**
 * @constructor
 * @param conf [object]
 * @param conf.retryTimes [number] the number of retries allowed in case of failure to receive an ack
 * @param conf.retryInterval [number] the milliseconds between an attempt and the other
 * @param conf.region [string] [optional] the sqs region to use, defaults to eu-west-1
 */
function Producer(conf) {
    let config = conf || {};
    this._retryTimes = config.retryTimes || 1;
    this._retryInterval = config.retryInterval || ((config.retryTimes === 1) ? 0 : 10000);
    this._queueUrl = config.queueUrl || 'http://sqs.eu-west-1.amazonaws.com/123456789012/queue2';
    this._sqs = new aws.SQS({
        region: process.env.aws_region || config.region || 'eu-west-1',
        accessKeyId: process.env.AWS_SQS_ACCESS_KEY_ID || '123456123456123456123456',
        secretAccessKey: process.env.AWS_SQS_SECRET_ACCESS_KEY || 'ABCDABCDABCDABCDABCD',
        params: {
            QueueUrl: this._queueUrl
        }
    });
}

Producer.prototype.sendAndRetry = function sendAndRetry(message) {
    return promiseRetry(function retrier(retry) {
        return this.send(message).catch(retry);
    }.bind(this), {
        retries: this._retryTimes,
        minTimeout: this._retryInterval
    });
};

Producer.prototype.send = function send(message) {
    return new Promise(function sender(resolve, reject) {
        return this._sqs.sendMessage(
            {MessageBody: typeof message === 'string' ? message : JSON.stringify(message)},
            (err, ack) => err ? reject(err) : resolve(ack)
        );
    }.bind(this));
};

module.exports = Producer;
