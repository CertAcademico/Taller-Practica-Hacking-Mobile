FROM python:3.12-slim-bookworm

ENV DEBIAN_FRONTEND=noninteractive

# ─── Sistema base ─────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl wget nmap dnsutils smbclient ldap-utils \
    krb5-user libkrb5-dev \
    ncat jq unzip \
    golang-go \
    && rm -rf /var/lib/apt/lists/*

# ─── Impacket (suite completa de herramientas AD) ─────────────────────────────
RUN pip3 install --no-cache-dir impacket

# ─── NetExec (sucesor de CrackMapExec) ───────────────────────────────────────
RUN pip3 install --no-cache-dir netexec

# ─── BloodHound Python ingestor ───────────────────────────────────────────────
RUN pip3 install --no-cache-dir bloodhound

# ─── Evil-WinRM ───────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends ruby ruby-dev \
    && gem install evil-winrm --no-document \
    && rm -rf /var/lib/apt/lists/*

# ─── Kerbrute ─────────────────────────────────────────────────────────────────
RUN go install github.com/ropnop/kerbrute@latest

# ─── enum4linux-ng ────────────────────────────────────────────────────────────
RUN pip3 install --no-cache-dir enum4linux-ng

# ─── ldapdomaindump ───────────────────────────────────────────────────────────
RUN pip3 install --no-cache-dir ldapdomaindump

# ─── Responder ────────────────────────────────────────────────────────────────
RUN git clone --depth 1 https://github.com/lgandx/Responder /opt/Responder \
    && pip3 install --no-cache-dir -r /opt/Responder/requirements.txt \
    && ln -s /opt/Responder/Responder.py /usr/local/bin/responder

ENV PATH=$PATH:/root/go/bin
WORKDIR /workspace
CMD ["/bin/bash"]
