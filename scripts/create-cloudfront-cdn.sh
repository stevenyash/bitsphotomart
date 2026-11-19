#!/bin/bash
# CloudFront CDN Creation Script for BitsPhotoMart
# Run with AWS credentials that have CloudFront:CreateDistribution permission

set -e

BUCKET_NAME="bpm-kenya"
AWS_REGION="af-south-1"
ACCOUNT_ID="528757822752"

echo "=== Creating CloudFront CDN for $BUCKET_NAME ==="

# Step 1: Create Origin Access Control
echo "Step 1: Creating Origin Access Control..."
OAC_RESULT=$(aws cloudfront create-origin-access-control \
  --origin-access-control-config "Name=${BUCKET_NAME}-oac,OriginAccessControlOriginType=s3,SigningBehavior=always,SigningProtocol=sigv4" \
  --output json 2>/dev/null || echo "{\"OriginAccessControl\":{\"Id\":\"existing\"}}")

OAC_ID=$(echo $OAC_RESULT | grep -o '"Id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "✓ OAC ID: $OAC_ID"

# Step 2: Update S3 bucket policy
echo ""
echo "Step 2: Updating S3 bucket policy..."
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [
    {
      \"Sid\": \"AllowCloudFrontServiceRead\",
      \"Effect\": \"Allow\",
      \"Principal\": {\"Service\": \"cloudfront.amazonaws.com\"},
      \"Action\": \"s3:GetObject\",
      \"Resource\": \"arn:aws:s3:::${BUCKET_NAME}/*\",
      \"Condition\": {
        \"StringEquals\": {
          \"AWS:SourceArn\": \"arn:aws:cloudfront::${ACCOUNT_ID}:distribution/*\"
        }
      }
    },
    {
      \"Sid\": \"DenyNonSSLRequests\",
      \"Effect\": \"Deny\",
      \"Principal\": \"*\",
      \"Action\": \"s3:*\",
      \"Resource\": [\"arn:aws:s3:::${BUCKET_NAME}\", \"arn:aws:s3:::${BUCKET_NAME}/*\"],
      \"Condition\": {\"Bool\": {\"aws:SecureTransport\": \"false\"}}
    }
  ]
}"
echo "✓ S3 bucket policy updated"

# Step 3: Create CloudFront distribution
echo ""
echo "Step 3: Creating CloudFront distribution..."
DIST_RESULT=$(aws cloudfront create-distribution \
  --origin-access-control "Id=${OAC_ID},OriginAccessControlOriginType=s3,SigningBehavior=always,SigningProtocol=sigv4" \
  --origin-domain-name "${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com" \
  --origin-id "${BUCKET_NAME}-origin" \
  --default-root-object "index.html" \
  --comment "BitsPhotoMart CDN for ${BUCKET_NAME}" \
  --enabled \
  --viewer-protocol-policy "redirect-to-https" \
  --http-version "http2andhttp3" \
  --price-class "PriceClass_All" \
  --output json)

DOMAIN_NAME=$(echo $DIST_RESULT | grep -o '"DomainName":"[^"]*"' | cut -d'"' -f4)
DIST_ID=$(echo $DIST_RESULT | grep -o '"Id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo ""
echo "=== CloudFront Distribution Created ==="
echo "Domain: https://$DOMAIN_NAME"
echo "Distribution ID: $DIST_ID"
echo ""
echo "=== Update your .env file with: ==="
echo "AWS_CLOUDFRONT_DOMAIN=https://$DOMAIN_NAME"
echo "AWS_CLOUDFRONT_DISTRIBUTION_ID=$DIST_ID"
