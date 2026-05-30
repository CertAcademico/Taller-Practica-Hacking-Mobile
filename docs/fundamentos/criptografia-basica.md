# Criptografía Básica

Fundamentos criptográficos aplicados a ciberseguridad: algoritmos, protocolos, hashing, cifrado simétrico/asimétrico y aplicaciones prácticas en pentesting.

---

## 1. Conceptos fundamentales

| Concepto | Definición |
|---------|-----------|
| **Confidencialidad** | Solo el destinatario autorizado puede leer el mensaje |
| **Integridad** | El mensaje no ha sido alterado en tránsito |
| **Autenticidad** | Verificar la identidad del emisor |
| **No repudio** | El emisor no puede negar haber enviado el mensaje |
| **Cifrado** | Transformar texto plano en texto cifrado |
| **Descifrado** | Revertir el cifrado al texto original |
| **Clave** | Dato secreto usado en el proceso de cifrado/descifrado |

---

## 2. Hashing

Una función hash convierte datos de tamaño arbitrario en una cadena de longitud fija. No es reversible.

### Propiedades

- **Determinista:** el mismo input siempre produce el mismo hash
- **Unidireccional:** no se puede obtener el input desde el hash
- **Efecto avalancha:** un cambio mínimo en el input cambia todo el hash
- **Resistente a colisiones:** difícil encontrar dos inputs con el mismo hash

### Algoritmos comunes

| Algoritmo | Longitud | Estado |
|-----------|---------|--------|
| MD5 | 128 bits | **Roto** — solo para checksums |
| SHA-1 | 160 bits | **Deprecado** |
| SHA-256 | 256 bits | Seguro |
| SHA-512 | 512 bits | Seguro |
| bcrypt | Variable | Recomendado para contraseñas |
| Argon2 | Variable | Estándar actual para contraseñas |

### Uso con OpenSSL

```bash
# Generar hash
echo -n "contraseña123" | md5sum
echo -n "contraseña123" | sha256sum
echo -n "contraseña123" | sha512sum

# Hash de un archivo
sha256sum /etc/passwd
md5sum archivo.zip

# Verificar integridad
sha256sum -c checksums.sha256
```

### Hashing en pentesting

```bash
# Identificar tipo de hash (hashid)
hashid '5f4dcc3b5aa765d61d8327deb882cf99'
# → MD5

# Crackear con hashcat
hashcat -m 0 hash.txt /usr/share/wordlists/rockyou.txt    # MD5
hashcat -m 1000 hash.txt rockyou.txt                       # NTLM
hashcat -m 3200 hash.txt rockyou.txt                       # bcrypt

# Crackear con John the Ripper
john --format=raw-md5 --wordlist=rockyou.txt hash.txt
john --show hash.txt
```

---

## 3. Cifrado simétrico

Usa la **misma clave** para cifrar y descifrar. Rápido, ideal para grandes volúmenes de datos.

### Algoritmos

| Algoritmo | Tipo | Uso |
|-----------|------|-----|
| AES-128/256 | Bloque | Estándar actual — TLS, disco, VPN |
| ChaCha20 | Stream | TLS 1.3, móviles (más rápido que AES sin hardware) |
| 3DES | Bloque | **Legacy** — no usar en sistemas nuevos |
| RC4 | Stream | **Roto** — no usar |

### OpenSSL — cifrado simétrico

```bash
# Cifrar archivo con AES-256
openssl enc -aes-256-cbc -pbkdf2 -in secreto.txt -out secreto.enc

# Descifrar
openssl enc -d -aes-256-cbc -pbkdf2 -in secreto.enc -out secreto.txt

# Cifrar con una clave específica (hex)
openssl enc -aes-256-cbc -K $(openssl rand -hex 32) -iv $(openssl rand -hex 16) \
    -in datos.txt -out datos.enc
```

### Problema del intercambio de claves

El cifrado simétrico requiere compartir la clave de forma segura. Esto se resuelve con criptografía asimétrica.

---

## 4. Cifrado asimétrico

Usa un **par de claves**: pública (compartir libremente) y privada (nunca compartir).

```
Lo que se cifra con la clave pública   → solo se descifra con la privada
Lo que se firma con la clave privada   → se verifica con la pública
```

### Algoritmos

| Algoritmo | Uso | Seguridad |
|-----------|-----|-----------|
| RSA-2048+ | Cifrado, firmas | Seguro (2048 bits mínimo) |
| RSA-1024 | Legacy | **Roto** |
| ECDSA | Firmas digitales | Más eficiente que RSA |
| Ed25519 | SSH, firmas | Recomendado actualmente |
| Diffie-Hellman | Intercambio de claves | Base de TLS |

### OpenSSL — par de claves RSA

```bash
# Generar par de claves RSA 4096
openssl genrsa -out privada.pem 4096
openssl rsa -in privada.pem -pubout -out publica.pem

# Ver contenido de la clave
openssl rsa -in privada.pem -text -noout

# Cifrar con clave pública
openssl rsautl -encrypt -pubin -inkey publica.pem -in mensaje.txt -out cifrado.bin

# Descifrar con clave privada
openssl rsautl -decrypt -inkey privada.pem -in cifrado.bin -out mensaje.txt

# Firmar un archivo
openssl dgst -sha256 -sign privada.pem -out firma.bin documento.txt

# Verificar firma
openssl dgst -sha256 -verify publica.pem -signature firma.bin documento.txt
```

### SSH — claves asimétricas

```bash
# Generar par Ed25519 (recomendado)
ssh-keygen -t ed25519 -C "usuario@equipo"

# Generar par RSA 4096
ssh-keygen -t rsa -b 4096

# Copiar clave pública al servidor
ssh-copy-id usuario@servidor

# Conectar usando clave privada específica
ssh -i ~/.ssh/id_ed25519 usuario@servidor

# Ver huella digital de una clave
ssh-keygen -lf ~/.ssh/id_ed25519.pub
```

---

## 5. Certificados y PKI

Un certificado X.509 vincula una clave pública con una identidad, firmado por una Autoridad Certificadora (CA).

```bash
# Ver certificado de un sitio web
openssl s_client -connect google.com:443 2>/dev/null | openssl x509 -text -noout

# Ver fechas de validez
openssl s_client -connect objetivo.com:443 2>/dev/null \
    | openssl x509 -noout -dates

# Extraer certificado
openssl s_client -connect objetivo.com:443 2>/dev/null \
    | sed -n '/BEGIN CERTIFICATE/,/END CERTIFICATE/p' > cert.pem

# Verificar cadena de certificados
openssl verify -CAfile ca-bundle.crt cert.pem

# Generar certificado autofirmado (labs)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem \
    -days 365 -nodes -subj "/CN=localhost"
```

---

## 6. Protocolos criptográficos

### TLS/SSL

```bash
# Ver versión TLS y cipher suite
openssl s_client -connect objetivo.com:443

# Forzar TLS 1.2
openssl s_client -connect objetivo.com:443 -tls1_2

# Verificar soporte de versiones débiles (SSLv3, TLS 1.0)
nmap --script=ssl-enum-ciphers objetivo.com -p 443

# Testssl.sh — análisis completo
docker run --rm -ti drwetter/testssl.sh objetivo.com
```

### Problemas comunes en auditorías

| Vulnerabilidad | Descripción | Detección |
|---------------|-------------|-----------|
| POODLE | SSLv3 habilitado | `nmap --script ssl-poodle` |
| BEAST | TLS 1.0 con CBC | `nmap --script ssl-enum-ciphers` |
| HEARTBLEED | OpenSSL < 1.0.1g | `nmap --script ssl-heartbleed` |
| ROBOT | RSA PKCS#1 v1.5 | `robot-detect` |
| Cert expirado | Fecha de validez | `openssl x509 -noout -dates` |
| Cert autofirmado | Sin CA reconocida | `openssl verify` |

---

## 7. Codificación (no es cifrado)

Importante: codificación no es cifrado. Es reversible sin clave.

```bash
# Base64
echo -n "texto secreto" | base64
echo "dGV4dG8gc2VjcmV0bw==" | base64 -d

# URL encoding
python3 -c "import urllib.parse; print(urllib.parse.quote('hola mundo'))"

# Hex
echo -n "hola" | xxd
echo "686f6c61" | xxd -r -p

# ROT13 (Caesar cipher)
echo "mensaje secreto" | tr 'A-Za-z' 'N-ZA-Mn-za-m'
```

---

## Actividades

1. Generar el hash SHA-256 de un archivo y verificar su integridad después de modificarlo
2. Cifrar un archivo con AES-256-CBC y descifrarlo
3. Generar un par de claves RSA, cifrar un mensaje con la pública y descifrarlo con la privada
4. Inspeccionar el certificado TLS de un sitio real (fecha, CA, cipher suite)
5. Identificar el tipo de hash `098f6bcd4621d373cade4e832627b4f6` y crackearlo

---

## Referencias

- [Cryptohack](https://cryptohack.org/) — challenges interactivos de criptografía
- [CyberChef](https://gchq.github.io/CyberChef/) — swiss army knife de codificación/cifrado
- [OpenSSL Cookbook](https://www.feistyduck.com/books/openssl-cookbook/) (gratuito online)
- [TryHackMe — Cryptography for Beginners](https://tryhackme.com/room/cryptographyforbeginners)
