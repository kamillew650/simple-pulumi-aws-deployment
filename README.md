# Simple AWS EC2 deployment using Pulumi and GitLab CI/CD

This project is a simple example of how to deploy application on the AWS EC2 instance using Pulumi and GitLab CI/CD.

> **_NOTE:_** This is not for production use.

## Configuration

To configure the project with AWS and GitLab Ci you need fallow the steps below:

1. Create an AWS account and create AWS Access Key and Secret Key.
2. Create S3 bucket for Pulumi backend.
3. Create a new project in GitLab or use an existing one.
4. Create EC2 key pair in AWS and save the private key.
5. Create a new GitLab CI/CD variables:
   - `AWS_ACCESS_KEY_ID` - AWS Access Key
   - `AWS_DEFAULT_REGION` - AWS region
   - `AWS_SECRET_ACCESS_KEY` - AWS Secret Key
   - `EC2_PRIVATE_KEY` - EC2 private key created in step 4
   - `PULUMI_BACKEND_URL` - Pulumi backend URL
   - `PULUMI_CONFIG_PASSPHRASE` - Pulumi config passphrase (for already created pulumi stack passphrase is empty)

## Usage

In the pipelines page in GitLab, you should see 4 stages:

- infra-deploy - deploy infrastructure using Pulumi
- infra-refresh - refresh infrastructure using Pulumi
- infra-destroy - destroy infrastructure using Pulumi
- app-deploy - deploy application on the EC2 instance

There is script `import-ssm-params.bash` that imports SSM parameters from the AWS Systems Manager Parameter Store to the `env` file on the EC2 instance. This file is used by `docker-compose.yml`. You can use AWS Parameter Store to store sensitive data like database passwords, API keys, etc.

## License

[MIT](https://choosealicense.com/licenses/mit/)
