import { EC2Client, StartInstancesCommand, DescribeInstancesCommand, DescribeInstancesCommandOutput } from "@aws-sdk/client-ec2";
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult, Callback, Context } from 'aws-lambda';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const instanceIds = [process.env.INSTANCE_ID!];

async function getHtmlTemplate(): Promise<string> {
  const templateUrl = process.env.HTML_TEMPLATE_S3_URL!;

  // Download the template from S3.
  const client = new S3Client({ region: process.env.AWS_REGION });
  const getObjectCommand = new GetObjectCommand({
    Bucket: process.env.HTML_TEMPLATE_S3_BUCKET!,
    Key: process.env.HTML_TEMPLATE_S3_KEY!
  });

  let s3Response = await client.send(getObjectCommand);
  return s3Response.Body!.transformToString("UTF-8");
}

async function generateApiGatewayResponse(title: string, content: string): Promise<APIGatewayProxyResult> {
  let html = (await getHtmlTemplate())
    .replace("{{TITLE}}", title)
    .replace("{{CONTENT}}", content);

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: html
  }
}

async function createSuccessPage(instanceData: DescribeInstancesCommandOutput): Promise<APIGatewayProxyResult> {
  const publicIp = instanceData.Reservations![0].Instances![0].PublicIpAddress;
  const outputText = `
    <p>The game server is being started.</p>
    <p>It may take a few minutes for the server to boot. Connection instructions:</p>
    <ol>
      <li>Open the "Server Manager" from the Satisfactory title screen.</li>
      <li>If you have connected to the server before, click on it in the list, and click "Remove Server"</li>
      <li>Click "Add Server"</li>
      <li>
        In the box that appears, paste in the following IP address:
        <ul><li><code>${publicIp}</code> <button onclick="navigator.clipboard.writeText('${publicIp}')">Copy</button></li></ul>
      </li>
      <li>Click "OK"</li>
      <li>Click "Authenticate" and enter the admin OR player password.</li>
      <li>Click "Join Game" in the Status tab.</li>
    </ol>
    <p>
      Note that this IP address is temporary and will change if the server is restarted. If you have connected previously, you will
      need to remove the old server from the server manager, and re-add it with the new IP address. Your progress will not be lost.
    </p>
    <h2>Technical Details: <button onclick="document.getElementById('details').style.display = 'block'">Show</button></h2>
    <pre id="details" style="display: none">
    ${JSON.stringify(instanceData, null, 2)}
    </pre>`;

  return generateApiGatewayResponse("Game Server Starting...", outputText);
}

async function createErrorPage(err: any): Promise<APIGatewayProxyResult> {
  let error_text = `
    <p>The game server failed to start. Error data:</p>
    <pre>
    ${JSON.stringify(err, null, 2)}
    </pre>`;

  return generateApiGatewayResponse("Error Starting Game Server", error_text);
}

export const handler: APIGatewayProxyHandler = async (
  _event: APIGatewayProxyEvent,
  _context: Context,
  _callback: Callback<APIGatewayProxyResult>
): Promise<APIGatewayProxyResult> => {

  const ec2Client = new EC2Client({ region: process.env.AWS_REGION });
  const startCommand = new StartInstancesCommand({InstanceIds: instanceIds});
  const describeInstancesCommand = new DescribeInstancesCommand({ InstanceIds: instanceIds });

  console.log("Attempting to start game server", instanceIds);

  try {
    let start_result = await ec2Client.send(startCommand);
    console.log("Start result", start_result);

    // Wait a short time for the server to start up.
    await new Promise(resolve => setTimeout(resolve, 5000));

    let describe_result = await ec2Client.send(describeInstancesCommand);
    console.log("Describe result", describe_result);

    return createSuccessPage(describe_result);
  }
  catch (ex: any) {
    return createErrorPage(ex);
  }
}
