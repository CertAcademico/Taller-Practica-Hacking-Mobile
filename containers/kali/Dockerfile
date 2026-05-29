FROM debian:bookworm

RUN apt update && apt install -y \
    nmap \
    git \
    curl \
    wget \
    dnsutils \
    net-tools \
    unzip \
    python3 \
    python3-pip

RUN wget https://go.dev/dl/go1.24.3.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go1.24.3.linux-amd64.tar.gz && \
    rm go1.24.3.linux-amd64.tar.gz

ENV PATH=$PATH:/usr/local/go/bin

RUN go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest

RUN go install github.com/projectdiscovery/httpx/cmd/httpx@latest

RUN go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

ENV PATH=$PATH:/root/go/bin

WORKDIR /workspace

CMD ["/bin/bash"]
