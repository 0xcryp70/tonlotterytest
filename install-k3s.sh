#!/bin/bash

# Install k3s with custom configurations
curl -sfL https://get.k3s.io | sh -s - \
  --write-kubeconfig-mode 644 \
  --kube-apiserver-arg service-node-port-range=30000-32767 \
  --kubelet-arg eviction-hard=memory.available<100Mi \
  --kubelet-arg eviction-minimum-reclaim=memory.available=100Mi \
  --kubelet-arg system-reserved=cpu=500m,memory=250Mi \
  --kubelet-arg kube-reserved=cpu=500m,memory=250Mi

# Wait for k3s to start
sleep 10

# Set up kubectl for the current user
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
chmod 600 ~/.kube/config

# Set KUBECONFIG environment variable
echo "export KUBECONFIG=~/.kube/config" >> ~/.bashrc
source ~/.bashrc

# Verify the installation
kubectl get nodes