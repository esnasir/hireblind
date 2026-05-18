#!/bin/bash
set -e

# Wait for gateway to be fully ready
sleep 10

echo "1. Login as ADMIN and RECRUITER..."
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"email":"nasirworkspace@gmail.com","password":"admin123"}' | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
RECRUITER_TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"email":"recruiter@hireblind.com","password":"recruiterStrongPass123"}' | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ] || [ -z "$RECRUITER_TOKEN" ]; then
  echo "ERROR: Failed to login."
  exit 1
fi
echo "✓ Login successful"

echo "2. Recruiter fetches campaigns..."
CAMPAIGN_ID="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
echo "✓ Campaigns fetched (ID: $CAMPAIGN_ID)"

echo "3. Recruiter fetches submissions..."
SUBMISSION_RESP=$(curl -s -X GET "http://localhost:8080/api/submissions?campaignId=$CAMPAIGN_ID" -H "Authorization: Bearer $RECRUITER_TOKEN")
SUBMISSION_ID=$(echo $SUBMISSION_RESP | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if echo $SUBMISSION_RESP | grep -qi "Alex Johnson\|Priya Sharma\|rawCandidateName\|rawCandidateEmail"; then
  echo "ERROR: PII LEAK in submissions list!"
  exit 1
fi
echo "✓ Submissions fetched. No PII leaked."

echo "4. Recruiter tries to reveal identity (should fail)..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://localhost:8080/api/submissions/$SUBMISSION_ID/reveal" -H "Authorization: Bearer $RECRUITER_TOKEN")
if [ "$HTTP_STATUS" != "403" ]; then
  echo "ERROR: Recruiter reveal returned $HTTP_STATUS instead of 403"
  exit 1
fi
echo "✓ Recruiter correctly blocked from revealing identity (403)"

echo "5. Admin reveals identity..."
REVEAL_RESP=$(curl -s -X POST "http://localhost:8080/api/submissions/$SUBMISSION_ID/reveal" -H "Authorization: Bearer $ADMIN_TOKEN")
if ! echo $REVEAL_RESP | grep -qi "candidateName"; then
  echo "ERROR: Admin failed to reveal identity. Resp: $REVEAL_RESP"
  exit 1
fi
echo "✓ Admin successfully revealed identity: $REVEAL_RESP"

echo "6. Admin checks audit log for the reveal event..."
AUDIT_RESP=$(curl -s -X GET "http://localhost:8080/api/audit/events?entityId=$SUBMISSION_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
if ! echo $AUDIT_RESP | grep -q "IDENTITY_REVEALED"; then
  echo "ERROR: Audit log does not contain the reveal event. Resp: $AUDIT_RESP"
  exit 1
fi
echo "✓ Audit log contains IDENTITY_REVEALED event"

echo "All tests passed successfully!"
