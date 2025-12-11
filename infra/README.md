# Infrastructure

This folder contains all the infrastructure code, scripts, and configuration for deploying the AutoBlog application.

## Folder Structure

- **`config/`**: Configuration files (e.g., `.env.example`).
- **`docker/`**: Docker related files (e.g., `docker-compose.yml` for local testing).
- **`scripts/`**: Automation scripts.
  - **`local/`**: Scripts to be run on your local machine.
    - `push.sh`: Builds and pushes Docker images to AWS ECR.
    - `remote-deploy.sh`: Orchestrates the full deployment (Push -> Sync -> Deploy on Server).
  - **`server/`**: Scripts to be run on the EC2 server.
    - `init-ec2.sh`: Initial server setup (installs Docker, Git, etc.).
    - `deploy.sh`: Pulls images and restarts containers.

## How to Deploy

1.  **Setup Environment:**
    Ensure `infra/.env` exists and is populated with your AWS and Database credentials.

2.  **Run Remote Deploy:**
    From the `infra/scripts/local` directory:
    ```bash
    ./remote-deploy.sh --path /path/to/your-key.pem
    ```

## Initial Server Setup

If setting up a fresh EC2 instance:
1.  SSH into the server.
2.  Copy `infra/scripts/server/init-ec2.sh` and `infra/.env` to the server.
3.  Run `./init-ec2.sh`.
