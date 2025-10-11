/**
 * Command bus
 */
export const commandBus = {
    handlers: new Map(),
  
    register(commandName, handlerFunction) {
      this.handlers.set(commandName, handlerFunction);
    },
  
    async execute(commandName, ...args) {
      const handlerFunction = this.handlers.get(commandName);
      if (!handlerFunction) {
        console.log('handlers', this.handlers);
        throw new Error(`Command ${commandName} not registered`);
      }
  
      return await handlerFunction(...args);
    }
}