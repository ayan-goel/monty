import os
from mangum import Mangum
from main_lambda import app

# Create the Lambda handler
handler = Mangum(app, lifespan="off")

def lambda_handler(event, context):
    """
    AWS Lambda handler function
    """
    return handler(event, context) 