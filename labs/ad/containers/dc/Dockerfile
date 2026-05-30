FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV SAMBA_DOMAIN=LABTHINKTANK
ENV SAMBA_REALM=LABTHINKTANK.LOCAL
ENV SAMBA_ADMIN_PASSWORD=Lab@Think2026!
ENV DNS_FORWARDER=8.8.8.8

RUN apt-get update && apt-get install -y --no-install-recommends \
    samba samba-common-bin winbind \
    krb5-user libpam-krb5 \
    dnsutils net-tools \
    python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Provisionar el dominio AD
RUN rm -f /etc/samba/smb.conf && \
    samba-tool domain provision \
        --use-rfc2307 \
        --domain="$SAMBA_DOMAIN" \
        --realm="$SAMBA_REALM" \
        --adminpass="$SAMBA_ADMIN_PASSWORD" \
        --dns-backend=SAMBA_INTERNAL \
        --server-role=dc \
        --option="dns forwarder = $DNS_FORWARDER"

# Crear usuarios vulnerables para los labs
COPY setup-users.sh /setup-users.sh
RUN chmod +x /setup-users.sh

EXPOSE 389 636 445 88 53 135 139

CMD ["/setup-users.sh"]
