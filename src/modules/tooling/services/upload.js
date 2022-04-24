'use strict';

const { DateTime }                   = require('luxon');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const { Service, Util } = require('../../../core');

module.exports = class UploadService extends Service {

    init() {

        this.bucketUrl = `https://${ this.client.settings.plugins.tooling.upload.bucket }.${ this.client.settings.plugins.tooling.upload.endpoint }`;

        this.s3 = new S3Client({
            credentials : this.client.settings.plugins.tooling.upload.credentials,
            endpoint    : `${ this.client.settings.plugins.tooling.upload.proto }://${ this.client.settings.plugins.tooling.upload.endpoint }`,
            region      : this.client.settings.plugins.tooling.upload.region
        });
    }

    async upload(file, options = {}) {

        const key = `${ (DateTime.now()).toFormat('yyyy/MM/dd') }/${ Util.uuid() }`;

        const command = new PutObjectCommand({
            ACL          : 'public-read',
            StorageClass : 'ONEZONE_IA',
            ContentType  : options.contentType,
            Bucket       : this.client.settings.plugins.tooling.upload.bucket,
            Body         : file,
            Key          : key
        });

        const { $metadata } = await this.s3.send(command);

        if ($metadata.httpStatusCode !== 200) {

            throw new Error(`Failed to upload file to S3: ${ $metadata.httpStatusCode } ${ $metadata.requestId || $metadata.extendedRequestId }`);
        }

        this.client.logger.info(`Uploaded file to S3: ${ this.bucketUrl }/${ key }`);

        return `${ this.bucketUrl }/${ key }`;
    }
};
