import os
import sys
import json
import uuid
import time
import subprocess
import boto3
from botocore.exceptions import ClientError

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

BUCKET = os.environ.get('BUCKET_TASK_FILES')
TABLE_TASKS = os.environ.get('TABLE_TASKS')
TABLE_WORKFLOW_TASK_LOGS = os.environ.get('TABLE_WORKFLOW_TASK_LOGS')

def handler(event, context):
    print(f"Received event: {json.dumps(event)}")
    
    task_id = event.get('taskId')
    run_id = event.get('runId', 'standalone')
    s3_key = event.get('s3Key')
    req_key = event.get('reqKey')
    env_req_content = event.get('envReqContent') # Base64
    
    if not s3_key:
        return {"success": False, "error": "Missing s3Key"}

    task_dir = f"/tmp/{uuid.uuid4()}"
    os.makedirs(task_dir, exist_ok=True)
    script_path = os.path.join(task_dir, "script.py")
    libs_dir = os.path.join(task_dir, "libs")
    os.makedirs(libs_dir, exist_ok=True)
    
    pipeline_logs = f"=== PIPELINE EXECUTION START (Python Runner) ===\n"
    
    try:
        # 1. Download Script
        pipeline_logs += f"-> Downloading script from S3: {s3_key}\n"
        s3.download_file(BUCKET, s3_key, script_path)
        
        # 2. Dependency Management
        if req_key:
            pipeline_logs += f"-> Installing task dependencies: {req_key}\n"
            req_path = os.path.join(task_dir, "requirements.txt")
            s3.download_file(BUCKET, req_key, req_path)
            install_res = subprocess.run(
                [sys.executable, "-m", "pip", "install", "-r", req_path, "-t", libs_dir],
                capture_output=True, text=True
            )
            pipeline_logs += install_res.stdout + install_res.stderr + "\n"

        if env_req_content:
            import base64
            pipeline_logs += "-> Installing environment dependencies...\n"
            env_req_path = os.path.join(task_dir, "env_requirements.txt")
            with open(env_req_path, "wb") as f:
                f.write(base64.b64decode(env_req_content))
            install_res = subprocess.run(
                [sys.executable, "-m", "pip", "install", "-r", env_req_path, "-t", libs_dir],
                capture_output=True, text=True
            )
            pipeline_logs += install_res.stdout + install_res.stderr + "\n"

        # 3. Prepare Environment
        env = os.environ.copy()
        env["PYTHONPATH"] = f"{libs_dir}:{env.get('PYTHONPATH', '')}"
        env["WORKFLOW_RUN_ID"] = run_id
        env["TASK_ID"] = task_id
        
        # 4. Execute
        pipeline_logs += "\n-> Executing script...\n"
        start_time = time.time()
        result = subprocess.run(
            [sys.executable, script_path],
            capture_output=True, text=True, env=env
        )
        duration = time.time() - start_time
        
        stdout = result.stdout
        stderr = result.stderr
        exit_code = result.returncode
        
        pipeline_logs += f"\n=== STDOUT ===\n{stdout}\n"
        pipeline_logs += f"\n=== STDERR ===\n{stderr}\n"
        pipeline_logs += f"Exit Code: {exit_code}\n"
        pipeline_logs += f"Duration: {duration:.2f}s\n"
        pipeline_logs += f"\n=== PIPELINE EXECUTION END ===\n"
        
        # 5. Upload Logs to S3
        log_key = f"tasks/{task_id}/task.log"
        s3.put_object(Bucket=BUCKET, Key=log_key, Body=pipeline_logs.encode('utf-8'))
        
        # 6. Update Task Metadata in Run-Specific Table
        run_task_table = dynamodb.Table(TABLE_WORKFLOW_TASK_LOGS)
        run_task_table.update_item(
            Key={'run_id': run_id, 'task_id': task_id},
            UpdateExpression="SET log_file_s3_key = :k, updated_at = :u",
            ExpressionAttributeValues={
                ':k': log_key,
                ':u': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
            }
        )
        
        return {
            "success": exit_code == 0,
            "exitCode": exit_code,
            "duration": duration,
            "stdout": stdout,
            "stderr": stderr
        }

    except Exception as e:
        error_msg = f"Runner Error: {str(e)}"
        print(error_msg)
        return {"success": False, "error": error_msg}
