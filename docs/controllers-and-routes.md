# Controllers & Routes

Within each service you should define routes and controller logic in your HTTP controller for API endpoints, and the message controller for internal service to service communication.

## HTTP Controllers

HTTP controllers handle incoming HTTP requests and route them to the appropriate service methods. They are responsible for processing the request, invoking the necessary business logic, and returning the response to the client.

Each route declared has a pre-handler and main handler. The pre-handler is used for any authorisation or any required schema validation. The main handler is where the business logic is executed and should return the appropriate response.


## Message Controllers

