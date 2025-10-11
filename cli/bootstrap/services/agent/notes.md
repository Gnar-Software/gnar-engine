# Gnar MCP Notes

### Aims

- We don't want to provide all command implementations (with payload information) until we know what commands are required.

Step 1: Gather Facts

- All first prompts (no chatId provided) are 'gather facts'.
- This prompt will be augmented with the all service/model schemas and a list of all available commands e.g. userService.create, userService.update.
- From the client input the model should generate an action plan with an ordered list of the commands required, and also request the exact data required from the user to carry out the plan (based on the schemas provided in the augmented prompt).

Step 2: Confirm plan

- All further prompts (chatId provided) that do not have a 'confirmed plan' are 'confirm plan'.
- This prompt will be augmented with the all service/model schemas, a list of all available commands, a manifest containing the command implementations (including payload information) for each command in the most recently proposed action plan, the most recently proposed action plan itself, and a list of all previous user inputs and response texts.
- The model should determine from the resources provided if the action plan is accurate and if we have enough information, request conmfirmation from the user to action the request. If not we should request further information from the user until all information is provided. Should reassess the proposed plan based on user input and the command implementations provided in the prompt augmentation. If the plan is suitable, we have all the required information, and the user has confirmed that we can action the request, the model should include - actionPlanGoAhead = true in the response, and also the first command execution payload in the actionPlan.


// should we postback before actioning?
Step 3: Action plan loop
- Before returning back to the client - if the agent response has 'actionPlanGoAhead' = true, we should initalise the action plan execution loop
- Action Plan Execution Loop (foreach action plan command):
    - The command will be triggered with the included payload.
    - The result of the first command will be passed back to the agent with the system prompt, action plan, all messages, schemas, relevant command implementations.
    - This prompt should confirm the payload for the next command in the action Plan.
    
- Upon the last command being executed, the model will be prompted to provide a text output to confirm the result of the action plan.
