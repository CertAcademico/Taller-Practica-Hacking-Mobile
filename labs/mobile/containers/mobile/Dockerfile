FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV JADX_VERSION=1.5.0
ENV APKTOOL_VERSION=2.9.3

# ─── Sistema base ─────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    android-tools-adb \
    default-jdk-headless \
    python3 \
    python3-pip \
    python3-venv \
    wget \
    curl \
    unzip \
    git \
    libpcap-dev \
    && rm -rf /var/lib/apt/lists/*

# ─── jadx (decompilador Java/Android) ────────────────────────────────────────
RUN wget -q "https://github.com/skylot/jadx/releases/download/v${JADX_VERSION}/jadx-${JADX_VERSION}.zip" \
        -O /tmp/jadx.zip \
    && unzip -q /tmp/jadx.zip -d /opt/jadx \
    && ln -s /opt/jadx/bin/jadx /usr/local/bin/jadx \
    && ln -s /opt/jadx/bin/jadx-gui /usr/local/bin/jadx-gui \
    && rm /tmp/jadx.zip

# ─── apktool (descompilación smali / reempaquetado) ───────────────────────────
RUN wget -q "https://github.com/iBotPeaches/Apktool/releases/download/v${APKTOOL_VERSION}/apktool_${APKTOOL_VERSION}.jar" \
        -O /usr/local/bin/apktool.jar \
    && printf '#!/bin/sh\nexec java -jar /usr/local/bin/apktool.jar "$@"\n' \
        > /usr/local/bin/apktool \
    && chmod +x /usr/local/bin/apktool

# ─── frida-tools + objection ──────────────────────────────────────────────────
RUN pip3 install --break-system-packages \
    frida-tools \
    objection \
    mitmproxy

# ─── alias útiles ─────────────────────────────────────────────────────────────
RUN echo 'alias adb-emu="adb -s emulator-5554"' >> /root/.bashrc \
    && echo 'alias adb-tcp="adb -s mobile-android:5555"' >> /root/.bashrc \
    && echo 'export PS1="[mobile-tools] \w # "' >> /root/.bashrc

WORKDIR /workspace
CMD ["/bin/bash"]
