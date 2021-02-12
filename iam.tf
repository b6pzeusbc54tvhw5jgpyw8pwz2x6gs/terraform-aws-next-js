######################
# IAM Role (λ Next.js)
######################

data "aws_iam_policy_document" "assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name        = "${var.name_prefix}-lambda-excution-role-${var.name_suffix}"
  description = "Managed by Terraform Next.js"

  permissions_boundary = var.lambda_role_permissions_boundary

  assume_role_policy = data.aws_iam_policy_document.assume_role.json

  tags        = var.tags
}

data "aws_iam_policy_document" "lambda_logging" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = [
      "arn:aws:logs:*:*:*"
    ]
  }
}

resource "aws_iam_policy" "lambda_logging" {
  description = "${var.name_prefix} Managed by Terraform Next.js"

  policy = data.aws_iam_policy_document.lambda_logging.json
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.lambda_logging.arn
}

####################################
# Additional policy JSON (λ Next.js)
####################################

resource "aws_iam_policy" "additional_json" {
  count = var.lambda_policy_json != null ? 1 : 0

  description = "${var.name_prefix} Managed by Terraform Next.js"
  policy      = var.lambda_policy_json
}

resource "aws_iam_role_policy_attachment" "additional_json" {
  for_each = var.lambda_policy_json != null ? local.lambdas : {}

  role       = aws_iam_role.lambda[each.key].name
  policy_arn = aws_iam_policy.additional_json[0].arn
}

####################
# IAM User for CI/CD
####################

resource "aws_iam_user_policy" "cicd" {
  name = "${var.name_prefix}-tfnext-cicd-${var.name_suffix}"
  user = aws_iam_user.cicd.name

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "iam:PassRole"
      ],
      "Effect": "Allow",
      "Resource": [
        "${aws_iam_role.lambda.arn}"
      ]
    },
    {
      "Action": [
        "s3:PutObject"
      ],
      "Effect": "Allow",
      "Resource": [
        "arn:aws:s3:::${module.statics_deploy.static_upload_bucket_id}/*",
        "arn:aws:s3:::${module.proxy_config.config_s3_bucket}/*"
      ]
    },
    {
      "Action": [
        "lambda:CreateFunction",
        "lambda:GetFunction",
        "lambda:DeleteFunction",
        "lambda:UpdateFunctionCode",
        "lambda:AddPermission"
      ],
      "Effect": "Allow",
      "Resource": [
        "arn:aws:lambda:${local.region_name}:${local.account_id}:function:${var.name_prefix}-*"
      ]
    },
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:PutRetentionPolicy"
      ],
      "Effect": "Allow",
      "Resource": [
        "arn:aws:logs:${local.region_name}:${local.account_id}:log-group:/aws/lambda/${var.name_prefix}-*:log-stream:*"
      ]
    },
    {
      "Action": [
        "apigateway:GET",
        "apigateway:POST",
        "apigateway:DELETE"
      ],
      "Effect": "Allow",
      "Resource": [
        "arn:aws:apigateway:${local.region_name}::/apis/${module.api_gateway.this_apigatewayv2_api_id}/*",
        "arn:aws:apigateway:${local.region_name}::/apis/${module.api_gateway.this_apigatewayv2_api_id}/routes",
        "arn:aws:apigateway:${local.region_name}::/apis/${module.api_gateway.this_apigatewayv2_api_id}/integrations/*"
      ]
    }
  ]
}
EOF
}

resource "aws_iam_user" "cicd" {
  name = "${var.name_prefix}-cicd-${var.name_suffix}"
  path = "/"
}

resource "aws_iam_access_key" "cicd" {
  user = aws_iam_user.cicd.name
  pgp_key = file("./pubkey.gpg")
  lifecycle {
    ignore_changes = [pgp_key]
  }
}
