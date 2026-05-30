FROM python:3.12-slim-bookworm

ENV DEBIAN_FRONTEND=noninteractive

# ─── Sistema base ─────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl wget nmap dnsutils whois ncat \
    jq unzip ca-certificates golang-go \
    && rm -rf /var/lib/apt/lists/*

# ─── theHarvester ─────────────────────────────────────────────────────────────
RUN pip3 install --no-cache-dir theHarvester

# ─── subfinder ────────────────────────────────────────────────────────────────
RUN go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest

# ─── httpx ────────────────────────────────────────────────────────────────────
RUN go install github.com/projectdiscovery/httpx/cmd/httpx@latest

# ─── nuclei ───────────────────────────────────────────────────────────────────
RUN go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

# ─── amass ────────────────────────────────────────────────────────────────────
RUN go install github.com/owasp-amass/amass/v4/...@latest

# ─── shodan CLI ───────────────────────────────────────────────────────────────
RUN pip3 install --no-cache-dir shodan

# ─── recon-ng ─────────────────────────────────────────────────────────────────
RUN pip3 install --no-cache-dir recon-ng || true

# ─── utilidades extra ─────────────────────────────────────────────────────────
RUN pip3 install --no-cache-dir \
    requests \
    dnspython \
    python-whois \
    beautifulsoup4 \
    lxml

ENV PATH=$PATH:/root/go/bin

RUN echo 'alias theharvester="theHarvester"' >> /root/.bashrc \
    && echo 'export PS1="[osint-tools] \w # "' >> /root/.bashrc

WORKDIR /workspace
CMD ["/bin/bash"]
