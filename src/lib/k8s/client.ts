import { KubeConfig, CoreV1Api } from "@kubernetes/client-node";

const kc = new KubeConfig();
kc.loadFromDefault();

export const k8sApi = kc.makeApiClient(CoreV1Api);

export async function getK8sNamespaces() {
  try {
    const res = await k8sApi.listNamespace();
    return { namespaces: res.body.items, error: null };
  } catch (err) {
    console.error("Error fetching namespaces:", err);
    return { namespaces: [], error: err };
  }
}

export async function getK8sPods(namespace: string = "default") {
  try {
    const res = await k8sApi.listNamespacedPod(namespace);
    return { pods: res.body.items, error: null };
  } catch (err) {
    console.error(`Error fetching pods in namespace ${namespace}:`, err);
    return { pods: [], error: err };
  }
}
