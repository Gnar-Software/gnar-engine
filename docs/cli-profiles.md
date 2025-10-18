# CLI Profiles

CLI profiles allow you to manage multiple projects and their respective environments seamlessly. Each profile relates to a specific project and environment (e.g. my-project-name:localdev which is the default profile created when you create a new project). You can use the localdev profiles to develop and test your applications locally before deployment. When you're ready to deploy, you can create additional profiles for different environments such as staging or production (e.g. my-project-name:staging, my-project-name:production). These remote profiles use http to connect to your deployed services and enable you to manage your applications remotely.

## Switching profiles

To switch between different CLI profiles, use the following command and then select the desired profile from the list:
```bash
gnar profile set-active
```

## Creating a new profile

To create a new CLI profile for a different environment, use the following command and follow the prompts to set up the new profile. It is advised to use the naming convention of `project-name:environment` for clarity.
```bash
gnar profile create
```

## Listing profiles

To view all available CLI profiles, use the following command:
```bash
gnar profile get-all
```

## Updating a profile

To update an existing CLI profile, use the following command and follow the prompts to modify the profile settings:
```bash
gnar profile update <profile-name>
```

## Further information

The CLI profiles are stored in a configuration file located at `~/.gnarengine/config.json`. You can manually edit this file if needed, but it's recommended to use the CLI commands for managing profiles to ensure consistency and avoid errors.
