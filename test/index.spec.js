'use strict';
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
require('sinon-as-promised');
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');
const proxyquire = require('proxyquire').noPreserveCache();

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('Producer', () => {
    let producer;
    let sendMessageStub;

    beforeEach(() => {
        const MockSQS = function() {};
        sendMessageStub = sinon.stub().yields(null, 'abcd');
        MockSQS.prototype.sendMessage = sendMessageStub;
        const Producer = proxyquire('../index', {
            'aws-sdk': {SQS: MockSQS}
        });
        producer = new Producer({
            retryTimes: 2,
            retryInterval: 10
        });
    });

    describe('Produce.prototype.constructor', () => {

        it('has properties set by the config', () => {
            expect(producer._retryTimes).to.equal(2);
            expect(producer._retryInterval).to.equal(10);
        });

    });

    describe('Producer.prototype.sendAndRetry', () => {

        it('exists', () => {
            expect(producer.sendAndRetry).to.exist;
        });

        it('returns a promise', () => {
            return expect(producer.sendAndRetry()).to.eventually.equal('abcd');
        });

        it('invokes sendMessage method', () => {
            return producer.sendAndRetry('a').then(ack => {
                expect(ack).to.equal('abcd');
                expect(sendMessageStub).to.have.been.calledOnce;
            });
        });

        it('retries until it gets an ack', () => {
            const MockSQS = function() {};
            const sendMessageStub = sinon.stub();
            sendMessageStub.onCall(0).yields(new Error(), 'efgh');
            sendMessageStub.onCall(1).yields(null, 'abcd');
            MockSQS.prototype.sendMessage = sendMessageStub;
            const Producer = proxyquire('../index', {
                'aws-sdk': {SQS: MockSQS}
            });
            const producer = new Producer({
                retryTimes: 2,
                retryInterval: 10
            });

            return producer.sendAndRetry('send and retry').then(ack => {
                expect(ack).to.equal('abcd');
                expect(sendMessageStub).to.have.been.calledTwice;
            });
        });

        it('retries until the retries are exhausted', () => {
            const MockSQS = function() {};
            const sendMessageStub = sinon.stub().yields('no workee');
            MockSQS.prototype.sendMessage = sendMessageStub;
            const Producer = proxyquire('../index', {
                'aws-sdk': {SQS: MockSQS}
            });
            const producer = new Producer({
                retryTimes: 2,
                retryInterval: 10
            });

            return producer.sendAndRetry('ugo').catch(err => {
                expect(err).to.equal('no workee');
            });
        });

    });

    describe('Producer.prototype.send', () => {

        it('exists', () => {
            expect(producer.send).to.exist;
        });

        it('returns a promise', () => {
            return expect(producer.send()).to.eventually.equal('abcd');
        });

        it('invokes the sqs sendMessage method', () => {
            producer.send();
            expect(sendMessageStub).to.have.been.calledOnce;
        });

        describe('should invoke the sqs sendMessage method', function () {
            it('with a string when given a string', () => {
                producer.send('String');
                expect(sendMessageStub).to.have.been.calledWith({MessageBody: 'String'});
            });

            it('with a stringified param when given not a string', () => {
                producer.send(1);
                expect(sendMessageStub).to.have.been.calledWith({MessageBody: '1'});
            });
        });
    });
});
