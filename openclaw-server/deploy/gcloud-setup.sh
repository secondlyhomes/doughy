#!/bin/bash
# Google Cloud Setup Script for OpenClaw Gmail Pub/Sub
#
# Prerequisites:
# 1. gcloud CLI installed: https://cloud.google.com/sdk/docs/install
# 2. Authenticated: gcloud auth login
# 3. Project created in Google Cloud Console
#
# Usage: ./gcloud-setup.sh YOUR_PROJECT_ID

set -e

if [ -z "$1" ]; then
  echo "Usage: ./gcloud-setup.sh YOUR_PROJECT_ID"
  echo "Example: ./gcloud-setup.sh doughy-openclaw"
  exit 1
fi

PROJECT_ID=$1
TOPIC_NAME="gmail-notifications"
SUBSCRIPTION_NAME="gmail-push"
WEBHOOK_URL="https://openclaw.doughy.app/webhooks/gmail"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           Google Cloud Pub/Sub Setup for OpenClaw             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Project: $PROJECT_ID"
echo "Topic: $TOPIC_NAME"
echo "Subscription: $SUBSCRIPTION_NAME"
echo "Webhook URL: $WEBHOOK_URL"
echo ""

# Set project
echo "📦 Setting active project..."
gcloud config set project $PROJECT_ID

# ============================================================================
# Step 1: Enable Required APIs
# ============================================================================
echo "📦 Step 1: Enabling required APIs..."
gcloud services enable gmail.googleapis.com
gcloud services enable pubsub.googleapis.com
echo "✅ APIs enabled"

# ============================================================================
# Step 2: Create Pub/Sub Topic
# ============================================================================
echo "📦 Step 2: Creating Pub/Sub topic..."
if gcloud pubsub topics describe $TOPIC_NAME 2>/dev/null; then
  echo "Topic already exists, skipping..."
else
  gcloud pubsub topics create $TOPIC_NAME
  echo "✅ Topic created"
fi

# ============================================================================
# Step 3: Grant Gmail permission to publish
# ============================================================================
echo "📦 Step 3: Granting Gmail permission to publish..."
gcloud pubsub topics add-iam-policy-binding $TOPIC_NAME \
  --member="serviceAccount:gmail-api-push@system.gserviceaccount.com" \
  --role="roles/pubsub.publisher"
echo "✅ Permission granted"

# ============================================================================
# Step 4: Create Push Subscription
# ============================================================================
echo "📦 Step 4: Creating push subscription..."
if gcloud pubsub subscriptions describe $SUBSCRIPTION_NAME 2>/dev/null; then
  echo "Subscription already exists, updating endpoint..."
  gcloud pubsub subscriptions modify-push-config $SUBSCRIPTION_NAME \
    --push-endpoint=$WEBHOOK_URL
else
  gcloud pubsub subscriptions create $SUBSCRIPTION_NAME \
    --topic=$TOPIC_NAME \
    --push-endpoint=$WEBHOOK_URL \
    --ack-deadline=60 \
    --message-retention-duration=1d \
    --expiration-period=never
  echo "✅ Subscription created"
fi

# ============================================================================
# Step 5: Output Information
# ============================================================================
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           Setup Complete!                                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Topic Name (for Gmail watch):"
echo "  projects/$PROJECT_ID/topics/$TOPIC_NAME"
echo ""
echo "Next steps:"
echo "1. Create OAuth 2.0 credentials in Google Cloud Console:"
echo "   https://console.cloud.google.com/apis/credentials"
echo ""
echo "2. Set authorized redirect URI to:"
echo "   https://openclaw.doughy.app/oauth/callback"
echo ""
echo "3. Add to your .env file:"
echo "   GOOGLE_CLIENT_ID=<your-client-id>"
echo "   GOOGLE_CLIENT_SECRET=<your-client-secret>"
echo "   GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID"
echo "   GMAIL_PUBSUB_TOPIC=$TOPIC_NAME"
echo ""
echo "4. In the Doughy app, users can connect Gmail via:"
echo "   https://openclaw.doughy.app/oauth/start?user_id=USER_ID"
echo ""
