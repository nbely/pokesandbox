import IBotEvent from "@structures/interfaces/botEvent";

const ErrorManager: IBotEvent = {
  name: "errorManager",
  customEvent: true,
  execute: async() => {
    process.on('unhandledRejection', error => {
      console.log(error)
  });
    process.on('uncaughtException', error => {
      console.log(error)
  });
  }
}

export default ErrorManager;
