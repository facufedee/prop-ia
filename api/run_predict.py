import sys
import json
from predict import handler

if __name__ == "__main__":
    try:
        # Read the JSON string from the command-line argument
        input_json_string = sys.argv[1]
        
        # The event body is the JSON string itself
        event = {
            'body': input_json_string
        }
        
        # Call the handler
        result = handler(event, {})
        
        # Print the final result to stdout
        print(json.dumps(result))
        
    except Exception as e:
        import traceback
        # Print a structured error for Node.js to parse
        error_output = {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e),
                "traceback": traceback.format_exc()
            })
        }
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)