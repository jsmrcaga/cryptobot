provider "aws" {
    region = "eu-west-3" // paris
    shared_credentials_file = "./aws.cred"
}

resource "aws_iam_role" "crypto_bot_role" {
    name = "crypto_bot_lambda_role"

    // "JSON strings must not have leading spaces"
    assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

# EnableCloudwatch logs
resource "aws_iam_role_policy" "lambda_role_logs_policy" {
  role   = aws_iam_role.crypto_bot_role.id
  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": [
        "arn:aws:logs:*:*:*"
      ]
    }
  ]
}
POLICY
}

// To set in environment use TF_VAR_xxxxxx
variable "telegram_bot_token" {
    type = string
}

variable "telegram_jo_chat_id" {
    type = string
    default = "@jsmrcaga"
}

/*********
    LAMBDA DEFINITION
*********/

// Lambda to trigger all requests
resource "aws_lambda_function" "crypto_bot_lambda" {
    filename = "deploy.zip"
    handler = "lambda.handle_lambda"

    role = aws_iam_role.crypto_bot_role.arn

    function_name = "crypto_bot"
    runtime = "nodejs14.x"

    environment {
        variables = {
            TELEGRAM_BOT_TOKEN = var.telegram_bot_token
            TELEGRAM_JO_CHAT_ID = var.telegram_jo_chat_id
        }
    }
}

/*********
    LAMBDA TRIGGERS
*********/

// APIGateway to get an API
resource "aws_apigatewayv2_api" "crypto_bot_api" {
    name = "crypto_bot_api"
    protocol_type = "HTTP"
    target = aws_lambda_function.crypto_bot_lambda.arn
}

resource "aws_apigatewayv2_integration" "crypto_api_lambda_integration" {
    integration_type = "AWS_PROXY"

    api_id = aws_apigatewayv2_api.crypto_bot_api.id
    integration_method = "POST"
    integration_uri = aws_lambda_function.crypto_bot_lambda.invoke_arn

    description = "Manual Lambda integration"
    payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "crypto_bot_lambda_route_default" {
    route_key = "ANY /"
    api_id = aws_apigatewayv2_api.crypto_bot_api.id
    target = "integrations/${aws_apigatewayv2_integration.crypto_api_lambda_integration.id}"
}


// Cloudwatch events
resource "aws_cloudwatch_event_rule" "scheduled_lambda" {
    name        = "schedule_lambda"
    description = "Schedule lambda price checker, once per hour"
    schedule_expression = "cron(0 9-17/2 * * ? *)"
}

resource "aws_cloudwatch_event_target" "crypto_bot_schedule_target" {
    rule      = aws_cloudwatch_event_rule.scheduled_lambda.name
    arn       = aws_lambda_function.crypto_bot_lambda.arn
}


/*********
    LAMBDA PERMISSIONS
*********/
resource "aws_lambda_permission" "api_permission" {
    action = "lambda:InvokeFunction"
    function_name = "crypto_bot"
    principal = "apigateway.amazonaws.com"
    source_arn = "${aws_apigatewayv2_api.crypto_bot_api.execution_arn}/*/*/"
}

resource "aws_lambda_permission" "event_bridge_permission" {
    action = "lambda:InvokeFunction"
    function_name = "crypto_bot"
    principal = "events.amazonaws.com"
    source_arn = aws_cloudwatch_event_rule.scheduled_lambda.arn
}
