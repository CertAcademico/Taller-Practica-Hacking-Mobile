FROM python:3.12-slim-bookworm

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl wget unzip jq groff less \
    nmap dnsutils ncat \
    && rm -rf /var/lib/apt/lists/*

# ─── AWS CLI v2 ───────────────────────────────────────────────────────────────
RUN curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip \
    && unzip -q /tmp/awscliv2.zip -d /tmp \
    && /tmp/aws/install \
    && rm -rf /tmp/awscliv2.zip /tmp/aws

# ─── Pacu (AWS exploitation framework) ────────────────────────────────────────
RUN pip3 install --no-cache-dir pacu

# ─── CloudFox (cloud attack surface enum) ─────────────────────────────────────
RUN curl -sL https://github.com/BishopFox/cloudfox/releases/latest/download/cloudfox-linux-amd64.zip \
        -o /tmp/cloudfox.zip \
    && unzip -q /tmp/cloudfox.zip -d /opt/cloudfox \
    && chmod +x /opt/cloudfox/cloudfox \
    && ln -s /opt/cloudfox/cloudfox /usr/local/bin/cloudfox \
    && rm /tmp/cloudfox.zip

# ─── Checkov (IaC scanner) ────────────────────────────────────────────────────
RUN pip3 install --no-cache-dir checkov

# ─── truffleHog (secrets in code/cloud) ──────────────────────────────────────
RUN pip3 install --no-cache-dir truffleHog3

# ─── ScoutSuite (multi-cloud auditor) ────────────────────────────────────────
RUN pip3 install --no-cache-dir scoutsuite

# ─── Boto3 + utilidades AWS ───────────────────────────────────────────────────
RUN pip3 install --no-cache-dir \
    boto3 \
    botocore \
    awscli-local \
    s3scanner

# ─── kubectl ──────────────────────────────────────────────────────────────────
RUN curl -sLO "https://dl.k8s.io/release/$(curl -sL https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" \
    && chmod +x kubectl \
    && mv kubectl /usr/local/bin/

# ─── Aliases para LocalStack ──────────────────────────────────────────────────
RUN echo 'alias aws="aws --endpoint-url http://localstack:4566"' >> /root/.bashrc \
    && echo 'alias awsl="aws --endpoint-url http://localstack:4566"' >> /root/.bashrc \
    && echo 'export AWS_DEFAULT_REGION=us-east-1' >> /root/.bashrc \
    && echo 'export AWS_ACCESS_KEY_ID=test' >> /root/.bashrc \
    && echo 'export AWS_SECRET_ACCESS_KEY=test' >> /root/.bashrc \
    && echo 'export PS1="[cloud-tools] \w # "' >> /root/.bashrc

WORKDIR /workspace
CMD ["/bin/bash"]
