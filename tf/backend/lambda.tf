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


// Cloudwatch events
resource "aws_cloudwatch_event_rule" "scheduled_lambda" {
    name        = "schedule_lambda"
    description = "Schedule lambda price checker, once per hour"
    schedule_expression = "rate(1 hour)"
}

resource "aws_cloudwatch_event_target" "sns" {
    rule      = aws_cloudwatch_event_rule.scheduled_lambda.name
    arn       = aws_lambda_function.crypto_bot_lambda.arn
}
