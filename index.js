var aws = require("aws-sdk");
 
exports.handler = function(event, context) {

    console.log("REQUEST RECEIVED:\n" + JSON.stringify(event));
    
    // For Delete requests, immediately send a SUCCESS response.
    if (event.RequestType == "Delete") {
        sendResponse(event, context, "SUCCESS");
        return;
    }
 
    var responseStatus = "FAILED";
    var responseData = {};
 

    var params = {
      InstanceId: event.ResourceProperties.InstanceId, /* required */
      Name: event.ResourceProperties.AMIName, /* required */
      NoReboot: false 
    };
    var ec2 = new aws.EC2({region: event.ResourceProperties.Region});
    ec2.createImage(params, function(err, data) {
        if (err) {
            responseData = {Error: "DescribeImages call failed"};
            console.log(responseData.Error + ":\n", err);
        }
      else {   
            console.log(data);
            responseStatus = "SUCCESS";
        }
        sendResponse(event, context, responseStatus, responseData);
    });
};

// Send response to the pre-signed S3 URL 
function sendResponse(event, context, responseStatus, responseData) {
 
    var responseBody = JSON.stringify({
        Status: responseStatus,
        Reason: "See the details in CloudWatch Log Stream: " + context.logStreamName,
        PhysicalResourceId: context.logStreamName,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        Data: responseData
    });
 
    console.log("RESPONSE BODY:\n", responseBody);
 
    var https = require("https");
    var url = require("url");
 
    var parsedUrl = url.parse(event.ResponseURL);
    var options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: "PUT",
        headers: {
            "content-type": "",
            "content-length": responseBody.length
        }
    };
 
    console.log("SENDING RESPONSE...\n" );
 
    var request = https.request(options, function(response) {
        console.log("STATUS: " + response.statusCode);
        console.log("HEADERS: " + JSON.stringify(response.headers));
        // Tell AWS Lambda that the function execution is done  
        killStack(event, context);
    });
 
    request.on("error", function(error) {
        console.log("sendResponse Error:" + error);
        // Tell AWS Lambda that the function execution is done  
        context.done();
    });
  
    // write data to request body
    request.write(responseBody);
    request.end();
}

function killStack(event, context) {
    var cloudformation = new aws.CloudFormation({region: event.ResourceProperties.Region});
    var params = {
        StackName: event.StackId
    };
    cloudformation.deleteStack(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        }
      else {
        console.log(data);
        context.done();
        }
    });
}