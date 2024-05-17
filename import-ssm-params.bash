#!/bin/bash

# Set the initial parameters
NEXT_TOKEN=""
OUTPUT_FILE=".env"

# Clear the output file if it exists
> $OUTPUT_FILE

# Function to fetch SSM parameters
fetch_parameters() {
  local NEXT_TOKEN=$1

  if [ -z "$NEXT_TOKEN" ]; then
    RESPONSE=$(aws ssm get-parameters-by-path --path "/dev" --region eu-central-1 --recursive --with-decryption)
  else
    RESPONSE=$(aws ssm get-parameters-by-path --path "/dev" --region eu-central-1 --recursive --with-decryption --next-token "$NEXT_TOKEN")
  fi

  echo $RESPONSE
}

# Function to convert parameter name to ENV variable format
convert_to_env_var() {
  echo "$1" | sed 's|/||g' | tr '/' '_' | tr '[:lower:]' '[:upper:]'
}

# Initial fetch
RESPONSE=$(fetch_parameters "")

# Append the fetched parameters to the .env file
echo $RESPONSE | jq -c '.Parameters[]' | while IFS= read -r param; do
  NAME=$(echo $param | jq -r '.Name')
  VALUE=$(echo $param | jq -r '.Value')
  ENV_VAR_NAME=$(convert_to_env_var "$NAME")
  echo "$ENV_VAR_NAME=$VALUE" >> $OUTPUT_FILE
done

# Check for the next token and paginate if necessary
NEXT_TOKEN=$(echo $RESPONSE | jq -r '.NextToken')

while [ -n "$NEXT_TOKEN" ] && [ "$NEXT_TOKEN" != "null" ]; do
  RESPONSE=$(fetch_parameters "$NEXT_TOKEN")
  echo $RESPONSE | jq -c '.Parameters[]' | while IFS= read -r param; do
    NAME=$(echo $param | jq -r '.Name')
    VALUE=$(echo $param | jq -r '.Value')
    ENV_VAR_NAME=$(convert_to_env_var "$NAME")
    echo "$ENV_VAR_NAME=$VALUE" >> $OUTPUT_FILE
  done
  NEXT_TOKEN=$(echo $RESPONSE | jq -r '.NextToken')
done

echo "All parameters have been saved to $OUTPUT_FILE."
