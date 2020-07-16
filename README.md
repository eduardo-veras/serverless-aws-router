# serverless-aws-router
This project aim to be a lightweight router system for [Serverless framework](https://serverless.com) for AWS Lambda, the code design was inspirated on [Hapi](https://hapi.dev).


## Serverless code pattern
The Serverless Architecture choosed for this router, is the [Monolithic Pattern](https://www.serverless.com/blog/serverless-architecture-code-patterns).
In the Monolithic Pattern your entire application is crammed into a single Lambda function. In our example app, our entire app is in a single Lambda function, all HTTP endpoints point to that Lambda function.
```yaml
service: serverless-social-network
provider: aws
functions:
  socialNetwork:
    handler: handler.socialNetwork
      events:
        - http: post users
        - http: put users
        - http: get users
        - http: delete users
        - http: post comments
        - http: put comments
        - http: get comments
        - http: delete comments
```
**Benefits of the Monolithic Pattern:**

-   A single Lambda function is much easier to comprehend and manage. It’s more of a traditional set-up.
-   Fast deployments, depending on the total code size.
-   Theoretically faster performance. Your single Lambda function will be called frequently and it is less likely that your users will run into cold-starts.

**Drawbacks of the Monolithic Pattern:**

-   Requires building a more complex router within your Lambda function and ensuring it always directs calls the appropriate logic.
-   It’s harder to understand performance. The Lambda function will run for a variety of durations.
-   You can easily hit the Lambda size limit in real world practical applications due to the larger function size.

## Examples
You can find some usage examples on the `samples` folder on this rep.