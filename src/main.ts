import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

const stack = pulumi.getStack();

const network = new awsx.ec2.Vpc(`vpc-${stack}`);

const ami = await aws.ec2.getAmi({
  mostRecent: true,
  owners: ["amazon"],
  filters: [
    {
      name: "name",
      values: ["amzn2-ami-hvm-*-x86_64-gp2"],
    },
  ],
});

const ec2SecurityGroup = new aws.ec2.SecurityGroup(`instance-sg-${stack}`, {
  vpcId: network.vpc.id,
  ingress: [
    // TODO: Change to your IP address
    // TODO: Allow ports for your application
    {
      protocol: "tcp",
      fromPort: 22,
      toPort: 22,
      cidrBlocks: ["0.0.0.0/0"],
    },
    {
      protocol: "tcp",
      fromPort: 80,
      toPort: 80,
      cidrBlocks: ["0.0.0.0/0"],
    },
  ],
  egress: [
    {
      protocol: "-1",
      fromPort: 0,
      toPort: 0,
      cidrBlocks: ["0.0.0.0/0"],
    },
  ],
});

const ec2Instance = pulumi
  .all([network.publicSubnetIds, ec2SecurityGroup.id])
  .apply(
    ([subnetId, sgId]) =>
      new aws.ec2.Instance(`instance-${stack}`, {
        subnetId: subnetId[0],
        securityGroups: [sgId],
        instanceType: "t2.micro",
        // EC2 key pair name created in AWS console
        keyName: "SIMPLE_DEPLOY",
        ami: ami.id,
        userData: `#!/bin/bash
  sudo yum install docker jq -y;
  sudo service docker start;
  sudo chkconfig docker on;
  sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose;
  sudo chmod +x /usr/local/bin/docker-compose;
  docker-compose version;
  sudo chmod 666 /var/run/docker.sock;
  `,
      })
  );

const elasticIp = new aws.ec2.Eip(`eip-${stack}`, {
  instance: ec2Instance.id,
});

const elasticIpParameter = new aws.ssm.Parameter(`eip-${stack}`, {
  name: `/${stack}/ec2_ip`,
  type: "String",
  value: elasticIp.publicIp,
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

const ec2Policy = new aws.iam.Policy("s3ReadOnlyPolicy", {
  policy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: [
          "ssm:GetParameters",
          "ssm:GetParameter",
          "ssm:GetParametersByPath",
          "ssm:Decrypt",
        ],
        Resource: "*",
      },
    ],
  }),
});

const instanceRolePolicyAttachment = new aws.iam.RolePolicyAttachment(
  "instanceRolePolicyAttachment",
  {
    role: ec2Role.name,
    policyArn: ec2Policy.arn,
  }
);
