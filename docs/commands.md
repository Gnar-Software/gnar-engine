# Commands

The command pattern is a pivotal part of the Gnar Engine architecture, facilitating communication between services and enabling a decoupled, scalable system. It also gives a level of abstraction that allows for AI activation across your services. 

## Command Structure

Commands are simple objects that encapsulate all the information needed to perform an action or trigger an event within the system. Each command typically includes a name, payload, and handler.
