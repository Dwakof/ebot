'use strict';

const { DateTime }                   = require('luxon');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const { Service, Util } = require('../../../core');

module.exports = class UploadService extends Service {

    #settings;

    init(settings) {

        this.#settings = settings.upload;

        this.bucketUrl = `https://${ this.#settings.bucket }.${ this.#settings.endpoint }`;

        this.s3 = new S3Client({
            credentials : this.#settings.credentials,
            endpoint    : `${ this.#settings.proto }://${ this.#settings.endpoint }`,
            region      : this.#settings.region
        });
    }

    async upload(file, options = {}) {

        const key = `${ (DateTime.now()).toFormat('yyyy/MM/dd') }/${ Util.uuid() }`;

        const command = new PutObjectCommand({
            ACL          : 'public-read',
            StorageClass : this.#settings.storageClass,
            Bucket       : this.#settings.bucket,
            ContentType  : options.contentType,
            Body         : file,
            Key          : key
        });

        const { $metadata } = await this.s3.send(command);

        if ($metadata.httpStatusCode !== 200) {

            throw new Error(`Failed to upload file to S3: ${ $metadata.httpStatusCode } ${ $metadata.requestId || $metadata.extendedRequestId }`);
        }

        this.client.logger.info({ msg : `Uploaded file to S3: ${ this.bucketUrl }/${ key }`, event : 'fileUpload', emitter : 'tooling' });

        return `${ this.bucketUrl }/${ key }`;
    }
};
