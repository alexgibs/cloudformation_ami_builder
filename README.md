# cloudformation_ami_builder

Example Cloudformation template to build a new AMI from a bootstrapped instance and remove stack afterwards. User-data and/or CFN init can be modified to customise and deploy applications to the instance before creating a AMI.

'amicreator.zip' needs to first be uploaded to an S3 bucket.
