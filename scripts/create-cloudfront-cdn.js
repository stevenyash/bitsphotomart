#!/usr/bin/env node
/**
 * CloudFront CDN Creation Script for BitsPhotoMart
 * 
 * Usage: Run with AWS credentials that have CloudFront permissions
 * The script creates:
 * 1. Origin Access Control (OAC)
 * 2. CloudFront distribution pointing to bpm-kenya S3 bucket
 * 
 * Required IAM permissions:
 * - cloudfront:CreateOriginAccessControl
 * - cloudfront:CreateDistribution
 * - cloudfront:CreateCachePolicy
 * - cloudfront:CreateOriginRequestPolicy
 * - cloudfront:CreateResponseHeadersPolicy
 * - s3:PutBucketPolicy
 */

const { execSync } = require('child_process');

function runCommand(command) {
  console.log(`Running: ${command}`);
  return JSON.parse(execSync(command, { encoding: 'utf-8' }));
}

async function createCloudFrontDistribution() {
  const bucketName = 'bpm-kenya';
  const region = 'af-south-1';
  const accountId = '528757822752';

  console.log('\n=== Creating CloudFront CDN for bpm-kenya ===\n');

  // Step 1: Create Origin Access Control (OAC)
  console.log('Step 1: Creating Origin Access Control...');
  let oacResult;
  try {
    oacResult = runCommand(
      `aws cloudfront create-origin-access-control ` +
      `--origin-access-control-config "Name=${bucketName}-oac,OriginAccessControlOriginType=s3,SigningBehavior=always,SigningProtocol=sigv4" ` +
      `--output json`
    );
    const oacId = oacResult.OriginAccessControl.Id;
    console.log(`✓ OAC created: ${oacId}`);
  } catch (e) {
    console.log('OAC might already exist, checking...');
    // Try to list existing OACs
    try {
      const listOac = runCommand(`aws cloudfront list-origin-access-controls --output json`);
      const existingOac = listOac.OriginAccessControlList.Items.find(
        o => o.OriginAccessControlOriginType === 's3'
      );
      if (existingOac) {
        console.log(`✓ Using existing OAC: ${existingOac.Id}`);
      }
    } catch (err) {
      console.log('Could not list OACs. Will try to create distribution anyway.');
    }
  }

  // Step 2: Get S3 bucket policy and update it
  console.log('\nStep 2: Updating S3 bucket policy...');
  const bucketPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'AllowCloudFrontServiceRead',
        Effect: 'Allow',
        Principal: { Service: 'cloudfront.amazonaws.com' },
        Action: 's3:GetObject',
        Resource: `arn:aws:s3:::${bucketName}/*`,
        Condition: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${accountId}:distribution/*`
          }
        }
      },
      {
        Sid: 'DenyNonSSLRequests',
        Effect: 'Deny',
        Principal: '*',
        Action: 's3:*',
        Resource: [`arn:aws:s3:::${bucketName}`, `arn:aws:s3:::${bucketName}/*`],
        Condition: {
          Bool: { 'aws:SecureTransport': 'false' }
        }
      }
    ]
  };

  try {
    runCommand(
      `aws s3api put-bucket-policy --bucket ${bucketName} --policy '${JSON.stringify(bucketPolicy)}'`
    );
    console.log('✓ S3 bucket policy updated');
  } catch (e) {
    console.log('Could not update bucket policy:', e.message);
  }

  // Step 3: Create CloudFront distribution
  console.log('\nStep 3: Creating CloudFront distribution...');
  const distributionConfig = {
    CallerReference: `bpm-${Date.now()}`,
    Comment: 'BitsPhotoMart CDN for bpm-kenya bucket',
    DefaultRootObject: 'index.html',
    Enabled: true,
    Origins: {
      Quantity: 1,
      Items: [
        {
          Id: `${bucketName}-origin`,
          DomainName: `${bucketName}.s3.${region}.amazonaws.com`,
          OriginPath: '',
          CustomHeaders: { Quantity: 0 },
          S3OriginConfig: {
            OriginAccessIdentity: ''
          },
          ConnectionAttempts: 3,
          ConnectionTimeout: 10,
          OriginShield: { Enabled: false }
        }
      ]
    },
    DefaultCacheBehavior: {
      TargetOriginId: `${bucketName}-origin`,
      TrustedSigners: { Enabled: false, Quantity: 0 },
      TrustedKeyGroups: { Enabled: false, Quantity: 0 },
      ViewerProtocolPolicy: 'redirect-to-https',
      AllowedMethods: {
        Quantity: 2,
        Items: ['HEAD', 'GET'],
        CachedMethods: { Quantity: 2, Items: ['HEAD', 'GET'] }
      },
      Compress: true,
      CachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // Managed-CachingOptimized
      OriginRequestPolicyId: '88a5eaf4-2fd4-4709-b370-b4c650ea3fcf', // Managed-AllViewer
      ResponseHeadersPolicyId: '60669652-455b-4ae9-85a4-c4c02393f86c', // Managed-SimpleCORS
    },
    PriceClass: 'PriceClass_All',
    HttpVersion: 'HTTP2andHTTP3',
    IsIPV6Enabled: true
  };

  try {
    const distResult = runCommand(
      `aws cloudfront create-distribution --origin-access-control-config "Name=${bucketName}-oac,OriginAccessControlOriginType=s3,SigningBehavior=always,SigningProtocol=sigv4" ` +
      `--distribution-config '${JSON.stringify(distributionConfig)}' --output json`.replace(/"/g, '\\"')
    );
    console.log('✓ CloudFront distribution created');
    console.log(`  Domain: ${distResult.Distribution.DomainName}`);
    console.log(`  ID: ${distResult.Distribution.Id}`);
    console.log(`  Status: ${distResult.Distribution.Status}`);
    
    console.log('\n=== Update your .env file with: ===');
    console.log(`AWS_CLOUDFRONT_DOMAIN=https://${distResult.Distribution.DomainName}`);
    console.log(`AWS_CLOUDFRONT_DISTRIBUTION_ID=${distResult.Distribution.Id}`);
  } catch (e) {
    console.log('Error creating distribution:', e.message);
    console.log('\nNote: You may need to run this script with AWS credentials');
    console.log('that have CloudFront:CreateDistribution permission.');
  }
}

createCloudFrontDistribution().catch(console.error);
