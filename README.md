# Satisfactory Server AWS

Automated Satisfactory Dedicated Server management on AWS

## Disclaimer

Lets get the warnings and stuff out the way first:

This is a free and open source project and there are no guarantees that it will
work or always continue working.  If you use it, you are responsible for
maintaining your setup and monitoring and paying your AWS bill.

I will not support your specific server setup, nor will I support you if you end
up paying too much. You will need to understand the basics of AWS to operate
this. If you don't want to do this, I recommend any of the fully managed server
hosts (e.g. <https://www.gtxgaming.co.uk> in the UK) that provide Satisfactory
dedicated servers at a flat rate.

## Intro

This tool can help you collaborate with friends on your Satisfactory projects.

This project uses [AWS CDK](https://aws.amazon.com/cdk/) to provision everything
you need to host a
[Satisfactory Dedicated Server](https://satisfactory.fandom.com/wiki/Dedicated_servers)
on AWS.  It includes the following:

* VPC/Network configuration
* Ec2 Instance provisioning
* Automatic shutdown behavior when not in use (saves $$)
* Automatic game file backup to s3
* A Lambda browser endpoint to
  [start the server back up](#starting-the-server-back-up)

## Requirements

What you will need to use this project:

* [AWS Account](https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/)
* [Git](https://git-scm.com/downloads)
* [AWS Command Line Interface (cli)](https://aws.amazon.com/cli/)
* [NodeJs](https://nodejs.org/en/download/)

## Configuration

1. Copy the given `server-hosting/config.sample.ts` file to
   `server-hosting/config.ts` file. Fill the fields with appropriate values.
   Explanation for each field is given in file itself.
2. Create a file called `server-hosting/lambda/html-template.html` (copy
   `server-hosting/lambda/html-template.sample.html` if preferred). This will
   provide the person who starts the server with the IP address required to
   connect (see [DNS and IP management](#dns-and-ip-management) for why this
   is important).

At a minimum, account (account number) and region are required.

You should set the region closest to where you and your friends play, as this
is where your dedicated server will run from. e.g. In the UK, `eu-west-2` is a
good start as the datacentre is in London. A full list of AWS regions (and their
nearest city) can be found
[here](https://docs.aws.amazon.com/de_de/global-infrastructure/latest/regions/aws-regions.html).

You may also set the EC2 instance type in the `config.ts` file. The [default one](https://aws.amazon.com/ec2/instance-types/m6a/)
in `config.sample.ts` meets the [requirements for the Satisfactory Dedicated
Server](https://satisfactory.wiki.gg/wiki/Dedicated_servers#Requirements).
If you are running a higher player count, or a large factory, you may need to
change the instance type to a more powerful server, but this will most likely
incur a higher cost. You may also be able to save a bit of $$ by choosing a
_smaller_ instance type. The available EC2  instance types are described [here](https://aws.amazon.com/de/ec2/instance-types/).

_Note_: Not all instance types may be available in all AWS regions. See AWS
documentation for details.

## Quick Start

This assumes you have all requirements and have
[configured aws cli](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)
to use your AWS account.

1. [Clone this project](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository)
2. In a terminal/command prompt, run:
   1. `npm install`
   2. `npx cdk bootstrap <aws account number>/<aws region>` (replace account
      number and region)
   3. `cp server-hosting/.config.sample.ts server-hosting/.config.ts` if you have not done so (see [Configuration](#configuration) for customization); you must fill in region and account
   4. `npx cdk deploy`
3. Wait for the CloudFormation stack to finish. It may take a few minutes for
   the server to download/install everything after the stack is finished.
4. Use the Ec2 instance public IP address to connect to your server in
   Satisfactory Server Manager (see
   [DNS and IP management](#dns-and-ip-management)).
5. Start a new game or upload a save.

## Starting the Server

As mentioned in the [intro](#intro), the server will shut itself down when not
in use. This saves you money as you are only charged ec2 fees while the server
is running.

Before you connect, you will need to start the server back up again. If you are
starting the server yourself, you can do this from the
[EC2 section of the AWS console](https://console.aws.amazon.com/ec2/home).

For your friends, an HTTPS API endpoint is available to connect to. You will
have received a link to this when you deployed with `npx cdk deploy`. For
example:

```text
 ✅  ServerHostingStack

✨  Deployment time: 297.84s

Outputs:
ServerHostingStack.SatisfactoryHostingStartServerApiEndpointABCDEF01 = https://dkeibye92c8.execute-api.us-west-1.amazonaws.com/prod/
Stack ARN:
arn:aws:cloudformation:us-west-1:123456789012:stack/ServerHostingStack/ea5e18d9-cbce-43d4-b5b1-bd6983f91887

✨  Total time: 301.57s
```

The HTTPS link (the one above is just an example, yours will be different), when
opened in a web browser, will automatically start the server, and show a basic
web page which shows the IP address of the server and instructions on how to
connect once you have started the Satisfactory game.

This is a useful link to keep, because even if the server is already running,
the page will not make server changes, but will still provide the IP. I
recommend just opening the link whenever you wish to play, even if you know
you're joining friends, just so you can get the IP address.

NOTE THAT THIS LINK IS NOT PASSWORD PROTECTED. Anyone who goes to this link will
start the server, so absolutely DO NOT put the link into a large Discord chat
room, forum, etc. Only share it with the people who you want to play on your
server.

## Accessing Your Server Remotely

Access to the EC2 instance hosting your Satisfactory server can be done via
[AWS Session Manager](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/session-manager.html).
External SSH is **blocked** by default at the network level.

> Tip: ssm may open /bin/sh, running `bash` can get you to a more familiar bash
> shell.

The server is running (by default) Ubuntu 24.04, so familiarity with Linux
commands is highly recommended.

## DNS and IP management

When your ec2 instance shuts down and starts back up, your IP address will
probably change. If it changes, you will have to re-add the server in Server
Manager. When you go to the HTTPS endpoint (see
[Starting the Server](#starting-the-server)). The new IP address will be
provided.


If you want to make this less painful, there are a couple ways to fix the issue,
however these are unsupported so you'll need to work it out for yourself:

1. [Elastic IP](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/elastic-ip-addresses-eip.html) -
   Create and assign it to your ec2 instance in AWS. Your Elastic IP will never
   change, but you will get charged for it ($0.005/hour or around $4/month).
   This method also allows you to use your own custom domain address if wish.
2. Dynamic DNS - Free dynamic DNS services like
   [DuckDns](https://www.duckdns.org/) provide a way to automatically manage
   when the IP address changes.  Once setup, you just use their URL and they
   handle everything else behind the scenes. This method may not allow you to
   use a custom domain. Populate the related settings in `config.ts` to enable.

## Modding support

You can use mods that are installed during the deployment of the EC2 instance.
To do so, set the option `useMods = true` in `config.ts`. Configure the mods 
you like to install and their preferred version in `./scripts/mods.json`. 
Copy `./scripts/mods.sample.json` for a starting point and replace the placeholders
 `[MOD_ID_x]` and `[VERSION_x]` with the actual values. The `MOD_ID` can be obtained
 from the URL of the mod's page on https://ficsit.app/ (e.g `https://ficsit.app/mod/[MOD_ID]`).

See https://github.com/satisfactorymodding/ficsit-cli/issues/72#issuecomment-2436314810 
for a real life example.

## Costs

If you play on the server 2 hours per day, this setup will cost around $13/month
on AWS. Note that this amount **scales by hours played**. Someone playing 4
hours a day should expect to pay around $26/month, someone playing 2 hours a
week should expect to pay around $2-3/month. The costs mainly depend on the 
choice of the EC2 instance type and region (see [Configuration](#configuration) above). Your mileage may vary, but you can observe the costs on a daily basis 
using the Cost Management menu in your AWS console.

Since the server automatically shuts down when not in use, you only pay when the
server is up and you (and/or your friends) are actively playing on it.

As long as the instance is set up, the EBS volume (virtual harddrive) will be 
charged ~5ct/day. If you are not playing over a longer period of time, you can
tear down the environment with `npx cdk destroy`. It can be re-deployed anytime.
All saves and data are stored in a S3 bucket and will be automatically restored
on next deployment.

S3 and Lambda usage costs are free tier eligible.

## Contributing

This project is licensed under the MIT license, see [LICENSE](LICENSE) for more
information.

I'm accepting bug reports and pull requests, but responsiveness will vary based
on how busy I am with life things, and whether I'm even playing the game
anymore.

## Credits

This project is a fork of [Karl Nicoll's](https://github.com/karlnicoll/satisfactory-server-aws) fork of [Dan Fey's](https://github.com/feydan/satisfactory-server-aws) satisfactory-server-aws project. 
Most of the credit should go to them for the initial effort.

## FAQs

### Why would I use a dedicated server when I can host for free on my own computer?

* If you want to allow friends to play on your server without you, you will have
  to always leave your computer on and the server running continuously, even if
  you are not playing.  Having it on the cloud frees up your hardware.
* Your computer may not have enough resources to host the server and play at the
  same time.
* You may not want to punch a hole into your internet security by exposing an open
port to the internet via port forwarding or opening it in your firewall.

### Why would I choose AWS over a dedicated game server hoster?

AWS is has a pay-per-use model, so you just pay when you and/or your friends
are actual playing and the server instance is running. Especially when you
only play occasionally, AWS might be cheaper than a dedicated server that
keeps running 24/7.


### How much does it cost?

See [Costs](#costs) above. Actual figures are subject to AWS changing their
prices.

### How do I pay my bill?

You settle your bill with AWS every month.
