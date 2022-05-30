import json
import boto3
from boto3.dynamodb.conditions import Key, Attr


#################################get
def lambda_get(event, context):
    db_resource = boto3.resource('dynamodb')
    table = db_resource.Table('imageresult')
    
    if event['queryStringParameters'] is not None:
        search_tag = event['queryStringParameters'].values()
    user = event['requestContext']['identity']['user']
    print(user)
    
    user = 'AWS:' + user
    
    etags = [] 
    
    response = table.scan(
        FilterExpression = Attr('user').eq(user)
    )
    
    if response['Items'] is not None:
        for item in response['Items']:
            tags = item['tags']
            if all(word in tags for word in search_tag):
                etags.append(item['etag'] )
        print(etags)
    return{
        'statusCode':200,
        "headers": {
			"Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
			"Access-Control-Allow-Credentials":"*",
			"Access-Control-Allow-Methods": "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT",
			"Access-Control-Allow-Origin": "*",
			"X-Requested-With":"*"
		},
		'body':json.dumps(etags)
        }
    
    ##########################put
def handle_put(event, context):
    db_resource = boto3.resource('dynamodb')
    table = db_resource.Table('imageresult')
    if event['queryStringParameters'] is not None:
        etag = event['queryStringParameters']['etag']
        tag = event['queryStringParameters']['tag']
        try:
            response = table.update_item(
                Key={'etag': etag
                     },
                UpdateExpression='SET tags = list_append(tags,:t)',
                ExpressionAttributeValues={
                    ':t': [tag]
                },
                ReturnValues='UPDATED_NEW'
            )
            print(response)
            return {
                'statusCode': 200,
                'headers': {
                    "Access-Control-Allow-Headers": "Content-Type, X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methond": "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT",
                    "Access_Control-Allow-Credentials": "true",
                    "X-Requested_With": "*"
                },
                'body': ''
            }
        except Exception as e:
            print(e)
    return {
        'statusCode': 500,
        'headers': {
            "Access-Control-Allow-Headers": "Content-Type, X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methond": "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT",
            "Access_Control-Allow-Credentials": "true",
            "X-Requested_With": "*"
        },
        'body': ''
    }





def lambda_delete(event, context):
    db_resource = boto3.resource('dynamodb')
    table = db_resource.Table('imageresult')
    
    if event['queryStringParameters'] is not None:
        etag = event['queryStringParameters']['etag']

        try:
            response = table.delete_item(
                Key = {
                    'etag':etag})
            return {
                'statusCode':200,
                "headers": {
        	        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
        	        "Access-Control-Allow-Credentials":"*",
        	        "Access-Control-Allow-Methods": "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT",
        	        "Access-Control-Allow-Origin": "*",
        	        "X-Requested-With":"*"
              },
              'body': ''}
        except Exception as e:
            print(e)
            return{
                'statusCode':500,
                "headers": {
        			"Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
        			"Access-Control-Allow-Credentials":"*",
        			"Access-Control-Allow-Methods": "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT",
        			"Access-Control-Allow-Origin": "*",
        			"X-Requested-With":"*"
        		},
        		'body':''
                }


def lambda_handler(event, context):
    
    if event['httpMethod'] == 'GET':
        return lambda_get(event,context)
    elif event['httpMethod'] == 'PUT':
        return handle_put(event,context)
    elif event['httpMethod'] == 'DELETE':
        return lambda_delete(event,context)
    else:
        return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
        }
