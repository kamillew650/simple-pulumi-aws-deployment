import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

const stack = pulumi.getStack();

const network = new awsx.ec2.Vpc(`vpc-${stack}`);

const ec2Instance = new aws.ec2.Instance(`instance-${stack}`, {
  vpcSecurityGroupIds: [network.publicSubnetIds.apply((ids) => ids[0])],
  instanceType: "t2.micro",
});

const elasticIp = new aws.ec2.Eip(`eip-${stack}`, {
  instance: ec2Instance.id,
});

const ec2Role = new aws.iam.Role(`role-${stack}`, {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Principal: {
          Service: "ec2.amazonaws.com",
        },
        Effect: "Allow",
        Sid: "",
      },
    ],
  }),
});

const s3ReadOnlyPolicy = aws.iam.ManagedPolicies.AmazonS3ReadOnlyAccess;
const instanceRolePolicyAttachment = new aws.iam.RolePolicyAttachment(
  "instanceRolePolicyAttachment",
  {
    role: ec2Role.name,
    policyArn: s3ReadOnlyPolicy,
  }
);
