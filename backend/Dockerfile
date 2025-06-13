FROM public.ecr.aws/lambda/python:3.9

# Copy requirements and install packages
COPY requirements-lambda.txt ${LAMBDA_TASK_ROOT}
RUN pip install -r requirements-lambda.txt

# Copy application code
COPY main_lambda.py ${LAMBDA_TASK_ROOT}
COPY lambda_handler.py ${LAMBDA_TASK_ROOT}
COPY core/ ${LAMBDA_TASK_ROOT}/core/
COPY api/ ${LAMBDA_TASK_ROOT}/api/
COPY utils/ ${LAMBDA_TASK_ROOT}/utils/

# Set the CMD to your handler
CMD ["lambda_handler.lambda_handler"] 