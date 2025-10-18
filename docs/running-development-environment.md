# Running your development environment

## Start your development environment

To run your application locally, ensure you have the correct CLI profile active (your-project-name:localdev), and then run

```bash
gnar dev up
```

Your application will now be available at `http://localhost`. Although your services will also be available on their respective ports, Nginx will proxy requests to the appropriate service based on the URL path and is available on port 80.

Options:
- `--build` option to ensure that your services are rebuilt before starting.
- `--detach` option to run the services in the background.


## Stop your development environment

Stop your development environment with:

```bash
gnar dev down
```
